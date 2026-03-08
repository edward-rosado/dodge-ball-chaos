import { GameState, ST, GameStateType } from "./types";
import { CW, CH, C } from "./constants";
import { applyKeyboardMovement } from "./input";
import { update } from "./update";
import { drawGrid, drawArenaBoundary } from "./renderer/background";
import { drawGoku } from "./renderer/player";
import { drawBall, drawPreviewBall } from "./renderer/ball";
import { drawPipe } from "./renderer/pipe";
import { drawHUD, drawText } from "./renderer/hud";
import { drawUltraInstinctGlow, drawAura } from "./renderer/effects";
import {
  drawPowerUps,
  drawKaiokenAura,
  drawKiShield,
  drawShrinkIndicator,
  drawSpiritBombCharge,
  drawAfterimageDecoy,
  drawPowerUpHUD,
  drawITTeleportTrail,
} from "./powerups/render";
import { isMilestoneLevel, getLevelConfig } from "./progression";
import { audio } from "./audio/engine";
import { getFormForRound, getAuraColor, SaiyanForm } from "./transformation";

/** Track previous state + round for audio transitions. */
let prevState: GameStateType | null = null;
let prevRound = 0;
/** Throttle bounce SFX to avoid overwhelming the audio system. */
let lastBounceSFXTime = 0;
/** Track previous ball count to detect bounces (new balls entering arena). */
let prevBallCount = 0;

/** Core update + render. Called each frame via requestAnimationFrame. */
export function tick(
  ctx: CanvasRenderingContext2D,
  g: GameState,
  dt: number
): void {
  // ── Update game logic ──
  update(g, dt, applyKeyboardMovement);

  // ── Audio triggers (based on state transitions) ──
  if (audio.isInitialized()) {
    const stateChanged = g.state !== prevState;
    const roundChanged = g.round !== prevRound;

    if (stateChanged) {
      if (g.state === ST.TITLE) {
        audio.playTrack("training");
      } else if (g.state === ST.DODGE || g.state === ST.READY) {
        const config = getLevelConfig(g.round);
        audio.playTrack(config.musicTrack);
        if (stateChanged && prevState === ST.THROW) {
          audio.playSFX("throw");
        }
      } else if (g.state === ST.CLEAR) {
        audio.playSFX("clear");
        if (roundChanged) {
          audio.playSFX("levelUp");
        }
      } else if (g.state === ST.HIT) {
        audio.playSFX("hit");
      } else if (g.state === ST.OVER) {
        audio.playSFX("gameOver");
        audio.stopTrack();
      } else if (g.state === ST.VICTORY) {
        audio.playSFX("victory");
        audio.playTrack("ultraInstinct");
      }
    }

    // Power-up collection: play SFX + speak the name aloud
    if (g.lastPowerUp) {
      audio.playSFX(g.lastPowerUp);
      audio.speakPowerUpName(g.lastPowerUp);
      g.lastPowerUp = "";
    }

    // Bounce SFX: detect ball count changes (throttled)
    if (g.state === ST.DODGE) {
      const now = g.t;
      if (g.balls.length > prevBallCount && now - lastBounceSFXTime > 0.1) {
        audio.playSFX("bounce");
        lastBounceSFXTime = now;
      }
    }

    prevState = g.state;
    prevRound = g.round;
    prevBallCount = g.balls.length;
  }

  // ── Render ──
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, CW, CH);
  drawGrid(ctx, CW, CH, g.t * 8, g.backgroundId);
  drawArenaBoundary(ctx);

  // ── Compute Saiyan form for current round ──
  const form = getFormForRound(g.round);

  // ── TITLE ──
  if (g.state === ST.TITLE) {
    drawGoku(ctx, CW / 2, CH / 2 - 40, false, g.t, 0, 0, SaiyanForm.Base);
    drawText(ctx, "DODGE BALL", CH / 2 + 30, C.title, 18);
    drawText(ctx, "CHAOS", CH / 2 + 56, C.title, 18);
    ctx.font = "9px monospace";
    ctx.fillStyle = C.hudDim;
    ctx.textAlign = "center";
    const blink = Math.sin(g.t * 3) > 0;
    if (blink) ctx.fillText("TAP / CLICK / SPACE", CW / 2, CH / 2 + 100);
    ctx.fillStyle = C.hudDim;
    ctx.fillText("SWIPE OR WASD TO MOVE", CW / 2, CH / 2 + 118);
    return;
  }

  if (g.state === ST.OVER) {
    drawText(ctx, "GAME OVER", CH / 2 - 30, C.gameOver, 18);
    drawText(ctx, "SCORE: " + g.score, CH / 2 + 10, C.hud, 12);
    drawText(ctx, "BEST: " + g.highScore, CH / 2 + 36, C.hudDim, 10);
    ctx.font = "9px monospace";
    ctx.fillStyle = C.hudDim;
    ctx.textAlign = "center";
    const blink = Math.sin(g.t * 3) > 0;
    if (blink) ctx.fillText("TAP TO RETRY", CW / 2, CH / 2 + 80);
    return;
  }

  if (g.state === ST.VICTORY) {
    drawGoku(ctx, CW / 2, CH / 2 - 60, false, g.t, 0, 0, SaiyanForm.UltraInstinct);
    drawUltraInstinctGlow(ctx, CW / 2, CH / 2 - 60, g.t);
    drawText(ctx, "YOU WIN!", CH / 2 + 10, "#ffd60a", 18);
    drawText(ctx, "SCORE: " + g.score, CH / 2 + 50, C.hud, 12);
    drawText(ctx, "BEST: " + g.highScore, CH / 2 + 76, C.hudDim, 10);
    ctx.font = "9px monospace";
    ctx.fillStyle = C.hudDim;
    ctx.textAlign = "center";
    const blink = Math.sin(g.t * 3) > 0;
    if (blink) ctx.fillText("TAP TO PLAY AGAIN", CW / 2, CH / 2 + 120);
    return;
  }

  // ── Draw pipes ──
  g.pipes.forEach((p, i) => drawPipe(ctx, p, i === g.activePipe, g.t, g.chargingPipes.includes(i)));
  drawPowerUps(ctx, g.powerUps, g.t);

  // ── Draw pipe suck-in animations (Mario warp pipe effect) ──
  for (const anim of g.pipeSuckAnims) {
    const progress = 1 - anim.timer / anim.duration; // 0→1
    const scale = 1 - progress; // Shrinks from 1→0

    ctx.save();

    // Vortex swirl rings (outer → inner)
    for (let ring = 0; ring < 3; ring++) {
      const ringProgress = Math.min(1, progress + ring * 0.15);
      const ringR = (anim.radius + 12 - ring * 4) * (1 - ringProgress);
      if (ringR > 0.5) {
        ctx.globalAlpha = (1 - ringProgress) * 0.4;
        ctx.strokeStyle = ring === 0 ? "#ffffff" : anim.color;
        ctx.lineWidth = 2 - ring * 0.5;
        ctx.beginPath();
        const spin = progress * Math.PI * 6 + ring * Math.PI * 0.7;
        ctx.arc(anim.x, anim.y, ringR, spin, spin + Math.PI * 1.4);
        ctx.stroke();
      }
    }

    // Ball shrinking into pipe center with squish
    const r = anim.radius * scale;
    if (r > 0.5) {
      ctx.globalAlpha = scale;
      ctx.save();
      ctx.translate(anim.x, anim.y);
      // Squish: squash horizontally, stretch vertically as it sucks in
      const squish = 1 + progress * 0.6;
      ctx.scale(1 / squish, squish);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = anim.color;
      ctx.fill();
      ctx.restore();
    }

    // Spark particles spiraling inward
    ctx.globalAlpha = scale * 0.8;
    for (let i = 0; i < 6; i++) {
      const sparkAngle = progress * Math.PI * 8 + (i / 6) * Math.PI * 2;
      const sparkDist = (anim.radius + 8) * scale;
      const sx = anim.x + Math.cos(sparkAngle) * sparkDist;
      const sy = anim.y + Math.sin(sparkAngle) * sparkDist;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ── Draw pipe emergence animations (burst out effect) ──
  for (const anim of g.pipeEmergeAnims) {
    const progress = 1 - anim.timer / anim.duration; // 0→1

    ctx.save();

    // Expanding shockwave ring
    const ringR = progress * 30;
    ctx.globalAlpha = (1 - progress) * 0.6;
    ctx.strokeStyle = anim.color;
    ctx.lineWidth = 3 * (1 - progress);
    ctx.beginPath();
    ctx.arc(anim.x, anim.y, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Second inner ring
    const ring2R = progress * 20;
    ctx.globalAlpha = (1 - progress) * 0.4;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2 * (1 - progress);
    ctx.beginPath();
    ctx.arc(anim.x, anim.y, ring2R, 0, Math.PI * 2);
    ctx.stroke();

    // Burst particles flying outward
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const d = progress * 25;
      const px = anim.x + Math.cos(angle) * d;
      const py = anim.y + Math.sin(angle) * d;
      ctx.globalAlpha = (1 - progress) * 0.7;
      ctx.fillStyle = i % 2 === 0 ? anim.color : "#ffffff";
      ctx.beginPath();
      ctx.arc(px, py, 2 * (1 - progress), 0, Math.PI * 2);
      ctx.fill();
    }

    // Flash at center
    if (progress < 0.3) {
      const flashAlpha = (1 - progress / 0.3) * 0.5;
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(anim.x, anim.y, 8 * (1 - progress / 0.3), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ── Message overlay ──
  if (g.msgTimer > 0) {
    drawText(ctx, g.msg, CH / 2, C.round, 14);
  }

  // ── READY ──
  if (g.state === ST.READY) {
    drawGoku(ctx, g.px, g.py, false, g.t, g.pvx, g.pvy, form);
    drawPreviewBall(ctx, g.px, g.py - 20);
    if (g.swS && g.swE) {
      ctx.beginPath();
      ctx.moveTo(g.swS.x, g.swS.y);
      ctx.lineTo(g.swE.x, g.swE.y);
      ctx.strokeStyle = C.swipe;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    drawHUD(ctx, g.round, g.lives, g.timer, g.score);
    return;
  }

  // ── THROW ──
  if (g.state === ST.THROW) {
    for (const t2 of g.thrown) drawBall(ctx, t2, g.t);
    drawGoku(ctx, g.px, g.py, false, g.t, g.pvx, g.pvy, form);
    drawHUD(ctx, g.round, g.lives, g.timer, g.score);
    return;
  }

  // ── DODGE ──
  if (g.state === ST.DODGE) {
    g.balls.forEach((b) => drawBall(ctx, b, g.t));

    // Draw afterimage decoy
    if (g.afterimageDecoy) {
      drawAfterimageDecoy(ctx, g.afterimageDecoy, g.t);
    }

    // Draw Ki Shield
    if (g.shield) {
      drawKiShield(ctx, g.px, g.py, g.t);
    }

    // Draw Kaioken aura
    if (g.kaioken) {
      drawKaiokenAura(ctx, g.px, g.py, g.t);
    }

    // Draw Shrink indicator
    if (g.shrink) {
      drawShrinkIndicator(ctx, g.px, g.py, g.t);
    }

    // Draw Spirit Bomb charge
    if (g.spiritBombCharging) {
      const progress = 1 - g.spiritBombTimer / 3;
      drawSpiritBombCharge(ctx, g.px, g.py, progress, g.t);
    }

    // Draw IT teleport trail
    if (g.itFlashTimer > 0) {
      drawITTeleportTrail(ctx, g.itDepartX, g.itDepartY, g.px, g.py, g.itFlashTimer, g.t);
    }

    // Draw power-up status HUD
    drawPowerUpHUD(ctx, g, CW);
  }

  // Form-based aura (SSJ golden, SSJ Blue, etc.)
  const auraColor = getAuraColor(form);
  if (auraColor) {
    drawAura(ctx, g.px, g.py, g.t, auraColor);
  }
  // Ultra Instinct gets its own special glow
  if (form === SaiyanForm.UltraInstinct) {
    drawUltraInstinctGlow(ctx, g.px, g.py, g.t);
  }
  // Scale character down when shrink power-up is active
  if (g.shrink) {
    ctx.save();
    ctx.translate(g.px, g.py);
    ctx.scale(0.5, 0.5);
    ctx.translate(-g.px, -g.py);
    drawGoku(ctx, g.px, g.py, g.flash > 0, g.t, g.pvx, g.pvy, form);
    ctx.restore();
  } else {
    drawGoku(ctx, g.px, g.py, g.flash > 0, g.t, g.pvx, g.pvy, form);
  }
  // ── Death/hit explosion animation ──
  if (g.deathAnimTimer > 0) {
    const progress = 1 - g.deathAnimTimer / 1.0; // 0→1
    ctx.save();

    // Screen flash (brief white overlay)
    if (progress < 0.15) {
      ctx.globalAlpha = (1 - progress / 0.15) * 0.4;
      ctx.fillStyle = "#ff4444";
      ctx.fillRect(0, 0, CW, CH);
    }

    // Expanding shockwave rings
    for (let ring = 0; ring < 3; ring++) {
      const ringDelay = ring * 0.08;
      const rp = Math.max(0, progress - ringDelay);
      if (rp > 0 && rp < 0.8) {
        const ringR = rp * 60;
        ctx.globalAlpha = (1 - rp / 0.8) * 0.6;
        ctx.strokeStyle = ring === 0 ? "#ff4444" : ring === 1 ? "#ff8833" : "#ffcc00";
        ctx.lineWidth = 3 * (1 - rp / 0.8);
        ctx.beginPath();
        ctx.arc(g.deathX, g.deathY, ringR, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Explosion particles flying outward
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 30 + (i % 3) * 15;
      const d = progress * speed;
      const px = g.deathX + Math.cos(angle) * d;
      const py = g.deathY + Math.sin(angle) * d;
      const size = (1 - progress) * 3;
      if (size > 0.3) {
        ctx.globalAlpha = (1 - progress) * 0.8;
        ctx.fillStyle = i % 3 === 0 ? "#ff4444" : i % 3 === 1 ? "#ffaa00" : "#ffffff";
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Central flash/fireball
    if (progress < 0.4) {
      const fbProgress = progress / 0.4;
      const fbR = 8 + fbProgress * 12;
      ctx.globalAlpha = (1 - fbProgress) * 0.7;
      const grad = ctx.createRadialGradient(g.deathX, g.deathY, 0, g.deathX, g.deathY, fbR);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.4, "#ffaa00");
      grad.addColorStop(1, "rgba(255,68,68,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(g.deathX, g.deathY, fbR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawHUD(ctx, g.round, g.lives, g.timer, g.score);
}

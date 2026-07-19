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
import { hasSlot } from "./save";

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
      } else if (g.state === ST.DODGE) {
        // Only start music when actually entering DODGE — not READY (which is a brief transition)
        // This avoids double-playing the track on OVER→READY→DODGE flow
        const config = getLevelConfig(g.round);
        audio.playTrack(config.musicTrack);
        if (prevState === ST.THROW) {
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
        // Fade out music smoothly instead of hard stop
        audio.fadeOutAndStop(0.4);
      } else if (g.state === ST.VICTORY) {
        audio.playSFX("victory");
        audio.stopTrack();
        audio.playTrack("ultraInstinct");
      }
    }

    // Power-up collection: play SFX + speak the name aloud
    if (g.meta.lastPowerUp) {
      audio.playSFX(g.meta.lastPowerUp);
      audio.speakPowerUpName(g.meta.lastPowerUp);
      g.meta.lastPowerUp = "";
    }

    // Bounce SFX: detect ball count changes (throttled)
    if (g.state === ST.DODGE) {
      const now = g.meta.t;
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
  drawGrid(ctx, CW, CH, g.meta.t * 8, g.meta.backgroundId);
  drawArenaBoundary(ctx);

  // ── Compute Saiyan form for current round ──
  const form = getFormForRound(g.round);

  // ── TITLE ──
  if (g.state === ST.TITLE) {
    // Check for existing save
    g.meta._hasSave = hasSlot(0);

    drawGoku(ctx, CW / 2, CH / 2 - 80, false, g.meta.t, 0, 0, SaiyanForm.Base);

    // Draw title text (centered)
    ctx.font = "bold 18px 'Press Start 2P', monospace";
    ctx.fillStyle = C.title;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("DODGE BALL", CW / 2, CH / 2 - 20);
    ctx.fillText("CHAOS", CW / 2, CH / 2 + 2);

    ctx.font = "9px monospace";
    ctx.fillStyle = C.hudDim;
    ctx.textAlign = "center";
    ctx.fillText("SWIPE OR WASD TO MOVE", CW / 2, CH / 2 + 40);

    // NEW GAME / LOAD GAME buttons
    const btnY = CH / 2 + 70;
    const btnW = 120;
    const btnH = 24;
    const gap = 16;
    const totalW = btnW * 2 + gap;
    const startX = CW / 2 - totalW / 2;

    // NEW GAME button
    const ngX = startX;
    const ngHover = g.meta._mouseX !== null && g.meta._mouseX >= ngX && g.meta._mouseX <= ngX + btnW &&
                    g.meta._mouseY !== null && g.meta._mouseY >= btnY && g.meta._mouseY <= btnY + btnH;
    ctx.fillStyle = ngHover ? "#2ec4b6" : "#08080f";
    ctx.strokeStyle = "#2ec4b6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(ngX, btnY, btnW, btnH, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ngHover ? "#08080f" : "#2ec4b6";
    ctx.fillText("NEW GAME", ngX + btnW / 2, btnY + btnH / 2 + 1);

    // LOAD GAME button (only if save exists)
    const lgX = ngX + btnW + gap;
    const hasSave = g.meta._hasSave;
    const lgHover = hasSave && g.meta._mouseX !== null && g.meta._mouseX >= lgX && g.meta._mouseX <= lgX + btnW &&
                    g.meta._mouseY !== null && g.meta._mouseY >= btnY && g.meta._mouseY <= btnY + btnH;
    ctx.fillStyle = hasSave ? (lgHover ? "#ffd60a" : "#08080f") : "#08080f";
    ctx.strokeStyle = hasSave ? "#ffd60a" : "#555580";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(lgX, btnY, btnW, btnH, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = hasSave ? (lgHover ? "#08080f" : "#ffd60a") : "#555580";
    ctx.fillText("LOAD GAME", lgX + btnW / 2, btnY + btnH / 2 + 1);

    // Blinking tap prompt (only if no save)
    if (!hasSave) {
      const blink = Math.sin(g.meta.t * 3) > 0;
      if (blink) ctx.fillText("TAP / CLICK / SPACE", CW / 2, CH / 2 + 120);
    }
    return;
  }

  if (g.state === ST.OVER) {
    drawText(ctx, "GAME OVER", CH / 2 - 30, C.gameOver, 18);
    drawText(ctx, "SCORE: " + g.score, CH / 2 + 10, C.hud, 12);
    drawText(ctx, "BEST: " + g.meta.highScore, CH / 2 + 36, C.hudDim, 10);
    ctx.font = "9px monospace";
    ctx.fillStyle = C.hudDim;
    ctx.textAlign = "center";
    const blink = Math.sin(g.meta.t * 3) > 0;
    if (blink) ctx.fillText("TAP TO RETRY", CW / 2, CH / 2 + 80);
    return;
  }

  if (g.state === ST.VICTORY) {
    drawGoku(ctx, CW / 2, CH / 2 - 60, false, g.meta.t, 0, 0, SaiyanForm.UltraInstinct);
    drawUltraInstinctGlow(ctx, CW / 2, CH / 2 - 60, g.meta.t);
    drawText(ctx, "YOU WIN!", CH / 2 + 10, "#ffd60a", 18);
    drawText(ctx, "SCORE: " + g.score, CH / 2 + 50, C.hud, 12);
    drawText(ctx, "BEST: " + g.meta.highScore, CH / 2 + 76, C.hudDim, 10);
    ctx.font = "9px monospace";
    ctx.fillStyle = C.hudDim;
    ctx.textAlign = "center";
    const blink = Math.sin(g.meta.t * 3) > 0;
    if (blink) ctx.fillText("TAP TO PLAY AGAIN", CW / 2, CH / 2 + 120);
    return;
  }

  // ── Draw pipes ──
  g.pipes.forEach((p, i) => drawPipe(ctx, p, i === g.activePipe, g.meta.t, g.pipeSystem.chargingPipes.includes(i)));
  drawPowerUps(ctx, g.powerUps, g.meta.t);

  // ── Draw pipe suck-in animations (Mario warp pipe effect) ──
  for (const anim of g.pipeSystem.pipeSuckAnims) {
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
  for (const anim of g.pipeSystem.pipeEmergeAnims) {
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
  if (g.meta.msgTimer > 0) {
    drawText(ctx, g.meta.msg, CH / 2, C.round, 14);
  }

  // ── READY ──
  if (g.state === ST.READY) {
    drawGoku(ctx, g.player.px, g.player.py, false, g.meta.t, g.player.pvx, g.player.pvy, form);
    drawPreviewBall(ctx, g.player.px, g.player.py - 20);
    if (g.input.swS && g.input.swE) {
      ctx.beginPath();
      ctx.moveTo(g.input.swS.x, g.input.swS.y);
      ctx.lineTo(g.input.swE.x, g.input.swE.y);
      ctx.strokeStyle = C.swipe;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    drawHUD(ctx, g.round, g.lives, g.timer, g.score);
    return;
  }

  // ── THROW ──
  if (g.state === ST.THROW) {
    for (const t2 of g.thrown) drawBall(ctx, t2, g.meta.t);
    drawGoku(ctx, g.player.px, g.player.py, false, g.meta.t, g.player.pvx, g.player.pvy, form);
    drawHUD(ctx, g.round, g.lives, g.timer, g.score);
    return;
  }

  // ── DODGE ──
  if (g.state === ST.DODGE) {
    g.balls.forEach((b) => drawBall(ctx, b, g.meta.t));

    // ── Destructo Disc explosions — BIG, BRIGHT, OBVIOUS destruction flash ──
    for (const ex of g.meta.explosions) {
      const t = ex.timer;
      const progress = 1 - t / 1.4; // 0→1 over 1.4s (matches extended timer)
      ctx.save();

      // ── Massive initial white flash — fills a good chunk of screen ──
      if (progress < 0.25) {
        const flashAlpha = (1 - progress / 0.25) * 0.8;
        ctx.globalAlpha = flashAlpha;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(~~ex.x, ~~ex.y, 60, 0, Math.PI * 2);
        ctx.fill();
        // Secondary outer flash ring
        if (progress < 0.1) {
          const outerAlpha = (1 - progress / 0.1) * 0.4;
          ctx.globalAlpha = outerAlpha;
          ctx.fillStyle = ex.color;
          ctx.beginPath();
          ctx.arc(~~ex.x, ~~ex.y, 90, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Expanding shockwave ring (thick, bright) ──
      const ringRadius = 10 + progress * 65;
      ctx.globalAlpha = Math.max(0, (1 - progress) * 0.9);
      ctx.strokeStyle = ex.color;
      ctx.lineWidth = 5 * (1 - progress * 0.5);
      ctx.beginPath();
      ctx.arc(~~ex.x, ~~ex.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      // ── Secondary counter-rotating ring with delay ──
      const r2Progress = Math.max(0, progress - 0.08);
      if (r2Progress < 0.75) {
        ctx.globalAlpha = Math.max(0, (1 - r2Progress) * 0.6);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3 * (1 - r2Progress * 0.5);
        const r2Radius = 8 + r2Progress * 50;
        ctx.beginPath();
        ctx.arc(~~ex.x, ~~ex.y, r2Radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ── Massive particle burst — 24 particles for dense explosion ──
      const particleCount = 24;
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + progress * 0.8;
        // Varied speeds for organic feel
        const speedMult = 0.7 + (i % 5) * 0.15;
        const dist = progress * 65 * speedMult;
        const px = ex.x + Math.cos(angle) * dist;
        const py = ex.y + Math.sin(angle) * dist;
        // Larger particles that persist longer
        const size = (1 - progress * 0.6) * 5;
        ctx.globalAlpha = Math.max(0, (1 - progress * 0.7) * 0.9);
        const pColor = i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? ex.color : "#ffcc00";
        ctx.fillStyle = pColor;
        ctx.beginPath();
        ctx.arc(~~px, ~~py, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Spark trails — fast thin particles shooting outward ──
      const sparkCount = 16;
      for (let i = 0; i < sparkCount; i++) {
        const angle = (Math.PI * 2 * i) / sparkCount - progress * 2.5;
        const speedMult = 0.8 + (i % 4) * 0.2;
        const dist = progress * 80 * speedMult;
        const sx = ex.x + Math.cos(angle) * dist;
        const sy = ex.y + Math.sin(angle) * dist;
        ctx.globalAlpha = Math.max(0, (1 - progress * 0.8) * 0.5);
        ctx.fillStyle = i % 2 === 0 ? "#ffee88" : "#ffffff";
        // Draw spark as a small line trail
        const trailLen = 4 + (1 - progress) * 6;
        const tx = sx - Math.cos(angle) * trailLen;
        const ty = sy - Math.sin(angle) * trailLen;
        ctx.lineWidth = 2 * (1 - progress);
        ctx.beginPath();
        ctx.moveTo(~~sx, ~~sy);
        ctx.lineTo(~~tx, ~~ty);
        ctx.stroke();
      }

      // ── Ball type label — shows WHICH ball was destroyed in its own color ──
      if (progress > 0.05 && progress < 0.5) {
        const labelAlpha = progress < 0.12
          ? (progress - 0.05) / 0.07   // fade in fast
          : Math.max(0, 1 - (progress - 0.12) / 0.38);
        ctx.globalAlpha = labelAlpha * 0.95;

        // Ball type name — large, bold, colored outline + white fill with glow
        if (ex.ballType) {
          const typeName = ex.ballType.charAt(0).toUpperCase() + ex.ballType.slice(1);
          ctx.font = "bold 12px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          // Thick colored outline for readability against any background
          ctx.strokeStyle = ex.color;
          ctx.lineWidth = 4;
          ctx.strokeText(typeName, ~~ex.x, ~~(ex.y - 62));
          // White fill with glow matching the destroyed ball's color
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = ex.color;
          ctx.shadowBlur = 14;
          ctx.fillText(typeName, ~~ex.x, ~~(ex.y - 62));
          ctx.shadowBlur = 0;
        }
      }

      // ── "DESTROYED!" text flash at the explosion center — bigger and bolder ──
      if (progress > 0.1 && progress < 0.45) {
        const textAlpha = progress < 0.18
          ? (progress - 0.1) / 0.08   // fade in fast
          : 1 - (progress - 0.18) / 0.27;                          // fade out
        ctx.globalAlpha = Math.max(0, textAlpha * 0.95);
        ctx.font = "bold 16px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = ex.color;
        ctx.lineWidth = 4;
        ctx.shadowColor = ex.color;
        ctx.shadowBlur = 16;
        ctx.strokeText("DESTROYED!", ~~ex.x, ~~(ex.y - 38));
        ctx.fillText("DESTROYED!", ~~ex.x, ~~(ex.y - 38));
        ctx.shadowBlur = 0;
      }

      // ── Debris chunks — larger slow-moving rocks ──
      if (progress > 0.1 && progress < 0.8) {
        const debrisCount = 6;
        for (let i = 0; i < debrisCount; i++) {
          const baseAngle = (Math.PI * 2 * i) / debrisCount + 0.3;
          const dist = (progress - 0.1) * 50;
          // Add slight gravity arc
          const dx = ex.x + Math.cos(baseAngle) * dist;
          const dy = ex.y + Math.sin(baseAngle) * dist + (progress - 0.1) * 20; // gravity pull down
          const size = 3 + (i % 3) * 2;
          ctx.globalAlpha = Math.max(0, (1 - progress) * 0.8);
          ctx.fillStyle = ex.color;
          ctx.fillRect(~~dx - size / 2, ~~dy - size / 2, size, size);
        }
      }

      ctx.restore();
    }

    // Draw afterimage decoy — pass form + shrink state so it matches the player sprite size
    if (g.effects.afterimageDecoy) {
      drawAfterimageDecoy(ctx, g.effects.afterimageDecoy, g.meta.t, form, g.effects.shrink);
    }

    // Draw Ki Shield
    if (g.effects.shield) {
      drawKiShield(ctx, g.player.px, g.player.py, g.meta.t);
    }

    // Draw Kaioken aura
    if (g.effects.kaioken) {
      drawKaiokenAura(ctx, g.player.px, g.player.py, g.meta.t);
    }

    // Draw Shrink indicator
    if (g.effects.shrink) {
      drawShrinkIndicator(ctx, g.player.px, g.player.py, g.meta.t);
    }

    // Draw Spirit Bomb charge
    if (g.effects.spiritBombCharging) {
      const progress = 1 - g.effects.spiritBombTimer / 3;
      drawSpiritBombCharge(ctx, g.player.px, g.player.py, progress, g.meta.t);
    }

    // Draw IT teleport trail
    if (g.effects.itFlashTimer > 0) {
      drawITTeleportTrail(ctx, g.effects.itDepartX, g.effects.itDepartY, g.player.px, g.player.py, g.effects.itFlashTimer, g.meta.t);
    }

    // Draw activation flash — brief white overlay when power-up is activated
    if (g.effects.activationFlash > 0) {
      const flashAlpha = g.effects.activationFlash / 0.5;
      ctx.save();
      ctx.globalAlpha = flashAlpha * 0.3;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, CW, CH);
      // Activation message
      if (g.effects.activationMsg) {
        ctx.globalAlpha = Math.min(1, flashAlpha * 1.5);
        ctx.font = "bold 10px monospace";
        ctx.fillStyle = "#ffff88";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(g.effects.activationMsg, CW / 2, 55);
      }
      ctx.restore();
    }

    // Draw power-up status HUD
    drawPowerUpHUD(ctx, g, CW);

    // Help overlay — toggleable with H key
    if (g.meta.helpVisible) {
      drawHelpOverlay(ctx, CW, CH);
    }
  }

  // Form-based aura (SSJ golden, SSJ Blue, etc.)
  const auraColor = getAuraColor(form);
  if (auraColor) {
    drawAura(ctx, g.player.px, g.player.py, g.meta.t, auraColor);
  }
  // Ultra Instinct gets its own special glow
  if (form === SaiyanForm.UltraInstinct) {
    drawUltraInstinctGlow(ctx, g.player.px, g.player.py, g.meta.t);
  }
  // Scale character down when shrink power-up is active
  if (g.effects.shrink) {
    ctx.save();
    ctx.translate(g.player.px, g.player.py);
    ctx.scale(0.5, 0.5);
    ctx.translate(-g.player.px, -g.player.py);
    drawGoku(ctx, g.player.px, g.player.py, g.meta.flash > 0, g.meta.t, g.player.pvx, g.player.pvy, form, g.effects.kaioken, g.effects.invincible);
    ctx.restore();
  } else {
    drawGoku(ctx, g.player.px, g.player.py, g.meta.flash > 0, g.meta.t, g.player.pvx, g.player.pvy, form, g.effects.kaioken, g.effects.invincible);
  }
  // ── Death/hit explosion animation ──
  if (g.meta.deathAnimTimer > 0) {
    const progress = 1 - g.meta.deathAnimTimer / 1.0; // 0→1
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
        ctx.arc(g.meta.deathX, g.meta.deathY, ringR, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Explosion particles flying outward
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 30 + (i % 3) * 15;
      const d = progress * speed;
      const px = g.meta.deathX + Math.cos(angle) * d;
      const py = g.meta.deathY + Math.sin(angle) * d;
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
      const grad = ctx.createRadialGradient(g.meta.deathX, g.meta.deathY, 0, g.meta.deathX, g.meta.deathY, fbR);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.4, "#ffaa00");
      grad.addColorStop(1, "rgba(255,68,68,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(g.meta.deathX, g.meta.deathY, fbR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawHUD(ctx, g.round, g.lives, g.timer, g.score);
}

/** Draw a single 8x8 pixel art icon (Mega Man 2 style). */
function drawPixelIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pixels: number[], // 64 values (8x8), each 0=transparent, 1=color
  color: string,
  scale: number = 2
): void {
  ctx.fillStyle = color;
  for (let py = 0; py < 8; py++) {
    for (let px = 0; px < 8; px++) {
      const idx = py * 8 + px;
      if (pixels[idx]) {
        ctx.fillRect(x + px * scale, y + py * scale, scale, scale);
      }
    }
  }
}

/** Draw the help overlay with Mega Man 2-style pixel art icons. */
export function drawHelpOverlay(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number
): void {
  const cx = cw / 2;
  const overlayH = 520;
  const overlayY = (ch - overlayH) / 2;
  const boxW = 380;
  const boxX = cx - boxW / 2;
  const scale = 2; // Pixel scale

  ctx.save();

  // Semi-transparent background
  ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
  ctx.fillRect(0, 0, cw, ch);

  // Panel background with Mega Man 2-style border
  ctx.fillStyle = "rgba(10, 10, 30, 0.98)";
  ctx.strokeStyle = "#4488ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(boxX, overlayY, boxW, overlayH, 6);
  ctx.fill();
  ctx.stroke();

  // Inner border (8-bit style)
  ctx.strokeStyle = "#2244aa";
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX + 4, overlayY + 4, boxW - 8, overlayH - 8);

  // Title with pixel art crown
  ctx.font = "bold 14px 'Press Start 2P', monospace";
  ctx.fillStyle = "#4488ff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("? HELP ?", cx, overlayY + 24);

  // Close hint
  ctx.font = "7px monospace";
  ctx.fillStyle = "#888888";
  ctx.fillText("[H] to close", cx, overlayY + 42);

  const leftX = boxX + 20;
  const iconX = leftX + 50;
  let y = overlayY + 56;
  const lineH = 14;

  // ── SECTION: CONTROLS (with pixel art icon) ──
  ctx.font = "bold 9px monospace";
  ctx.fillStyle = "#ffcc44";
  ctx.textAlign = "left";
  ctx.fillText("CONTROLS", leftX, y);
  y += lineH + 4;

  // Movement icon (8x8 pixel art arrow)
  const moveIcon: number[] = Array(64).fill(0);
  moveIcon[3] = 1; moveIcon[4] = 1; moveIcon[2] = 1; moveIcon[5] = 1;
  moveIcon[1] = 1; moveIcon[6] = 1; moveIcon[0] = 1; moveIcon[7] = 1;
  moveIcon[8] = 1; moveIcon[9] = 1; moveIcon[10] = 1; moveIcon[11] = 1;
  moveIcon[16] = 1; moveIcon[17] = 1; moveIcon[18] = 1; moveIcon[19] = 1;
  moveIcon[24] = 1; moveIcon[25] = 1; moveIcon[26] = 1; moveIcon[27] = 1;
  moveIcon[32] = 1; moveIcon[33] = 1; moveIcon[34] = 1; moveIcon[35] = 1;
  moveIcon[40] = 1; moveIcon[41] = 1; moveIcon[42] = 1; moveIcon[43] = 1;
  moveIcon[48] = 1; moveIcon[49] = 1; moveIcon[50] = 1; moveIcon[51] = 1;
  moveIcon[56] = 1; moveIcon[57] = 1; moveIcon[58] = 1; moveIcon[59] = 1;
  moveIcon[63] = 1;
  drawPixelIcon(ctx, iconX, y - 6, moveIcon, "#ffcc44", scale);

  ctx.font = "7px monospace";
  ctx.fillStyle = "#cccccc";
  ctx.fillText("WASD / Arrows: Move", iconX + 20, y);
  y += lineH;
  ctx.fillText("Swipe/Click-drag: Move (touch/mouse)", iconX + 20, y);
  y += lineH * 2;

  // Throw icon
  const throwIcon: number[] = Array(64).fill(0);
  throwIcon[3] = 1; moveIcon[4] = 1; moveIcon[2] = 1; moveIcon[5] = 1;
  throwIcon[1] = 1; moveIcon[6] = 1; moveIcon[0] = 1; moveIcon[7] = 1;
  throwIcon[8] = 1; moveIcon[9] = 1; moveIcon[10] = 1; moveIcon[11] = 1;
  throwIcon[16] = 1; moveIcon[17] = 1; moveIcon[18] = 1; moveIcon[19] = 1;
  throwIcon[24] = 1; moveIcon[25] = 1; moveIcon[26] = 1; moveIcon[27] = 1;
  throwIcon[32] = 1; moveIcon[33] = 1; moveIcon[34] = 1; moveIcon[35] = 1;
  throwIcon[40] = 1; moveIcon[41] = 1; moveIcon[42] = 1; moveIcon[43] = 1;
  throwIcon[48] = 1; moveIcon[49] = 1; moveIcon[50] = 1; moveIcon[51] = 1;
  throwIcon[56] = 1; moveIcon[57] = 1; moveIcon[58] = 1; moveIcon[59] = 1;
  throwIcon[63] = 1;
  drawPixelIcon(ctx, iconX, y - 6, throwIcon, "#ffcc44", scale);

  ctx.font = "7px monospace";
  ctx.fillStyle = "#cccccc";
  ctx.fillText("Space: Throw (READY state)", iconX + 20, y);
  y += lineH;
  ctx.fillText("Double-tap: Activate power-up (DODGE)", iconX + 20, y);
  y += lineH * 2;

  // ── SECTION: BALLS ──
  y += 4;
  ctx.font = "bold 9px monospace";
  ctx.fillStyle = "#ffcc44";
  ctx.fillText("BALLS", leftX, y);
  y += lineH + 4;

  // Ball icons with labels (Mega Man 2 style)
  const ballIcons: { name: string; color: string; pixels: number[] }[] = [
    // Dodgeball - simple circle
    {
      name: "Dodgeball",
      color: "#e63946",
      pixels: [0,0,1,1,1,1,0,0,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0,1,1,1,1,0,0],
    },
    // Tracker - circle with guidance lines
    {
      name: "Tracker",
      color: "#9b59b6",
      pixels: [0,0,1,1,1,1,0,0,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0,1,1,1,1,0,0],
    },
    // Splitter - circle with split arrows
    {
      name: "Splitter",
      color: "#2ecc71",
      pixels: [0,0,1,1,1,1,0,0,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0,1,1,1,1,0,0],
    },
    // Ghost - semi-transparent circle
    {
      name: "Ghost",
      color: "#ecf0f1",
      pixels: [0,0,1,1,1,1,0,0,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0,1,1,1,1,0,0],
    },
    // Bomber - circle with fuse
    {
      name: "Bomber",
      color: "#e67e22",
      pixels: [0,0,1,1,1,1,0,0,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0,1,1,1,1,0,0],
    },
    // Zigzag - circle with zigzag path
    {
      name: "Zigzag",
      color: "#f1c40f",
      pixels: [0,0,1,1,1,1,0,0,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0,1,1,1,1,0,0],
    },
  ];

  ballIcons.forEach((ball) => {
    drawPixelIcon(ctx, iconX, y - 6, ball.pixels, ball.color, scale);
    ctx.font = "7px monospace";
    ctx.fillStyle = "#cccccc";
    ctx.fillText(ball.name, iconX + 20, y);
    y += lineH;
  });

  // ── SECTION: POWER-UPS ──
  y += 8;
  ctx.font = "bold 9px monospace";
  ctx.fillStyle = "#ffcc44";
  ctx.fillText("POWER-UPS", leftX, y);
  y += lineH + 4;

  // Power-up icons (Mega Man 2 style)
  const puIcons: { name: string; desc: string; pixels: number[]; color: string }[] = [
    // Instant Transmission - teleport symbol
    {
      name: "Instant Transmission",
      desc: "Teleport to safe spot",
      color: "#00bfff",
      pixels: [0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,1,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    },
    // Ki Shield - shield icon
    {
      name: "Ki Shield",
      desc: "Blocks 1 hit",
      color: "#ffd60a",
      pixels: [0,0,1,1,1,1,0,0,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,0,0,1,1,1,1,0,0,0],
    },
    // Kaioken - red aura
    {
      name: "Kaioken",
      desc: "2x speed 5s",
      color: "#ff2222",
      pixels: [0,1,0,0,0,0,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0,1,1,1,1,1,1,0,0,1,1,1,1,1,1,0,0,1,1,1,1,1,1,0,0,1,0,0,0,0,1,0],
    },
    // Solar Flare - flash
    {
      name: "Solar Flare",
      desc: "Freeze all 3s",
      color: "#ffffaa",
      pixels: [0,0,1,0,0,1,0,0,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0,0,1,0,0,1,0,0],
    },
    // Senzu Bean - green bean
    {
      name: "Senzu Bean",
      desc: "+1 life",
      color: "#00cc44",
      pixels: [0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0,0,1,1,1,0,0,0,0,0,0,0,0],
    },
    // TimeSkip - hourglass
    {
      name: "TimeSkip",
      desc: "Slow balls 4s",
      color: "#3a86ff",
      pixels: [0,0,1,1,1,1,0,0,0,1,1,1,1,1,1,0,1,1,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0],
    },
    // DestructoDisc - orange disc
    {
      name: "Destructo Disc",
      desc: "Destroys 1 ball",
      color: "#ff8c00",
      pixels: [0,0,0,1,1,0,0,0,0,1,1,1,1,1,1,0,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0,0],
    },
    // Afterimage - purple afterimage
    {
      name: "Afterimage",
      desc: "Decoy 4s",
      color: "#bb88ff",
      pixels: [0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0,0,1,1,1,0,0,0,0,0,0,0,0],
    },
    // Shrink - shrinking arrow
    {
      name: "Shrink",
      desc: "Half size 5s",
      color: "#88ddff",
      pixels: [0,0,0,0,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
    },
    // SpiritBomb - large sphere
    {
      name: "Spirit Bomb",
      desc: "Clear round",
      color: "#44ddff",
      pixels: [0,0,0,1,1,0,0,0,0,1,1,1,1,1,1,0,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,0,0],
    },
    // InvincibleStar - golden star
    {
      name: "Invincible Star",
      desc: "3s invincible",
      color: "#ffdd00",
      pixels: [0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    },
  ];

  puIcons.forEach((pu) => {
    drawPixelIcon(ctx, iconX, y - 6, pu.pixels, pu.color, scale);
    ctx.font = "bold 7px monospace";
    ctx.fillStyle = pu.color;
    ctx.textAlign = "left";
    ctx.fillText(pu.name, iconX + 20, y);
    ctx.font = "7px monospace";
    ctx.fillStyle = "#cccccc";
    ctx.fillText(pu.desc, iconX + 20, y + lineH);
    y += lineH * 2;
  });

  ctx.restore();
}
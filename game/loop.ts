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

    // Power-up collection SFX (per-type unique sounds)
    if (g.lastPowerUp) {
      audio.playSFX(g.lastPowerUp); // Matches SFX_MAP keys (e.g., "kaioken", "kiShield")
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
  drawHUD(ctx, g.round, g.lives, g.timer, g.score);
}

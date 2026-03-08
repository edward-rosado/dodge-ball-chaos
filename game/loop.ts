import { GameState, ST } from "./types";
import { CW, CH, C } from "./constants";
import { applyKeyboardMovement } from "./input";
import { update } from "./update";
import { drawGrid, drawArenaBoundary } from "./renderer/background";
import { drawGoku } from "./renderer/player";
import { drawBall, drawPreviewBall } from "./renderer/ball";
import { drawPipe } from "./renderer/pipe";
import { drawHUD, drawText } from "./renderer/hud";
import { drawPowerUp } from "./renderer/powerup";

/** Core update + render. Called each frame via requestAnimationFrame. */
export function tick(
  ctx: CanvasRenderingContext2D,
  g: GameState,
  dt: number
): void {
  // ── Update game logic ──
  update(g, dt, applyKeyboardMovement);

  // ── Render ──
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, CW, CH);
  drawGrid(ctx, CW, CH, g.t * 8);
  drawArenaBoundary(ctx);

  // ── TITLE ──
  if (g.state === ST.TITLE) {
    drawGoku(ctx, CW / 2, CH / 2 - 40, false);
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

  // ── Draw pipes ──
  g.pipes.forEach((p, i) => drawPipe(ctx, p, i === g.activePipe, g.t));
  drawPowerUp(ctx, g.powerUp, g.t);

  // ── Message overlay ──
  if (g.msgTimer > 0) {
    drawText(ctx, g.msg, CH / 2, C.round, 14);
  }

  // ── READY ──
  if (g.state === ST.READY) {
    drawGoku(ctx, g.px, g.py, false);
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
    drawGoku(ctx, g.px, g.py, false);
    drawHUD(ctx, g.round, g.lives, g.timer, g.score);
    return;
  }

  // ── DODGE ──
  if (g.state === ST.DODGE) {
    g.balls.forEach((b) => drawBall(ctx, b, g.t));

    if (g.shield) {
      ctx.beginPath();
      ctx.arc(g.px, g.py, 22, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,214,10," + (0.5 + Math.sin(g.t * 8) * 0.3) + ")";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (g.slow) {
      ctx.font = "8px monospace";
      ctx.fillStyle = C.powerSlow;
      ctx.textAlign = "center";
      ctx.fillText("SLOW " + g.slowTimer.toFixed(1) + "s", CW / 2, 72);
    }
  }

  drawGoku(ctx, g.px, g.py, g.flash > 0);
  drawHUD(ctx, g.round, g.lives, g.timer, g.score);
}

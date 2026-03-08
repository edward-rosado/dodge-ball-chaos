import { GameState, ST } from "./types";
import {
  CW,
  CH,
  C,
  PIPE_COUNT,
  BASE_BALL_SPEED,
  HIT_DIST,
  ARENA_CX,
  ARENA_CY,
  ARENA_RADIUS,
} from "./constants";
import { dist, circularClamp, bounceOffWall, checkPipeSuckIn } from "./physics";
import { initRound } from "./state";
import { applyKeyboardMovement } from "./input";
import { drawGrid, drawArenaBoundary } from "./renderer/background";
import { drawGoku } from "./renderer/player";
import { drawBall } from "./renderer/ball";
import { drawPipe } from "./renderer/pipe";
import { drawHUD, drawText } from "./renderer/hud";
import { drawPowerUp } from "./renderer/powerup";

/** Core update + render. Called each frame via requestAnimationFrame. */
export function tick(
  ctx: CanvasRenderingContext2D,
  g: GameState,
  dt: number
): void {
  g.t += dt;

  // ── Clear ──
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

  // ── GAME OVER ──
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
    g.msgTimer -= dt;
    drawText(ctx, g.msg, CH / 2, C.round, 14);
  }
  if (g.flash > 0) g.flash -= dt;
  if (g.slow) {
    g.slowTimer -= dt;
    if (g.slowTimer <= 0) g.slow = false;
  }
  if (g.shield) {
    g.shieldTimer -= dt;
    if (g.shieldTimer <= 0) g.shield = false;
  }

  const sm = g.slow ? 0.4 : 1;

  // ── READY ──
  if (g.state === ST.READY) {
    drawGoku(ctx, g.px, g.py, false);
    drawBall(ctx, g.px, g.py - 20, false);
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
    if (g.thrown) {
      g.thrown.x += g.thrown.vx;
      g.thrown.y += g.thrown.vy;
      drawBall(ctx, g.thrown.x, g.thrown.y, true);

      // Check pipe suck-in first
      const suckPipe = checkPipeSuckIn(g.thrown, g.pipes);
      if (suckPipe >= 0) {
        g.activePipe = suckPipe;
      }

      // Bounce off wall — on first bounce, transition to DODGE and persist the ball
      const bounced = bounceOffWall(g.thrown);
      if (bounced || suckPipe >= 0) {
        // Move thrown ball into the balls array so it persists
        g.balls.push(g.thrown);
        g.thrown = null;
        g.state = ST.DODGE;
        g.launchDelay = 0.6;
      }
    }
    drawGoku(ctx, g.px, g.py, false);
    drawHUD(ctx, g.round, g.lives, g.timer, g.score);
    return;
  }

  // ── DODGE ──
  if (g.state === ST.DODGE) {
    // Keyboard movement
    applyKeyboardMovement(g);

    // Move player + clamp to circular boundary
    const clamped = circularClamp(g.px + g.pvx, g.py + g.pvy);
    g.px = clamped.x;
    g.py = clamped.y;

    // Launch balls from pipes
    g.launchDelay -= dt;
    if (g.launched < g.launchQueue && g.launchDelay <= 0) {
      const pi = Math.floor(Math.random() * PIPE_COUNT);
      const p = g.pipes[pi];
      const a = p.angle + Math.PI; // Fire inward
      const spd = BASE_BALL_SPEED + g.round * 0.25;
      const spread = (Math.random() - 0.5) * 0.4;
      g.balls.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(a + spread) * spd,
        vy: Math.sin(a + spread) * spd,
        bounceCount: 0,
      });
      g.activePipe = pi;
      g.launched++;
      g.launchDelay = Math.max(0.3, 1.2 - g.round * 0.08);
    }

    // Update balls: move, check pipe suck-in, bounce off wall
    g.balls.forEach((b) => {
      b.x += b.vx * sm;
      b.y += b.vy * sm;
      // Check pipe suck-in (teleport to another pipe)
      const suckPipe = checkPipeSuckIn(b, g.pipes);
      if (suckPipe >= 0) {
        g.activePipe = suckPipe;
      } else {
        // Only bounce off wall if not sucked into a pipe
        bounceOffWall(b);
      }
    });

    // Collision detection
    if (!g.shield) {
      for (const b of g.balls) {
        if (dist({ x: g.px, y: g.py }, b) < HIT_DIST) {
          g.lives--;
          g.flash = 0.5;
          if (g.lives <= 0) {
            g.state = ST.OVER;
            g.highScore = Math.max(g.highScore, g.score);
          } else {
            g.state = ST.HIT;
            g.msgTimer = 1.2;
            g.msg = "HIT!";
          }
          break;
        }
      }
    }

    // Power-up collection
    if (
      g.powerUp &&
      !g.powerUp.collected &&
      dist({ x: g.px, y: g.py }, g.powerUp) < 20
    ) {
      g.powerUp.collected = true;
      if (g.powerUp.type === "slow") {
        g.slow = true;
        g.slowTimer = 3;
        g.msg = "SLOW MOTION!";
        g.msgTimer = 1;
      } else {
        g.shield = true;
        g.shieldTimer = 2.5;
        g.msg = "SHIELD!";
        g.msgTimer = 1;
      }
    }

    // Round timer
    g.timer -= dt;
    if (g.timer <= 0 && g.state === ST.DODGE) {
      g.score += g.round * 100;
      g.round++;
      g.state = ST.CLEAR;
      g.msgTimer = 1.5;
      g.msg = "CLEAR!";
    }

    // Draw balls
    g.balls.forEach((b) => drawBall(ctx, b.x, b.y, true));

    // Shield visual
    if (g.shield) {
      ctx.beginPath();
      ctx.arc(g.px, g.py, 22, 0, Math.PI * 2);
      ctx.strokeStyle =
        "rgba(255,214,10," + (0.5 + Math.sin(g.t * 8) * 0.3) + ")";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // Slow indicator
    if (g.slow) {
      ctx.font = "8px monospace";
      ctx.fillStyle = C.powerSlow;
      ctx.textAlign = "center";
      ctx.fillText("SLOW " + g.slowTimer.toFixed(1) + "s", CW / 2, 72);
    }
  }

  // ── HIT / CLEAR transitions ──
  if (g.state === ST.HIT && g.msgTimer <= 0) initRound(g);
  if (g.state === ST.CLEAR && g.msgTimer <= 0) initRound(g);

  // ── Draw player ──
  drawGoku(ctx, g.px, g.py, g.flash > 0);

  drawHUD(ctx, g.round, g.lives, g.timer, g.score);
}

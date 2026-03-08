import { GameState, ST, MoveProvider } from "./types";
import {
  PIPE_COUNT,
  BASE_BALL_SPEED,
  HIT_DIST,
} from "./constants";
import { dist, circularClamp, bounceOffWall, checkPipeSuckIn } from "./physics";
import { initRound } from "./state";

/**
 * Pure game logic update — no rendering, no canvas.
 * Called each frame by both the real game loop and headless simulation.
 */
export function update(g: GameState, dt: number, moveProvider?: MoveProvider): void {
  g.t += dt;

  // ── Timers (always tick) ──
  if (g.msgTimer > 0) g.msgTimer -= dt;
  if (g.flash > 0) g.flash -= dt;
  if (g.slow) {
    g.slowTimer -= dt;
    if (g.slowTimer <= 0) g.slow = false;
  }
  if (g.shield) {
    g.shieldTimer -= dt;
    if (g.shieldTimer <= 0) g.shield = false;
  }

  // ── THROW ──
  if (g.state === ST.THROW) {
    if (g.thrown) {
      g.thrown.x += g.thrown.vx;
      g.thrown.y += g.thrown.vy;

      const suckPipe = checkPipeSuckIn(g.thrown, g.pipes);
      if (suckPipe >= 0) g.activePipe = suckPipe;

      const bounced = bounceOffWall(g.thrown);
      if (bounced || suckPipe >= 0) {
        g.balls.push(g.thrown);
        g.thrown = null;
        g.state = ST.DODGE;
        g.launchDelay = 0.6;
      }
    }
    return;
  }

  // ── DODGE ──
  if (g.state === ST.DODGE) {
    // Movement (keyboard for real game, bot for simulation)
    if (moveProvider) moveProvider(g);

    // Move player + clamp to arena boundary
    const clamped = circularClamp(g.px + g.pvx, g.py + g.pvy);
    g.px = clamped.x;
    g.py = clamped.y;

    // Launch balls from pipes
    g.launchDelay -= dt;
    if (g.launched < g.launchQueue && g.launchDelay <= 0) {
      const pi = Math.floor(Math.random() * PIPE_COUNT);
      const p = g.pipes[pi];
      const a = p.angle + Math.PI;
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

    // Update balls
    const sm = g.slow ? 0.4 : 1;
    for (const b of g.balls) {
      b.x += b.vx * sm;
      b.y += b.vy * sm;
      const suckPipe = checkPipeSuckIn(b, g.pipes);
      if (suckPipe >= 0) {
        g.activePipe = suckPipe;
      } else {
        bounceOffWall(b);
      }
    }

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
          return;
        }
      }
    }

    // Power-up collection
    if (g.powerUp && !g.powerUp.collected && dist({ x: g.px, y: g.py }, g.powerUp) < 20) {
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
  }

  // ── HIT / CLEAR transitions ──
  if (g.state === ST.HIT && g.msgTimer <= 0) initRound(g);
  if (g.state === ST.CLEAR && g.msgTimer <= 0) initRound(g);
}

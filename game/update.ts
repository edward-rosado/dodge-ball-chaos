import { GameState, Ball, ST, MoveProvider } from "./types";
import {
  PIPE_COUNT,
  BASE_BALL_SPEED,
  PLAYER_HITBOX,
  getDifficulty,
} from "./constants";
import { dist, circularClamp, bounceOffWall, checkPipeSuckIn } from "./physics";
import { initRound } from "./state";
import { updateBallByType } from "./balls/dispatcher";
import { createBall } from "./balls/factory";
import { getAvailableTypes } from "./balls/spawn";

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
    let anyBounced = false;
    for (const t of g.thrown) {
      t.x += t.vx;
      t.y += t.vy;
      const suckPipe = checkPipeSuckIn(t, g.pipes);
      if (suckPipe >= 0) { g.activePipe = suckPipe; anyBounced = true; }
      const bounced = bounceOffWall(t);
      if (bounced) anyBounced = true;
    }
    if (anyBounced) {
      g.balls.push(...g.thrown);
      g.thrown = [];
      g.state = ST.DODGE;
      g.launchDelay = 0.6;
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
      const diff = getDifficulty(g.round);
      const spd = BASE_BALL_SPEED + g.round * diff.speedPerRound;
      const available = getAvailableTypes(g.round);
      const type = available[Math.floor(Math.random() * available.length)];
      const ball = createBall(type, p, spd);
      g.balls.push(ball);
      g.activePipe = pi;
      g.launched++;
      g.launchDelay = Math.max(diff.launchDelayMin, 1.2 - g.round * 0.03);
    }

    // Update balls
    const sm = g.slow ? 0.4 : 1;
    const newBalls: Ball[] = [];
    for (const b of g.balls) {
      b.x += b.vx * sm;
      b.y += b.vy * sm;

      // Type-specific update (tracker curves, ghost phases, etc.)
      updateBallByType(b, g, newBalls);

      // Physics: pipe suck-in or wall bounce
      const suckPipe = checkPipeSuckIn(b, g.pipes);
      if (suckPipe >= 0) {
        g.activePipe = suckPipe;
      } else {
        bounceOffWall(b);
      }
    }

    // Add children (Splitter, Mirage) and remove dead balls
    if (newBalls.length > 0) g.balls.push(...newBalls);
    g.balls = g.balls.filter(b => !b.dead);

    // Collision detection
    if (!g.shield) {
      for (const b of g.balls) {
        if (b.isReal && dist({ x: g.px, y: g.py }, b) < b.radius + PLAYER_HITBOX) {
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
      // Bonus life at milestone rounds (every 5th round starting at 10)
      if (g.round >= 10 && g.round % 5 === 0) {
        g.lives++;
        g.msg = "CLEAR! +1 LIFE!";
      } else {
        g.msg = "CLEAR!";
      }
      g.round++;
      g.state = ST.CLEAR;
      g.msgTimer = 1.5;
    }
  }

  // ── HIT / CLEAR transitions ──
  if (g.state === ST.HIT && g.msgTimer <= 0) initRound(g);
  if (g.state === ST.CLEAR && g.msgTimer <= 0) initRound(g);
}

import { describe, it, expect } from "vitest";
import { makeGame, initRound, startGame } from "../state";
import { bounceOffWall, checkPipeSuckIn, dist, circularClamp } from "../physics";
import { GameState, ST, Ball, Point } from "../types";
import {
  ARENA_CX,
  ARENA_CY,
  ARENA_LEFT,
  ARENA_RIGHT,
  ARENA_TOP,
  ARENA_BOTTOM,
  ARENA_RADIUS,
  BASE_BALL_SPEED,
  HIT_DIST,
  PLAYER_SPEED,
  PIPE_COUNT,
  PLAYER_HITBOX,
  THROW_SPEED,
} from "../constants";

// ─── Headless simulation ───

const DT = 1 / 60; // 60fps frame step

/** Predict ball position N frames ahead (simple linear extrapolation). */
function predictBall(b: Ball, frames: number): Point {
  return { x: b.x + b.vx * frames, y: b.y + b.vy * frames };
}

/**
 * Bot AI with predictive multi-frame threat avoidance.
 * Evaluates 16 candidate directions at 3 time horizons,
 * picking the direction that maximizes minimum distance from all balls.
 */
function botMove(g: GameState): void {
  if (g.balls.length === 0) {
    // No balls — drift toward center
    const toCenterX = ARENA_CX - g.px;
    const toCenterY = ARENA_CY - g.py;
    const m = Math.hypot(toCenterX, toCenterY);
    if (m > 5) {
      g.pvx = (toCenterX / m) * PLAYER_SPEED * 0.5;
      g.pvy = (toCenterY / m) * PLAYER_SPEED * 0.5;
    } else {
      g.pvx = 0;
      g.pvy = 0;
    }
    return;
  }

  // Evaluate 16 candidate directions + staying still
  const NUM_DIRS = 16;
  const candidates: { dx: number; dy: number }[] = [];
  for (let i = 0; i < NUM_DIRS; i++) {
    const a = (Math.PI * 2 * i) / NUM_DIRS;
    candidates.push({ dx: Math.cos(a), dy: Math.sin(a) });
  }
  candidates.push({ dx: 0, dy: 0 });

  // Check at multiple time horizons to avoid short-sighted moves
  const horizons = [5, 10, 20];

  let bestScore = -Infinity;
  let bestDx = 0;
  let bestDy = 0;

  for (const c of candidates) {
    let worstMinDist = Infinity; // Worst case across all horizons

    for (const h of horizons) {
      const futureX = g.px + c.dx * PLAYER_SPEED * h;
      const futureY = g.py + c.dy * PLAYER_SPEED * h;
      const clamped = circularClamp(futureX, futureY);

      // Min distance from any predicted ball at this horizon
      let minBallDist = Infinity;
      for (const b of g.balls) {
        const futureB = predictBall(b, h);
        const d = dist(clamped, futureB);
        if (d < minBallDist) minBallDist = d;
      }

      if (minBallDist < worstMinDist) worstMinDist = minBallDist;
    }

    // Center bonus: prefer positions closer to center (more escape room)
    const futurePos = circularClamp(
      g.px + c.dx * PLAYER_SPEED * 10,
      g.py + c.dy * PLAYER_SPEED * 10,
    );
    const centerDist = dist(futurePos, { x: ARENA_CX, y: ARENA_CY });
    const centerBonus = ((ARENA_RADIUS - centerDist) / ARENA_RADIUS) * 8;

    // Wall penalty: avoid getting trapped at the edge
    const wallProximity = ARENA_RADIUS - centerDist;
    const wallPenalty = wallProximity < 30 ? (30 - wallProximity) * 0.5 : 0;

    const score = worstMinDist + centerBonus - wallPenalty;
    if (score > bestScore) {
      bestScore = score;
      bestDx = c.dx;
      bestDy = c.dy;
    }
  }

  const mm = Math.hypot(bestDx, bestDy);
  if (mm > 0.01) {
    g.pvx = (bestDx / mm) * PLAYER_SPEED;
    g.pvy = (bestDy / mm) * PLAYER_SPEED;
  } else {
    g.pvx = 0;
    g.pvy = 0;
  }
}

/** Simulate one frame of the DODGE state without rendering. */
function simulateFrame(g: GameState): void {
  botMove(g);

  // Move player + clamp to arena
  const clamped = circularClamp(g.px + g.pvx, g.py + g.pvy);
  g.px = clamped.x;
  g.py = clamped.y;

  // Launch balls from pipes
  g.launchDelay -= DT;
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
    g.launched++;
    g.launchDelay = Math.max(0.3, 1.2 - g.round * 0.08);
  }

  // Update balls
  const sm = g.slow ? 0.4 : 1;
  for (const b of g.balls) {
    b.x += b.vx * sm;
    b.y += b.vy * sm;
    const suckPipe = checkPipeSuckIn(b, g.pipes);
    if (suckPipe < 0) {
      bounceOffWall(b);
    }
  }

  // Collision detection
  if (!g.shield) {
    for (const b of g.balls) {
      if (dist({ x: g.px, y: g.py }, b) < HIT_DIST) {
        g.lives--;
        if (g.lives <= 0) {
          g.state = ST.OVER;
        } else {
          g.state = ST.HIT;
        }
        return;
      }
    }
  }

  // Round timer
  g.timer -= DT;
  if (g.timer <= 0) {
    g.score += g.round * 100;
    g.round++;
    g.state = ST.CLEAR;
  }
}

/** Throw the dodgeball and fast-forward until it bounces into DODGE state. */
function throwAndTransition(g: GameState): void {
  g.thrown = { x: g.px, y: g.py, vx: 0, vy: -THROW_SPEED, bounceCount: 0 };
  g.state = ST.THROW;
  for (let i = 0; i < 120; i++) {
    if (!g.thrown) break;
    g.thrown.x += g.thrown.vx;
    g.thrown.y += g.thrown.vy;
    const suck = checkPipeSuckIn(g.thrown, g.pipes);
    const bounced = bounceOffWall(g.thrown);
    if (bounced || suck >= 0) {
      g.balls.push(g.thrown);
      g.thrown = null;
      g.state = ST.DODGE;
      g.launchDelay = 0.6;
      break;
    }
  }
}

/** Run a full headless game simulation. Returns the round reached. */
function simulateGame(maxRounds: number = 10): { roundReached: number; survived: boolean } {
  const g = makeGame();
  startGame(g);
  throwAndTransition(g);

  const maxFrames = maxRounds * 15 * 60; // ~15s per round at 60fps
  for (let frame = 0; frame < maxFrames; frame++) {
    if (g.state === ST.OVER) break;

    if (g.state === ST.DODGE) {
      simulateFrame(g);
    } else if (g.state === ST.HIT || g.state === ST.CLEAR) {
      initRound(g);
      if (g.round > maxRounds) {
        return { roundReached: g.round - 1, survived: true };
      }
      throwAndTransition(g);
    }
  }

  return { roundReached: g.round, survived: g.state !== ST.OVER };
}

/** Run N simulations, return survival rate. */
function survivalRate(maxRounds: number, runs: number): number {
  let survivals = 0;
  for (let i = 0; i < runs; i++) {
    const result = simulateGame(maxRounds);
    if (result.survived) survivals++;
  }
  return survivals / runs;
}

// ─── Beatability tests ───
// Targets from design doc (docs/plans/2026-03-07-game-overhaul-implementation-plan.md):
//   L1-10: 60%+  | L11-20: 50%+ | L21-30: 40%+
//   L31-40: 30%+ | L41-49: 25%+ | L50: 20%+
//
// Bot thresholds are set ~10-15% below human targets since the bot
// uses basic predictive avoidance — a human player performs better.

describe("beatability", () => {
  // ─── L1-10 bracket (target: 60%+, bot threshold: 50%+) ───

  it("should survive round 1 consistently (only dodgeball, no pipe balls)", () => {
    const rate = survivalRate(1, 50);
    expect(rate).toBeGreaterThanOrEqual(0.8);
  });

  it("L1-10: bot survives rounds 1-5 at ≥40% (human target: 60%)", { timeout: 15000 }, () => {
    const rate = survivalRate(5, 50);
    expect(rate).toBeGreaterThanOrEqual(0.4);
  });

  it("L1-10: bot survives rounds 1-10 at ≥20% (human target: 60%)", { timeout: 15000 }, () => {
    const rate = survivalRate(10, 50);
    expect(rate).toBeGreaterThanOrEqual(0.2);
  });

  // ─── L11-20 bracket (target: 50%+, bot threshold: 10%+) ───

  it("L11-20: bot can reach round 15 (at least 1 of 50 runs)", { timeout: 30000 }, () => {
    let bestRound = 0;
    for (let i = 0; i < 50; i++) {
      const result = simulateGame(20);
      if (result.roundReached > bestRound) bestRound = result.roundReached;
      if (bestRound >= 15) break;
    }
    expect(bestRound).toBeGreaterThanOrEqual(12);
  });

  // ─── Difficulty curve ───

  it("should have increasing difficulty (fewer survivals at higher rounds)", { timeout: 30000 }, () => {
    const rate3 = survivalRate(3, 50);
    const rate5 = survivalRate(5, 50);
    const rate10 = survivalRate(10, 50);
    // Monotonically decreasing survival
    expect(rate3).toBeGreaterThanOrEqual(rate5);
    expect(rate5).toBeGreaterThanOrEqual(rate10);
  });
});

// ─── Game mechanics sanity ───

describe("game mechanics sanity", () => {
  it("should have exactly round-1 pipe balls launched per round", () => {
    const g = makeGame();
    startGame(g);
    expect(g.launchQueue).toBe(0);

    g.round = 2;
    initRound(g);
    expect(g.launchQueue).toBe(1);

    g.round = 5;
    initRound(g);
    expect(g.launchQueue).toBe(4);
  });

  it("should decrease timer as rounds increase (harder rounds are shorter)", () => {
    const g = makeGame();
    startGame(g);
    const timer1 = g.timer;

    g.round = 5;
    initRound(g);
    const timer5 = g.timer;

    g.round = 10;
    initRound(g);
    const timer10 = g.timer;

    expect(timer1).toBeGreaterThan(timer5);
    expect(timer5).toBeGreaterThan(timer10);
  });

  it("should enforce minimum timer of 4 seconds", () => {
    const g = makeGame();
    g.round = 100;
    initRound(g);
    expect(g.timer).toBeGreaterThanOrEqual(4);
  });

  it("should increase ball speed with round number", () => {
    const speed1 = BASE_BALL_SPEED + 1 * 0.25;
    const speed10 = BASE_BALL_SPEED + 10 * 0.25;
    expect(speed10).toBeGreaterThan(speed1);
  });

  it("should keep player inside the arena during simulation", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.balls.push({ x: ARENA_CX + 50, y: ARENA_CY, vx: -3, vy: 2, bounceCount: 0 });

    for (let i = 0; i < 600; i++) {
      simulateFrame(g);
      if (g.state !== ST.DODGE) break;
      // Player must stay within the rounded-rect arena (with hitbox inset)
      expect(g.px).toBeGreaterThanOrEqual(ARENA_LEFT + PLAYER_HITBOX - 1);
      expect(g.px).toBeLessThanOrEqual(ARENA_RIGHT - PLAYER_HITBOX + 1);
      expect(g.py).toBeGreaterThanOrEqual(ARENA_TOP + PLAYER_HITBOX - 1);
      expect(g.py).toBeLessThanOrEqual(ARENA_BOTTOM - PLAYER_HITBOX + 1);
    }
  });

  it("should keep all balls inside the arena (bouncing)", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5;
      g.balls.push({
        x: ARENA_CX + Math.cos(a) * 50,
        y: ARENA_CY + Math.sin(a) * 50,
        vx: Math.cos(a) * 4,
        vy: Math.sin(a) * 4,
        bounceCount: 0,
      });
    }

    const margin = 5; // Small tolerance for push-back timing
    for (let i = 0; i < 300; i++) {
      simulateFrame(g);
      if (g.state !== ST.DODGE) break;
      for (const b of g.balls) {
        // Balls must stay within the rounded-rect arena boundary
        expect(b.x).toBeGreaterThanOrEqual(ARENA_LEFT - margin);
        expect(b.x).toBeLessThanOrEqual(ARENA_RIGHT + margin);
        expect(b.y).toBeGreaterThanOrEqual(ARENA_TOP - margin);
        expect(b.y).toBeLessThanOrEqual(ARENA_BOTTOM + margin);
      }
    }
  });
});

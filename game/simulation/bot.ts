import { GameState, Ball, Point, MoveProvider } from "../types";
import {
  ARENA_CX,
  ARENA_CY,
  ARENA_RADIUS,
  PLAYER_SPEED,
} from "../constants";
import { dist, circularClamp } from "../physics";

/** Predict ball position N frames ahead (simple linear extrapolation). */
function predictBall(b: Ball, frames: number): Point {
  return { x: b.x + b.vx * frames, y: b.y + b.vy * frames };
}

// ── Reaction delay state (module-level, reset per simulation run) ──
let lastDecisionTime = -1;
let cachedDx = 0;
let cachedDy = 0;

/** Reset bot state between simulation runs. */
export function resetBotState(): void {
  lastDecisionTime = -1;
  cachedDx = 0;
  cachedDy = 0;
}

/**
 * Bot AI: simulates a casual 10-year-old player.
 *
 * Models kid-level play:
 * - 280ms reaction delay (slower than adult gamer ~150ms)
 * - 8 directions (cardinal + diagonal — natural on touch/WASD)
 * - Medium lookahead (3/6 frames — can react but not predict far ahead)
 * - Panic jitter (20% within 50px, 8% otherwise)
 * - 15% chance of picking 2nd-best direction (imprecise decisions)
 * - Minimal power-up seeking (only when very safe)
 * - Weak center-seeking (doesn't understand positional strategy)
 *
 * Implements MoveProvider interface for use with update().
 */
export const botMove: MoveProvider = (g: GameState): void => {
  if (g.balls.length === 0) {
    // No balls — drift toward center or nearest power-up if obvious
    const uncollectedPU = g.powerUps.filter(p => !p.collected);
    const nearPU = uncollectedPU.find(p => dist({ x: g.px, y: g.py }, p) < 80);
    const target = nearPU
      ? { x: nearPU.x, y: nearPU.y }
      : { x: ARENA_CX, y: ARENA_CY };
    const dx = target.x - g.px;
    const dy = target.y - g.py;
    const m = Math.hypot(dx, dy);
    if (m > 10) {
      g.pvx = (dx / m) * PLAYER_SPEED * 0.4;
      g.pvy = (dy / m) * PLAYER_SPEED * 0.4;
    } else {
      g.pvx = 0;
      g.pvy = 0;
    }
    return;
  }

  // Reaction delay: 280ms between decisions
  const REACTION_DELAY = 0.28;
  if (lastDecisionTime >= 0 && g.t - lastDecisionTime < REACTION_DELAY) {
    const mm = Math.hypot(cachedDx, cachedDy);
    if (mm > 0.01) {
      g.pvx = (cachedDx / mm) * PLAYER_SPEED;
      g.pvy = (cachedDy / mm) * PLAYER_SPEED;
    } else {
      g.pvx = 0;
      g.pvy = 0;
    }
    return;
  }
  lastDecisionTime = g.t;

  // Find nearest ball distance for pressure calculation
  let nearestBallDist = Infinity;
  for (const b of g.balls) {
    const d = dist({ x: g.px, y: g.py }, b);
    if (d < nearestBallDist) nearestBallDist = d;
  }

  // Panic jitter — kids panic when balls are close
  const jitterChance = nearestBallDist < 50 ? 0.20 : 0.08;
  if (Math.random() < jitterChance) {
    const randomAngle = Math.random() * Math.PI * 2;
    cachedDx = Math.cos(randomAngle);
    cachedDy = Math.sin(randomAngle);
    const mm = Math.hypot(cachedDx, cachedDy);
    g.pvx = (cachedDx / mm) * PLAYER_SPEED;
    g.pvy = (cachedDy / mm) * PLAYER_SPEED;
    return;
  }

  // 8 directions (cardinal + diagonal) + stationary
  const NUM_DIRS = 8;
  const candidates: { dx: number; dy: number }[] = [];
  for (let i = 0; i < NUM_DIRS; i++) {
    const a = (Math.PI * 2 * i) / NUM_DIRS;
    candidates.push({ dx: Math.cos(a), dy: Math.sin(a) });
  }
  candidates.push({ dx: 0, dy: 0 });

  // Medium lookahead — can react but not predict far ahead
  const horizons = [3, 6];

  const scores: { dx: number; dy: number; score: number }[] = [];

  for (const c of candidates) {
    let worstMinDist = Infinity;

    for (const h of horizons) {
      const futureX = g.px + c.dx * PLAYER_SPEED * h;
      const futureY = g.py + c.dy * PLAYER_SPEED * h;
      const clamped = circularClamp(futureX, futureY);

      let minBallDist = Infinity;
      for (const b of g.balls) {
        const futureB = predictBall(b, h);
        const d = dist(clamped, futureB);
        if (d < minBallDist) minBallDist = d;
      }

      if (minBallDist < worstMinDist) worstMinDist = minBallDist;
    }

    // Weak center bias
    const futurePos = circularClamp(
      g.px + c.dx * PLAYER_SPEED * 6,
      g.py + c.dy * PLAYER_SPEED * 6,
    );
    const centerDist = dist(futurePos, { x: ARENA_CX, y: ARENA_CY });
    const centerBonus = ((ARENA_RADIUS - centerDist) / ARENA_RADIUS) * 4;
    const wallProximity = ARENA_RADIUS - centerDist;
    const wallPenalty = wallProximity < 20 ? (20 - wallProximity) * 0.3 : 0;

    const score = worstMinDist + centerBonus - wallPenalty;
    scores.push({ dx: c.dx, dy: c.dy, score });
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // 15% chance of picking 2nd-best direction (imprecise decisions)
  const pick = (scores.length >= 2 && Math.random() < 0.15) ? scores[1] : scores[0];

  cachedDx = pick.dx;
  cachedDy = pick.dy;

  const mm = Math.hypot(pick.dx, pick.dy);
  if (mm > 0.01) {
    g.pvx = (pick.dx / mm) * PLAYER_SPEED;
    g.pvy = (pick.dy / mm) * PLAYER_SPEED;
  } else {
    g.pvx = 0;
    g.pvy = 0;
  }
};

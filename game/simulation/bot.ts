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

/** Reaction delay — human ~200ms between decisions. */
const REACTION_DELAY = 0.2;

/**
 * Bot AI: human-realistic threat avoidance + power-up collection.
 * Models human limitations:
 * - 200ms reaction delay (re-evaluates every 0.2s, not every frame)
 * - 8 candidate directions (cardinal + diagonal, not 16)
 * - Reduced lookahead horizons (3/6/10 frames, not 5/10/20)
 * - Random jitter under pressure (15% panic chance within 50px)
 * Implements MoveProvider interface for use with update().
 */
export const botMove: MoveProvider = (g: GameState): void => {
  if (g.balls.length === 0) {
    // No balls — drift toward center or nearest power-up
    const uncollectedPU = g.powerUps.filter(p => !p.collected);
    const nearestPU = uncollectedPU.length > 0 ? uncollectedPU[0] : null;
    const target = nearestPU
      ? { x: nearestPU.x, y: nearestPU.y }
      : { x: ARENA_CX, y: ARENA_CY };
    const dx = target.x - g.px;
    const dy = target.y - g.py;
    const m = Math.hypot(dx, dy);
    if (m > 5) {
      g.pvx = (dx / m) * PLAYER_SPEED * 0.5;
      g.pvy = (dy / m) * PLAYER_SPEED * 0.5;
    } else {
      g.pvx = 0;
      g.pvy = 0;
    }
    return;
  }

  // Reaction delay: only re-evaluate every REACTION_DELAY seconds
  if (lastDecisionTime >= 0 && g.t - lastDecisionTime < REACTION_DELAY) {
    // Use cached direction from last decision
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

  // Random jitter under pressure
  const jitterChance = nearestBallDist < 50 ? 0.15 : 0.05;
  if (Math.random() < jitterChance) {
    // Pick a random direction (panic/imprecision)
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

  // Reduced lookahead horizons (human can't predict 20 frames ahead)
  const horizons = [3, 6, 10];

  let bestScore = -Infinity;
  let bestDx = 0;
  let bestDy = 0;

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

    const futurePos = circularClamp(
      g.px + c.dx * PLAYER_SPEED * 10,
      g.py + c.dy * PLAYER_SPEED * 10,
    );
    const centerDist = dist(futurePos, { x: ARENA_CX, y: ARENA_CY });
    const centerBonus = ((ARENA_RADIUS - centerDist) / ARENA_RADIUS) * 8;
    const wallProximity = ARENA_RADIUS - centerDist;
    const wallPenalty = wallProximity < 30 ? (30 - wallProximity) * 0.5 : 0;

    // Power-up bonus: prefer directions toward uncollected power-ups when safe
    let powerUpBonus = 0;
    const uncollected = g.powerUps.filter(p => !p.collected);
    if (uncollected.length > 0 && worstMinDist > 40) {
      for (const pu of uncollected) {
        const puDist = dist(futurePos, pu);
        powerUpBonus += Math.max(0, (100 - puDist) / 100) * 15;
      }
    }

    const score = worstMinDist + centerBonus - wallPenalty + powerUpBonus;
    if (score > bestScore) {
      bestScore = score;
      bestDx = c.dx;
      bestDy = c.dy;
    }
  }

  cachedDx = bestDx;
  cachedDy = bestDy;

  const mm = Math.hypot(bestDx, bestDy);
  if (mm > 0.01) {
    g.pvx = (bestDx / mm) * PLAYER_SPEED;
    g.pvy = (bestDy / mm) * PLAYER_SPEED;
  } else {
    g.pvx = 0;
    g.pvy = 0;
  }
};

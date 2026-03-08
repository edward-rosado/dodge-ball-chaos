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

/**
 * Bot AI: predictive multi-frame threat avoidance + power-up collection.
 * Evaluates 16 candidate directions at 3 time horizons,
 * picking the direction that maximizes minimum distance from all balls.
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

  const NUM_DIRS = 16;
  const candidates: { dx: number; dy: number }[] = [];
  for (let i = 0; i < NUM_DIRS; i++) {
    const a = (Math.PI * 2 * i) / NUM_DIRS;
    candidates.push({ dx: Math.cos(a), dy: Math.sin(a) });
  }
  candidates.push({ dx: 0, dy: 0 });

  const horizons = [5, 10, 20];

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

  const mm = Math.hypot(bestDx, bestDy);
  if (mm > 0.01) {
    g.pvx = (bestDx / mm) * PLAYER_SPEED;
    g.pvy = (bestDy / mm) * PLAYER_SPEED;
  } else {
    g.pvx = 0;
    g.pvy = 0;
  }
};

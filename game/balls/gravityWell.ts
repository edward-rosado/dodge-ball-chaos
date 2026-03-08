import { Ball, GameState } from "../types";

const PULL_RADIUS = 80;
const PULL_STRENGTH = 0.3;

/** GravityWell: pulls player toward it within radius. */
export function updateGravityWell(ball: Ball, g: GameState): void {
  const dx = ball.x - g.px;
  const dy = ball.y - g.py;
  const d = Math.hypot(dx, dy);

  if (d > 0 && d < PULL_RADIUS) {
    g.px += (dx / d) * PULL_STRENGTH;
    g.py += (dy / d) * PULL_STRENGTH;
  }
}

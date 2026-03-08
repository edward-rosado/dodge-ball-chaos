import { Ball, GameState } from "../types";

/** Tracker: curves toward player at 2% angle lerp per frame. */
export function updateTracker(ball: Ball, g: GameState): void {
  const targetAngle = Math.atan2(g.py - ball.y, g.px - ball.x);
  const currentAngle = Math.atan2(ball.vy, ball.vx);
  const speed = Math.hypot(ball.vx, ball.vy);

  // Lerp angle toward player (2% per frame)
  let diff = targetAngle - currentAngle;
  // Normalize to [-PI, PI]
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;

  const newAngle = currentAngle + diff * 0.02;
  ball.vx = Math.cos(newAngle) * speed;
  ball.vy = Math.sin(newAngle) * speed;
}

import { Ball, GameState } from "../types";

/** Tracker: curves toward player (or afterimage decoy) at 2% angle lerp per frame. */
export function updateTracker(ball: Ball, g: GameState): void {
  // If afterimage decoy exists, target it instead of the player
  const targetX = g.afterimageDecoy ? g.afterimageDecoy.x : g.px;
  const targetY = g.afterimageDecoy ? g.afterimageDecoy.y : g.py;

  const targetAngle = Math.atan2(targetY - ball.y, targetX - ball.x);
  const currentAngle = Math.atan2(ball.vy, ball.vx);
  const speed = Math.hypot(ball.vx, ball.vy);

  // Lerp angle toward target — turn harder when close to prevent orbiting
  let diff = targetAngle - currentAngle;
  // Normalize to [-PI, PI]
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;

  const distance = Math.hypot(targetX - ball.x, targetY - ball.y);
  // Base 2% lerp at long range, ramps up to 15% within 60px
  const lerpRate = distance < 60 ? 0.02 + 0.13 * (1 - distance / 60) : 0.02;
  const newAngle = currentAngle + diff * lerpRate;
  ball.vx = Math.cos(newAngle) * speed;
  ball.vy = Math.sin(newAngle) * speed;
}

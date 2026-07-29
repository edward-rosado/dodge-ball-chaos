import { Ball } from "../types";

const MAX_SPEED_MULTIPLIER = 8;

/** SpeedDemon: caps speed at 8x base to prevent invisible balls. */
export function updateSpeedDemon(ball: Ball): void {
  const speed = Math.hypot(ball.vx, ball.vy);
  // Use a fixed base speed reference (approx BASE_BALL_SPEED) for the cap
  const maxSpeed = 2.0 * MAX_SPEED_MULTIPLIER;

  if (speed > maxSpeed) {
    const scale = maxSpeed / speed;
    ball.vx *= scale;
    ball.vy *= scale;
  }
}

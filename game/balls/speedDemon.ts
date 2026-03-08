import { Ball } from "../types";

const MAX_SPEED_MULTIPLIER = 8;

/** SpeedDemon: caps speed at 8x base to prevent invisible balls. */
export function updateSpeedDemon(ball: Ball): void {
  const speed = Math.hypot(ball.vx, ball.vy);
  const baseSpeed = speed / Math.pow(2, ball.bounceCount);
  const maxSpeed = baseSpeed * MAX_SPEED_MULTIPLIER;

  if (speed > maxSpeed) {
    const scale = maxSpeed / speed;
    ball.vx *= scale;
    ball.vy *= scale;
  }
}

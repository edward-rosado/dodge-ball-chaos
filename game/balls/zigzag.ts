import { Ball } from "../types";

const ZIGZAG_AMP = 1.5;  // Amplitude of sine offset per frame
const ZIGZAG_FREQ = 0.1; // Frequency of sine wave

/** Zigzag: adds sine-wave offset perpendicular to velocity. */
export function updateZigzag(ball: Ball): void {
  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed < 0.01) return;

  // Perpendicular direction
  const perpX = -ball.vy / speed;
  const perpY = ball.vx / speed;

  // Sine offset
  const offset = Math.cos(ball.age * ZIGZAG_FREQ) * ZIGZAG_AMP;
  ball.x += perpX * offset;
  ball.y += perpY * offset;
}

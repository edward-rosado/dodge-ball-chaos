import { C, BALL_R } from "../constants";

export function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  glow: boolean
): void {
  if (glow) {
    ctx.shadowColor = C.ball;
    ctx.shadowBlur = 12;
  }
  ctx.beginPath();
  ctx.arc(~~x, ~~y, BALL_R, 0, Math.PI * 2);
  ctx.fillStyle = C.ball;
  ctx.fill();
  // Highlight
  ctx.beginPath();
  ctx.arc(~~x - 2, ~~y - 2, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = C.ballHi;
  ctx.fill();
  ctx.shadowBlur = 0;
}

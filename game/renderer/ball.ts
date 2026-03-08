import { Ball } from "../types";
import { BallType, BALL_COLORS } from "../balls/types";
import { C, BALL_R } from "../constants";

/** Draw a ball — used for both READY state preview and in-game balls. */
export function drawBall(ctx: CanvasRenderingContext2D, ball: Ball, t: number): void {
  const color = BALL_COLORS[ball.type];

  ctx.save();

  // Ghost: reduce opacity when phased out
  if (ball.type === BallType.Ghost && !ball.isReal) {
    ctx.globalAlpha = 0.2;
  }

  // Mirage fakes: semi-transparent
  if (ball.type === BallType.Mirage && !ball.isReal) {
    ctx.globalAlpha = 0.4;
  }

  // Bomber: flash rate increases near 3rd bounce
  let drawColor = color;
  if (ball.type === BallType.Bomber) {
    const flashRate = ball.bounceCount >= 2 ? 12 : 6;
    if (Math.floor(t * flashRate) % 2 === 0) drawColor = "#fff";
  }

  // Draw the ball
  ctx.fillStyle = drawColor;
  ctx.beginPath();
  ctx.arc(~~ball.x, ~~ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  // Glow for dodgeball
  if (ball.type === BallType.Dodgeball) {
    ctx.shadowColor = "#ff4444";
    ctx.shadowBlur = 8 + Math.sin(t * 4) * 3;
    ctx.beginPath();
    ctx.arc(~~ball.x, ~~ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Highlight
  ctx.beginPath();
  ctx.arc(~~ball.x - 2, ~~ball.y - 2, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = C.ballHi;
  ctx.fill();

  // Tracker: reticle overlay
  if (ball.type === BallType.Tracker) {
    ctx.strokeStyle = "#ff00ff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(~~ball.x, ~~ball.y, ball.radius + 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  // GravityWell: swirl effect
  if (ball.type === BallType.GravityWell) {
    ctx.strokeStyle = "rgba(128,0,255,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(~~ball.x, ~~ball.y, 40, t * 2, t * 2 + Math.PI * 1.5);
    ctx.stroke();
  }

  ctx.restore();
}

/** Draw a simple preview ball (for READY state, above player's head). */
export function drawPreviewBall(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.beginPath();
  ctx.arc(~~x, ~~y, BALL_R, 0, Math.PI * 2);
  ctx.fillStyle = C.ball;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(~~x - 2, ~~y - 2, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = C.ballHi;
  ctx.fill();
}

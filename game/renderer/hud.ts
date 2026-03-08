import { C, CW, BASE_ROUND_TIME } from "../constants";
import { clamp, px } from "../physics";
import { audio } from "../audio/engine";

/** Music toggle button position and size (top-right corner). */
export const MUSIC_BTN = { x: CW - 28, y: 44, w: 24, h: 18 };

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  round: number,
  lives: number,
  timer: number,
  score: number
): void {
  ctx.font = "bold 13px 'Press Start 2P', monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = C.hud;
  ctx.fillText("RND " + round, 12, 24);
  ctx.textAlign = "right";
  ctx.fillText("" + score, CW - 12, 24);
  ctx.textAlign = "left";
  if (lives <= 10) {
    for (let i = 0; i < lives; i++) {
      ctx.fillStyle = C.life;
      ctx.fillText("\u2665", 24 + i * 20, 46);
    }
  } else {
    ctx.fillStyle = C.life;
    ctx.fillText("\u2665 x" + lives, 24, 46);
  }
  const maxW = CW - 24;
  const pct = clamp(timer / BASE_ROUND_TIME, 0, 1);
  px(ctx, 12, 56, maxW, 4, C.lifeDead);
  px(ctx, 12, 56, maxW * pct, 4, pct < 0.25 ? C.life : C.round);

  // Music toggle button
  drawMusicButton(ctx, audio.musicMuted);
}

/** Draw the music on/off button. */
function drawMusicButton(ctx: CanvasRenderingContext2D, muted: boolean): void {
  const { x, y, w, h } = MUSIC_BTN;
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = muted ? "#662222" : "#225533";
  ctx.strokeStyle = muted ? "#ff4444" : "#44ff88";
  ctx.lineWidth = 1;
  // Rounded rect background
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 4);
  ctx.fill();
  ctx.stroke();
  // Icon: speaker shape
  ctx.globalAlpha = 1;
  ctx.fillStyle = muted ? "#ff6666" : "#ffffff";
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(muted ? "♪✕" : "♪", x, y);
  ctx.restore();
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  color: string,
  size: number
): void {
  ctx.save();
  ctx.font = "bold " + size + "px 'Press Start 2P', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.fillStyle = color;
  ctx.fillText(text, CW / 2, y);
  ctx.shadowBlur = 0;
  ctx.restore();
}

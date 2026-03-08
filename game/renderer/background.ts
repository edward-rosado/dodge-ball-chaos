import { C, ARENA_LEFT, ARENA_RIGHT, ARENA_TOP, ARENA_BOTTOM, ARENA_CORNER_R } from "../constants";
import { getBackgroundDrawFn } from "./backgrounds";

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  backgroundId: number
): void {
  const drawBg = getBackgroundDrawFn(backgroundId);
  drawBg(ctx, w, h, t);
}

export function drawArenaBoundary(ctx: CanvasRenderingContext2D): void {
  const l = ARENA_LEFT;
  const r = ARENA_RIGHT;
  const t = ARENA_TOP;
  const b = ARENA_BOTTOM;
  const cr = ARENA_CORNER_R;

  ctx.beginPath();
  ctx.moveTo(l + cr, t);
  ctx.lineTo(r - cr, t);
  ctx.arcTo(r, t, r, t + cr, cr);
  ctx.lineTo(r, b - cr);
  ctx.arcTo(r, b, r - cr, b, cr);
  ctx.lineTo(l + cr, b);
  ctx.arcTo(l, b, l, b - cr, cr);
  ctx.lineTo(l, t + cr);
  ctx.arcTo(l, t, l + cr, t, cr);
  ctx.closePath();
  ctx.strokeStyle = C.arenaEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
}

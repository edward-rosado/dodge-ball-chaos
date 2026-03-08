import { Pipe } from "../types";
import { C } from "../constants";
import { px } from "../physics";

export function drawPipe(
  ctx: CanvasRenderingContext2D,
  p: Pipe,
  active: boolean,
  t: number
): void {
  const s = 14;
  ctx.save();
  if (active) {
    ctx.shadowColor = C.pipeGlow;
    ctx.shadowBlur = 10 + Math.sin(t * 6) * 5;
  }
  px(ctx, p.x - s / 2, p.y - s / 2, s, s, active ? C.pipeGlow : C.pipe);
  px(ctx, p.x - s / 4, p.y - s / 4, s / 2, s / 2, active ? C.white : "#1a6b64");
  ctx.restore();
}

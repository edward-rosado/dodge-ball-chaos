import { C } from "../constants";
import { px } from "../physics";

export function drawGoku(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  flash: boolean
): void {
  const u = 4;
  const bx = ~~(x - u * 3.5);
  const by = ~~(y - u * 4);
  if (flash) {
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 16;
  }
  // Hair
  px(ctx, bx + u, by, u, u * 2.5, C.hair);
  px(ctx, bx + u * 2, by - u * 1.2, u, u * 3, C.hair);
  px(ctx, bx + u * 3, by - u * 1.8, u, u * 3.5, C.hair);
  px(ctx, bx + u * 4, by - u * 1.2, u, u * 3, C.hair);
  px(ctx, bx + u * 5, by, u, u * 2, C.hair);
  // Face
  px(ctx, bx + u * 2, by + u * 1.8, u * 3, u * 1.8, flash ? C.white : C.skin);
  px(ctx, bx + u * 2.4, by + u * 2.5, u * 0.6, u * 0.6, C.hair);
  px(ctx, bx + u * 4, by + u * 2.5, u * 0.6, u * 0.6, C.hair);
  // Body
  px(ctx, bx + u * 2, by + u * 3.6, u * 3, u * 2.5, flash ? C.white : C.player);
  px(ctx, bx + u * 2, by + u * 5, u * 3, u * 0.5, C.belt);
  // Legs
  px(ctx, bx + u * 2.2, by + u * 6, u, u * 1.5, flash ? C.white : C.player);
  px(ctx, bx + u * 3.8, by + u * 6, u, u * 1.5, flash ? C.white : C.player);
  ctx.shadowBlur = 0;
}

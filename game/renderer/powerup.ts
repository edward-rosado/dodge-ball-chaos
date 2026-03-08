import { PowerUp } from "../types";
import { C } from "../constants";

export function drawPowerUp(
  ctx: CanvasRenderingContext2D,
  pu: PowerUp | null,
  t: number
): void {
  if (!pu || pu.collected) return;
  const pulse = 1 + Math.sin(t * 5) * 0.15;
  const r = 10 * pulse;
  ctx.save();
  ctx.shadowColor = pu.type === "slow" ? C.powerSlow : C.powerShield;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(~~pu.x, ~~pu.y, r, 0, Math.PI * 2);
  ctx.fillStyle = pu.type === "slow" ? C.powerSlow : C.powerShield;
  ctx.fill();
  ctx.font = "bold 10px monospace";
  ctx.fillStyle = C.white;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(pu.type === "slow" ? "S" : "\u2605", pu.x, pu.y + 1);
  ctx.restore();
}

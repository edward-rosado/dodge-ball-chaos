import { PowerUp } from "../types";
import { C } from "../constants";
import { PowerUpType, POWER_UP_CONFIGS } from "../powerups/types";

/**
 * Legacy single power-up renderer. Kept for backward compatibility.
 * The main loop now uses drawPowerUps from powerups/render instead.
 */
export function drawPowerUp(
  ctx: CanvasRenderingContext2D,
  pu: PowerUp | null,
  t: number
): void {
  if (!pu || pu.collected) return;
  const config = POWER_UP_CONFIGS[pu.type as PowerUpType];
  if (!config) return;
  const pulse = 1 + Math.sin(t * 5) * 0.15;
  const r = 10 * pulse;
  ctx.save();
  ctx.shadowColor = config.glowColor;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(~~pu.x, ~~pu.y, r, 0, Math.PI * 2);
  ctx.fillStyle = config.color;
  ctx.fill();
  ctx.font = "bold 10px monospace";
  ctx.fillStyle = C.white;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(config.icon, pu.x, pu.y + 1);
  ctx.restore();
}

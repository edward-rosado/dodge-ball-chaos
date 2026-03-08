import { PowerUp, GameState, Point } from "../types";
import { C } from "../constants";
import { POWER_UP_CONFIGS } from "./types";

/** Draw a single power-up capsule with pulsing animation and type-specific icon. */
export function drawPowerUpCapsule(
  ctx: CanvasRenderingContext2D,
  pu: PowerUp,
  t: number
): void {
  if (pu.collected) return;
  const cfg = POWER_UP_CONFIGS[pu.type];
  const pulse = 1 + Math.sin(t * 5) * 0.15;
  const r = 10 * pulse;

  ctx.save();
  ctx.shadowColor = cfg.glowColor;
  ctx.shadowBlur = 14;

  // Draw capsule body
  ctx.beginPath();
  ctx.arc(~~pu.x, ~~pu.y, r, 0, Math.PI * 2);
  ctx.fillStyle = cfg.color;
  ctx.fill();

  // Draw capsule outline
  ctx.strokeStyle = cfg.glowColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw icon text
  ctx.font = "bold 8px monospace";
  ctx.fillStyle = C.white;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(cfg.icon, pu.x, pu.y + 1);
  ctx.restore();
}

/** Draw all power-ups on screen. */
export function drawPowerUps(
  ctx: CanvasRenderingContext2D,
  powerUps: PowerUp[],
  t: number
): void {
  for (const pu of powerUps) {
    drawPowerUpCapsule(ctx, pu, t);
  }
}

/** Draw Kaioken aura around player. */
export function drawKaiokenAura(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number
): void {
  const pulse = 1 + Math.sin(t * 10) * 0.2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 24 * pulse, 0, Math.PI * 2);
  const alpha = 0.3 + Math.sin(t * 8) * 0.15;
  ctx.strokeStyle = `rgba(255,34,34,${alpha})`;
  ctx.lineWidth = 3;
  ctx.stroke();
  // Inner glow
  ctx.beginPath();
  ctx.arc(x, y, 18 * pulse, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255,100,50,${alpha * 0.6})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/** Draw Ki Shield bubble around player. */
export function drawKiShield(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255,214,10,${0.5 + Math.sin(t * 8) * 0.3})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/** Draw Shrink indicator (smaller ring). */
export function drawShrinkIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  const alpha = 0.4 + Math.sin(t * 6) * 0.2;
  ctx.strokeStyle = `rgba(136,221,255,${alpha})`;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.restore();
}

/** Draw Spirit Bomb charge circle (growing). */
export function drawSpiritBombCharge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  t: number
): void {
  ctx.save();
  const maxR = 40;
  const r = maxR * progress;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  const alpha = 0.3 + Math.sin(t * 12) * 0.15;
  ctx.strokeStyle = `rgba(68,221,255,${alpha})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Fill with transparent blue
  ctx.fillStyle = `rgba(68,221,255,${alpha * 0.3})`;
  ctx.fill();
  // Text
  ctx.font = "bold 8px monospace";
  ctx.fillStyle = `rgba(255,255,255,${0.7 + Math.sin(t * 6) * 0.3})`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CHARGING...", x, y - r - 10);
  ctx.restore();
}

/** Draw afterimage decoy (ghost player). */
export function drawAfterimageDecoy(
  ctx: CanvasRenderingContext2D,
  pos: Point,
  t: number
): void {
  ctx.save();
  const alpha = 0.3 + Math.sin(t * 8) * 0.15;
  ctx.globalAlpha = alpha;
  // Draw a ghostly player silhouette
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 14, 0, Math.PI * 2);
  ctx.fillStyle = "#bb88ff";
  ctx.fill();
  ctx.font = "8px monospace";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("?", pos.x, pos.y);
  ctx.restore();
}

/** Draw active power-up status indicators (timers, uses). */
export function drawPowerUpHUD(
  ctx: CanvasRenderingContext2D,
  g: GameState,
  canvasWidth: number
): void {
  ctx.save();
  ctx.font = "8px monospace";
  ctx.textAlign = "center";
  let hudY = 72;
  const cx = canvasWidth / 2;

  if (g.slow) {
    ctx.fillStyle = "#3a86ff";
    ctx.fillText("TIME SKIP " + g.slowTimer.toFixed(1) + "s", cx, hudY);
    hudY += 12;
  }
  if (g.kaioken) {
    ctx.fillStyle = "#ff2222";
    ctx.fillText("KAIOKEN " + g.kaiokenTimer.toFixed(1) + "s", cx, hudY);
    hudY += 12;
  }
  if (g.solarFlare) {
    ctx.fillStyle = "#ffffaa";
    ctx.fillText("SOLAR FLARE " + g.solarFlareTimer.toFixed(1) + "s", cx, hudY);
    hudY += 12;
  }
  if (g.shrink) {
    ctx.fillStyle = "#88ddff";
    ctx.fillText("SHRINK " + g.shrinkTimer.toFixed(1) + "s", cx, hudY);
    hudY += 12;
  }
  if (g.afterimageDecoy) {
    ctx.fillStyle = "#bb88ff";
    ctx.fillText("AFTERIMAGE " + g.afterimageTimer.toFixed(1) + "s", cx, hudY);
    hudY += 12;
  }
  if (g.instantTransmissionUses > 0) {
    ctx.fillStyle = "#00bfff";
    ctx.fillText("IT x" + g.instantTransmissionUses + " [SPACE]", cx, hudY);
    hudY += 12;
  }
  if (g.spiritBombCharging) {
    ctx.fillStyle = "#44ddff";
    ctx.fillText("SPIRIT BOMB " + g.spiritBombTimer.toFixed(1) + "s", cx, hudY);
    hudY += 12;
  }

  ctx.restore();
}

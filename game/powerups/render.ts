import { PowerUp, GameState, Point } from "../types";
import { C } from "../constants";
import { POWER_UP_CONFIGS, PowerUpType } from "./types";
import { drawGoku } from "../renderer/player";
import { SaiyanForm } from "../transformation";

/** Draw a single power-up with unique shape per type. */
export function drawPowerUpCapsule(
  ctx: CanvasRenderingContext2D,
  pu: PowerUp,
  t: number
): void {
  if (pu.collected) return;
  const cfg = POWER_UP_CONFIGS[pu.type];
  const pulse = 1 + Math.sin(t * 5) * 0.15;
  const x = ~~pu.x;
  const y = ~~pu.y;

  ctx.save();
  ctx.shadowColor = cfg.glowColor;
  ctx.shadowBlur = 14;

  switch (pu.type) {
    case PowerUpType.SenzuBean:
      drawSenzuBean(ctx, x, y, pulse, cfg.color);
      break;
    case PowerUpType.DestructoDisc:
      drawDestructoDisc(ctx, x, y, pulse, t);
      break;
    case PowerUpType.KiShield:
      drawStar(ctx, x, y, pulse, cfg.color);
      break;
    case PowerUpType.Kaioken:
      drawFlame(ctx, x, y, pulse, t);
      break;
    case PowerUpType.SolarFlare:
      drawSunburst(ctx, x, y, pulse, t);
      break;
    case PowerUpType.TimeSkip:
      drawHourglass(ctx, x, y, pulse, cfg.color);
      break;
    case PowerUpType.InstantTransmission:
      drawLightningBolt(ctx, x, y, pulse, cfg.color);
      break;
    case PowerUpType.Afterimage:
      drawGhost(ctx, x, y, pulse, t, cfg.color);
      break;
    case PowerUpType.Shrink:
      drawDownArrow(ctx, x, y, pulse, cfg.color);
      break;
    case PowerUpType.SpiritBombCharge:
      drawEnergyOrb(ctx, x, y, pulse, t, cfg.color);
      break;
    default:
      // Fallback circle
      ctx.beginPath();
      ctx.arc(x, y, 10 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = cfg.color;
      ctx.fill();
  }

  // Name above the icon
  ctx.shadowBlur = 0;
  ctx.font = "bold 6px monospace";
  ctx.fillStyle = cfg.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(cfg.icon, x, y - 13);
  // Effect label below
  ctx.font = "bold 5px monospace";
  ctx.fillStyle = C.white;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(cfg.label, x, y + 13);

  ctx.restore();
}

// ── Per-type shape drawers ──

function drawSenzuBean(ctx: CanvasRenderingContext2D, x: number, y: number, p: number, color: string) {
  // Bean shape — tilted oval with a crease
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.3);
  ctx.scale(p, p);
  ctx.beginPath();
  ctx.ellipse(0, 0, 5, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // Crease line
  ctx.strokeStyle = "#008833";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-3, -2);
  ctx.quadraticCurveTo(0, 1, 3, -1);
  ctx.stroke();
  // Highlight
  ctx.fillStyle = "#44ff77";
  ctx.beginPath();
  ctx.ellipse(-1, -4, 2, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDestructoDisc(ctx: CanvasRenderingContext2D, x: number, y: number, p: number, t: number) {
  // Spinning yellow disc with orange edge
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t * 8);
  ctx.scale(p, p);
  // Outer ring
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#ffaa00";
  ctx.fill();
  // Inner cutout
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#ffe066";
  ctx.fill();
  // Blade lines
  ctx.strokeStyle = "#ff6600";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5);
    ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, p: number, color: string) {
  // 5-pointed star
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p, p);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerA = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const innerA = outerA + Math.PI / 5;
    ctx.lineTo(Math.cos(outerA) * 10, Math.sin(outerA) * 10);
    ctx.lineTo(Math.cos(innerA) * 4, Math.sin(innerA) * 4);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
}

function drawFlame(ctx: CanvasRenderingContext2D, x: number, y: number, p: number, t: number) {
  // Red flame shape
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p, p);
  const flicker = Math.sin(t * 12) * 2;
  // Outer flame
  ctx.beginPath();
  ctx.moveTo(0, -12 + flicker);
  ctx.quadraticCurveTo(8, -4, 6, 4);
  ctx.quadraticCurveTo(3, 10, 0, 8);
  ctx.quadraticCurveTo(-3, 10, -6, 4);
  ctx.quadraticCurveTo(-8, -4, 0, -12 + flicker);
  ctx.fillStyle = "#ff2222";
  ctx.fill();
  // Inner flame
  ctx.beginPath();
  ctx.moveTo(0, -8 + flicker);
  ctx.quadraticCurveTo(4, -2, 3, 3);
  ctx.quadraticCurveTo(1, 7, 0, 5);
  ctx.quadraticCurveTo(-1, 7, -3, 3);
  ctx.quadraticCurveTo(-4, -2, 0, -8 + flicker);
  ctx.fillStyle = "#ff8844";
  ctx.fill();
  ctx.restore();
}

function drawSunburst(ctx: CanvasRenderingContext2D, x: number, y: number, p: number, t: number) {
  // Sun with radiating rays
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p, p);
  // Rays
  ctx.strokeStyle = "#ffff44";
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + t * 2;
    const inner = 6;
    const outer = 11 + Math.sin(t * 6 + i) * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
    ctx.stroke();
  }
  // Center circle
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffcc";
  ctx.fill();
  ctx.restore();
}

function drawHourglass(ctx: CanvasRenderingContext2D, x: number, y: number, p: number, color: string) {
  // Hourglass shape
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p, p);
  ctx.beginPath();
  ctx.moveTo(-6, -10);
  ctx.lineTo(6, -10);
  ctx.lineTo(1, 0);
  ctx.lineTo(6, 10);
  ctx.lineTo(-6, 10);
  ctx.lineTo(-1, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.stroke();
  // Sand dots
  ctx.fillStyle = "#88bbff";
  ctx.fillRect(-2, 3, 4, 5);
  ctx.restore();
}

function drawLightningBolt(ctx: CanvasRenderingContext2D, x: number, y: number, p: number, color: string) {
  // Zigzag lightning bolt
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p, p);
  ctx.beginPath();
  ctx.moveTo(2, -12);
  ctx.lineTo(6, -12);
  ctx.lineTo(0, -2);
  ctx.lineTo(4, -2);
  ctx.lineTo(-4, 12);
  ctx.lineTo(0, 2);
  ctx.lineTo(-4, 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
}

function drawGhost(ctx: CanvasRenderingContext2D, x: number, y: number, p: number, t: number, color: string) {
  // Ghost silhouette with wavy bottom
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p, p);
  ctx.globalAlpha = 0.6 + Math.sin(t * 4) * 0.2;
  ctx.beginPath();
  ctx.arc(0, -4, 7, Math.PI, 0); // Rounded top
  ctx.lineTo(7, 6);
  // Wavy bottom
  ctx.quadraticCurveTo(5, 3, 3, 6);
  ctx.quadraticCurveTo(1, 9, -1, 6);
  ctx.quadraticCurveTo(-3, 3, -5, 6);
  ctx.quadraticCurveTo(-7, 9, -7, 6);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Eyes
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(-3, -4, 2, 0, Math.PI * 2);
  ctx.arc(3, -4, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDownArrow(ctx: CanvasRenderingContext2D, x: number, y: number, p: number, color: string) {
  // Down-pointing arrow (shrink)
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p, p);
  ctx.beginPath();
  ctx.moveTo(0, 10);     // Point
  ctx.lineTo(-8, -2);
  ctx.lineTo(-3, -2);
  ctx.lineTo(-3, -10);
  ctx.lineTo(3, -10);
  ctx.lineTo(3, -2);
  ctx.lineTo(8, -2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
}

function drawEnergyOrb(ctx: CanvasRenderingContext2D, x: number, y: number, p: number, t: number, color: string) {
  // Glowing energy sphere with orbiting particles
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p, p);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.4, color);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  // Orbiting sparks
  for (let i = 0; i < 4; i++) {
    const a = t * 3 + (i / 4) * Math.PI * 2;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 8, Math.sin(a) * 8, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
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

/** Draw Kaioken aura around player — pulsing red glow with rising energy particles. */
export function drawKaiokenAura(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number
): void {
  ctx.save();
  const pulse = 1 + Math.sin(t * 8) * 0.12;

  // Outer red glow via shadow
  ctx.shadowColor = "#ff2222";
  ctx.shadowBlur = 15 + Math.sin(t * 8) * 8;

  // Radial gradient aura
  const grad = ctx.createRadialGradient(x, y, 6, x, y, 36 * pulse);
  grad.addColorStop(0, "rgba(255,50,50,0.25)");
  grad.addColorStop(0.5, "rgba(200,30,30,0.1)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, y, 32 * pulse, 40 * pulse, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  // Rising red energy particles
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + t * 3;
    const dist = 16 + Math.sin(t * 5 + i * 1.7) * 6;
    const wx = x + Math.cos(angle) * dist * 0.5;
    const wy = y - 6 - Math.abs(Math.sin(t * 4 + i)) * 20;
    ctx.globalAlpha = 0.4 + Math.sin(t * 7 + i) * 0.15;
    ctx.fillStyle = "#e63946";
    ctx.beginPath();
    ctx.arc(wx, wy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Draw Ki Shield — golden force field bubble with radial gradient and orbiting sparkles. */
export function drawKiShield(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number
): void {
  ctx.save();
  const pulse = 1 + Math.sin(t * 4) * 0.06;
  const r = 30 * pulse;
  const alpha = 0.25 + Math.sin(t * 4) * 0.1;

  // Radial gradient fill — transparent center to semi-transparent gold edge
  const grad = ctx.createRadialGradient(x, y, 4, x, y, r);
  grad.addColorStop(0, "rgba(255,214,10,0)");
  grad.addColorStop(0.7, `rgba(255,214,10,${alpha * 0.5})`);
  grad.addColorStop(1, `rgba(255,214,10,${alpha})`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Outer ring
  ctx.strokeStyle = `rgba(255,214,10,${0.5 + Math.sin(t * 4) * 0.2})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Orbiting sparkle particles
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + t * 2.5;
    const sx = x + Math.cos(angle) * (r - 2);
    const sy = y + Math.sin(angle) * (r - 2);
    const sparkAlpha = 0.5 + Math.sin(t * 6 + i * 1.5) * 0.3;
    ctx.globalAlpha = sparkAlpha;
    ctx.fillStyle = "#ffe066";
    ctx.beginPath();
    ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
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

/** Draw afterimage decoy as a faint, ghostly Goku silhouette. */
export function drawAfterimageDecoy(
  ctx: CanvasRenderingContext2D,
  pos: Point,
  t: number
): void {
  ctx.save();
  const alpha = 0.25 + Math.sin(t * 8) * 0.1;
  ctx.globalAlpha = alpha;

  // Purple-tinted glow behind the ghost
  ctx.shadowColor = "#bb88ff";
  ctx.shadowBlur = 12;

  // Draw Goku sprite as the decoy (no flash, no movement, base form)
  drawGoku(ctx, pos.x, pos.y, false, t, 0, 0, SaiyanForm.Base);

  ctx.restore();
}

/** Detect touch-capable device for label display. */
const isTouchDevice = typeof window !== "undefined" && "ontouchstart" in window;

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
    ctx.fillText("DECOY ACTIVE " + g.afterimageTimer.toFixed(1) + "s", cx, hudY);
    hudY += 12;
  }
  if (g.afterimageUses > 0 && !g.afterimageDecoy) {
    ctx.fillStyle = "#bb88ff";
    const decoyKey = isTouchDevice ? "[dbl tap]" : "[SPACE]";
    // Show ghost icons for each available use
    let decoyDisplay = "";
    for (let i = 0; i < g.afterimageUses; i++) decoyDisplay += "\uD83D\uDC7B";
    ctx.fillText("DECOY " + decoyDisplay + " " + decoyKey, cx, hudY);
    hudY += 12;
  }
  if (g.instantTransmissionUses > 0) {
    ctx.fillStyle = "#00bfff";
    const itKey = isTouchDevice ? "[dbl tap]" : "[SPACE]";
    // Show lightning bolt icons for each available use
    let itDisplay = "";
    for (let i = 0; i < g.instantTransmissionUses; i++) itDisplay += "\u26A1";
    ctx.fillText("I.T. " + itDisplay + " " + itKey, cx, hudY);
    hudY += 12;
  }
  if (g.spiritBombCharging) {
    ctx.fillStyle = "#44ddff";
    ctx.fillText("\uD83D\uDCA0 SPIRIT BOMB " + g.spiritBombTimer.toFixed(1) + "s", cx, hudY);
    hudY += 12;
  }
  if (g.spiritBombReady && !g.spiritBombCharging) {
    ctx.fillStyle = "#44ddff";
    const sbKey = isTouchDevice ? "[dbl tap]" : "[SPACE]";
    ctx.fillText("\uD83D\uDCA0 SPIRIT BOMB READY " + sbKey, cx, hudY);
    hudY += 12;
  }

  ctx.restore();
}

/** Draw Instant Transmission teleport trail — afterimage at departure, burst at arrival. */
export function drawITTeleportTrail(
  ctx: CanvasRenderingContext2D,
  departX: number,
  departY: number,
  arriveX: number,
  arriveY: number,
  timer: number,
  t: number
): void {
  if (timer <= 0) return;
  const progress = timer / 0.4; // 1.0 at start → 0.0 at end

  ctx.save();

  // Departure afterimage (fading ghost)
  ctx.globalAlpha = progress * 0.5;
  ctx.fillStyle = "#66b0ff";
  ctx.beginPath();
  ctx.arc(departX, departY, 14, 0, Math.PI * 2);
  ctx.fill();
  // Ghost silhouette
  ctx.globalAlpha = progress * 0.3;
  ctx.fillStyle = "#aaddff";
  ctx.beginPath();
  ctx.arc(departX, departY, 10, 0, Math.PI * 2);
  ctx.fill();

  // Connecting line (fades quickly)
  if (progress > 0.5) {
    ctx.globalAlpha = (progress - 0.5) * 0.6;
    ctx.strokeStyle = "#44aaff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(departX, departY);
    ctx.lineTo(arriveX, arriveY);
    ctx.stroke();
  }

  // Arrival burst (expanding blue ring)
  const burstR = (1 - progress) * 30;
  ctx.globalAlpha = progress * 0.6;
  ctx.strokeStyle = "#44ddff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(arriveX, arriveY, burstR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

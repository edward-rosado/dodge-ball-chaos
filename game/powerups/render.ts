import { PowerUp, GameState, Point } from "../types";
import { C, CW, CH } from "../constants";
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
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.3);
  ctx.scale(p, p);
  ctx.beginPath();
  ctx.ellipse(0, 0, 5, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#008833";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-3, -2);
  ctx.quadraticCurveTo(0, 1, 3, -1);
  ctx.stroke();
  ctx.fillStyle = "#44ff77";
  ctx.beginPath();
  ctx.ellipse(-1, -4, 2, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDestructoDisc(ctx: CanvasRenderingContext2D, x: number, y: number, p: number, t: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t * 8);
  ctx.scale(p, p);
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#ffaa00";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#ffe066";
  ctx.fill();
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
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p, p);
  const flicker = Math.sin(t * 12) * 2;
  ctx.beginPath();
  ctx.moveTo(0, -12 + flicker);
  ctx.quadraticCurveTo(8, -4, 6, 4);
  ctx.quadraticCurveTo(3, 10, 0, 8);
  ctx.quadraticCurveTo(-3, 10, -6, 4);
  ctx.quadraticCurveTo(-8, -4, 0, -12 + flicker);
  ctx.fillStyle = "#ff2222";
  ctx.fill();
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
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p, p);
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
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffcc";
  ctx.fill();
  ctx.restore();
}

function drawHourglass(ctx: CanvasRenderingContext2D, x: number, y: number, p: number, color: string) {
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
  ctx.fillStyle = "#88bbff";
  ctx.fillRect(-2, 3, 4, 5);
  ctx.restore();
}

function drawLightningBolt(ctx: CanvasRenderingContext2D, x: number, y: number, p: number, color: string) {
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
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p, p);
  ctx.globalAlpha = 0.6 + Math.sin(t * 4) * 0.2;
  ctx.beginPath();
  ctx.arc(0, -4, 7, Math.PI, 0);
  ctx.lineTo(7, 6);
  ctx.quadraticCurveTo(5, 3, 3, 6);
  ctx.quadraticCurveTo(1, 9, -1, 6);
  ctx.quadraticCurveTo(-3, 3, -5, 6);
  ctx.quadraticCurveTo(-7, 9, -7, 6);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(-3, -4, 2, 0, Math.PI * 2);
  ctx.arc(3, -4, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDownArrow(ctx: CanvasRenderingContext2D, x: number, y: number, p: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p, p);
  ctx.beginPath();
  ctx.moveTo(0, 10);
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

/** Draw Kaioken aura around player. */
export function drawKaiokenAura(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number
): void {
  ctx.save();
  const pulse = 1 + Math.sin(t * 8) * 0.12;
  ctx.shadowColor = "#ff2222";
  ctx.shadowBlur = 15 + Math.sin(t * 8) * 8;
  const grad = ctx.createRadialGradient(x, y, 6, x, y, 36 * pulse);
  grad.addColorStop(0, "rgba(255,50,50,0.25)");
  grad.addColorStop(0.5, "rgba(200,30,30,0.1)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, y, 32 * pulse, 40 * pulse, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
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

/** Draw Ki Shield — golden force field bubble. */
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
  const grad = ctx.createRadialGradient(x, y, 4, x, y, r);
  grad.addColorStop(0, "rgba(255,214,10,0)");
  grad.addColorStop(0.7, `rgba(255,214,10,${alpha * 0.5})`);
  grad.addColorStop(1, `rgba(255,214,10,${alpha})`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(255,214,10,${0.5 + Math.sin(t * 4) * 0.2})`;
  ctx.lineWidth = 2;
  ctx.stroke();
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

/** Draw Shrink indicator — visible hitbox ring at actual hitbox radius (6px = PLAYER_HITBOX/2). */
export function drawShrinkIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number
): void {
  ctx.save();
  const hitboxR = 6;
  const pulse = 0.5 + Math.sin(t * 8) * 0.3;
  ctx.beginPath();
  ctx.arc(x, y, hitboxR, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(136,221,255,${pulse})`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = "bold 6px monospace";
  ctx.fillStyle = `rgba(136,221,255,${0.6 + Math.sin(t * 8) * 0.3})`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SHRINK", x, y - hitboxR - 6);
  ctx.restore();
}

/** Draw Spirit Bomb charge — world darkens, orb grows with energy rings, lightning, and particles. */
export function drawSpiritBombCharge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  t: number
): void {
  ctx.save();

  // ── Vignette darkening (edges darken, center stays visible for gameplay) ──
  const vignetteGrad = ctx.createRadialGradient(CW / 2, CH / 2, Math.min(CW, CH) * 0.25, CW / 2, CH / 2, Math.max(CW, CH) * 0.7);
  vignetteGrad.addColorStop(0, `rgba(0,0,0,0)`);
  vignetteGrad.addColorStop(0.7, `rgba(0,0,0,${progress * 0.4})`);
  vignetteGrad.addColorStop(1, `rgba(0,0,0,${progress * 0.85})`);
  ctx.fillStyle = vignetteGrad;
  ctx.fillRect(0, 0, CW, CH);

  // ── Orb size and pulse ──
  const maxR = 45;
  const r = maxR * progress;
  const pulse = 0.75 + Math.sin(t * 12) * 0.25;
  const shake = progress * 1.5;
  const sx = x + (Math.random() - 0.5) * shake;
  const sy = y + (Math.random() - 0.5) * shake;

  // ── Subtle ground energy pulse ──
  if (progress > 0.1) {
    const groundY = CH - 30;
    const energyGrad = ctx.createRadialGradient(x, groundY, 0, x, groundY, 80 * progress);
    energyGrad.addColorStop(0, `rgba(100,200,255,${progress * 0.15})`);
    energyGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = energyGrad;
    ctx.fillRect(0, groundY - 80 * progress, CW, 80 * progress);
  }

  // ── Energy spiraling inward from edges (collected by the orb) ──
  const particleCount = 30 + Math.floor(progress * 50);
  ctx.globalAlpha = 0.6 + progress * 0.4;
  for (let i = 0; i < particleCount; i++) {
    const baseAngle = (i / particleCount) * Math.PI * 2;
    const spiralSpeed = 2 + progress * 3;
    const angle = baseAngle + t * spiralSpeed;
    const outerDist = 120 + progress * 140;
    const innerDist = r + 5;
    // Spiral from outer to inner
    const spiralFactor = 0.3 + 0.7 * progress;
    const dist = outerDist - (outerDist - innerDist) * spiralFactor + Math.sin(t * 4 + i) * 20;
    const px = sx + Math.cos(angle) * dist;
    const py = sy + Math.sin(angle) * dist;
    const alpha = 0.2 + Math.sin(t * 5 + i * 0.5) * 0.15;
    const size = 1 + progress * 1.5;
    ctx.fillStyle = `rgba(100,220,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ── Lightning arcs from orb edges toward player ──
  if (progress > 0.2) {
    const arcCount = Math.floor(progress * 8);
    for (let i = 0; i < arcCount; i++) {
      const angle = (i / arcCount) * Math.PI * 2 + t * 2;
      const outerR = r * 1.2;
      const innerR = r * 0.3;
      ctx.globalAlpha = 0.3 + Math.sin(t * 15 + i * 3) * 0.2;
      ctx.strokeStyle = `rgba(150,220,255,0.6)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Jagged lightning
      const segments = 4;
      ctx.moveTo(sx + Math.cos(angle) * outerR, sy + Math.sin(angle) * outerR);
      for (let s = 1; s <= segments; s++) {
        const segAngle = angle + (Math.random() - 0.5) * 0.4;
        const segR = outerR - (outerR - innerR) * (s / segments);
        const jx = sx + Math.cos(segAngle) * segR + (Math.random() - 0.5) * 10;
        const jy = sy + Math.sin(segAngle) * segR + (Math.random() - 0.5) * 10;
        ctx.lineTo(jx, jy);
      }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // ── Main orb glow (outer halo) ──
  if (r > 2) {
    const glowGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2);
    glowGrad.addColorStop(0, `rgba(120,210,255,${pulse * 0.4 * progress})`);
    glowGrad.addColorStop(0.3, `rgba(80,160,240,${pulse * 0.25 * progress})`);
    glowGrad.addColorStop(0.6, `rgba(50,100,200,${pulse * 0.1 * progress})`);
    glowGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, r * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Rotating rings around orb ──
  if (r > 5) {
    const ringCount = 3;
    for (let ring = 0; ring < ringCount; ring++) {
      const ringR = r * (0.8 + ring * 0.15);
      const ringSpeed = (ring % 2 === 0 ? 1 : -1) * (3 + ring);
      const ringAlpha = 0.3 + Math.sin(t * 6 + ring) * 0.15;
      ctx.strokeStyle = `rgba(100,200,255,${ringAlpha * progress})`;
      ctx.lineWidth = 1.5 - ring * 0.3;
      ctx.beginPath();
      const segments = 24;
      for (let s = 0; s <= segments; s++) {
        const a = (s / segments) * Math.PI * 2 + t * ringSpeed;
        const rr = ringR + Math.sin(t * 8 + s * 2) * 3;
        const px = sx + Math.cos(a) * rr;
        const py = sy + Math.sin(a) * rr;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  // ── Core orb ──
  if (r > 1) {
    const coreGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    coreGrad.addColorStop(0, `rgba(255,255,255,${pulse * 0.95 * progress})`);
    coreGrad.addColorStop(0.15, `rgba(180,230,255,${pulse * 0.9 * progress})`);
    coreGrad.addColorStop(0.4, `rgba(100,200,255,${pulse * 0.8 * progress})`);
    coreGrad.addColorStop(0.7, `rgba(60,140,220,${pulse * 0.6 * progress})`);
    coreGrad.addColorStop(1, `rgba(30,80,180,${pulse * 0.3 * progress})`);
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core
    const innerR = r * 0.3;
    if (innerR > 1) {
      const innerGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, innerR);
      innerGrad.addColorStop(0, `rgba(255,255,255,${pulse * 0.9 * progress})`);
      innerGrad.addColorStop(1, `rgba(200,240,255,${pulse * 0.4 * progress})`);
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.arc(sx, sy, innerR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Surface crackling on orb ──
  if (r > 15) {
    const crackCount = Math.floor(progress * 12);
    for (let i = 0; i < crackCount; i++) {
      const angle = (i / crackCount) * Math.PI * 2 + t * 4;
      const crackR = r * (0.85 + Math.sin(t * 6 + i) * 0.15);
      const cx = sx + Math.cos(angle) * crackR;
      const cy = sy + Math.sin(angle) * crackR;
      const crackLen = 3 + Math.sin(t * 10 + i) * 2;
      const perpAngle = angle + Math.PI / 2;
      ctx.globalAlpha = 0.4 + Math.sin(t * 8 + i) * 0.2;
      ctx.strokeStyle = `rgba(200,240,255,0.7)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(perpAngle) * crackLen, cy + Math.sin(perpAngle) * crackLen);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // ── Text label ──
  const textAlpha = 0.6 + Math.sin(t * 5) * 0.3;
  ctx.font = `bold ${8 + progress * 2}px 'Press Start 2P', monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (progress >= 1) {
    // READY state — pulsing larger text
    const readyPulse = 0.8 + Math.sin(t * 8) * 0.2;
    ctx.fillStyle = `rgba(255,255,255,${readyPulse})`;
    ctx.shadowColor = "#44ddff";
    ctx.shadowBlur = 15;
    ctx.fillText("READY!", sx, sy - r - 18);
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = `rgba(200,230,255,${textAlpha})`;
    ctx.shadowColor = "#4488cc";
    ctx.shadowBlur = 8;
    ctx.fillText("CHARGING...", sx, sy - r - 14);
    ctx.shadowBlur = 0;
  }

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
  ctx.shadowColor = "#bb88ff";
  ctx.shadowBlur = 12;
  drawGoku(ctx, pos.x, pos.y, false, t, 0, 0, SaiyanForm.Base);
  ctx.restore();
}

/** Detect touch-capable device for label display. */
const isTouchDevice = typeof window !== "undefined" && "ontouchstart" in window;

/** Draw active power-up status indicators (timers, uses, queue). */
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

  if (g.effects.slow) {
    ctx.fillStyle = "#3a86ff";
    ctx.fillText("TIME SKIP " + g.effects.slowTimer.toFixed(1) + "s", cx, hudY);
    hudY += 12;
  }
  if (g.effects.kaioken) {
    ctx.fillStyle = "#ff2222";
    ctx.fillText("KAIOKEN " + g.effects.kaiokenTimer.toFixed(1) + "s", cx, hudY);
    hudY += 12;
  }
  if (g.effects.solarFlare) {
    ctx.fillStyle = "#ffffaa";
    ctx.fillText("SOLAR FLARE " + g.effects.solarFlareTimer.toFixed(1) + "s", cx, hudY);
    hudY += 12;
  }
  if (g.effects.shrink) {
    ctx.fillStyle = "#88ddff";
    ctx.fillText("SHRINK " + g.effects.shrinkTimer.toFixed(1) + "s", cx, hudY);
    hudY += 12;
  }
  if (g.effects.afterimageDecoy) {
    ctx.fillStyle = "#bb88ff";
    ctx.fillText("DECOY ACTIVE " + g.effects.afterimageTimer.toFixed(1) + "s", cx, hudY);
    hudY += 12;
  }
  if (g.effects.afterimageUses > 0 && !g.effects.afterimageDecoy) {
    ctx.fillStyle = "#bb88ff";
    const decoyKey = isTouchDevice ? "[dbl tap]" : "[SPACE]";
    let decoyDisplay = "";
    for (let i = 0; i < g.effects.afterimageUses; i++) decoyDisplay += "\uD83D\uDC7B";
    ctx.fillText("DECOY " + decoyDisplay + " " + decoyKey, cx, hudY);
    hudY += 12;
  }
  if (g.effects.instantTransmissionUses > 0) {
    ctx.fillStyle = "#00bfff";
    const itKey = isTouchDevice ? "[dbl tap]" : "[SPACE]";
    let itDisplay = "";
    for (let i = 0; i < g.effects.instantTransmissionUses; i++) itDisplay += "\u26A1";
    ctx.fillText("I.T. " + itDisplay + " " + itKey, cx, hudY);
    hudY += 12;
  }
  if (g.effects.spiritBombCharging) {
    ctx.fillStyle = "#44ddff";
    ctx.fillText("\uD83D\udca0 SPIRIT BOMB " + g.effects.spiritBombTimer.toFixed(1) + "s", cx, hudY);
    hudY += 12;
  }
  if (g.effects.spiritBombReady && !g.effects.spiritBombCharging) {
    ctx.fillStyle = "#44ddff";
    const sbKey = isTouchDevice ? "[dbl tap]" : "[SPACE]";
    ctx.fillText("\uD83D\udca0 SPIRIT BOMB READY " + sbKey, cx, hudY);
    hudY += 12;
  }

  // Show power-up queue with skip-ahead indicator
  if (g.activePowerUpQueue.length > 0) {
    hudY += 4;
    ctx.font = "7px monospace";
    ctx.fillStyle = "#aaaa88";
    let queueText = "QUEUE: ";
    const queueItems: string[] = [];
    for (const entry of g.activePowerUpQueue) {
      if (entry === "it") queueItems.push("⚡IT(" + g.effects.instantTransmissionUses + ")");
      else if (entry === "afterimage") queueItems.push("👻(" + g.effects.afterimageUses + ")");
      else if (entry === "spiritBomb") queueItems.push("💣(" + (g.effects.spiritBombReady ? "R" : "C") + ")");
    }
    queueText += queueItems.join(" → ");
    ctx.fillText(queueText, cx, hudY);
    hudY += 10;

    // Show skip-ahead info
    if (g.effects.skipAhead > 0) {
      ctx.fillStyle = "#ff8844";
      ctx.fillText("⏭ SKIPPING " + g.effects.skipAhead + " NEXT... (Q to skip 1, Shift+Space to skip 2)", cx, hudY);
    } else {
      ctx.fillStyle = "#888866";
      ctx.fillText("[Q] skip 1  [Shift+Space] skip 2  [Space/Double-tap] activate", cx, hudY);
    }
  }

  ctx.restore();
}

/** Draw Instant Transmission teleport trail. */
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
  const progress = timer / 0.4;

  ctx.save();
  ctx.globalAlpha = progress * 0.5;
  ctx.fillStyle = "#66b0ff";
  ctx.beginPath();
  ctx.arc(departX, departY, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = progress * 0.3;
  ctx.fillStyle = "#aaddff";
  ctx.beginPath();
  ctx.arc(departX, departY, 10, 0, Math.PI * 2);
  ctx.fill();
  if (progress > 0.5) {
    ctx.globalAlpha = (progress - 0.5) * 0.6;
    ctx.strokeStyle = "#44aaff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(departX, departY);
    ctx.lineTo(arriveX, arriveY);
    ctx.stroke();
  }
  const burstR = (1 - progress) * 30;
  ctx.globalAlpha = progress * 0.6;
  ctx.strokeStyle = "#44ddff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(arriveX, arriveY, burstR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
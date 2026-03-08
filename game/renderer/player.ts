import { C } from "../constants";
import { px } from "../physics";
import { SaiyanForm, getHairPalette, getEyeColor } from "../transformation";

// ─── Color palette ───
const SKIN = C.skin;              // #ffb07c
const SKIN_SH = "#e09060";        // Skin shadow
const GI_TOP = C.player;          // #ff6b1a (orange gi)
const GI_TOP_HI = "#ff8844";      // Gi highlight
const GI_TOP_SH = "#cc5010";      // Gi shadow
const BELT = C.belt;              // #3a86ff (blue)
const BELT_SH = "#2060cc";        // Belt shadow
const GI_PANTS = "#ff6b1a";       // Same orange
const GI_PANTS_SH = "#cc5010";
const BOOT = "#3355aa";           // Blue boots
const BOOT_SH = "#223388";
const EYE_WHITE = "#ffffff";
const MOUTH = "#cc4422";
const WRISTBAND = "#3355aa";      // Blue wristbands
const OUTLINE = "#1a1020";

/**
 * Draw an 80x80px SNES-quality Goku sprite.
 * Centered on (x, y). Supports idle bob, running pose, hit flash, and Ultra Instinct.
 */
export function drawGoku(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  flash: boolean,
  t: number = 0,
  vx: number = 0,
  vy: number = 0,
  form: SaiyanForm = SaiyanForm.Base
): void {
  ctx.save();

  // ─── Determine animation state ───
  const speed = Math.hypot(vx, vy);
  const isRunning = speed > 0.5;
  const facingLeft = vx < -0.3;

  // Idle breathing bob (1-2px)
  const breathBob = isRunning ? 0 : Math.sin(t * 3) * 1.5;

  // Running animation cycle
  const runCycle = isRunning ? Math.sin(t * 12) : 0;
  const runPhase = isRunning ? Math.cos(t * 12) : 0;

  // Base position (top-left of 80x80 bounding box)
  const bx = ~~(x - 40);
  const by = ~~(y - 40 + breathBob);

  // Flash effect
  if (flash) {
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 18;
  }

  // Mirror for facing direction
  if (facingLeft) {
    ctx.translate(x, 0);
    ctx.scale(-1, 1);
    ctx.translate(-x, 0);
  }

  const palette = getHairPalette(form);
  const hairColor = palette.main;
  const hairHi = palette.highlight;
  const hairSh = palette.shadow;
  const skinColor = flash ? C.white : SKIN;
  const skinShadow = flash ? "#dddddd" : SKIN_SH;
  const giColor = flash ? C.white : GI_TOP;
  const giHi = flash ? "#eeeeee" : GI_TOP_HI;
  const giSh = flash ? "#cccccc" : GI_TOP_SH;
  const pantsColor = flash ? C.white : GI_PANTS;
  const pantsSh = flash ? "#cccccc" : GI_PANTS_SH;
  const beltColor = flash ? C.white : BELT;
  const bootColor = flash ? C.white : BOOT;
  const bootSh = flash ? "#bbbbbb" : BOOT_SH;
  const wristColor = flash ? C.white : WRISTBAND;
  const eyeIris = getEyeColor(form);

  // ─── HAIR (form-dependent style) ───
  // Base hair mass
  px(ctx, bx + 22, by + 2, 36, 22, hairColor);
  // Spikes (SSJ3 gets extra long spikes)
  drawHairSpikes(ctx, bx, by, hairColor, hairHi, hairSh, t, form);

  // ─── HEAD ───
  // Face base
  px(ctx, bx + 24, by + 18, 32, 20, skinColor);
  // Chin / jaw shadow
  px(ctx, bx + 26, by + 34, 28, 4, skinShadow);

  // Ears
  px(ctx, bx + 22, by + 24, 4, 8, skinColor);
  px(ctx, bx + 54, by + 24, 4, 8, skinColor);

  // ─── EYES ───
  // Left eye
  px(ctx, bx + 28, by + 24, 10, 7, EYE_WHITE);
  px(ctx, bx + 32, by + 25, 5, 5, eyeIris);
  px(ctx, bx + 33, by + 26, 2, 2, "#000000"); // pupil
  // Brow
  px(ctx, bx + 27, by + 22, 12, 2, OUTLINE);

  // Right eye
  px(ctx, bx + 42, by + 24, 10, 7, EYE_WHITE);
  px(ctx, bx + 44, by + 25, 5, 5, eyeIris);
  px(ctx, bx + 45, by + 26, 2, 2, "#000000"); // pupil
  // Brow
  px(ctx, bx + 41, by + 22, 12, 2, OUTLINE);

  // ─── MOUTH ───
  px(ctx, bx + 34, by + 33, 12, 2, MOUTH);
  // Determined line
  px(ctx, bx + 33, by + 32, 14, 1, skinShadow);

  // ─── NECK ───
  px(ctx, bx + 34, by + 38, 12, 4, skinColor);

  // ─── BODY / GI TOP ───
  // Torso
  px(ctx, bx + 22, by + 42, 36, 16, giColor);
  // Gi collar / neckline (V-shape via overlapping rects)
  px(ctx, bx + 32, by + 42, 16, 4, giSh);
  px(ctx, bx + 34, by + 42, 12, 2, skinColor); // V-neck opening

  // Muscle definition: chest shadows
  px(ctx, bx + 26, by + 46, 12, 2, giSh);
  px(ctx, bx + 42, by + 46, 12, 2, giSh);
  // Center line
  px(ctx, bx + 39, by + 44, 2, 12, giSh);
  // Highlight on chest
  px(ctx, bx + 28, by + 44, 8, 2, giHi);
  px(ctx, bx + 44, by + 44, 8, 2, giHi);

  // ─── ARMS ───
  const armSwing = isRunning ? runCycle * 6 : 0;
  const armSwingBack = isRunning ? -runCycle * 4 : 0;

  // Left arm (front arm when running)
  drawArm(ctx, bx + 14, by + 42 + armSwing, skinColor, skinShadow, giColor, giSh, wristColor, false);
  // Right arm
  drawArm(ctx, bx + 58, by + 42 + armSwingBack, skinColor, skinShadow, giColor, giSh, wristColor, true);

  // ─── BELT / SASH ───
  px(ctx, bx + 22, by + 56, 36, 4, beltColor);
  px(ctx, bx + 22, by + 58, 36, 2, BELT_SH);
  // Knot
  px(ctx, bx + 36, by + 56, 8, 5, beltColor);
  px(ctx, bx + 38, by + 60, 4, 3, beltColor); // sash tail

  // ─── LEGS / PANTS ───
  const legSwing = isRunning ? runCycle * 5 : 0;
  const legSwingBack = isRunning ? -runCycle * 5 : 0;

  // Left leg
  px(ctx, bx + 24, by + 60 + legSwing, 14, 10, pantsColor);
  px(ctx, bx + 26, by + 62 + legSwing, 4, 6, pantsSh); // shadow
  // Right leg
  px(ctx, bx + 42, by + 60 + legSwingBack, 14, 10, pantsColor);
  px(ctx, bx + 48, by + 62 + legSwingBack, 4, 6, pantsSh); // shadow

  // ─── BOOTS ───
  // Left boot
  px(ctx, bx + 24, by + 70 + legSwing, 14, 8, bootColor);
  px(ctx, bx + 24, by + 74 + legSwing, 16, 4, bootColor); // toe
  px(ctx, bx + 24, by + 70 + legSwing, 14, 2, bootSh); // top rim
  // Right boot
  px(ctx, bx + 42, by + 70 + legSwingBack, 14, 8, bootColor);
  px(ctx, bx + 40, by + 74 + legSwingBack, 16, 4, bootColor); // toe
  px(ctx, bx + 42, by + 70 + legSwingBack, 14, 2, bootSh); // top rim

  ctx.shadowBlur = 0;
  ctx.restore();
}

/** Draw form-dependent hair spikes. */
function drawHairSpikes(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  color: string,
  highlight: string,
  shadow: string,
  t: number,
  form: SaiyanForm
): void {
  // Hair sway for animation (more intense for higher forms)
  const swayMult = form >= SaiyanForm.SSJ ? 1.5 : 0.6;
  const sway = Math.sin(t * 2.5) * swayMult;

  // Base form: flat, shorter hair (no spikes standing up)
  if (form === SaiyanForm.Base) {
    // Flat messy hair, slightly spiky but not standing up
    px(ctx, bx + 22, by + 2, 36, 16, color);
    // Small bumps instead of tall spikes
    drawSpike(ctx, bx + 30 + sway, by - 2, 10, 6, color);
    drawSpike(ctx, bx + 40 + sway, by - 2, 10, 6, color);
    drawSpike(ctx, bx + 20, by + 4, 6, 4, color);
    drawSpike(ctx, bx + 54, by + 4, 6, 4, color);
    // Highlights
    px(ctx, bx + 32, by + 4, 8, 3, highlight);
    // Side bangs
    px(ctx, bx + 22, by + 12, 6, 10, color);
    px(ctx, bx + 52, by + 12, 6, 10, color);
    px(ctx, bx + 24, by + 14, 3, 6, shadow);
    px(ctx, bx + 53, by + 14, 3, 6, shadow);
    return;
  }

  // SSJ3: extra long spikes reaching down the back
  const isSSJ3 = form === SaiyanForm.SSJ3;
  const spikeScale = isSSJ3 ? 1.5 : 1.0;

  // Central spike (tallest)
  drawSpike(ctx, bx + 34 + sway, by - 14 * spikeScale, 12, 18 * spikeScale, color);
  px(ctx, bx + 36 + sway, by - 10 * spikeScale, 4, 8 * spikeScale, highlight);

  // Left spikes
  drawSpike(ctx, bx + 20 + sway * 0.7, by - 8 * spikeScale, 10, 14 * spikeScale, color);
  px(ctx, bx + 22 + sway * 0.7, by - 4 * spikeScale, 3, 6 * spikeScale, highlight);

  drawSpike(ctx, bx + 12 + sway * 0.5, by - 2 * spikeScale, 8, 10 * spikeScale, color);
  px(ctx, bx + 14 + sway * 0.5, by, 3, 5, highlight);

  // Right spikes
  drawSpike(ctx, bx + 48 + sway * 0.7, by - 8 * spikeScale, 10, 14 * spikeScale, color);
  px(ctx, bx + 50 + sway * 0.7, by - 4 * spikeScale, 3, 6 * spikeScale, highlight);

  drawSpike(ctx, bx + 56 + sway * 0.5, by - 2 * spikeScale, 8, 10 * spikeScale, color);
  px(ctx, bx + 58 + sway * 0.5, by, 3, 5, highlight);

  // Back spike (behind head)
  drawSpike(ctx, bx + 28 + sway * 0.3, by - 4, 8, 8, shadow);
  drawSpike(ctx, bx + 44 + sway * 0.3, by - 4, 8, 8, shadow);

  // SSJ3: long flowing hair down the back
  if (isSSJ3) {
    for (let i = 0; i < 5; i++) {
      const lx = bx + 24 + i * 8 + Math.sin(t * 1.5 + i) * 2;
      const ly = by + 20 + i * 4;
      px(ctx, lx, ly, 6, 12, color);
      px(ctx, lx + 1, ly + 2, 3, 6, highlight);
    }
    // No brow ridge (SSJ3 has no eyebrows — classic DBZ detail)
  }

  // Side bangs framing face
  px(ctx, bx + 22, by + 12, 6, 10, color);
  px(ctx, bx + 52, by + 12, 6, 10, color);
  px(ctx, bx + 24, by + 14, 3, 6, shadow);
  px(ctx, bx + 53, by + 14, 3, 6, shadow);

  // SSJ2: intense electric lightning crackling around entire body
  if (form === SaiyanForm.SSJ2) {
    ctx.save();
    // Outer electric glow pulse
    const glowAlpha = 0.15 + Math.sin(t * 12) * 0.1;
    ctx.globalAlpha = glowAlpha;
    ctx.shadowColor = "#ffe066";
    ctx.shadowBlur = 18 + Math.sin(t * 10) * 6;
    ctx.fillStyle = "#ffe066";
    ctx.beginPath();
    ctx.arc(bx + 40, by + 30, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Lightning bolts — 8 branching arcs around the body
    for (let i = 0; i < 8; i++) {
      const phase = t * 10 + i * 0.9;
      // Origin points distributed around hair and body
      const originX = bx + 40 + Math.sin(phase * 1.1) * 28;
      const originY = by + 10 + Math.cos(phase * 0.8) * 25;
      const alpha = 0.7 + Math.sin(phase * 3) * 0.3;
      ctx.globalAlpha = alpha > 0 ? alpha : 0;

      // Main bolt — 3-segment jagged line
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      const m1x = originX + (Math.random() - 0.5) * 14;
      const m1y = originY + (Math.random() - 0.5) * 14;
      ctx.lineTo(m1x, m1y);
      const m2x = m1x + (Math.random() - 0.5) * 12;
      const m2y = m1y + (Math.random() - 0.5) * 12;
      ctx.lineTo(m2x, m2y);
      ctx.lineTo(m2x + (Math.random() - 0.5) * 8, m2y + (Math.random() - 0.5) * 8);
      ctx.stroke();

      // Branch bolt from midpoint
      if (i % 2 === 0) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#ffe066";
        ctx.beginPath();
        ctx.moveTo(m1x, m1y);
        ctx.lineTo(m1x + (Math.random() - 0.5) * 10, m1y + (Math.random() - 0.5) * 10);
        ctx.stroke();
      }

      // Bright spark dot at origin
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(originX, originY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Extra sparkle particles orbiting
    for (let i = 0; i < 6; i++) {
      const angle = t * 4 + i * (Math.PI * 2 / 6);
      const radius = 30 + Math.sin(t * 6 + i) * 8;
      const sx = bx + 40 + Math.cos(angle) * radius;
      const sy = by + 25 + Math.sin(angle) * radius * 0.7;
      const sparkAlpha = 0.5 + Math.sin(t * 8 + i * 2) * 0.5;
      ctx.globalAlpha = sparkAlpha > 0 ? sparkAlpha : 0;
      ctx.fillStyle = "#ffe066";
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Ultra Instinct shimmer particles on hair
  if (form === SaiyanForm.UltraInstinct) {
    for (let i = 0; i < 4; i++) {
      const sx = bx + 26 + Math.sin(t * 3 + i * 2.1) * 16;
      const sy = by - 4 + Math.cos(t * 2.5 + i * 1.7) * 8;
      const alpha = 0.5 + Math.sin(t * 5 + i) * 0.3;
      ctx.globalAlpha = alpha;
      px(ctx, sx, sy, 2, 2, "#ffffff");
    }
    ctx.globalAlpha = 1;
  }

  // SSJ Blue: subtle blue particles
  if (form === SaiyanForm.SSJBlue) {
    for (let i = 0; i < 3; i++) {
      const sx = bx + 28 + Math.sin(t * 2.5 + i * 2.5) * 14;
      const sy = by - 2 + Math.cos(t * 2 + i * 1.9) * 6;
      const alpha = 0.4 + Math.sin(t * 4 + i) * 0.2;
      ctx.globalAlpha = alpha;
      px(ctx, sx, sy, 2, 2, "#66b0ff");
    }
    ctx.globalAlpha = 1;
  }
}

/** Draw a single triangular hair spike using layered rectangles. */
function drawSpike(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
): void {
  // Build spike from bottom (wide) to top (narrow) using pixel rows
  const rows = ~~(h / 2);
  for (let i = 0; i < rows; i++) {
    const t = i / rows;
    const rw = ~~(w * (1 - t * 0.7));
    const rx = ~~(x + (w - rw) / 2);
    const ry = ~~(y + h - i * 2 - 2);
    px(ctx, rx, ry, rw, 2, color);
  }
}

/** Draw an arm with muscle definition, gi sleeve, and wristband. */
function drawArm(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  skinColor: string,
  skinShadow: string,
  giColor: string,
  giShadow: string,
  wristColor: string,
  isRight: boolean
): void {
  // Gi sleeve (upper arm)
  px(ctx, x, y, 8, 8, giColor);
  px(ctx, x + (isRight ? 0 : 4), y + 2, 4, 4, giShadow);

  // Bare arm / bicep
  px(ctx, x, y + 8, 8, 8, skinColor);
  // Muscle shadow
  px(ctx, x + (isRight ? 0 : 4), y + 10, 3, 4, skinShadow);

  // Wristband
  px(ctx, x, y + 16, 8, 3, wristColor);

  // Fist
  px(ctx, x, y + 19, 8, 5, skinColor);
  px(ctx, x + 1, y + 20, 6, 3, skinShadow);
}

import { C } from "../constants";
import { px } from "../physics";

// ─── Color palette ───
const HAIR_SSJ = "#f5c542";       // Golden SSJ hair
const HAIR_SSJ_HI = "#ffe066";    // Hair highlight
const HAIR_SSJ_SH = "#c9982a";    // Hair shadow
const HAIR_UI = "#c0c0d0";        // Ultra Instinct silver
const HAIR_UI_HI = "#e0e0ee";     // UI highlight
const HAIR_UI_SH = "#8888a0";     // UI shadow
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
const EYE_IRIS = "#222222";
const EYE_UI = "#c8c8e0";         // Silver-tinted eyes for UI
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
  ultraInstinct: boolean = false
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

  const hairColor = ultraInstinct ? HAIR_UI : HAIR_SSJ;
  const hairHi = ultraInstinct ? HAIR_UI_HI : HAIR_SSJ_HI;
  const hairSh = ultraInstinct ? HAIR_UI_SH : HAIR_SSJ_SH;
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
  const eyeIris = ultraInstinct ? EYE_UI : EYE_IRIS;

  // ─── HAIR (spiky SSJ style) ───
  // Base hair mass
  px(ctx, bx + 22, by + 2, 36, 22, hairColor);
  // Spikes
  drawHairSpikes(ctx, bx, by, hairColor, hairHi, hairSh, t, ultraInstinct);

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

/** Draw spiky SSJ/UI hair. */
function drawHairSpikes(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  color: string,
  highlight: string,
  shadow: string,
  t: number,
  ultraInstinct: boolean
): void {
  // Hair sway for animation
  const sway = Math.sin(t * 2.5) * 1;

  // Central spike (tallest)
  drawSpike(ctx, bx + 34 + sway, by - 14, 12, 18, color);
  px(ctx, bx + 36 + sway, by - 10, 4, 8, highlight);

  // Left spikes
  drawSpike(ctx, bx + 20 + sway * 0.7, by - 8, 10, 14, color);
  px(ctx, bx + 22 + sway * 0.7, by - 4, 3, 6, highlight);

  drawSpike(ctx, bx + 12 + sway * 0.5, by - 2, 8, 10, color);
  px(ctx, bx + 14 + sway * 0.5, by, 3, 5, highlight);

  // Right spikes
  drawSpike(ctx, bx + 48 + sway * 0.7, by - 8, 10, 14, color);
  px(ctx, bx + 50 + sway * 0.7, by - 4, 3, 6, highlight);

  drawSpike(ctx, bx + 56 + sway * 0.5, by - 2, 8, 10, color);
  px(ctx, bx + 58 + sway * 0.5, by, 3, 5, highlight);

  // Back spike (behind head)
  drawSpike(ctx, bx + 28 + sway * 0.3, by - 4, 8, 8, shadow);
  drawSpike(ctx, bx + 44 + sway * 0.3, by - 4, 8, 8, shadow);

  // Side bangs framing face
  px(ctx, bx + 22, by + 12, 6, 10, color);
  px(ctx, bx + 52, by + 12, 6, 10, color);
  px(ctx, bx + 24, by + 14, 3, 6, shadow);
  px(ctx, bx + 53, by + 14, 3, 6, shadow);

  // Ultra Instinct shimmer particles on hair
  if (ultraInstinct) {
    for (let i = 0; i < 4; i++) {
      const sx = bx + 26 + Math.sin(t * 3 + i * 2.1) * 16;
      const sy = by - 4 + Math.cos(t * 2.5 + i * 1.7) * 8;
      const alpha = 0.5 + Math.sin(t * 5 + i) * 0.3;
      ctx.globalAlpha = alpha;
      px(ctx, sx, sy, 2, 2, "#ffffff");
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

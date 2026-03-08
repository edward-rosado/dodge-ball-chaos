import { Pipe } from "../types";
import { PIPE_WIDTH, PIPE_HEIGHT, PIPE_LIP_HEIGHT } from "../constants";

// Mario-style warp tube colors
const TUBE_MAIN = "#2ecc40";
const TUBE_SHADOW = "#1a8c2a";
const TUBE_HIGHLIGHT = "#4ae060";
const TUBE_DARK = "#0a4a12";
const TUBE_LIP_MAIN = "#34d848";
const TUBE_LIP_SHADOW = "#1a8c2a";
const TUBE_OPENING = "#061a08";
const CHARGE_INNER = "#ff4422";

/**
 * Draw a Mario-style warp pipe at the given position.
 * The pipe opens toward the arena center (determined by p.angle).
 * `charging` indicates a ball is about to emerge (glow + shake).
 */
export function drawPipe(
  ctx: CanvasRenderingContext2D,
  p: Pipe,
  active: boolean,
  t: number,
  charging: boolean = false
): void {
  const w = PIPE_WIDTH;
  const h = PIPE_HEIGHT;
  const lipH = PIPE_LIP_HEIGHT;
  const lipExtra = 4; // Lip extends this much wider on each side

  ctx.save();

  // Translate to pipe center, rotate so opening faces inward toward arena
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle + Math.PI / 2);

  // Charging: shake effect
  if (charging) {
    const shakeX = (Math.random() - 0.5) * 2;
    const shakeY = (Math.random() - 0.5) * 2;
    ctx.translate(shakeX, shakeY);
  }

  // Active or charging glow
  if (active || charging) {
    ctx.shadowColor = charging ? CHARGE_INNER : "#0ff";
    ctx.shadowBlur = 12 + Math.sin(t * 6) * 5;
  }

  // ── Tube body (extends "downward" = away from arena) ──
  const bodyTop = -lipH; // Lip is at the top (opening end)
  const bodyBottom = h - lipH;

  // Shadow side (left darker strip)
  ctx.fillStyle = TUBE_SHADOW;
  ctx.fillRect(-w / 2, bodyTop, w / 4, bodyBottom - bodyTop);

  // Main body
  ctx.fillStyle = TUBE_MAIN;
  ctx.fillRect(-w / 2 + w / 4, bodyTop, w / 2, bodyBottom - bodyTop);

  // Highlight side (right lighter strip)
  ctx.fillStyle = TUBE_HIGHLIGHT;
  ctx.fillRect(w / 4 - 2, bodyTop, w / 4 + 2, bodyBottom - bodyTop);

  // ── Lip / rim (wider, at the opening) ──
  const lipW = w + lipExtra * 2;

  // Lip shadow
  ctx.fillStyle = TUBE_LIP_SHADOW;
  ctx.fillRect(-lipW / 2, -lipH, lipW / 4, lipH);

  // Lip main
  ctx.fillStyle = TUBE_LIP_MAIN;
  ctx.fillRect(-lipW / 2 + lipW / 4, -lipH, lipW / 2, lipH);

  // Lip highlight
  ctx.fillStyle = TUBE_HIGHLIGHT;
  ctx.fillRect(lipW / 4 - 2, -lipH, lipW / 4 + 2, lipH);

  // ── Inner opening (dark hole) ──
  const openingW = w - 6;
  const openingH = lipH - 2;
  ctx.fillStyle = charging ? CHARGE_INNER : TUBE_OPENING;
  ctx.fillRect(-openingW / 2, -lipH + 1, openingW, openingH);

  // Dark inner ring for depth
  ctx.fillStyle = TUBE_DARK;
  ctx.fillRect(-openingW / 2 + 2, -lipH + 2, openingW - 4, openingH - 2);

  ctx.restore();
}

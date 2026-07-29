/**
 * Mega Man 8-bit Style Utilities
 * Provides common rendering elements for the Mega Man 2 aesthetic.
 */

export const MEGA_MAN_COLORS = {
  darkBg: "#0a0a2a",
  midBg: "#1a1a4a",
  techBlue: "#333399",
  highlight: "#00ffff",
  floorBase: "#222244",
  grid: "#333366",
  pillar: "#444488",
  scanline: "rgba(0, 0, 0, 0.05)",
};

/** Draws a scrolling 8-bit grid floor. */
export function drawMegaManGrid(
  ctx: CanvasRenderingContext2D,
  floorY: number,
  t: number
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  
  // Floor base
  ctx.fillStyle = "#111122";
  ctx.fillRect(0, floorY, w, h - floorY);

  // Grid lines
  ctx.strokeStyle = MEGA_MAN_COLORS.grid;
  ctx.lineWidth = 2;

  // Horizontal grid lines
  for (let i = 0; i < (h - floorY); i += 40) {
    ctx.beginPath();
    ctx.moveTo(0, floorY + i);
    ctx.lineTo(w, floorY + i);
    ctx.stroke();
  }

  // Vertical grid lines (scrolling)
  const gridSpacing = 60;
  for (let i = 0; i < w + gridSpacing; i += gridSpacing) {
    const x = (i - (t * 20) % gridSpacing + gridSpacing) % (w + gridSpacing);
    ctx.beginPath();
    ctx.moveTo(x, floorY);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
}

/** Draws subtle 8-bit scanlines. */
export function drawScanlines(ctx: CanvasRenderingContext2D, h: number): void {
  ctx.fillStyle = MEGA_MAN_COLORS.scanline;
  for (let i = 0; i < h; i += 4) {
    ctx.fillRect(0, i, ctx.canvas.width, 1);
  }
}

/** Draws floating tech particles. */
export function drawTechParticles(ctx: CanvasRenderingContext2D, t: number): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  for (let i = 0; i < 10; i++) {
    const px = (i * 137 + t * 50) % w;
    const py = (i * 233 + t * 100) % (h * 0.6);
    ctx.fillStyle = MEGA_MAN_COLORS.highlight;
    ctx.fillRect(~~px, ~~py, 2, 2);
  }
}

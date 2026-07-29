import { BackgroundConfig, LayerConfig, Theme, THEMES, BackgroundConfigFactory } from "./types";

/** Renders a background based on its configuration and theme. */
export function renderBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  configFactory: BackgroundConfigFactory
): void {
  const config = configFactory(h);
  const theme = THEMES[config.theme];

  // ── Draw Layers ──
  for (const layer of config.layers) {
    switch (layer.type) {
      case "sky": {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        const [s1, c1, s2, c2, s3, c3] = theme.skyGradient;
        const gradParams = layer.gradient || [s1, c1, s2, c2, s3, c3];
        
        grad.addColorStop(0, c1);
        grad.addColorStop(0.5, c2);
        grad.addColorStop(1, c3);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        break;
      }
      case "parallax": {
        ctx.globalAlpha = 1;
        for (const item of (layer.items || [])) {
          const x = (item.x + (item.speed || 0) * t) % (w + 200) - 100;
          const y = item.y + Math.sin(t * (item.phase || 1.0) + (item.x || 0)) * (item.y || 0) * 0.01;
          ctx.fillStyle = item.color || theme.gridColor;
          ctx.fillRect(~~x, ~~y, item.w || 30, item.h || 30);
        }
        break;
      }
      case "floor": {
        const floorY = h * 0.6;
        ctx.fillStyle = theme.floorBase;
        ctx.fillRect(0, floorY, w, h - floorY);

        // Draw grid
        ctx.strokeStyle = theme.gridColor;
        ctx.lineWidth = 2;
        // Horizontal
        for (let i = 0; i < (h - floorY); i += 40) {
          ctx.beginPath();
          ctx.moveTo(0, floorY + i);
          ctx.lineTo(w, floorY + i);
          ctx.stroke();
        }
        // Vertical (scrolling)
        const gridSpacing = 60;
        for (let i = 0; i < w + gridSpacing; i += gridSpacing) {
          const x = (i - (t * 20) % gridSpacing + gridSpacing) % (w + gridSpacing);
          ctx.beginPath();
          ctx.moveTo(x, floorY);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        break;
      }
      case "decoration": {
        ctx.globalAlpha = 1;
        for (const item of (layer.items || [])) {
          ctx.fillStyle = item.color || theme.particleColor;
          ctx.fillRect(~~item.x, ~~item.y, item.w || 2, item.h || 2);
        }
        break;
      }
    }
  }

  // ── Apply Theme Overlays ──
  // Scanlines
  ctx.fillStyle = `rgba(0,0,0,${theme.scanlineAlpha})`;
  for (let i = 0; i < h; i += 4) {
    ctx.fillRect(0, i, w, 1);
  }

  // Custom Draw
  if (config.customDraw) {
    config.customDraw(ctx, w, h, t);
  }
}

/**
 * Kami's Lookout — White tiled floor, blue sky with clouds, palm tree silhouettes.
 * Used in L1-9, L21-29, and as a general fallback.
 */
export function drawKamisLookout(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
): void {
  // ── Sky gradient ──
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  sky.addColorStop(0, "#1a3a6a");
  sky.addColorStop(0.6, "#3a6a9a");
  sky.addColorStop(1, "#4a8bc2");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.55);

  // ── Clouds (drift using t) ──
  ctx.fillStyle = "rgba(200,210,230,0.12)";
  const drawCloud = (bx: number, by: number, s: number): void => {
    const cx = ((bx + t * 6) % (w + 80)) - 40;
    ctx.beginPath();
    ctx.ellipse(cx, by, 30 * s, 10 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - 18 * s, by + 3 * s, 18 * s, 8 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 20 * s, by + 2 * s, 22 * s, 9 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  drawCloud(50, 60, 1.0);
  drawCloud(200, 40, 0.8);
  drawCloud(320, 80, 1.2);
  drawCloud(140, 100, 0.6);

  // ── Horizon line ──
  const horizonY = h * 0.55;

  // ── Tiled floor ──
  const floor = ctx.createLinearGradient(0, horizonY, 0, h);
  floor.addColorStop(0, "#d0c8b8");
  floor.addColorStop(1, "#b0a898");
  ctx.fillStyle = floor;
  ctx.fillRect(0, horizonY, w, h - horizonY);

  // Tile lines
  ctx.strokeStyle = "rgba(180,170,150,0.25)";
  ctx.lineWidth = 1;
  const tileSize = 32;
  for (let x = 0; x < w; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, horizonY);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = horizonY; y < h; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // ── Palm tree silhouettes ──
  ctx.fillStyle = "rgba(10,20,10,0.3)";
  const drawPalm = (px: number, py: number, scale: number): void => {
    // Trunk
    ctx.fillRect(px - 3 * scale, py - 60 * scale, 6 * scale, 60 * scale);
    // Fronds
    for (let i = 0; i < 5; i++) {
      const angle = ((i * Math.PI * 2) / 5) + Math.sin(t * 0.5) * 0.05;
      ctx.beginPath();
      ctx.ellipse(
        px + Math.cos(angle) * 18 * scale,
        py - 60 * scale + Math.sin(angle) * 8 * scale,
        20 * scale,
        4 * scale,
        angle,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  };
  drawPalm(30, horizonY + 10, 1.0);
  drawPalm(370, horizonY + 5, 1.2);
  drawPalm(90, horizonY + 15, 0.7);

  // ── Darken overlay for gameplay readability ──
  ctx.fillStyle = "rgba(8,8,15,0.45)";
  ctx.fillRect(0, 0, w, h);
}

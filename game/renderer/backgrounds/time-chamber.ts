/**
 * Hyperbolic Time Chamber — White void gradient, tiled floor fading to infinity, clock at top.
 * Used in L21-29.
 */
export function drawTimeChamber(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
): void {
  // ── White void gradient (top = bright white, fades to pale) ──
  const void_bg = ctx.createLinearGradient(0, 0, 0, h);
  void_bg.addColorStop(0, "#e8e8e8");
  void_bg.addColorStop(0.3, "#d0d0d0");
  void_bg.addColorStop(0.7, "#b0b0b8");
  void_bg.addColorStop(1, "#909098");
  ctx.fillStyle = void_bg;
  ctx.fillRect(0, 0, w, h);

  // ── Tiled floor fading to infinity ──
  const floorY = h * 0.55;
  const tileSize = 40;

  // Perspective floor lines (horizontal — fade with distance)
  for (let row = 0; row < 16; row++) {
    const yRatio = row / 16;
    const y = floorY + (h - floorY) * yRatio;
    const alpha = 0.08 + yRatio * 0.15;
    ctx.strokeStyle = `rgba(150,150,160,${alpha})`;
    ctx.lineWidth = 0.5 + yRatio;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Vertical perspective lines (converge toward center horizon)
  const vanishX = w / 2;
  const vanishY = floorY - 20;
  ctx.strokeStyle = "rgba(150,150,160,0.12)";
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 10; i++) {
    const bottomX = (i / 10) * w;
    ctx.beginPath();
    ctx.moveTo(vanishX, vanishY);
    ctx.lineTo(bottomX, h);
    ctx.stroke();
  }

  // ── Clock at top ──
  const clockX = w / 2;
  const clockY = 35;
  const clockR = 18;

  // Clock face
  ctx.beginPath();
  ctx.arc(clockX, clockY, clockR, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(200,200,200,0.3)";
  ctx.fill();
  ctx.strokeStyle = "rgba(100,100,110,0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Hour marks
  ctx.fillStyle = "rgba(80,80,90,0.3)";
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI * 2) / 12 - Math.PI / 2;
    const mx = clockX + Math.cos(angle) * (clockR - 4);
    const my = clockY + Math.sin(angle) * (clockR - 4);
    ctx.beginPath();
    ctx.arc(mx, my, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hands (slowly rotate with t)
  ctx.strokeStyle = "rgba(60,60,70,0.35)";
  // Hour hand
  const hourAngle = (t * 0.02) - Math.PI / 2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(clockX, clockY);
  ctx.lineTo(clockX + Math.cos(hourAngle) * 9, clockY + Math.sin(hourAngle) * 9);
  ctx.stroke();
  // Minute hand
  const minAngle = (t * 0.2) - Math.PI / 2;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(clockX, clockY);
  ctx.lineTo(clockX + Math.cos(minAngle) * 13, clockY + Math.sin(minAngle) * 13);
  ctx.stroke();

  // ── Darken overlay (lighter than other backgrounds since this is already pale) ──
  ctx.fillStyle = "rgba(8,8,15,0.55)";
  ctx.fillRect(0, 0, w, h);
}

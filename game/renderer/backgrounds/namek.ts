/**
 * Planet Namek — Green sky gradient, blue-green grass, tall Namekian trees, distant mountains.
 * Used in L1-9, L11-20, L50.
 */
export function drawNamek(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
): void {
  // ── Green sky gradient ──
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.5);
  sky.addColorStop(0, "#1a4a28");
  sky.addColorStop(0.5, "#2d6b3f");
  sky.addColorStop(1, "#3a8a50");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.5);

  // ── Distant mountains ──
  ctx.fillStyle = "#1a3a28";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.48);
  ctx.lineTo(40, h * 0.35);
  ctx.lineTo(90, h * 0.42);
  ctx.lineTo(140, h * 0.3);
  ctx.lineTo(200, h * 0.4);
  ctx.lineTo(260, h * 0.32);
  ctx.lineTo(310, h * 0.38);
  ctx.lineTo(370, h * 0.28);
  ctx.lineTo(w, h * 0.42);
  ctx.lineTo(w, h * 0.5);
  ctx.lineTo(0, h * 0.5);
  ctx.closePath();
  ctx.fill();

  // ── Blue-green grass ──
  const grass = ctx.createLinearGradient(0, h * 0.5, 0, h);
  grass.addColorStop(0, "#1a4a50");
  grass.addColorStop(1, "#0a2a30");
  ctx.fillStyle = grass;
  ctx.fillRect(0, h * 0.5, w, h * 0.5);

  // ── 3 Namekian trees (tall, bulbous tops) ──
  const drawTree = (tx: number, baseY: number, height: number, topR: number): void => {
    // Trunk
    ctx.fillStyle = "#0a3010";
    ctx.fillRect(tx - 4, baseY - height, 8, height);

    // Bulbous top
    ctx.fillStyle = "#1a5a1a";
    ctx.beginPath();
    ctx.ellipse(tx, baseY - height, topR, topR * 1.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = "rgba(40,120,40,0.3)";
    ctx.beginPath();
    ctx.ellipse(tx - topR * 0.2, baseY - height - topR * 0.3, topR * 0.5, topR * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  drawTree(60, h * 0.5, 120, 22);
  drawTree(220, h * 0.5, 150, 28);
  drawTree(340, h * 0.5, 100, 18);

  // ── Subtle Namekian "suns" (3 small circles in sky) ──
  ctx.fillStyle = "rgba(200,220,180,0.15)";
  ctx.beginPath();
  ctx.arc(300, 40, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(330, 55, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(280, 60, 6, 0, Math.PI * 2);
  ctx.fill();

  // ── Floating particles (Namek atmosphere) ──
  ctx.fillStyle = "rgba(100,200,120,0.08)";
  for (let i = 0; i < 12; i++) {
    const px = ((i * 37 + t * 4) % w);
    const py = 40 + ((i * 53) % (h - 80)) + Math.sin(t * 0.8 + i) * 8;
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Darken overlay ──
  ctx.fillStyle = "rgba(8,8,15,0.5)";
  ctx.fillRect(0, 0, w, h);
}

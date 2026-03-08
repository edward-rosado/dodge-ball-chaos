/**
 * Frieza's Ship — Purple/dark interior, curved walls, viewport showing space/Namek, tech panels.
 * Used in L50 only.
 */
export function drawFriezaShip(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
): void {
  // ── Dark purple interior ──
  const interior = ctx.createLinearGradient(0, 0, 0, h);
  interior.addColorStop(0, "#1a0a30");
  interior.addColorStop(0.5, "#2a1040");
  interior.addColorStop(1, "#120828");
  ctx.fillStyle = interior;
  ctx.fillRect(0, 0, w, h);

  // ── Curved wall lines ──
  ctx.strokeStyle = "rgba(80,40,120,0.2)";
  ctx.lineWidth = 1;
  // Left wall curve
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(30, h / 2, 0, h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.quadraticCurveTo(45, h / 2, 15, h);
  ctx.stroke();
  // Right wall curve
  ctx.beginPath();
  ctx.moveTo(w, 0);
  ctx.quadraticCurveTo(w - 30, h / 2, w, h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w - 15, 0);
  ctx.quadraticCurveTo(w - 45, h / 2, w - 15, h);
  ctx.stroke();

  // ── Viewport showing space + Namek ──
  const vpX = w / 2;
  const vpY = 100;
  const vpW = 120;
  const vpH = 60;

  // Viewport frame
  ctx.fillStyle = "#201040";
  ctx.beginPath();
  ctx.ellipse(vpX, vpY, vpW / 2 + 6, vpH / 2 + 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Space through viewport
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(vpX, vpY, vpW / 2, vpH / 2, 0, 0, Math.PI * 2);
  ctx.clip();

  const spaceGrad = ctx.createRadialGradient(vpX, vpY, 0, vpX, vpY, vpW / 2);
  spaceGrad.addColorStop(0, "#050515");
  spaceGrad.addColorStop(1, "#020208");
  ctx.fillStyle = spaceGrad;
  ctx.fillRect(vpX - vpW / 2, vpY - vpH / 2, vpW, vpH);

  // Stars
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  const seeds = [
    [0.1, 0.2], [0.3, 0.7], [0.5, 0.15], [0.7, 0.5],
    [0.85, 0.3], [0.2, 0.85], [0.6, 0.8], [0.9, 0.7],
    [0.4, 0.4], [0.15, 0.55],
  ];
  for (const [sx, sy] of seeds) {
    const starAlpha = 0.3 + Math.sin(t * 1.5 + sx * 20) * 0.3;
    ctx.globalAlpha = starAlpha;
    ctx.beginPath();
    ctx.arc(
      vpX - vpW / 2 + sx * vpW,
      vpY - vpH / 2 + sy * vpH,
      0.8,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Planet Namek (small green sphere)
  const namekX = vpX + 25;
  const namekY = vpY - 5;
  const namekR = 12;
  const namekGrad = ctx.createRadialGradient(
    namekX - 3, namekY - 3, 0,
    namekX, namekY, namekR
  );
  namekGrad.addColorStop(0, "#4a8a4a");
  namekGrad.addColorStop(0.7, "#2a5a2a");
  namekGrad.addColorStop(1, "#1a3a1a");
  ctx.fillStyle = namekGrad;
  ctx.beginPath();
  ctx.arc(namekX, namekY, namekR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // ── Tech panels on sides ──
  const drawTechPanel = (px: number, py: number, pw: number, ph: number): void => {
    ctx.fillStyle = "#1a0a30";
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = "rgba(100,50,150,0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, pw, ph);

    // Screen glow
    ctx.fillStyle = "rgba(80,30,140,0.15)";
    ctx.fillRect(px + 3, py + 3, pw - 6, ph - 6);

    // Scan line
    const scanY = py + 3 + ((t * 15) % (ph - 6));
    ctx.fillStyle = "rgba(120,60,200,0.2)";
    ctx.fillRect(px + 3, scanY, pw - 6, 2);

    // Data dots
    ctx.fillStyle = "rgba(160,80,220,0.3)";
    for (let i = 0; i < 4; i++) {
      const dotOn = Math.sin(t * 2 + i * 1.5 + px) > 0;
      if (dotOn) {
        ctx.beginPath();
        ctx.arc(px + 8 + i * 10, py + ph - 8, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  drawTechPanel(10, 200, 50, 80);
  drawTechPanel(w - 60, 200, 50, 80);
  drawTechPanel(10, h - 150, 45, 60);
  drawTechPanel(w - 55, h - 150, 45, 60);

  // ── Floor pattern ──
  ctx.strokeStyle = "rgba(60,30,90,0.15)";
  ctx.lineWidth = 0.5;
  for (let y = h * 0.6; y < h; y += 24) {
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(w - 20, y);
    ctx.stroke();
  }

  // ── Purple ambient glow ──
  const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
  glow.addColorStop(0, "rgba(60,20,100,0.08)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // ── Darken overlay ──
  ctx.fillStyle = "rgba(8,8,15,0.3)";
  ctx.fillRect(0, 0, w, h);
}

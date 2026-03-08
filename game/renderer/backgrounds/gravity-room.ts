/**
 * Gravity Room — Red-tinted metal interior, circular window, control panels, dark metallic walls.
 * Used in L11-19, L31-39.
 */
export function drawGravityRoom(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
): void {
  // ── Dark metallic walls ──
  const walls = ctx.createLinearGradient(0, 0, 0, h);
  walls.addColorStop(0, "#1a0a0a");
  walls.addColorStop(0.5, "#2a1818");
  walls.addColorStop(1, "#1a0808");
  ctx.fillStyle = walls;
  ctx.fillRect(0, 0, w, h);

  // ── Metal panel lines (horizontal) ──
  ctx.strokeStyle = "rgba(80,30,30,0.25)";
  ctx.lineWidth = 1;
  for (let y = 0; y < h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // ── Vertical panel seams ──
  ctx.strokeStyle = "rgba(60,20,20,0.2)";
  for (let x = 0; x < w; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  // ── Circular window (top center) ──
  const winX = w / 2;
  const winY = 90;
  const winR = 30;

  // Window frame
  ctx.beginPath();
  ctx.arc(winX, winY, winR + 4, 0, Math.PI * 2);
  ctx.fillStyle = "#2a2a3a";
  ctx.fill();

  // Window — space view
  const space = ctx.createRadialGradient(winX, winY, 0, winX, winY, winR);
  space.addColorStop(0, "#0a0a20");
  space.addColorStop(1, "#050510");
  ctx.beginPath();
  ctx.arc(winX, winY, winR, 0, Math.PI * 2);
  ctx.fillStyle = space;
  ctx.fill();

  // Stars in window
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  const starSeeds = [
    [0.2, 0.3], [0.7, 0.2], [0.4, 0.7], [0.8, 0.6],
    [0.15, 0.8], [0.6, 0.4], [0.9, 0.85], [0.3, 0.5],
  ];
  for (const [sx, sy] of starSeeds) {
    const starX = winX - winR + sx * winR * 2;
    const starY = winY - winR + sy * winR * 2;
    const dx = starX - winX;
    const dy = starY - winY;
    if (dx * dx + dy * dy < winR * winR) {
      const twinkle = 0.3 + Math.sin(t * 2 + sx * 10) * 0.3;
      ctx.globalAlpha = twinkle;
      ctx.beginPath();
      ctx.arc(starX, starY, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // ── Control panels (bottom corners) ──
  const drawPanel = (px: number, py: number, pw: number, ph: number): void => {
    ctx.fillStyle = "#2a1515";
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = "#4a2020";
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, pw, ph);

    // Indicator lights
    for (let i = 0; i < 3; i++) {
      const lx = px + 8 + i * 14;
      const ly = py + ph / 2;
      const on = Math.sin(t * 1.5 + i * 2) > 0;
      ctx.fillStyle = on ? "rgba(255,60,60,0.6)" : "rgba(80,20,20,0.4)";
      ctx.beginPath();
      ctx.arc(lx, ly, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  drawPanel(10, h - 70, 60, 30);
  drawPanel(w - 70, h - 70, 60, 30);

  // ── Red ambient glow from bottom ──
  const glow = ctx.createLinearGradient(0, h - 100, 0, h);
  glow.addColorStop(0, "rgba(80,10,10,0)");
  glow.addColorStop(1, "rgba(80,10,10,0.15)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, h - 100, w, 100);

  // ── "GRAVITY" text indicator ──
  ctx.font = "8px monospace";
  ctx.fillStyle = "rgba(200,60,60,0.15)";
  ctx.textAlign = "center";
  const gMult = Math.floor(10 + Math.sin(t * 0.3) * 5);
  ctx.fillText(`${gMult}x`, w / 2, h - 15);

  // ── Darken overlay ──
  ctx.fillStyle = "rgba(8,8,15,0.35)";
  ctx.fillRect(0, 0, w, h);
}

/**
 * World Tournament Arena — Stadium with crowd silhouettes, tournament ring, banners.
 * Used in L11-19, L31-39.
 */
export function drawTournament(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
): void {
  // ── Sky ──
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.3);
  sky.addColorStop(0, "#1a2040");
  sky.addColorStop(1, "#2a3060");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.3);

  // ── Stadium walls ──
  ctx.fillStyle = "#3a3020";
  ctx.fillRect(0, h * 0.3, w, h * 0.25);

  // ── Crowd silhouettes (rows of bumps) ──
  const drawCrowdRow = (baseY: number, density: number, alpha: number): void => {
    ctx.fillStyle = `rgba(40,30,20,${alpha})`;
    for (let x = 0; x < w; x += density) {
      const bobble = Math.sin(t * 1.5 + x * 0.1) * 1.5;
      ctx.beginPath();
      ctx.arc(x + density / 2, baseY + bobble, density * 0.4, Math.PI, 0);
      ctx.fill();
    }
  };
  drawCrowdRow(h * 0.32, 8, 0.6);
  drawCrowdRow(h * 0.36, 10, 0.5);
  drawCrowdRow(h * 0.41, 12, 0.4);
  drawCrowdRow(h * 0.47, 14, 0.35);

  // ── Tournament ring / floor ──
  const floor = ctx.createLinearGradient(0, h * 0.55, 0, h);
  floor.addColorStop(0, "#c4a858");
  floor.addColorStop(0.4, "#a08040");
  floor.addColorStop(1, "#806830");
  ctx.fillStyle = floor;
  ctx.fillRect(0, h * 0.55, w, h * 0.45);

  // Ring tile pattern
  ctx.strokeStyle = "rgba(160,128,64,0.15)";
  ctx.lineWidth = 1;
  const tileS = 28;
  for (let x = 0; x < w; x += tileS) {
    ctx.beginPath();
    ctx.moveTo(x, h * 0.55);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = h * 0.55; y < h; y += tileS) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // ── Banners ──
  const drawBanner = (bx: number, color: string): void => {
    ctx.fillStyle = color;
    ctx.fillRect(bx - 8, h * 0.22, 16, 40);
    // Triangle bottom
    ctx.beginPath();
    ctx.moveTo(bx - 8, h * 0.22 + 40);
    ctx.lineTo(bx + 8, h * 0.22 + 40);
    ctx.lineTo(bx, h * 0.22 + 52);
    ctx.closePath();
    ctx.fill();
  };
  drawBanner(60, "rgba(200,50,50,0.3)");
  drawBanner(140, "rgba(50,50,200,0.3)");
  drawBanner(260, "rgba(200,180,50,0.3)");
  drawBanner(340, "rgba(50,180,50,0.3)");

  // ── Pole/pillar at edges ──
  ctx.fillStyle = "rgba(80,60,30,0.3)";
  ctx.fillRect(0, h * 0.2, 12, h * 0.4);
  ctx.fillRect(w - 12, h * 0.2, 12, h * 0.4);

  // ── Ring edge line ──
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, h * 0.55);
  ctx.lineTo(w - 20, h * 0.55);
  ctx.stroke();

  // ── Darken overlay ──
  ctx.fillStyle = "rgba(8,8,15,0.5)";
  ctx.fillRect(0, 0, w, h);
}

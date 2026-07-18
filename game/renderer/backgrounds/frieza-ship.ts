/**
 * Frieza's Spaceship — Metallic corridor interior, curved walls with panel seams, glowing
 * red energy cores, viewport showing space battle above Namek. Highly detailed 8-bit
 * Dragon Ball Z tech aesthetic. Used for Levels 40-50 (Band 5).
 */
export function drawFriezaShip(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
): void {
  // ── Dark metallic interior gradient ──
  const interior = ctx.createLinearGradient(0, 0, 0, h);
  interior.addColorStop(0, "#140828");
  interior.addColorStop(0.3, "#1e0e38");
  interior.addColorStop(0.6, "#241240");
  interior.addColorStop(1, "#0e0620");
  ctx.fillStyle = interior;
  ctx.fillRect(0, 0, w, h);

  // ── CURVED WALL PANNELS — segmented metallic plates with visible seams ──
  const panelW = 52;
  for (let px = -panelW; px < w + panelW; px += panelW) {
    // Panel face
    ctx.fillStyle = "#2a1848";
    ctx.fillRect(px, 0, panelW - 2, h);

    // Panel border / seam
    ctx.strokeStyle = "rgba(60,35,90,0.5)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 1, 1, panelW - 4, h - 2);

    // Subtle panel highlight (light from above-left)
    ctx.fillStyle = "rgba(80,50,120,0.12)";
    ctx.fillRect(px + 3, 2, panelW - 8, 4);

    // Horizontal seam lines on each panel
    ctx.strokeStyle = "rgba(50,30,75,0.3)";
    ctx.lineWidth = 0.5;
    for (let sy = 30; sy < h; sy += 60) {
      ctx.beginPath();
      ctx.moveTo(px + 4, sy);
      ctx.lineTo(px + panelW - 8, sy);
      ctx.stroke();
    }

    // Panel rivets / bolts (8-bit detail)
    ctx.fillStyle = "rgba(100,70,140,0.35)";
    const boltPositions = [[6, 15], [panelW - 12, 15], [6, h * 0.5 - 8], [panelW - 12, h * 0.5 - 8], [6, h - 24], [panelW - 12, h - 24]];
    for (const [bx, by] of boltPositions) {
      ctx.beginPath();
      ctx.arc(px + bx, by, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── VIEWPORT — large circular window showing space + Namek + battle flashes ──
  const vpX = w / 2;
  const vpY = h * 0.22;
  const vpR = Math.min(w, h) * 0.16;

  // Outer viewport frame (thick metallic ring)
  ctx.fillStyle = "#3a2858";
  ctx.beginPath();
  ctx.arc(vpX, vpY, vpR + 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4a3868";
  ctx.beginPath();
  ctx.arc(vpX, vpY, vpR + 7, 0, Math.PI * 2);
  ctx.fill();

  // Inner frame depth shadow
  ctx.strokeStyle = "rgba(15,5,30,0.6)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(vpX, vpY, vpR + 2, 0, Math.PI * 2);
  ctx.stroke();

  // Viewport glass (space scene) — clipped to circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(vpX, vpY, vpR, 0, Math.PI * 2);
  ctx.clip();

  // Deep space background
  const spaceGrad = ctx.createRadialGradient(vpX - 15, vpY - 20, 5, vpX, vpY, vpR);
  spaceGrad.addColorStop(0, "#0a0a28");
  spaceGrad.addColorStop(0.6, "#060618");
  spaceGrad.addColorStop(1, "#030310");
  ctx.fillStyle = spaceGrad;
  ctx.fillRect(vpX - vpR, vpY - vpR, vpR * 2, vpR * 2);

  // Dense star field through viewport
  const vpSeedRandom = (seed: number): number => {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  for (let i = 0; i < 35; i++) {
    const sx = vpX - vpR + vpSeedRandom(i * 3 + 1) * vpR * 2;
    const sy = vpY - vpR + vpSeedRandom(i * 3 + 2) * vpR * 2;
    const twinkle = Math.sin(t * (1.5 + vpSeedRandom(i * 7) * 3) + i) * 0.4 + 0.6;

    ctx.globalAlpha = twinkle * (0.3 + vpSeedRandom(i * 5 + 3) * 0.7);
    ctx.fillStyle = ["#ffffff", "#aaccff", "#ffe8aa"][i % 3];
    const sz = vpSeedRandom(i * 11) > 0.8 ? 2 : 1;
    ctx.fillRect(~~sx, ~~sy, sz, sz);
  }
  ctx.globalAlpha = 1;

  // Planet Namek visible through viewport — green sphere with continents
  const namekX = vpX + 30;
  const namekY = vpY + 15;
  const namekR = 24;

  // Namek glow atmosphere
  const atmoGrad = ctx.createRadialGradient(namekX, namekY, namekR - 2, namekX, namekY, namekR + 6);
  atmoGrad.addColorStop(0, "rgba(80,180,80,0.15)");
  atmoGrad.addColorStop(1, "rgba(40,120,40,0)");
  ctx.fillStyle = atmoGrad;
  ctx.beginPath();
  ctx.arc(namekX, namekY, namekR + 6, 0, Math.PI * 2);
  ctx.fill();

  // Namek body
  const namekGrad = ctx.createRadialGradient(
    namekX - 5, namekY - 8, 3, namekX, namekY, namekR
  );
  namekGrad.addColorStop(0, "#5aaa5a");
  namekGrad.addColorStop(0.4, "#3a8a3a");
  namekGrad.addColorStop(0.7, "#2a6a2a");
  namekGrad.addColorStop(1, "#1a4a1a");
  ctx.fillStyle = namekGrad;
  ctx.beginPath();
  ctx.arc(namekX, namekY, namekR, 0, Math.PI * 2);
  ctx.fill();

  // Namek continent shapes (green land masses on blue-green ocean)
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = "#3a7a3a";
  ctx.beginPath();
  ctx.ellipse(namekX - 6, namekY - 2, 10, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4a9a4a";
  ctx.beginPath();
  ctx.ellipse(namekX + 8, namekY + 5, 7, 6, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Namek highlight (sun reflection)
  ctx.globalAlpha = 0.2;
  const nhlGrad = ctx.createRadialGradient(namekX - 8, namekY - 10, 1, namekX - 4, namekY - 6, namekR * 0.7);
  nhlGrad.addColorStop(0, "rgba(150,230,150,0.5)");
  nhlGrad.addColorStop(1, "rgba(80,180,80,0)");
  ctx.fillStyle = nhlGrad;
  ctx.beginPath();
  ctx.arc(namekX, namekY, namekR, 0, Math.PI * 2);
  ctx.fill();

  // Distant explosion flash (battle above Namek!) — flickers periodically
  const expPhase = (t * 0.8) % 6;
  if (expPhase < 1.5) {
    ctx.globalAlpha = (1 - expPhase / 1.5) * 0.6;
    const expX = vpX - 40;
    const expY = vpY - 35;
    const expR = 4 + (expPhase / 1.5) * 8;
    ctx.fillStyle = "#ff8844";
    ctx.beginPath();
    ctx.arc(expX, expY, expR, 0, Math.PI * 2);
    ctx.fill();
    // Flash white core
    if (expPhase < 0.3) {
      ctx.globalAlpha = (1 - expPhase / 0.3) * 0.8;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(expX, expY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Small distant ship silhouette (Frieza force scout pod)
  const shipSway = Math.sin(t * 0.3 + 2) * 3;
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "#1a1a2a";
  const shipX = vpX - 55;
  const shipY = vpY - 45 + shipSway;
  // Pod body (oval)
  ctx.beginPath();
  ctx.ellipse(shipX, shipY, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Engine glow
  ctx.globalAlpha = 0.4 + Math.sin(t * 5) * 0.2;
  ctx.fillStyle = "#4488ff";
  ctx.beginPath();
  ctx.arc(shipX - 7, shipY, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // unclip viewport

  // Viewport glass reflection (subtle diagonal highlight)
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(vpX - vpR * 0.3, vpY - vpR * 0.4, vpR * 0.5, vpR * 0.15, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // ── PULSING RED ENERGY CORES — along the corridor walls ──
  const drawEnergyCore = (cx: number, cy: number): void => {
    // Core housing
    ctx.fillStyle = "#2a1848";
    ctx.fillRect(cx - 6, cy - 10, 12, 20);
    ctx.strokeStyle = "rgba(80,40,120,0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 6, cy - 10, 12, 20);

    // Pulsing red energy inside
    const pulse = Math.sin(t * 4 + cx * 0.1) * 0.4 + 0.6;
    const coreGrad = ctx.createRadialGradient(cx, cy, 1, cx, cy, 7);
    coreGrad.addColorStop(0, `rgba(255,80,40,${pulse})`);
    coreGrad.addColorStop(0.6, `rgba(200,40,20,${pulse * 0.5})`);
    coreGrad.addColorStop(1, "rgba(150,20,10,0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();

    // Outer glow halo
    ctx.globalAlpha = pulse * 0.15;
    const haloGrad = ctx.createRadialGradient(cx, cy, 3, cx, cy, 18);
    haloGrad.addColorStop(0, "rgba(255,60,20,0.3)");
    haloGrad.addColorStop(1, "rgba(200,30,10,0)");
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  // Place energy cores along both walls at intervals
  for (let iy = 80; iy < h - 40; iy += 90) {
    drawEnergyCore(35, iy);          // left wall
    drawEnergyCore(w - 35, iy);     // right wall
  }

  // ── FLOOR — metallic deck plating with grip pattern ──
  const floorY = h * 0.65;
  const floorGrad = ctx.createLinearGradient(0, floorY, 0, h);
  floorGrad.addColorStop(0, "#281840");
  floorGrad.addColorStop(0.3, "#201238");
  floorGrad.addColorStop(1, "#140a28");
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, floorY, w, h - floorY);

  // Floor panel lines (horizontal)
  ctx.strokeStyle = "rgba(60,35,90,0.3)";
  ctx.lineWidth = 1;
  for (let fy = floorY + 20; fy < h; fy += 28) {
    ctx.beginPath();
    ctx.moveTo(15, fy);
    ctx.lineTo(w - 15, fy);
    ctx.stroke();

    // Anti-slip grip dots on each floor panel row (8-bit detail)
    for (let fx = 20; fx < w - 20; fx += 14) {
      ctx.fillStyle = "rgba(70,45,100,0.3)";
      ctx.fillRect(fx, fy + 2, 3, 2);
    }
  }

  // ── WARNING LIGHTS — small blinking red lights on ceiling ──
  for (let lx = 40; lx < w - 20; lx += 70) {
    const blinkAlpha = Math.sin(t * 3 + lx * 0.05) > 0.3 ? 0.8 : 0.15;
    ctx.globalAlpha = blinkAlpha;
    ctx.fillStyle = "#ff2222";
    ctx.beginPath();
    ctx.arc(lx, 6, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Warning light glow
    if (blinkAlpha > 0.4) {
      const wGlow = ctx.createRadialGradient(lx, 6, 1, lx, 6, 10);
      wGlow.addColorStop(0, "rgba(255,30,30,0.2)");
      wGlow.addColorStop(1, "rgba(255,20,10,0)");
      ctx.fillStyle = wGlow;
      ctx.beginPath();
      ctx.arc(lx, 6, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // ── RED AMBIENT GLOW — subtle red light wash from energy cores ──
  const ambientGrad = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.4, w * 0.6);
  ambientGrad.addColorStop(0, "rgba(80,20,30,0.06)");
  ambientGrad.addColorStop(1, "rgba(40,10,15,0)");
  ctx.fillStyle = ambientGrad;
  ctx.fillRect(0, 0, w, h);

  // ── Darken overlay for gameplay readability (slightly reddish tint) ──
  ctx.fillStyle = "rgba(6,2,8,0.45)";
  ctx.fillRect(0, 0, w, h);
}

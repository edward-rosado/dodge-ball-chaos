/**
 * Hyperbolic Time Chamber — Endless beige void with sand-like floor, towering stone pillars,
 * a large clock on the wall counting down, floating time particles. Highly detailed 8-bit
 * Dragon Ball art style. Used for Levels 30-39 (Band 4).
 */
export function drawTimeChamber(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
): void {
  // ── Endless void gradient — warm beige fading to infinity ──
  const voidGrad = ctx.createLinearGradient(0, 0, 0, h);
  voidGrad.addColorStop(0, "#d8d0c0");               // bright "sky" ceiling
  voidGrad.addColorStop(0.25, "#ccc4b0");
  voidGrad.addColorStop(0.55, "#bcb4a0");             // horizon
  voidGrad.addColorStop(0.75, "#a89e88");
  voidGrad.addColorStop(1, "#908878");                // darker floor edge
  ctx.fillStyle = voidGrad;
  ctx.fillRect(0, 0, w, h);

  // ── DUST / TIME PARTICLES — floating in the endless void ──
  for (let i = 0; i < 35; i++) {
    const px = ((i * 43 + t * 8) % (w + 20)) - 10;
    const pyBase = (i * 67) % h;
    const py = pyBase + Math.sin(t * 0.8 + i * 1.7) * 5;
    // Slowly drift downward like sand
    const sandY = pyBase + ((t * 12 + i * 31) % (h + 40)) - 20;
    const alpha = 0.12 + Math.sin(t * 1.5 + i * 2.3) * 0.08;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = ["#c8b898", "#b8a888", "#d8c8a8", "#a89878"][i % 4];
    const sz = 1 + (i % 3);
    ctx.fillRect(~~px, ~~sandY, sz, sz);
  }
  ctx.globalAlpha = 1;

  // ── FLOOR — sandy terrain with subtle dune texture ──
  const floorY = h * 0.62;

  // Distant horizon line (slightly curved for void feeling)
  ctx.fillStyle = "#a89e88";
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  for (let x = 0; x <= w; x += 4) {
    const y = floorY + Math.sin((x + t * 2) * 0.008) * 3
                     + Math.sin((x + t * 2) * 0.02) * 1.5;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Near floor — sandy gradient with pixel texture
  const sandGrad = ctx.createLinearGradient(0, floorY + 10, 0, h);
  sandGrad.addColorStop(0, "#b8a888");
  sandGrad.addColorStop(0.4, "#a89878");
  sandGrad.addColorStop(1, "#887858");
  ctx.fillStyle = sandGrad;
  ctx.fillRect(0, floorY + 10, w, h - floorY - 10);

  // Pixel sand texture (tiny random dots — 8-bit detail)
  for (let i = 0; i < 50; i++) {
    const fx = (i * 37) % w;
    const fy = floorY + 12 + ((i * 59) % (h - floorY - 14));
    ctx.fillStyle = i % 2 === 0 ? "rgba(140,128,100,0.3)" : "rgba(160,148,118,0.25)";
    ctx.fillRect(~~fx, ~~fy, 2, 1);
  }

  // ── TALL STONE PILLARS — the signature Time Chamber columns ──
  const drawPillar = (px: number, baseY: number, pillarH: number, depth: number): void => {
    ctx.save();

    // Pillar body — blocky rectangle (8-bit style)
    const pw = 18 - depth * 4;                        // farther pillars are narrower
    const paleFactor = depth * 0.2;                    // distance fades color
    const r = ~~(160 - paleFactor * 40);
    const g = ~~(150 - paleFactor * 40);
    const b = ~~(130 - paleFactor * 40);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(px - pw / 2, baseY - pillarH, pw, pillarH);

    // Pillar cap (wider top slab)
    const capW = pw + 8;
    ctx.fillStyle = `rgb(${r + 15},${g + 15},${b + 10})`;
    ctx.fillRect(px - capW / 2, baseY - pillarH - 6, capW, 8);

    // Pillar base (wider bottom slab)
    ctx.fillStyle = `rgb(${r - 10},${g - 10},${b - 8})`;
    ctx.fillRect(px - capW / 2 + 2, baseY - 6, capW - 4, 8);

    // Vertical groove lines (chisel marks — 8-bit detail)
    ctx.fillStyle = `rgba(${r - 20},${g - 20},${b - 15},0.25)`;
    for (let v = 0; v < 3; v++) {
      const gx = px - pw / 4 + v * (pw / 4);
      ctx.fillRect(gx, baseY - pillarH + 8, 2, pillarH - 16);
    }

    // Shadow cast by pillar on floor
    ctx.globalAlpha = 0.15 - depth * 0.03;
    ctx.fillStyle = "#483828";
    ctx.beginPath();
    ctx.moveTo(px - pw / 2, baseY);
    ctx.lineTo(px + pw * 0.8, baseY + 8);
    ctx.lineTo(px + pw / 2, baseY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  // Far pillars (smaller, lighter = depth)
  drawPillar(w * 0.15, floorY, h * 0.55, 3);   // far left
  drawPillar(w * 0.40, floorY - 5, h * 0.52, 3);
  drawPillar(w * 0.62, floorY - 3, h * 0.50, 2);
  drawPillar(w * 0.85, floorY - 4, h * 0.53, 3);

  // Mid-distance pillars (medium size)
  drawPillar(w * 0.10, floorY + 8, h * 0.65, 2);
  drawPillar(w * 0.35, floorY + 5, h * 0.70, 1);
  drawPillar(w * 0.68, floorY + 6, h * 0.68, 1);
  drawPillar(w * 0.92, floorY + 7, h * 0.72, 2);

  // ── LARGE WALL CLOCK — the iconic Time Chamber countdown clock ──
  const clockX = w / 2;
  const clockY = h * 0.18;
  const clockR = 32;

  // Clock shadow on wall
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#483828";
  ctx.beginPath();
  ctx.arc(clockX + 4, clockY + 4, clockR + 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Clock frame — thick stone border
  ctx.fillStyle = "#8a7858";
  ctx.beginPath();
  ctx.arc(clockX, clockY, clockR + 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#b8a888";
  ctx.beginPath();
  ctx.arc(clockX, clockY, clockR + 3, 0, Math.PI * 2);
  ctx.fill();

  // Clock face
  const clockFaceGrad = ctx.createRadialGradient(
    clockX - 4, clockY - 4, 2, clockX, clockY, clockR
  );
  clockFaceGrad.addColorStop(0, "#f0e8d0");
  clockFaceGrad.addColorStop(1, "#d8c8a0");
  ctx.fillStyle = clockFaceGrad;
  ctx.beginPath();
  ctx.arc(clockX, clockY, clockR - 2, 0, Math.PI * 2);
  ctx.fill();

  // Hour markers (12 positions) — bold blocks for 8-bit style
  ctx.fillStyle = "#5a4830";
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI * 2) / 12 - Math.PI / 2;
    const innerR = clockR - 9;
    const outerR = clockR - 4;
    ctx.save();
    ctx.translate(clockX, clockY);
    ctx.rotate(angle);
    ctx.fillRect(innerR, -2, outerR - innerR, 4);
    ctx.restore();
  }

  // Clock numbers (simplified — just tick marks for 8-bit feel)
  ctx.fillStyle = "#6a5838";
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI * 2) / 12 - Math.PI / 2;
    const nx = clockX + Math.cos(angle) * (clockR - 13);
    const ny = clockY + Math.sin(angle) * (clockR - 13);
    ctx.fillRect(nx - 1, ny - 1, 3, 3);
  }

  // Clock hands — the minute hand advances visibly with t (Time Chamber time flows!)
  ctx.strokeStyle = "#3a2810";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  const hourAngle = ((t * 0.01) % (Math.PI * 2)) - Math.PI / 2;
  ctx.beginPath();
  ctx.moveTo(clockX, clockY);
  ctx.lineTo(clockX + Math.cos(hourAngle) * 14, clockY + Math.sin(hourAngle) * 14);
  ctx.stroke();

  ctx.lineWidth = 2;
  const minAngle = ((t * 0.15) % (Math.PI * 2)) - Math.PI / 2;
  ctx.beginPath();
  ctx.moveTo(clockX, clockY);
  ctx.lineTo(clockX + Math.cos(minAngle) * 22, clockY + Math.sin(minAngle) * 22);
  ctx.stroke();

  // Center pin
  ctx.fillStyle = "#5a4830";
  ctx.beginPath();
  ctx.arc(clockX, clockY, 3, 0, Math.PI * 2);
  ctx.fill();

  // ── VOID MIST at edges (fading to nothing — the endless void) ──
  const mistGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.7);
  mistGrad.addColorStop(0, "rgba(180,170,150,0)");
  mistGrad.addColorStop(0.7, "rgba(140,130,110,0.08)");
  mistGrad.addColorStop(1, "rgba(120,110,90,0.2)");
  ctx.fillStyle = mistGrad;
  ctx.fillRect(0, 0, w, h);

  // ── Darken overlay (moderate — Time Chamber is well-lit but still needs gameplay contrast) ──
  ctx.fillStyle = "rgba(8,6,4,0.3)";
  ctx.fillRect(0, 0, w, h);
}

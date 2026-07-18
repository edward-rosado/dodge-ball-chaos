/**
 * Desert Wasteland — King Piccolo's domain. Orange dunes, jagged rock formations,
 * twin suns in a hazy sky, distant pyramid ruins.  Highly detailed 8-bit Dragon Ball art style.
 * Used for Levels 10-19 (Band 2).
 */
export function drawDesertWasteland(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
): void {
  // ── Sky gradient — dusty orange to deep crimson (hot desert) ──
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  sky.addColorStop(0, "#2a1040");
  sky.addColorStop(0.3, "#6a2840");
  sky.addColorStop(0.6, "#c05520");
  sky.addColorStop(1, "#e89040");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.55);

  // ── Twin suns (King Piccolo world detail) ──
  // Large primary sun
  const sun1X = w * 0.25 + Math.sin(t * 0.1) * 3;
  const sun1Y = h * 0.12;
  const sunGrad1 = ctx.createRadialGradient(sun1X, sun1Y, 4, sun1X, sun1Y, 28);
  sunGrad1.addColorStop(0, "rgba(255,220,100,0.9)");
  sunGrad1.addColorStop(0.5, "rgba(255,160,40,0.4)");
  sunGrad1.addColorStop(1, "rgba(255,80,20,0)");
  ctx.fillStyle = sunGrad1;
  ctx.beginPath();
  ctx.arc(sun1X, sun1Y, 28, 0, Math.PI * 2);
  ctx.fill();

  // Small secondary sun
  const sun2X = w * 0.72 + Math.sin(t * 0.08 + 1) * 2;
  const sun2Y = h * 0.18;
  const sunGrad2 = ctx.createRadialGradient(sun2X, sun2Y, 2, sun2X, sun2Y, 14);
  sunGrad2.addColorStop(0, "rgba(255,180,80,0.7)");
  sunGrad2.addColorStop(0.6, "rgba(255,100,30,0.2)");
  sunGrad2.addColorStop(1, "rgba(255,60,10,0)");
  ctx.fillStyle = sunGrad2;
  ctx.beginPath();
  ctx.arc(sun2X, sun2Y, 14, 0, Math.PI * 2);
  ctx.fill();

  // ── Distant mountain range (dark silhouettes) ──
  ctx.fillStyle = "#3a1810";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.45);
  ctx.lineTo(w * 0.05, h * 0.32);
  ctx.lineTo(w * 0.12, h * 0.38);
  ctx.lineTo(w * 0.18, h * 0.28); // tall peak
  ctx.lineTo(w * 0.25, h * 0.36);
  ctx.lineTo(w * 0.32, h * 0.30);
  ctx.lineTo(w * 0.40, h * 0.37);
  ctx.lineTo(w * 0.48, h * 0.25); // highest peak
  ctx.lineTo(w * 0.55, h * 0.33);
  ctx.lineTo(w * 0.62, h * 0.29);
  ctx.lineTo(w * 0.70, h * 0.38);
  ctx.lineTo(w * 0.78, h * 0.31);
  ctx.lineTo(w * 0.85, h * 0.36);
  ctx.lineTo(w * 0.92, h * 0.30); // peak near right edge
  ctx.lineTo(w, h * 0.40);
  ctx.lineTo(w, h * 0.55);
  ctx.lineTo(0, h * 0.55);
  ctx.closePath();
  ctx.fill();

  // ── Mid-ground dunes (layered for depth) ──
  const drawDune = (baseY: number, amplitude: number, color: string, phase: number): void => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 4) {
      const y = baseY + Math.sin((x + phase) * 0.015) * amplitude
                      + Math.sin((x + phase) * 0.03) * (amplitude * 0.4);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  };

  drawDune(h * 0.48, 18, "#7a3520", ~~(t * 2));         // far dunes (slow drift)
  drawDune(h * 0.52, 12, "#9a4828", ~~(t * 3));         // mid dunes
  drawDune(h * 0.56, 8, "#b05830", ~~(t * 4));          // near dunes

  // ── 8-bit rock formations (jagged DB-style boulders) ──
  const drawRock = (rx: number, ry: number, rw: number, rh: number, shade: string): void => {
    ctx.fillStyle = shade;
    // Main body — blocky polygon
    ctx.beginPath();
    ctx.moveTo(rx - rw / 2, ry);
    ctx.lineTo(rx - rw / 2 + 2, ry - rh * 0.6);
    ctx.lineTo(rx - rw * 0.15, ry - rh);
    ctx.lineTo(rw * 0.2, ry - rh * 0.85);
    ctx.lineTo(rw / 2, ry - rh * 0.7);
    ctx.lineTo(rx + rw / 2 - 1, ry - rh * 0.4);
    ctx.lineTo(rx + rw / 2, ry);
    ctx.closePath();
    ctx.fill();

    // Highlight edge (8-bit style)
    ctx.fillStyle = "rgba(200,120,60,0.3)";
    ctx.fillRect(rx - rw * 0.1, ry - rh * 0.9, 3, rh * 0.3);
  };

  drawRock(w * 0.08, h * 0.54, 22, 30, "#6a3018");      // left cluster
  drawRock(w * 0.12, h * 0.55, 16, 22, "#7a381c");
  drawRock(w * 0.85, h * 0.53, 26, 35, "#6a3018");      // right cluster
  drawRock(w * 0.90, h * 0.55, 18, 24, "#7a381c");

  // ── Cactus-like pillar formations (King Piccolo wasteland detail) ──
  const drawCactusPillar = (px: number, py: number, ph: number, scale: number): void => {
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(scale, scale);

    // Main trunk
    ctx.fillStyle = "#4a2810";
    ctx.fillRect(-3, -ph, 6, ph);

    // Arms (jagged, asymmetrical)
    if (ph > 25) {
      ctx.fillStyle = "#3a1c08";
      ctx.fillRect(3, -ph * 0.7, 10, 4);       // right arm
      ctx.fillRect(11, -ph * 0.9, 4, ph * 0.25); // right arm up
      ctx.fillStyle = "#4a2810";
      ctx.fillRect(-13, -ph * 0.5, 10, 4);     // left arm
      ctx.fillRect(-13, -ph * 0.7, 4, ph * 0.25); // left arm up
    }

    // Top bud
    ctx.fillStyle = "#8a5020";
    ctx.beginPath();
    ctx.arc(0, -ph - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  drawCactusPillar(w * 0.20, h * 0.56, 28, 1.2);   // tall one left
  drawCactusPillar(w * 0.75, h * 0.57, 20, 0.9);   // medium right
  drawCactusPillar(w * 0.68, h * 0.58, 14, 0.7);   // small near medium

  // ── Distant pyramid ruins (DB King Piccolo fortress hint) ──
  ctx.fillStyle = "#5a2818";
  ctx.beginPath();
  ctx.moveTo(w * 0.50, h * 0.34);
  ctx.lineTo(w * 0.44, h * 0.44);
  ctx.lineTo(w * 0.56, h * 0.44);
  ctx.closePath();
  ctx.fill();
  // Pyramid detail lines (8-bit style)
  ctx.strokeStyle = "rgba(30,15,5,0.3)";
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 4; i++) {
    const ly = h * 0.36 + i * 2.5;
    const halfW = (ly - h * 0.34) * 1.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.50 - halfW, ly);
    ctx.lineTo(w * 0.50 + halfW, ly);
    ctx.stroke();
  }

  // ── Heat shimmer particles (floating dust) ──
  for (let i = 0; i < 20; i++) {
    const px = ((i * 47 + t * 18) % (w + 20)) - 10;
    const pyBase = h * 0.50 + (i * 23) % (h * 0.15);
    const py = pyBase + Math.sin(t * 1.5 + i * 2.1) * 4;
    const alpha = 0.15 + Math.sin(t * 2 + i) * 0.1;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#d08040";
    // Pixelated dust specks (tiny squares for 8-bit feel)
    const sz = 1 + (i % 3);
    ctx.fillRect(~~px, ~~py, sz, sz);
  }
  ctx.globalAlpha = 1;

  // ── Floor — dark packed earth with pixel texture ──
  const floorGrad = ctx.createLinearGradient(0, h * 0.58, 0, h);
  floorGrad.addColorStop(0, "#6a3018");
  floorGrad.addColorStop(0.4, "#5a2814");
  floorGrad.addColorStop(1, "#4a2010");
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, h * 0.58, w, h - h * 0.58);

  // Pixel texture dots on floor (8-bit detail)
  for (let i = 0; i < 40; i++) {
    const fx = (i * 31) % w;
    const fy = h * 0.6 + ((i * 53) % (h - h * 0.6));
    ctx.fillStyle = i % 2 === 0 ? "rgba(90,45,20,0.4)" : "rgba(110,55,25,0.3)";
    ctx.fillRect(~~fx, ~~fy, 2, 2);
  }

  // ── Darken overlay for gameplay readability ──
  ctx.fillStyle = "rgba(8,4,2,0.4)";
  ctx.fillRect(0, 0, w, h);
}

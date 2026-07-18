/**
 * King Kai's Planet — Red dusty surface, pink/purple sky, giant gas planet dominating the horizon,
 * odd-shaped rocks and sparse alien vegetation. Highly detailed 8-bit Dragon Ball art style.
 * Used for Levels 20-29 (Band 3).
 */
export function kingKaiPlanet(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
): void {
  // ── Sky gradient — deep pink-purple with orange horizon glow ──
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.5);
  sky.addColorStop(0, "#1a0830");
  sky.addColorStop(0.25, "#3a1860");
  sky.addColorStop(0.5, "#7a2870");
  sky.addColorStop(0.75, "#c04850");
  sky.addColorStop(1, "#e07040");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.5);

  // ── STAR FIELD — dense and prominent (King Kai has no atmosphere blocking stars) ──
  const seedRandom = (seed: number): number => {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  for (let i = 0; i < 60; i++) {
    const sx = seedRandom(i * 3 + 1) * w;
    const sy = seedRandom(i * 3 + 2) * h * 0.45;
    const brightness = 0.3 + seedRandom(i * 3 + 3) * 0.7;
    // Twinkle animation — different rates per star
    const twinkle = Math.sin(t * (1.5 + seedRandom(i * 7) * 2) + i) * 0.3 + 0.7;
    ctx.globalAlpha = brightness * twinkle;

    // Star color variation: white, blue-white, yellow
    const starColor = [
      "#ffffff", "#aaccff", "#ffe8aa", "#ffccee", "#ccddff"
    ][i % 5];
    ctx.fillStyle = starColor;

    const sz = seedRandom(i * 11) > 0.85 ? 2 : 1;
    ctx.fillRect(~~sx, ~~sy, sz, sz);

    // Cross sparkle on bright stars (8-bit detail)
    if (sz === 2 && brightness > 0.6) {
      ctx.globalAlpha = brightness * twinkle * 0.4;
      ctx.fillRect(~~sx - 2, ~~sy, 5, 1);
      ctx.fillRect(~~sx, ~~sy - 2, 1, 5);
    }
  }
  ctx.globalAlpha = 1;

  // ── GIANT PLANET in sky (King Kai's home planet visible from here — a visual signature) ──
  const planetCX = w * 0.70 + Math.sin(t * 0.05) * 2;
  const planetCY = h * 0.18;
  const planetR = Math.min(w, h) * 0.28;

  // Planet glow halo
  const haloGrad = ctx.createRadialGradient(planetCX, planetCY, planetR * 0.8, planetCX, planetCY, planetR * 1.4);
  haloGrad.addColorStop(0, "rgba(200,100,150,0.15)");
  haloGrad.addColorStop(1, "rgba(150,50,100,0)");
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(planetCX, planetCY, planetR * 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Planet body — bands of color (gas giant look)
  const planetBody = ctx.createLinearGradient(planetCX - planetR, planetCY - planetR, planetCX + planetR, planetCY + planetR);
  planetBody.addColorStop(0, "#8a4060");
  planetBody.addColorStop(0.2, "#c05870");
  planetBody.addColorStop(0.35, "#e08060");
  planetBody.addColorStop(0.5, "#f0a070");
  planetBody.addColorStop(0.65, "#d07060");
  planetBody.addColorStop(0.8, "#9a4858");
  planetBody.addColorStop(1, "#6a2838");
  ctx.fillStyle = planetBody;
  ctx.beginPath();
  ctx.arc(planetCX, planetCY, planetR, 0, Math.PI * 2);
  ctx.fill();

  // Horizontal bands (gas giant detail — 8-bit style)
  for (let band = 0; band < 8; band++) {
    const by = planetCY - planetR + (band / 7) * planetR * 2;
    const bAlpha = 0.15 + Math.sin(band * 1.3) * 0.1;
    ctx.globalAlpha = bAlpha;
    ctx.fillStyle = band % 2 === 0 ? "#d06848" : "#a04050";
    const bandH = planetR * 0.18 + Math.sin(band) * planetR * 0.05;
    // Clip to circle — approximate with rect (good enough for 8-bit look)
    ctx.fillRect(planetCX - planetR, ~~by, planetR * 2, ~~bandH);
  }
  ctx.globalAlpha = 1;

  // Planet highlight (light source from upper left)
  const hlGrad = ctx.createRadialGradient(
    planetCX - planetR * 0.35, planetCY - planetR * 0.35, planetR * 0.1,
    planetCX, planetCY, planetR
  );
  hlGrad.addColorStop(0, "rgba(255,200,160,0.3)");
  hlGrad.addColorStop(0.5, "rgba(255,150,100,0.05)");
  hlGrad.addColorStop(1, "rgba(80,30,40,0.3)");
  ctx.fillStyle = hlGrad;
  ctx.beginPath();
  ctx.arc(planetCX, planetCY, planetR, 0, Math.PI * 2);
  ctx.fill();

  // ── RED DUSTY SURFACE — uneven terrain with craters ──
  const horizonY = h * 0.52;

  // Far hills
  ctx.fillStyle = "#6a3040";
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  for (let x = 0; x <= w; x += 3) {
    const y = horizonY + Math.sin((x + t * 1) * 0.012) * 8
                     + Math.sin((x + t * 1) * 0.025) * 4;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Near ground — warm red-brown
  const groundGrad = ctx.createLinearGradient(0, horizonY + 15, 0, h);
  groundGrad.addColorStop(0, "#8a4048");
  groundGrad.addColorStop(0.3, "#7a3840");
  groundGrad.addColorStop(0.6, "#6a3038");
  groundGrad.addColorStop(1, "#502530");
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, horizonY + 15, w, h - horizonY - 15);

  // ── CRATERS in the red surface (8-bit style — dark circles with raised rims) ──
  const drawCrater = (cx: number, cy: number, cr: number): void => {
    // Dark inner depression
    ctx.fillStyle = "#4a2028";
    ctx.beginPath();
    ctx.ellipse(cx, cy, cr, cr * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Raised rim (lighter)
    ctx.strokeStyle = "rgba(140,70,80,0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 1, cr + 2, (cr + 2) * 0.5, 0, Math.PI * 0.8, Math.PI * 2.2);
    ctx.stroke();
  };

  drawCrater(w * 0.12, h * 0.62, 14);
  drawCrater(w * 0.35, h * 0.70, 10);
  drawCrater(w * 0.65, h * 0.65, 18);
  drawCrater(w * 0.88, h * 0.72, 8);

  // ── Alien rock formations (oddly shaped King Kai-style boulders) ──
  const drawAlienRock = (rx: number, ry: number, rw: number, rh: number): void => {
    ctx.save();
    // Slight sway animation from wind
    const sway = Math.sin(t * 0.8 + rx * 0.1) * 1;

    // Rock body — blocky/irregular shape (8-bit style)
    ctx.fillStyle = "#6a3545";
    ctx.beginPath();
    ctx.moveTo(rx - rw / 2, ry);
    ctx.lineTo(rx - rw / 2 + 3, ry - rh * 0.5);
    ctx.quadraticCurveTo(rx - rw * 0.15, ry - rh * 1.1 + sway, rx, ry - rh + sway);
    ctx.quadraticCurveTo(rw * 0.2, ry - rh * 1.0 + sway, rx + rw / 2 - 2, ry - rh * 0.45);
    ctx.lineTo(rx + rw / 2, ry);
    ctx.closePath();
    ctx.fill();

    // Highlight (lighter red on top)
    ctx.fillStyle = "rgba(160,80,90,0.35)";
    ctx.fillRect(rx - 2, ry - rh + sway, 4, rh * 0.3);

    // Dark shadow side
    ctx.fillStyle = "rgba(50,20,30,0.3)";
    ctx.fillRect(rx + rw * 0.2, ry - rh * 0.6 + sway, rw * 0.3, rh * 0.5);

    ctx.restore();
  };

  drawAlienRock(w * 0.15, h * 0.58, 24, 32);       // tall left
  drawAlienRock(w * 0.25, h * 0.60, 16, 22);        // medium
  drawAlienRock(w * 0.78, h * 0.57, 28, 38);        // large right
  drawAlienRock(w * 0.88, h * 0.61, 14, 18);        // small far right

  // ── Sparse alien vegetation (tiny red plants) ──
  const drawAlienPlant = (px: number, py: number): void => {
    const sway = Math.sin(t * 1.2 + px * 0.2) * 1.5;
    ctx.fillStyle = "#8a3848";
    // Stems
    for (let s = 0; s < 3; s++) {
      const sx = px + (s - 1) * 6;
      const sh = 6 + (s % 2) * 4;
      ctx.fillRect(sx, py - sh + sway * 0.3, 2, sh);
    }
    // Leaves/buds
    ctx.fillStyle = "#b05060";
    ctx.beginPath();
    ctx.arc(px + sway * 0.5, py - 10 + sway * 0.3, 3, 0, Math.PI * 2);
    ctx.fill();
  };

  for (let i = 0; i < 8; i++) {
    drawAlienPlant(w * 0.05 + i * w * 0.12, h * 0.64 + (i % 3) * 8);
  }

  // ── Floating dust particles (red wind effect) ──
  for (let i = 0; i < 25; i++) {
    const px = ((i * 41 + t * 14) % (w + 30)) - 15;
    const pyBase = h * 0.55 + (i * 37) % (h * 0.2);
    const py = pyBase + Math.sin(t * 1.8 + i * 1.9) * 5;
    const alpha = 0.2 + Math.sin(t * 2.5 + i) * 0.1;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#c06070";
    const sz = 1 + (i % 2);
    ctx.fillRect(~~px, ~~py, sz, sz);
  }
  ctx.globalAlpha = 1;

  // ── Darken overlay for gameplay readability ──
  ctx.fillStyle = "rgba(8,4,6,0.35)";
  ctx.fillRect(0, 0, w, h);
}

// Exported alias for index.ts import (matches the naming convention)
export const drawKingKaiPlanet = kingKaiPlanet;

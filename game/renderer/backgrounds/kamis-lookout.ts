/**
 * Kami's Lookout — Sacred floating platform high in the sky. White tiled floor, blue
 * atmosphere fading to starry space above, stone railing with carved details, swaying
 * palm trees, distant clouds drifting below. Highly detailed 8-bit Dragon Ball art style.
 * Used for Levels 1-9 (Band 1).
 */
export function drawKamisLookout(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
): void {
  // ── Sky gradient — deep blue sky fading to starry space at top ──
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
  sky.addColorStop(0, "#0a1040");              // upper atmosphere → near-space black-blue
  sky.addColorStop(0.25, "#1a3070");
  sky.addColorStop(0.5, "#2a5898");
  sky.addColorStop(0.75, "#4080b8");
  sky.addColorStop(1, "#60a8d8");               // horizon = bright blue
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.6);

  // ── STAR FIELD above the atmosphere (Lookout is high enough to see stars) ──
  const seededRandom = (seed: number): number => {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  for (let i = 0; i < 45; i++) {
    const sx = seededRandom(i * 5 + 1) * w;
    const sy = seededRandom(i * 5 + 2) * h * 0.42;
    const brightness = 0.3 + seededRandom(i * 5 + 3) * 0.7;
    const twinkle = Math.sin(t * (1.2 + seededRandom(i * 3 + 9) * 2.5) + i) * 0.4 + 0.6;
    ctx.globalAlpha = brightness * twinkle;

    // Pixel-sized stars with occasional cross sparkle
    const sz = seededRandom(i * 7) > 0.8 ? 2 : 1;
    const starColor = ["#ffffff", "#bbddff", "#ffeec0"][i % 3];
    ctx.fillStyle = starColor;
    ctx.fillRect(~~sx, ~~sy, sz, sz);

    if (sz === 2 && brightness > 0.65) {
      ctx.globalAlpha = brightness * twinkle * 0.35;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(~~sx - 2, ~~sy, 5, 1);
      ctx.fillRect(~~sx, ~~sy - 2, 1, 5);
    }
  }
  ctx.globalAlpha = 1;

  // ── Distant cloud sea below the Lookout (parallax layers) ──
  const drawCloudSea = (baseY: number, speed: number, alpha: number, color: string): void => {
    for (let i = 0; i < 8; i++) {
      const cx = ((i * 73 + t * speed) % (w + 120)) - 60;
      const cy = baseY + Math.sin(i * 1.7) * 6;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;

      // Puffy cloud shapes (3 overlapping ellipses — 8-bit friendly)
      const sizes = [24, 18, 20];
      const offsets = [-14, 0, 16];
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.ellipse(cx + offsets[j], cy, sizes[j], sizes[j] * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };

  drawCloudSea(h * 0.50, 4, 0.25, "#b0d0e8");   // far cloud layer (slow)
  drawCloudSea(h * 0.53, 7, 0.35, "#c8e0f0");   // mid cloud layer

  // ── THE LOOKOUT PLATFORM — stone tiles with carved patterns ──
  const platformY = h * 0.52;

  // Platform base (thick stone edge visible from below)
  ctx.fillStyle = "#989088";
  ctx.fillRect(0, platformY + 4, w, h - platformY);

  // Stone edge detail — horizontal layers
  ctx.fillStyle = "#807870";
  for (let ly = 0; ly < 3; ly++) {
    ctx.globalAlpha = 0.2 + ly * 0.1;
    ctx.fillRect(0, platformY + 6 + ly * 4, w, 2);
  }
  ctx.globalAlpha = 1;

  // ── TILED FLOOR — white/cream tiles with grid lines (the iconic Lookout look) ──
  const floorGrad = ctx.createLinearGradient(0, platformY + 6, 0, h);
  floorGrad.addColorStop(0, "#e8e0d4");
  floorGrad.addColorStop(0.5, "#ddd4c4");
  floorGrad.addColorStop(1, "#c8bca8");
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, platformY + 6, w, h - platformY - 6);

  // Tile grid (larger tiles for 8-bit clarity)
  const tileSize = 36;
  ctx.strokeStyle = "rgba(140,130,115,0.2)";
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, platformY + 6);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = platformY + 6; y < h; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Tile highlight pattern — alternating lighter tiles for texture (8-bit style)
  for (let tx = 0; tx < w / tileSize; tx++) {
    for (let ty = 0; ty < (h - platformY) / tileSize; ty++) {
      if ((tx + ty) % 3 === 0) {
        ctx.fillStyle = "rgba(255,250,240,0.12)";
        ctx.fillRect(tx * tileSize + 2, platformY + ty * tileSize + 8, tileSize - 4, tileSize - 4);
      }
    }
  }

  // ── STONE RAILING — carved pillars with DB-style details ──
  const pillarW = 10;
  const pillarH = 36;
  const railY = platformY + 8;

  const drawPillar = (px: number): void => {
    // Main pillar body
    ctx.fillStyle = "#b0a898";
    ctx.fillRect(px - pillarW / 2, railY, pillarW, pillarH);

    // Pillar cap (wider top)
    ctx.fillStyle = "#c8c0b0";
    ctx.fillRect(px - pillarW * 0.8, railY - 4, pillarW * 1.6, 6);

    // Pillar base
    ctx.fillRect(px - pillarW * 0.9, railY + pillarH - 4, pillarW * 1.8, 5);

    // Carved detail — horizontal groove
    ctx.fillStyle = "rgba(120,110,95,0.3)";
    ctx.fillRect(px - pillarW / 2, railY + 12, pillarW, 2);
    ctx.fillRect(px - pillarW / 2, railY + 24, pillarW, 2);

    // Small DB-style symbol on cap (circle detail)
    ctx.fillStyle = "rgba(80,70,55,0.3)";
    ctx.beginPath();
    ctx.arc(px, railY - 1, 3, 0, Math.PI * 2);
    ctx.fill();

    // Shadow beneath cap
    ctx.fillStyle = "rgba(60,50,40,0.15)";
    ctx.fillRect(px - pillarW * 0.8 + 2, railY + 2, pillarW * 1.6 - 4, 3);
  };

  // Draw pillars at regular intervals
  const pillarSpacing = w / 7;
  for (let i = 0; i <= 7; i++) {
    drawPillar(i * pillarSpacing + pillarSpacing * 0.5);
  }

  // Top rail connecting the pillars
  ctx.fillStyle = "#c0b8a8";
  ctx.fillRect(0, railY - 6, w, 4);
  ctx.fillStyle = "rgba(100,90,75,0.2)";
  ctx.fillRect(0, railY - 2, w, 2);

  // ── PALM TREES — swaying in the wind with animated fronds ──
  const drawPalmTree = (px: number, py: number, scale: number): void => {
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(scale, scale);

    // Trunk — slight curve using stepped blocks (8-bit style)
    const trunkSegments = 6;
    for (let s = 0; s < trunkSegments; s++) {
      const sy = -s * 12;
      const sway = Math.sin(t * 0.7 + px * 0.05) * (s * 1.2);
      ctx.fillStyle = s % 2 === 0 ? "#6a4828" : "#5a3c20";
      ctx.fillRect(-3 + sway * 0.3, sy - 12, 6, 12);
      // Trunk ring detail
      ctx.fillStyle = "rgba(40,25,10,0.3)";
      ctx.fillRect(-3 + sway * 0.3, sy - 1, 6, 2);
    }

    // Fronds — palm leaves swaying from the top
    const topSway = Math.sin(t * 0.9 + px * 0.05) * 3;
    for (let f = 0; f < 7; f++) {
      const angle = ((f / 7) * Math.PI * 2) + Math.sin(t * 0.6) * 0.15;
      const frondLen = 28 + (f % 3) * 6;
      const endX = Math.cos(angle) * frondLen + topSway;
      const endY = Math.sin(angle) * frondLen * 0.5 - 8;

      ctx.strokeStyle = "#2a5a18";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(topSway, -72);
      // Curved frond path (quadratic bezier for natural bend)
      const cpX = topSway + Math.cos(angle) * frondLen * 0.5;
      const cpY = -72 + Math.sin(angle) * frondLen * 0.15;
      ctx.quadraticCurveTo(cpX, cpY, endX, endY);
      ctx.stroke();

      // Leaflets along the frond (small lines sticking out — 8-bit detail)
      for (let l = 0; l < 4; l++) {
        const frac = (l + 1) / 5;
        const lx = topSway + (endX - topSway) * frac;
        const ly = -72 + (endY + 72) * frac;
        ctx.strokeStyle = "rgba(40,90,25,0.6)";
        ctx.lineWidth = 1;
        // Alternate leaflet direction
        const dir = l % 2 === 0 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + dir * 6, ly - 3);
        ctx.stroke();
      }
    }

    // Coconuts at top
    ctx.fillStyle = "#5a3820";
    ctx.beginPath();
    ctx.arc(topSway - 3, -70, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(topSway + 4, -71, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  drawPalmTree(w * 0.06, platformY + 12, 1.1);     // left palm (tall)
  drawPalmTree(w * 0.92, platformY + 10, 1.3);     // right palm (larger, closer)
  drawPalmTree(w * 0.82, platformY + 16, 0.75);    // small right-back

  // ── Small decorative elements on the Lookout ──
  // Sacred water pool / fountain hint at one end
  const poolX = w * 0.5;
  const poolY = h * 0.68;
  ctx.fillStyle = "rgba(60,120,180,0.4)";
  ctx.beginPath();
  ctx.ellipse(poolX, poolY, 30, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Water ripple animation
  for (let r = 0; r < 3; r++) {
    const rippleR = 8 + ((t * 8 + r * 8) % 24);
    ctx.globalAlpha = Math.max(0, 0.3 - rippleR * 0.015);
    ctx.strokeStyle = "rgba(100,180,240,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(poolX, poolY, rippleR, rippleR * 0.33, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Small lantern/torch posts between pillars
  const drawLantern = (lx: number): void => {
    ctx.fillStyle = "#8a7860";
    ctx.fillRect(lx - 2, railY + 4, 4, pillarH - 4);
    // Lantern top
    ctx.fillStyle = "#c09030";
    ctx.fillRect(lx - 5, railY + 1, 10, 5);
    // Flame flicker
    const flameAlpha = 0.5 + Math.sin(t * 6 + lx) * 0.3;
    ctx.globalAlpha = flameAlpha;
    ctx.fillStyle = "#ff8822";
    ctx.beginPath();
    ctx.moveTo(lx, railY - 4);
    ctx.quadraticCurveTo(lx + 3, railY - 10, lx, railY - 12 - Math.sin(t * 8 + lx) * 2);
    ctx.quadraticCurveTo(lx - 3, railY - 10, lx, railY - 4);
    ctx.fill();
    // Glow
    const glowGrad = ctx.createRadialGradient(lx, railY - 8, 1, lx, railY - 8, 15);
    glowGrad.addColorStop(0, "rgba(255,160,40,0.15)");
    glowGrad.addColorStop(1, "rgba(255,100,20,0)");
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(lx, railY - 8, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  for (let i = 1; i <= 6; i++) {
    drawLantern(i * pillarSpacing);
  }

  // ── Darken overlay (slightly lighter since this is a bright area) ──
  ctx.fillStyle = "rgba(4,8,20,0.35)";
  ctx.fillRect(0, 0, w, h);
}

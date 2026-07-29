/** Visual effects: aura, Ultra Instinct, Kaioken, shrink indicator. */

/** Draw a ki aura glow around the player. */
export function drawAura(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  color: string
): void {
  ctx.save();
  const pulse = 1.0 + Math.sin(t * 6) * 0.15;
  const rx = 44 * pulse;
  const ry = 52 * pulse;
  const alpha = 0.2 + Math.sin(t * 8) * 0.08;

  // Outer glow
  const grad = ctx.createRadialGradient(x, y - 4, 10, x, y - 4, ry);
  grad.addColorStop(0, color.replace(")", `,${alpha * 1.5})`).replace("rgb", "rgba"));
  grad.addColorStop(0.5, color.replace(")", `,${alpha})`).replace("rgb", "rgba"));
  grad.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, y - 4, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  // Flame-like wisps rising upward
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + t * 2;
    const wispR = 20 + Math.sin(t * 4 + i * 1.3) * 8;
    const wx = x + Math.cos(angle) * wispR * 0.6;
    const wy = y - 10 + Math.sin(angle) * wispR * 0.3 - Math.abs(Math.sin(t * 3 + i)) * 18;
    const wSize = 3 + Math.sin(t * 5 + i) * 1.5;
    ctx.globalAlpha = 0.3 + Math.sin(t * 6 + i * 2) * 0.15;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(wx, wy, wSize, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Draw Ultra Instinct silver sparkle particles and aura. */
export function drawUltraInstinctGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number
): void {
  ctx.save();

  // Silver-white aura
  const pulse = 1.0 + Math.sin(t * 5) * 0.1;
  const grad = ctx.createRadialGradient(x, y - 6, 8, x, y - 6, 55 * pulse);
  grad.addColorStop(0, "rgba(200,200,220,0.25)");
  grad.addColorStop(0.4, "rgba(180,180,210,0.12)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, y - 6, 48 * pulse, 58 * pulse, 0, 0, Math.PI * 2);
  ctx.fill();

  // Silver sparkle particles
  for (let i = 0; i < 12; i++) {
    const seed = i * 137.508; // golden angle for distribution
    const lifetime = ((t * 1.5 + seed) % 3) / 3; // 0→1 cycle
    const angle = seed + t * 0.8;
    const dist = 15 + lifetime * 40;
    const sx = x + Math.cos(angle) * dist * 0.7;
    const sy = y - 10 + Math.sin(angle) * dist * 0.4 - lifetime * 30;
    const alpha = (1 - lifetime) * 0.7;
    const size = (1 - lifetime) * 2.5 + 0.5;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#e8e8f0";
    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fill();

    // Cross sparkle on some particles
    if (i % 3 === 0) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = alpha * 0.6;
      ctx.beginPath();
      ctx.moveTo(sx - size * 2, sy);
      ctx.lineTo(sx + size * 2, sy);
      ctx.moveTo(sx, sy - size * 2);
      ctx.lineTo(sx, sy + size * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Draw Kaioken red aura — BIG, INTENSE, OBVIOUS flame-like aura with sparks. */
export function drawKaiokenGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number
): void {
  ctx.save();

  // ── Core intense glow — big radial gradient ──
  const pulse = 1.0 + Math.sin(t * 10) * 0.2;
  const outerR = 65 * pulse;
  const grad = ctx.createRadialGradient(x, y - 6, 8, x, y - 6, outerR);
  grad.addColorStop(0, "rgba(255,60,20,0.45)");
  grad.addColorStop(0.3, "rgba(230,40,10,0.25)");
  grad.addColorStop(0.6, "rgba(200,20,5,0.1)");
  grad.addColorStop(1, "rgba(150,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, y - 6, 55 * pulse, 70 * pulse, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Inner bright flame core — flickering upward ──
  for (let layer = 0; layer < 3; layer++) {
    const layerPhase = t * 12 + layer * 1.5;
    const layerAlpha = [0.3, 0.2, 0.1][layer];
    const layerScale = [1.0, 0.75, 0.5][layer];
    ctx.globalAlpha = layerAlpha + Math.sin(layerPhase) * 0.08;

    const flameGrad = ctx.createRadialGradient(x, y - 10 - layer * 4, 4, x, y - 4, 40 * layerScale);
    flameGrad.addColorStop(0, "rgba(255,140,30,0.6)");
    flameGrad.addColorStop(0.5, `rgba(255,${40 + layer * 20},0,0.2)`);
    flameGrad.addColorStop(1, "rgba(200,0,0,0)");
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    // Flame shape: taller on top, wider at base
    const fw = 35 * layerScale + Math.sin(layerPhase) * 4;
    const fh = 50 * layerScale + Math.cos(layerPhase * 1.3) * 6;
    ctx.ellipse(x, y - 8 - layer * 2, fw, fh, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Jagged flame wisps rising upward — 10 tongues of fire ──
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 + t * 4;
    const flicker = Math.sin(t * 8 + i * 1.7) * 0.5 + 0.5;
    const dist = 22 + flicker * 14;
    const wx = x + Math.cos(angle) * dist * 0.45;
    const wy = y - 12 - Math.abs(Math.sin(t * 5 + i * 1.1)) * 35 - flicker * 12;
    const wSize = (2.5 + flicker * 3) * (0.7 + Math.sin(t * 9 + i * 2) * 0.3);

    ctx.globalAlpha = 0.4 + flicker * 0.35;
    // Red-orange flame color with yellow core
    const wColor = i % 2 === 0 ? "#ff4411" : "#ff8822";
    ctx.fillStyle = wColor;
    ctx.beginPath();
    ctx.arc(wx, wy, wSize, 0, Math.PI * 2);
    ctx.fill();

    // Yellow core highlight on alternate wisps
    if (i % 3 === 0) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#ffcc44";
      ctx.beginPath();
      ctx.arc(wx, wy - 1, wSize * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Upward-shooting spark particles — embers rising ──
  for (let i = 0; i < 14; i++) {
    const seed = i * 97.3 + t * 3;
    const lifetime = ((seed % 2.5) / 2.5); // 0→1 cycle
    const spawnAngle = (i / 14) * Math.PI * 2 + t * 2;
    const sx = x + Math.cos(spawnAngle) * (8 + lifetime * 30);
    const sy = y + Math.sin(spawnAngle) * (5 + lifetime * 15) - lifetime * 55;
    const alpha = (1 - lifetime) * 0.7;
    const size = (1 - lifetime * 0.7) * 2.8;

    if (alpha > 0.05 && size > 0.3) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = lifetime < 0.3 ? "#ffffff" : lifetime < 0.6 ? "#ffdd44" : "#ff5522";
      ctx.beginPath();
      ctx.arc(~~sx, ~~sy, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Flickering outline ring — makes the aura shape pop ──
  ctx.globalAlpha = 0.15 + Math.sin(t * 14) * 0.1;
  ctx.strokeStyle = "#ff6633";
  ctx.lineWidth = 2;
  const outlineR = 58 * pulse + Math.sin(t * 9) * 4;
  ctx.beginPath();
  ctx.ellipse(x, y - 4, outlineR, outlineR * 1.15, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/** Draw shrink power-up visual indicator (pulsing ring). */
export function drawShrinkIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number
): void {
  ctx.save();
  const pulse = 0.8 + Math.sin(t * 6) * 0.2;
  ctx.globalAlpha = 0.4 + Math.sin(t * 4) * 0.15;
  ctx.strokeStyle = "#a855f7";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 28 * pulse, 0, Math.PI * 2);
  ctx.stroke();

  // Inner contracting ring
  const inner = 0.5 + Math.sin(t * 8) * 0.3;
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.arc(x, y, 18 * inner, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

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

/** Draw Kaioken red aura effect. */
export function drawKaiokenGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number
): void {
  ctx.save();
  const pulse = 1.0 + Math.sin(t * 8) * 0.12;
  const grad = ctx.createRadialGradient(x, y - 4, 6, x, y - 4, 50 * pulse);
  grad.addColorStop(0, "rgba(230,50,50,0.3)");
  grad.addColorStop(0.5, "rgba(200,30,30,0.12)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, y - 4, 42 * pulse, 52 * pulse, 0, 0, Math.PI * 2);
  ctx.fill();

  // Red energy wisps
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + t * 3;
    const dist = 18 + Math.sin(t * 5 + i * 1.7) * 6;
    const wx = x + Math.cos(angle) * dist * 0.5;
    const wy = y - 8 - Math.abs(Math.sin(t * 4 + i)) * 22;
    ctx.globalAlpha = 0.35 + Math.sin(t * 7 + i) * 0.15;
    ctx.fillStyle = "#e63946";
    ctx.beginPath();
    ctx.arc(wx, wy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
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

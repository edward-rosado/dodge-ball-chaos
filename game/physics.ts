import { Point, Ball, Pipe } from "./types";
import {
  ARENA_LEFT,
  ARENA_RIGHT,
  ARENA_TOP,
  ARENA_BOTTOM,
  ARENA_CORNER_R,
  PLAYER_HITBOX,
  PIPE_RADIUS,
  BOUNCE_SPEED_BOOST,
} from "./constants";
import { randomPipe } from "./arena";

export const dist = (a: Point, b: Point): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

export const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));

// ─── Rounded-rectangle helpers ───

const L = ARENA_LEFT;
const R = ARENA_RIGHT;
const T = ARENA_TOP;
const B = ARENA_BOTTOM;
const CR = ARENA_CORNER_R;

/** The 4 corner circle centers for the rounded rectangle. */
const corners = [
  { cx: L + CR, cy: T + CR }, // top-left
  { cx: R - CR, cy: T + CR }, // top-right
  { cx: L + CR, cy: B - CR }, // bottom-left
  { cx: R - CR, cy: B - CR }, // bottom-right
];

/**
 * Check if a point is inside the rounded rectangle.
 * Returns { inside, nx, ny, pushX, pushY } where n is the outward normal
 * and push is the nearest point on the boundary (used for push-back).
 */
function roundedRectCheck(
  x: number,
  y: number,
  inset: number = 0
): { inside: boolean; nx: number; ny: number; pushX: number; pushY: number } {
  const il = L + inset;
  const ir = R - inset;
  const it = T + inset;
  const ib = B - inset;
  const icr = Math.max(0, CR - inset);

  // First check if clearly inside the rect (not in corner zones)
  const inHBand = x >= il + icr && x <= ir - icr; // horizontal band (no corners)
  const inVBand = y >= it + icr && y <= ib - icr; // vertical band (no corners)

  if (inHBand && y >= it && y <= ib) return { inside: true, nx: 0, ny: 0, pushX: x, pushY: y };
  if (inVBand && x >= il && x <= ir) return { inside: true, nx: 0, ny: 0, pushX: x, pushY: y };

  // Check corners
  for (const c of corners) {
    const dx = x - c.cx;
    const dy = y - c.cy;
    // Only check if we're in this corner's quadrant
    const inCornerX = (c.cx === L + CR) ? x < il + icr : x > ir - icr;
    const inCornerY = (c.cy === T + CR) ? y < it + icr : y > ib - icr;
    if (!inCornerX || !inCornerY) continue;

    const d = Math.hypot(dx, dy);
    if (d <= icr) return { inside: true, nx: 0, ny: 0, pushX: x, pushY: y };

    // Outside corner arc
    const nx = dx / d;
    const ny = dy / d;
    return {
      inside: false,
      nx,
      ny,
      pushX: c.cx + nx * (icr - 1),
      pushY: c.cy + ny * (icr - 1),
    };
  }

  // Outside flat edge
  let nx = 0, ny = 0, pushX = x, pushY = y;
  if (x < il) { nx = -1; pushX = il + 1; }
  else if (x > ir) { nx = 1; pushX = ir - 1; }
  if (y < it) { ny = -1; pushY = it + 1; }
  else if (y > ib) { ny = 1; pushY = ib - 1; }

  return { inside: false, nx, ny, pushX, pushY };
}

/** Clamp a point to stay within the rounded-rectangle arena boundary. */
export function circularClamp(x: number, y: number): { x: number; y: number } {
  const check = roundedRectCheck(x, y, PLAYER_HITBOX);
  if (check.inside) return { x, y };
  return { x: check.pushX, y: check.pushY };
}

/** Bounce a ball off the rounded-rectangle arena wall. Applies +5% speed boost. Returns true if bounced. */
export function bounceOffWall(ball: Ball): boolean {
  const check = roundedRectCheck(ball.x, ball.y);
  if (check.inside) return false;

  let { nx, ny } = check;

  // Normalize the normal (for corner cases where both nx, ny are set)
  const nm = Math.hypot(nx, ny);
  if (nm > 0) {
    nx /= nm;
    ny /= nm;
  }

  // Reflect velocity off the normal
  const dot = ball.vx * nx + ball.vy * ny;
  ball.vx -= 2 * dot * nx;
  ball.vy -= 2 * dot * ny;

  // Speed boost per bounce
  ball.vx *= BOUNCE_SPEED_BOOST;
  ball.vy *= BOUNCE_SPEED_BOOST;

  // Push ball back inside
  ball.x = check.pushX;
  ball.y = check.pushY;

  ball.bounceCount++;
  return true;
}

/**
 * Check if a ball is close enough to a pipe for suck-in.
 * Probability gradient: 95% at dead center → 5% at edge, linear interpolation.
 * On suck-in: teleport to a random different pipe, fire at random angle.
 * Returns the index of the pipe that sucked it in, or -1.
 */
export function checkPipeSuckIn(ball: Ball, pipes: Pipe[]): number {
  for (let i = 0; i < pipes.length; i++) {
    const p = pipes[i];
    const d = dist(ball, p);
    if (d > PIPE_RADIUS) continue;

    // Probability gradient: center=95%, edge=5%
    const t = d / PIPE_RADIUS; // 0 at center, 1 at edge
    const suckProb = 0.95 - t * 0.9; // 0.95 → 0.05
    if (Math.random() > suckProb) continue; // No suck-in, ball bounces normally

    // Suck-in! Teleport to a different pipe
    const destIdx = randomPipe(i);
    const dest = pipes[destIdx];
    const spd = Math.hypot(ball.vx, ball.vy);
    const outAngle = dest.angle + Math.PI + (Math.random() - 0.5) * 1.2; // Fire inward with spread

    ball.x = dest.x;
    ball.y = dest.y;
    ball.vx = Math.cos(outAngle) * spd * BOUNCE_SPEED_BOOST;
    ball.vy = Math.sin(outAngle) * spd * BOUNCE_SPEED_BOOST;
    ball.bounceCount++;

    return destIdx;
  }
  return -1;
}

/** Helper to draw a filled rectangle (pixel art). */
export const px = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  c: string
) => {
  ctx.fillStyle = c;
  ctx.fillRect(~~x, ~~y, ~~w, ~~h);
};

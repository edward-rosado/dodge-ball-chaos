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
import { BallType } from "./balls/types";

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

  // Ricochet: add random angle offset ±45°
  if (ball.type === BallType.Ricochet) {
    const speed = Math.hypot(ball.vx, ball.vy);
    const angle = Math.atan2(ball.vy, ball.vx) + (Math.random() - 0.5) * Math.PI / 2;
    ball.vx = Math.cos(angle) * speed;
    ball.vy = Math.sin(angle) * speed;
  }

  // SpeedDemon: 2x speed on each bounce (instead of standard boost)
  if (ball.type === BallType.SpeedDemon) {
    ball.vx *= 2 / BOUNCE_SPEED_BOOST; // Undo the standard boost, apply 2x
    ball.vy *= 2 / BOUNCE_SPEED_BOOST;
  }

  return true;
}

/**
 * Check if a ball is close enough to a pipe for suck-in.
 * Only sucks in balls that hit near the center of the pipe opening.
 * Probability: 90% within inner 30% of radius, drops sharply to 0% at edge.
 * Balls hitting the pipe sides bounce off instead (handled by bounceOffWall).
 * Returns the index of the ENTRY pipe that sucked it in, or -1.
 * Does NOT modify the ball — caller handles queuing and re-emergence.
 */
export function checkPipeSuckIn(ball: Ball, pipes: Pipe[]): number {
  const CENTER_ZONE = PIPE_RADIUS * 0.3; // Inner 30% = high suck-in chance
  for (let i = 0; i < pipes.length; i++) {
    const p = pipes[i];
    const d = dist(ball, p);
    if (d > PIPE_RADIUS) continue;

    // Only suck in if ball is near the center of the pipe
    if (d <= CENTER_ZONE) {
      // Dead center: 90% chance
      const t = d / CENTER_ZONE; // 0 at center, 1 at edge of center zone
      const suckProb = 0.9 - t * 0.4; // 0.9 → 0.5
      if (Math.random() <= suckProb) return i;
    }
    // Outside center zone: ball bounces off the pipe (no suck-in)
    // bounceOffWall in the caller handles the bounce
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

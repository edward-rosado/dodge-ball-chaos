import { Pipe } from "./types";
import {
  PIPE_COUNT,
  ARENA_LEFT,
  ARENA_RIGHT,
  ARENA_TOP,
  ARENA_BOTTOM,
  ARENA_CORNER_R,
} from "./constants";

/**
 * Distribute pipes evenly along the perimeter of the rounded rectangle.
 * Layout: 10 on top, 6 on right, 10 on bottom, 6 on left = 32 total.
 * Angle points inward (toward arena center).
 */
const SIDES = [
  { count: 10, edge: "top" },
  { count: 6, edge: "right" },
  { count: 10, edge: "bottom" },
  { count: 6, edge: "left" },
] as const;

/** Calculate pipe position along the rounded-rectangle perimeter. */
export function pipePos(i: number): Pipe {
  let idx = i;
  const l = ARENA_LEFT;
  const r = ARENA_RIGHT;
  const t = ARENA_TOP;
  const b = ARENA_BOTTOM;
  const cr = ARENA_CORNER_R;

  for (const side of SIDES) {
    if (idx < side.count) {
      const frac = (idx + 1) / (side.count + 1); // Even spacing, no corners
      switch (side.edge) {
        case "top": {
          const x = l + cr + frac * (r - l - 2 * cr);
          return { x, y: t, angle: Math.PI / 2 }; // Points down (inward)
        }
        case "bottom": {
          const x = l + cr + frac * (r - l - 2 * cr);
          return { x, y: b, angle: -Math.PI / 2 }; // Points up (inward)
        }
        case "right": {
          const y = t + cr + frac * (b - t - 2 * cr);
          return { x: r, y, angle: Math.PI }; // Points left (inward)
        }
        case "left": {
          const y = t + cr + frac * (b - t - 2 * cr);
          return { x: l, y, angle: 0 }; // Points right (inward)
        }
      }
    }
    idx -= side.count;
  }

  // Fallback (should not reach)
  return { x: (l + r) / 2, y: t, angle: Math.PI / 2 };
}

/** Generate all pipe positions. */
export function createPipes(): Pipe[] {
  return Array.from({ length: PIPE_COUNT }, (_, i) => pipePos(i));
}

/** Get a random pipe index, optionally excluding one. */
export function randomPipe(exclude?: number): number {
  let idx: number;
  do {
    idx = Math.floor(Math.random() * PIPE_COUNT);
  } while (idx === exclude);
  return idx;
}

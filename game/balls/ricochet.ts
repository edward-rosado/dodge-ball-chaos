import { Ball } from "../types";

/** Ricochet: bounce angle randomization is handled in physics.ts bounceOffWall. */
export function updateRicochet(_ball: Ball): void {
  // No per-frame behavior. Wild bounce angles applied in bounceOffWall.
}

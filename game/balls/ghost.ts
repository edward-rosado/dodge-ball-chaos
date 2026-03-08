import { Ball } from "../types";

const PHASE_INTERVAL = 120; // 2 seconds at 60fps

/** Ghost: phases in/out every 2 seconds. */
export function updateGhost(ball: Ball): void {
  ball.phaseTimer++;
  if (ball.phaseTimer >= PHASE_INTERVAL) {
    ball.phaseTimer = 0;
    ball.isReal = !ball.isReal;
  }
}

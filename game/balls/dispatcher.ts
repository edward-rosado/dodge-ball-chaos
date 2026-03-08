import { Ball, GameState } from "../types";
import { BallType } from "./types";

/**
 * Update a ball based on its type. Returns new balls to add (Splitter children, Mirage fakes).
 * The caller handles standard movement (position += velocity) before calling this.
 * This function handles type-specific per-frame behavior.
 */
export function updateBallByType(ball: Ball, g: GameState, newBalls: Ball[]): void {
  ball.age++;

  switch (ball.type) {
    case BallType.Dodgeball:
      // No special behavior — standard bounce handled by caller
      break;
    // Other types will be added in subsequent tasks
    default:
      break;
  }
}

/**
 * Render a ball based on its type.
 * Called by the renderer for each ball.
 */
export function renderBallByType(
  ctx: CanvasRenderingContext2D,
  ball: Ball,
  t: number
): void {
  // Will be populated as each type is implemented.
  // For now, all types use the default ball renderer.
}

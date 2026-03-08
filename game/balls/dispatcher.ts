import { Ball, GameState } from "../types";
import { BallType } from "./types";
import { updateTracker } from "./tracker";
import { updateSplitter } from "./splitter";
import { updateGhost } from "./ghost";
import { updateBomber } from "./bomber";
import { updateZigzag } from "./zigzag";
import { updateGiant } from "./giant";
import { updateSpeedDemon } from "./speedDemon";
import { updateGravityWell } from "./gravityWell";
import { updateMirage } from "./mirage";
import { updateRicochet } from "./ricochet";

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
    case BallType.Tracker:
      updateTracker(ball, g);
      break;
    case BallType.Splitter:
      updateSplitter(ball, g, newBalls);
      break;
    case BallType.Ghost:
      updateGhost(ball);
      break;
    case BallType.Bomber:
      updateBomber(ball, g);
      break;
    case BallType.Zigzag:
      updateZigzag(ball);
      break;
    case BallType.Giant:
      updateGiant(ball);
      break;
    case BallType.SpeedDemon:
      updateSpeedDemon(ball);
      break;
    case BallType.GravityWell:
      updateGravityWell(ball, g);
      break;
    case BallType.Mirage:
      updateMirage(ball, g, newBalls);
      break;
    case BallType.Ricochet:
      updateRicochet(ball);
      break;
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

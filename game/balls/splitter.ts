import { Ball, GameState } from "../types";
import { BallType } from "./types";
import { BALL_R } from "../constants";
import { createBall } from "./factory";

/** Splitter: splits into 3 smaller balls on first bounce. */
export function updateSplitter(ball: Ball, g: GameState, newBalls: Ball[]): void {
  // Only split once: on first bounce, for full-size balls that are not children
  if (ball.bounceCount >= 1 && !ball.isChild) {
    const speed = Math.hypot(ball.vx, ball.vy) * 0.5;
    const baseAngle = Math.atan2(ball.vy, ball.vx);

    for (let i = 0; i < 3; i++) {
      const angle = baseAngle + ((i - 1) * Math.PI * 2) / 3;
      const child = createBall(BallType.Splitter, { x: ball.x, y: ball.y, angle }, speed);
      child.isChild = true; // Mark children so they don't split again
      newBalls.push(child);
    }
    ball.dead = true;
  }
}

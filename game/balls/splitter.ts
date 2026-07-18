import { Ball, GameState } from "../types";
import { BallType } from "./types";
import { BALL_R } from "../constants";
import { createBall } from "./factory";

/** Splitter: splits into 3 smaller balls on first bounce. */
export function updateSplitter(ball: Ball, g: GameState, newBalls: Ball[]): void {
  // Only split on first bounce and if full-size
  if (ball.bounceCount >= 1 && ball.radius >= BALL_R) {
    const speed = Math.hypot(ball.vx, ball.vy) * 0.5;
    const baseAngle = Math.atan2(ball.vy, ball.vx);

    for (let i = 0; i < 3; i++) {
      const angle = baseAngle + ((i - 1) * Math.PI * 2) / 3;
      // Use factory to get proper minimum radius enforcement on children
      const fakePipe = { x: ball.x, y: ball.y, angle };
      newBalls.push(createBall(BallType.Splitter, fakePipe, speed));
    }
    ball.dead = true;
  }
}

import { Ball, GameState } from "../types";
import { BallType } from "./types";
import { BALL_R } from "../constants";

/** Splitter: splits into 3 smaller balls on first bounce. */
export function updateSplitter(ball: Ball, g: GameState, newBalls: Ball[]): void {
  // Only split on first bounce and if full-size
  if (ball.bounceCount >= 1 && ball.radius >= BALL_R) {
    const speed = Math.hypot(ball.vx, ball.vy) * 0.5;
    const baseAngle = Math.atan2(ball.vy, ball.vx);
    const childRadius = Math.floor(BALL_R / 2);

    for (let i = 0; i < 3; i++) {
      const angle = baseAngle + ((i - 1) * Math.PI * 2) / 3;
      newBalls.push({
        x: ball.x,
        y: ball.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        bounceCount: 0,
        type: BallType.Splitter,
        age: 0,
        phaseTimer: 0,
        isReal: true,
        radius: childRadius,
        dead: false,
        pipeImmunity: 0,
      });
    }
    ball.dead = true;
  }
}

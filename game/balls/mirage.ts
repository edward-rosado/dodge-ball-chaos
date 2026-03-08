import { Ball, GameState } from "../types";
import { BallType } from "./types";
import { BALL_R } from "../constants";

const FAKE_LIFESPAN = 300; // 5 seconds at 60fps

/** Mirage: spawns 2 fakes on first bounce, fakes expire after 5s. */
export function updateMirage(ball: Ball, g: GameState, newBalls: Ball[]): void {
  // Expire fakes
  if (!ball.isReal && ball.age >= FAKE_LIFESPAN) {
    ball.dead = true;
    return;
  }

  // Spawn fakes on first bounce (only once, tracked by phaseTimer)
  if (ball.isReal && ball.bounceCount >= 1 && ball.phaseTimer === 0) {
    ball.phaseTimer = 1; // Prevent re-spawning

    for (let i = 0; i < 2; i++) {
      const angleOffset = (Math.random() - 0.5) * Math.PI;
      const speed = Math.hypot(ball.vx, ball.vy);
      const baseAngle = Math.atan2(ball.vy, ball.vx);
      const angle = baseAngle + angleOffset;

      newBalls.push({
        x: ball.x,
        y: ball.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        bounceCount: 0,
        type: BallType.Mirage,
        age: 0,
        phaseTimer: 0,
        isReal: false,
        radius: BALL_R,
        dead: false,
      });
    }
  }
}

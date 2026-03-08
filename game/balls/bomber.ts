import { Ball, GameState, ST } from "../types";
import { dist } from "../physics";

const BLAST_RADIUS = 60;

/** Bomber: explodes on 3rd bounce with blast radius. */
export function updateBomber(ball: Ball, g: GameState): void {
  if (ball.bounceCount >= 3) {
    // Blast radius damage check
    if (!g.shield) {
      const d = dist({ x: g.px, y: g.py }, ball);
      if (d < BLAST_RADIUS) {
        g.lives--;
        g.flash = 0.5;
        if (g.lives <= 0) {
          g.state = ST.OVER;
          g.highScore = Math.max(g.highScore, g.score);
        } else {
          g.state = ST.HIT;
          g.msgTimer = 1.2;
          g.msg = "BOOM!";
        }
      }
    }
    ball.dead = true;
  }
}

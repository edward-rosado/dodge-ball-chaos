import { Ball, GameState, ST } from "../types";
import { dist } from "../physics";

const BLAST_RADIUS = 60;

/** Bomber: explodes on 3rd bounce with blast radius. */
export function updateBomber(ball: Ball, g: GameState): void {
  if (ball.bounceCount >= 3) {
    // Blast radius damage check
    if (!g.effects.shield) {
      const d = dist({ x: g.player.px, y: g.player.py }, ball);
      if (d < BLAST_RADIUS) {
        g.lives--;
        g.meta.flash = 0.5;
        if (g.lives <= 0) {
          g.state = ST.OVER;
          g.meta.highScore = Math.max(g.meta.highScore, g.score);
        } else {
          g.state = ST.HIT;
          g.meta.msgTimer = 1.2;
          g.meta.msg = "BOOM!";
        }
      }
    }
    ball.dead = true;
  }
}
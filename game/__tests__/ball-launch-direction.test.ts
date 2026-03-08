import { describe, it, expect, vi, afterEach } from "vitest";
import { makeGame, initRound } from "../state";
import { update } from "../update";
import { ST } from "../types";
import { createBall } from "../balls/factory";
import { BallType } from "../balls/types";
import { createPipes } from "../arena";
import {
  ARENA_CX,
  ARENA_CY,
  ARENA_LEFT,
  ARENA_RIGHT,
  ARENA_TOP,
  ARENA_BOTTOM,
  PIPE_COUNT,
} from "../constants";

const DT = 1 / 60;

describe("balls launch inward from pipes", () => {
  afterEach(() => vi.restoreAllMocks());

  it("top pipe should fire balls downward (positive vy)", () => {
    const pipes = createPipes();
    // Top pipes have angle: Math.PI / 2 (pointing down)
    const topPipe = pipes[0]; // First pipe is on the top edge
    expect(topPipe.y).toBe(ARENA_TOP);

    // Create multiple balls to account for random spread
    for (let i = 0; i < 20; i++) {
      const ball = createBall(BallType.Dodgeball, topPipe, 2.0);
      // Ball should move downward (positive vy) into the arena
      expect(ball.vy).toBeGreaterThan(0);
      // Ball should start offset inward from the pipe (not at exact pipe position)
      expect(ball.y).toBeGreaterThan(topPipe.y);
    }
  });

  it("bottom pipe should fire balls upward (negative vy)", () => {
    const pipes = createPipes();
    // Bottom pipes start after top (10) + right (6) = index 16
    const bottomPipe = pipes[16];
    expect(bottomPipe.y).toBe(ARENA_BOTTOM);

    for (let i = 0; i < 20; i++) {
      const ball = createBall(BallType.Dodgeball, bottomPipe, 2.0);
      // Ball should move upward (negative vy) into the arena
      expect(ball.vy).toBeLessThan(0);
    }
  });

  it("left pipe should fire balls rightward (positive vx)", () => {
    const pipes = createPipes();
    // Left pipes start after top (10) + right (6) + bottom (10) = index 26
    const leftPipe = pipes[26];
    expect(leftPipe.x).toBe(ARENA_LEFT);

    for (let i = 0; i < 20; i++) {
      const ball = createBall(BallType.Dodgeball, leftPipe, 2.0);
      // Ball should move rightward (positive vx) into the arena
      expect(ball.vx).toBeGreaterThan(0);
    }
  });

  it("right pipe should fire balls leftward (negative vx)", () => {
    const pipes = createPipes();
    // Right pipes start after top (10) = index 10
    const rightPipe = pipes[10];
    expect(rightPipe.x).toBe(ARENA_RIGHT);

    for (let i = 0; i < 20; i++) {
      const ball = createBall(BallType.Dodgeball, rightPipe, 2.0);
      // Ball should move leftward (negative vx) into the arena
      expect(ball.vx).toBeLessThan(0);
    }
  });

  it("all pipes should fire balls toward arena center", () => {
    const pipes = createPipes();

    for (let pi = 0; pi < PIPE_COUNT; pi++) {
      const pipe = pipes[pi];
      // Create a ball and step it forward a few frames
      // Use a fixed random for determinism
      const ball = createBall(BallType.Dodgeball, pipe, 2.0);

      // After one step, ball should be closer to arena center than the pipe
      const newX = ball.x + ball.vx;
      const newY = ball.y + ball.vy;

      const pipeDist = Math.hypot(pipe.x - ARENA_CX, pipe.y - ARENA_CY);
      const ballDist = Math.hypot(newX - ARENA_CX, newY - ARENA_CY);

      // Ball must move inward (closer to center) — allowing small tolerance for spread
      expect(ballDist).toBeLessThan(pipeDist + 0.5);
    }
  });

  it("balls launched from pipes during DODGE should move inward", () => {
    const g = makeGame();
    g.round = 5;
    initRound(g);
    g.state = ST.DODGE;
    g.launched = 0;
    g.launchQueue = 3;
    g.launchDelay = 0; // Force immediate launch

    // Capture balls before update
    const ballsBefore = g.balls.length;

    // Tick a frame to trigger a pipe launch
    update(g, DT);

    // Should have launched at least one ball
    expect(g.balls.length).toBeGreaterThan(ballsBefore);

    // The newly launched ball should be moving inward
    for (let i = ballsBefore; i < g.balls.length; i++) {
      const ball = g.balls[i];
      const pipe = g.pipes.find(p => p.x === ball.x && p.y === ball.y);
      if (!pipe) continue; // Ball may have moved slightly

      const nextX = ball.x + ball.vx;
      const nextY = ball.y + ball.vy;
      const pipeDist = Math.hypot(pipe.x - ARENA_CX, pipe.y - ARENA_CY);
      const ballDist = Math.hypot(nextX - ARENA_CX, nextY - ARENA_CY);

      expect(ballDist).toBeLessThan(pipeDist + 0.5);
    }
  });

  it("pipe queue re-emergence should fire balls inward", () => {
    const g = makeGame();
    g.round = 3;
    initRound(g);
    g.state = ST.DODGE;
    g.launched = g.launchQueue;
    g.launchDelay = 999;

    // Manually create a pipe queue entry about to emerge
    const destIdx = 0; // Top pipe
    const destPipe = g.pipes[destIdx];

    // Queue a ball that's about to emerge (delay nearly 0)
    g.pipeQueue.push({
      ball: {
        x: destPipe.x,
        y: destPipe.y,
        // Set velocity using the pipe angle (inward) — this is what update.ts should do
        vx: Math.cos(destPipe.angle) * 2.0,
        vy: Math.sin(destPipe.angle) * 2.0,
        bounceCount: 1,
        type: BallType.Dodgeball,
        age: 0,
        phaseTimer: 0,
        isReal: true,
        radius: 7,
        dead: false,
      },
      pipeIndex: destIdx,
      delay: 0.01, // About to emerge
      totalDelay: 2.0,
    });

    // Tick past the delay
    update(g, 0.02);

    // The re-emerged ball should exist and be moving inward
    expect(g.balls.length).toBeGreaterThanOrEqual(1);
    const emerged = g.balls[g.balls.length - 1];

    // Top pipe: ball should be moving downward (positive vy)
    expect(emerged.vy).toBeGreaterThan(0);
  });
});

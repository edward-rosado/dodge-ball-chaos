import { describe, it, expect, vi, afterEach } from "vitest";
import { makeGame, initRound, restoreAfterHit } from "../state";
import { update } from "../update";
import { ST, Ball } from "../types";
import { BallType } from "../balls/types";
import { PIPE_COUNT, BALL_R } from "../constants";
import { randomPipe } from "../arena";

afterEach(() => vi.restoreAllMocks());

function makeBall(overrides: Partial<Ball> = {}): Ball {
  return {
    x: 200, y: 200, vx: 3, vy: 0, bounceCount: 0,
    type: BallType.Dodgeball, age: 0, phaseTimer: 0,
    isReal: true, radius: BALL_R, dead: false,
    ...overrides,
  };
}

/** Set up a DODGE-state game with no pipe launches (launchQueue exhausted). */
function setupDodgeGame() {
  const g = makeGame();
  g.round = 3;
  initRound(g);
  g.state = ST.DODGE;
  g.launched = g.launchQueue; // Prevent new pipe launches
  g.launchDelay = 999; // Extra safety
  return g;
}

describe("pipe queue delay", () => {
  it("should queue ball on suck-in instead of instant teleport", () => {
    const g = setupDodgeGame();
    const pipe0 = g.pipes[0];
    g.balls = [makeBall({ x: pipe0.x, y: pipe0.y, vx: 3, vy: 0 })];

    // Control random: suck-in probability (0 triggers), dest pipe, delay
    let callIdx = 0;
    vi.spyOn(Math, "random").mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return 0;    // suck-in probability
      if (callIdx === 2) return 0.5;   // destination pipe
      if (callIdx === 3) return 0.5;   // delay component
      return 0.5;
    });

    update(g, 1 / 60);

    const liveBalls = g.balls.filter(b => !b.dead);
    expect(liveBalls).toHaveLength(0);
    expect(g.pipeQueue.length).toBe(1);
    expect(g.pipeQueue[0].delay).toBeGreaterThan(0);
    expect(g.pipeQueue[0].delay).toBeLessThanOrEqual(3);
  });

  it("should re-emerge ball after delay expires", () => {
    const g = setupDodgeGame();
    const destPipe = g.pipes[5];
    // Ball is in the CENTER of the arena so it won't get sucked in again
    g.pipeQueue = [{
      ball: makeBall({ x: 200, y: 350, vx: 2, vy: 1 }),
      pipeIndex: 5,
      delay: 0.01,
      totalDelay: 2,
    }];
    g.chargingPipes = [5];
    g.balls = [];

    update(g, 1 / 60);

    expect(g.pipeQueue).toHaveLength(0);
    expect(g.chargingPipes).not.toContain(5);
    expect(g.balls.length).toBeGreaterThanOrEqual(1);
  });

  it("should NOT re-emerge ball before delay expires", () => {
    const g = setupDodgeGame();
    g.pipeQueue = [{
      ball: makeBall({ x: 200, y: 350, vx: 2, vy: 1 }),
      pipeIndex: 5,
      delay: 2.0,
      totalDelay: 2,
    }];
    g.chargingPipes = [5];
    g.balls = [];

    update(g, 1 / 60);

    expect(g.pipeQueue).toHaveLength(1);
    expect(g.pipeQueue[0].delay).toBeCloseTo(2.0 - 1 / 60, 3);
    expect(g.chargingPipes).toContain(5);
    expect(g.balls).toHaveLength(0);
  });

  it("should mark destination pipe as charging while ball is queued", () => {
    const g = setupDodgeGame();
    const pipe0 = g.pipes[0];
    g.balls = [makeBall({ x: pipe0.x, y: pipe0.y, vx: 3, vy: 0 })];

    let callIdx = 0;
    vi.spyOn(Math, "random").mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return 0;
      if (callIdx === 2) return 0.5;
      if (callIdx === 3) return 0.5;
      return 0.5;
    });

    update(g, 1 / 60);

    if (g.pipeQueue.length > 0) {
      const destIdx = g.pipeQueue[0].pipeIndex;
      expect(g.chargingPipes).toContain(destIdx);
    }
  });

  it("should clear pipe queue on initRound", () => {
    const g = makeGame();
    initRound(g);
    g.pipeQueue = [{ ball: makeBall(), pipeIndex: 3, delay: 2, totalDelay: 2 }];
    g.chargingPipes = [3];
    initRound(g);
    expect(g.pipeQueue).toHaveLength(0);
    expect(g.chargingPipes).toHaveLength(0);
  });

  it("should clear pipe queue on restoreAfterHit", () => {
    const g = makeGame();
    initRound(g);
    g.pipeQueue = [{ ball: makeBall(), pipeIndex: 3, delay: 2, totalDelay: 2 }];
    g.chargingPipes = [3];
    restoreAfterHit(g);
    expect(g.pipeQueue).toHaveLength(0);
    expect(g.chargingPipes).toHaveLength(0);
  });

  it("should set activePipe to destination when ball emerges", () => {
    const g = setupDodgeGame();
    g.pipeQueue = [{
      ball: makeBall({ x: 200, y: 350, vx: 2, vy: 1 }),
      pipeIndex: 12,
      delay: 0.001,
      totalDelay: 2,
    }];
    g.chargingPipes = [12];
    g.balls = [];

    update(g, 1 / 60);
    expect(g.activePipe).toBe(12);
  });

  it("should process multiple queued balls independently", () => {
    const g = setupDodgeGame();
    g.pipeQueue = [
      { ball: makeBall({ x: 200, y: 300, vx: 1, vy: 0 }), pipeIndex: 3, delay: 0.001, totalDelay: 1 },
      { ball: makeBall({ x: 200, y: 400, vx: -1, vy: 0 }), pipeIndex: 7, delay: 2.0, totalDelay: 2 },
    ];
    g.chargingPipes = [3, 7];
    g.balls = [];

    update(g, 1 / 60);

    // First ball should emerge, second should stay queued
    expect(g.pipeQueue).toHaveLength(1);
    expect(g.pipeQueue[0].pipeIndex).toBe(7);
    expect(g.balls.length).toBeGreaterThanOrEqual(1);
    expect(g.chargingPipes).toContain(7);
    expect(g.chargingPipes).not.toContain(3);
  });
});

describe("randomPipe — all 32 pipes selectable", () => {
  it("should be able to select all 32 pipe indices over many calls", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 5000; i++) {
      seen.add(randomPipe());
    }
    expect(seen.size).toBe(PIPE_COUNT);
  });

  it("should never return the excluded pipe index", () => {
    for (let exclude = 0; exclude < PIPE_COUNT; exclude++) {
      for (let i = 0; i < 20; i++) {
        expect(randomPipe(exclude)).not.toBe(exclude);
      }
    }
  });

  it("should be able to select all non-excluded pipes", () => {
    const exclude = 15;
    const seen = new Set<number>();
    for (let i = 0; i < 5000; i++) {
      seen.add(randomPipe(exclude));
    }
    expect(seen.size).toBe(PIPE_COUNT - 1);
    expect(seen.has(exclude)).toBe(false);
  });
});

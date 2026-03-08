import { describe, it, expect } from "vitest";
import { makeGame, initRound, restoreAfterHit } from "../state";
import { ST, PowerUp } from "../types";
import { BallType } from "../balls/types";
import { PowerUpType } from "../powerups/types";
import { BASE_ROUND_TIME } from "../constants";

describe("initRound", () => {
  it("should set launchQueue to 0 for round 1 (only dodgeball, no pipe balls)", () => {
    const g = makeGame();
    g.round = 1;
    initRound(g);
    expect(g.launchQueue).toBe(0);
  });

  it("should set launchQueue to 1 for round 2 (dodgeball + 1 pipe ball)", () => {
    const g = makeGame();
    g.round = 2;
    initRound(g);
    expect(g.launchQueue).toBe(1);
  });

  it("should cap launchQueue by difficulty band maxBalls", () => {
    const g = makeGame();
    g.round = 10;
    initRound(g);
    // L1-10 band has maxBalls=2, so min(2, 10-1) = 2
    expect(g.launchQueue).toBe(2);
  });

  it("should reset balls array to empty on initRound", () => {
    const g = makeGame();
    g.balls = [{ x: 0, y: 0, vx: 1, vy: 1, bounceCount: 0, type: BallType.Dodgeball, age: 0, phaseTimer: 0, isReal: true, radius: 7, dead: false }];
    initRound(g);
    expect(g.balls).toHaveLength(0);
  });

  it("should set state to READY", () => {
    const g = makeGame();
    initRound(g);
    expect(g.state).toBe(ST.READY);
  });
});

describe("makeGame", () => {
  it("should start with 3 lives", () => {
    const g = makeGame();
    expect(g.lives).toBe(3);
  });

  it("should start on TITLE state", () => {
    const g = makeGame();
    expect(g.state).toBe(ST.TITLE);
  });

  it("should create 32 pipes", () => {
    const g = makeGame();
    expect(g.pipes).toHaveLength(32);
  });
});

describe("restoreAfterHit", () => {
  it("should NOT reset timer (timer persists across deaths)", () => {
    const g = makeGame();
    g.round = 3;
    initRound(g);
    const fullTimer = g.timer;
    // Simulate some time passing
    g.timer = fullTimer - 5;
    const timerBeforeHit = g.timer;
    restoreAfterHit(g);
    expect(g.timer).toBe(timerBeforeHit);
  });

  it("should reset timer on initRound (new round)", () => {
    const g = makeGame();
    g.round = 3;
    initRound(g);
    const fullTimer = g.timer;
    g.timer = fullTimer - 5;
    // New round — timer should reset to full
    initRound(g);
    expect(g.timer).toBeCloseTo(fullTimer, 1);
  });

  it("should preserve power-ups on screen after HIT", () => {
    const g = makeGame();
    initRound(g);
    const pu: PowerUp = { x: 100, y: 200, type: PowerUpType.TimeSkip, collected: false };
    g.powerUps = [pu];
    restoreAfterHit(g);
    expect(g.powerUps).toHaveLength(1);
    expect(g.powerUps[0].type).toBe(PowerUpType.TimeSkip);
  });

  it("should clear power-ups on initRound (new round)", () => {
    const g = makeGame();
    initRound(g);
    const pu: PowerUp = { x: 100, y: 200, type: PowerUpType.TimeSkip, collected: false };
    g.powerUps = [pu];
    initRound(g);
    expect(g.powerUps).toHaveLength(0);
  });

  it("should reset player position to center", () => {
    const g = makeGame();
    initRound(g);
    g.px = 50;
    g.py = 50;
    restoreAfterHit(g);
    expect(g.px).toBe(200); // ARENA_CX
  });

  it("should set state to READY", () => {
    const g = makeGame();
    g.state = ST.HIT;
    restoreAfterHit(g);
    expect(g.state).toBe(ST.READY);
  });

  it("should clear balls and thrown arrays", () => {
    const g = makeGame();
    initRound(g);
    g.balls = [{ x: 0, y: 0, vx: 1, vy: 1, bounceCount: 0, type: BallType.Dodgeball, age: 0, phaseTimer: 0, isReal: true, radius: 7, dead: false }];
    restoreAfterHit(g);
    expect(g.balls).toHaveLength(0);
    expect(g.thrown).toHaveLength(0);
  });

  it("should reset timed power-up effects", () => {
    const g = makeGame();
    initRound(g);
    g.kaioken = true;
    g.kaiokenTimer = 3;
    g.slow = true;
    g.slowTimer = 2;
    g.shrink = true;
    g.shrinkTimer = 4;
    restoreAfterHit(g);
    expect(g.kaioken).toBe(false);
    expect(g.slow).toBe(false);
    expect(g.shrink).toBe(false);
  });
});

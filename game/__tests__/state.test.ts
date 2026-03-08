import { describe, it, expect } from "vitest";
import { makeGame, initRound } from "../state";
import { ST } from "../types";
import { BallType } from "../balls/types";

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
    // L1-10 band has maxBalls=3, so min(3, 10-1) = 3
    expect(g.launchQueue).toBe(3);
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

  it("should create 16 pipes", () => {
    const g = makeGame();
    expect(g.pipes).toHaveLength(16);
  });
});

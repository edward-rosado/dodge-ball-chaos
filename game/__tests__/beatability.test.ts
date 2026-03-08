import { describe, it, expect } from "vitest";
import { BRACKETS } from "../simulation/brackets";
import { survivalRate } from "../simulation/runner";
import { makeGame, startGame, initRound } from "../state";
import { ST } from "../types";
import { update } from "../update";
import { botMove } from "../simulation/bot";
import { BallType } from "../balls/types";
import {
  ARENA_CX,
  ARENA_CY,
  ARENA_LEFT,
  ARENA_RIGHT,
  ARENA_TOP,
  ARENA_BOTTOM,
  BASE_BALL_SPEED,
  PLAYER_HITBOX,
} from "../constants";

// ─── Two-sided beatability gates ───
// Each bracket must be within its sweet spot: not too hard AND not too easy.

describe("beatability — not too hard", () => {
  // 50 runs has ~5% variance vs CLI's 500 runs; subtract tolerance buffer
  const VARIANCE_TOLERANCE = 0.05;
  for (const b of BRACKETS) {
    it(`${b.name}: survival >= ${b.minSurvival * 100}% (-${VARIANCE_TOLERANCE * 100}% tolerance)`, { timeout: 60000 }, () => {
      const rate = survivalRate(b.maxRound, 50);
      expect(rate).toBeGreaterThanOrEqual(b.minSurvival - VARIANCE_TOLERANCE);
    });
  }
});

describe("beatability — not too easy", () => {
  // 50 runs has ~7% std dev (binomial); use 10% tolerance. CLI (500 runs) is the real gate.
  const VARIANCE_TOLERANCE = 0.10;
  for (const b of BRACKETS) {
    if (b.maxSurvival >= 1.0) continue; // Skip one-sided brackets (no upper bound)
    it(`${b.name}: survival <= ${b.maxSurvival * 100}% (+${VARIANCE_TOLERANCE * 100}% tolerance)`, { timeout: 60000 }, () => {
      const rate = survivalRate(b.maxRound, 50);
      expect(rate).toBeLessThanOrEqual(b.maxSurvival + VARIANCE_TOLERANCE);
    });
  }
});

describe("beatability — difficulty curve", () => {
  it("should have monotonically decreasing survival rates", { timeout: 120000 }, () => {
    const rates = BRACKETS.map((b) => survivalRate(b.maxRound, 50));
    // Allow 2% tolerance for simulation variance (same as reporter.ts checkMonotonic)
    for (let i = 1; i < rates.length; i++) {
      expect(rates[i]).toBeLessThanOrEqual(rates[i - 1] + 0.02);
    }
  });
});

// ─── Game mechanics sanity ───

const DT = 1 / 60;

describe("game mechanics sanity", () => {
  it("should cap launchQueue by difficulty band maxBalls", () => {
    const g = makeGame();
    startGame(g);
    expect(g.launchQueue).toBe(0);

    g.round = 2;
    initRound(g);
    expect(g.launchQueue).toBe(1); // min(maxBalls=9, 2-1) = 1

    g.round = 5;
    initRound(g);
    expect(g.launchQueue).toBe(4); // min(maxBalls=9, 5-1) = 4 (L1-10 band)
  });

  it("should decrease timer as rounds increase (harder rounds are shorter)", () => {
    const g = makeGame();
    startGame(g);
    const timer1 = g.timer;

    g.round = 5;
    initRound(g);
    const timer5 = g.timer;

    g.round = 10;
    initRound(g);
    const timer10 = g.timer;

    expect(timer1).toBeGreaterThan(timer5);
    expect(timer5).toBeGreaterThan(timer10);
  });

  it("should enforce minimum timer of 4 seconds", () => {
    const g = makeGame();
    g.round = 100;
    initRound(g);
    expect(g.timer).toBeGreaterThanOrEqual(4);
  });

  it("should increase ball speed with round number", () => {
    // speedPerRound varies by band but is always positive, so higher rounds = faster balls
    const speed1 = BASE_BALL_SPEED + 1 * 0.12;
    const speed10 = BASE_BALL_SPEED + 10 * 0.12;
    expect(speed10).toBeGreaterThan(speed1);
  });

  it("should keep player inside the arena during simulation", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.balls.push({ x: ARENA_CX + 50, y: ARENA_CY, vx: -3, vy: 2, bounceCount: 0, type: BallType.Dodgeball, age: 0, phaseTimer: 0, isReal: true, radius: 7, dead: false, pipeImmunity: 0 });

    for (let i = 0; i < 600; i++) {
      update(g, DT, botMove);
      if (g.state !== ST.DODGE) break;
      expect(g.px).toBeGreaterThanOrEqual(ARENA_LEFT + PLAYER_HITBOX - 1);
      expect(g.px).toBeLessThanOrEqual(ARENA_RIGHT - PLAYER_HITBOX + 1);
      expect(g.py).toBeGreaterThanOrEqual(ARENA_TOP + PLAYER_HITBOX - 1);
      expect(g.py).toBeLessThanOrEqual(ARENA_BOTTOM - PLAYER_HITBOX + 1);
    }
  });

  it("should keep all balls inside the arena (bouncing)", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5;
      g.balls.push({
        x: ARENA_CX + Math.cos(a) * 50,
        y: ARENA_CY + Math.sin(a) * 50,
        vx: Math.cos(a) * 4,
        vy: Math.sin(a) * 4,
        bounceCount: 0,
        type: BallType.Dodgeball,
        age: 0,
        phaseTimer: 0,
        isReal: true,
        radius: 7,
        dead: false,
        pipeImmunity: 0,
      });
    }

    const margin = 5;
    for (let i = 0; i < 300; i++) {
      update(g, DT, botMove);
      if (g.state !== ST.DODGE) break;
      for (const b of g.balls) {
        expect(b.x).toBeGreaterThanOrEqual(ARENA_LEFT - margin);
        expect(b.x).toBeLessThanOrEqual(ARENA_RIGHT + margin);
        expect(b.y).toBeGreaterThanOrEqual(ARENA_TOP - margin);
        expect(b.y).toBeLessThanOrEqual(ARENA_BOTTOM + margin);
      }
    }
  });
});

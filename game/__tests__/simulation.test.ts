import { describe, it, expect } from "vitest";
import { botMove } from "../simulation/bot";
import { BRACKETS } from "../simulation/brackets";
import { simulateGame, survivalRate, runAllBrackets } from "../simulation/runner";
import { formatTable, checkMonotonic, checkAll } from "../simulation/reporter";
import { makeGame, startGame } from "../state";
import { ST } from "../types";
import { ARENA_CX, ARENA_CY, PLAYER_SPEED } from "../constants";

describe("brackets", () => {
  it("should have 6 brackets", () => {
    expect(BRACKETS).toHaveLength(6);
  });

  it("should have minSurvival < maxSurvival for every bracket", () => {
    for (const b of BRACKETS) {
      expect(b.minSurvival).toBeLessThan(b.maxSurvival);
    }
  });

  it("should have decreasing targets as rounds increase", () => {
    for (let i = 1; i < BRACKETS.length; i++) {
      expect(BRACKETS[i].minSurvival).toBeLessThanOrEqual(BRACKETS[i - 1].minSurvival);
    }
  });
});

describe("botMove", () => {
  it("should set player velocity when balls are present", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.balls.push({ x: ARENA_CX + 50, y: ARENA_CY, vx: -3, vy: 0, bounceCount: 0 });
    botMove(g);
    const speed = Math.hypot(g.pvx, g.pvy);
    expect(speed).toBeCloseTo(PLAYER_SPEED, 0);
  });

  it("should drift toward center when no balls", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.px = ARENA_CX + 100;
    g.py = ARENA_CY;
    botMove(g);
    expect(g.pvx).toBeLessThan(0); // Moving left toward center
  });
});

describe("simulateGame", () => {
  it("should return roundReached >= 1", () => {
    const result = simulateGame(5);
    expect(result.roundReached).toBeGreaterThanOrEqual(1);
  });

  it("should return survived=true when bot survives all rounds", () => {
    // Run many tries — at least one should survive round 1
    let anySurvived = false;
    for (let i = 0; i < 20; i++) {
      const result = simulateGame(1);
      if (result.survived) { anySurvived = true; break; }
    }
    expect(anySurvived).toBe(true);
  });
});

describe("survivalRate", () => {
  it("should return a number between 0 and 1", () => {
    const rate = survivalRate(1, 10);
    expect(rate).toBeGreaterThanOrEqual(0);
    expect(rate).toBeLessThanOrEqual(1);
  });
});

describe("reporter", () => {
  it("should format a table with all brackets", () => {
    const results = BRACKETS.map((bracket) => ({
      bracket,
      rate: 0.5,
      tooHard: false,
      tooEasy: false,
      passed: true,
    }));
    const table = formatTable(results);
    expect(table).toContain("L1-10");
    expect(table).toContain("L50");
    expect(table).toContain("PASS");
  });

  it("should show FAIL too hard when rate is below min", () => {
    const results = [{
      bracket: BRACKETS[0],
      rate: 0.3,
      tooHard: true,
      tooEasy: false,
      passed: false,
    }];
    const table = formatTable(results);
    expect(table).toContain("FAIL too hard");
  });

  it("should show FAIL too easy when rate is above max", () => {
    const results = [{
      bracket: BRACKETS[0],
      rate: 0.9,
      tooHard: false,
      tooEasy: true,
      passed: false,
    }];
    const table = formatTable(results);
    expect(table).toContain("FAIL too easy");
  });

  it("checkMonotonic should return true for decreasing rates", () => {
    const results = BRACKETS.map((bracket, i) => ({
      bracket,
      rate: 0.7 - i * 0.1,
      tooHard: false,
      tooEasy: false,
      passed: true,
    }));
    expect(checkMonotonic(results)).toBe(true);
  });

  it("checkMonotonic should return false for non-decreasing rates", () => {
    const results = BRACKETS.map((bracket) => ({
      bracket,
      rate: 0.5,
      tooHard: false,
      tooEasy: false,
      passed: true,
    }));
    results[2].rate = 0.8;
    expect(checkMonotonic(results)).toBe(false);
  });

  it("checkAll should report failures", () => {
    const results = BRACKETS.map((bracket) => ({
      bracket,
      rate: 0.1,
      tooHard: true,
      tooEasy: false,
      passed: false,
    }));
    const summary = checkAll(results);
    expect(summary.passed).toBe(false);
    expect(summary.failedBrackets.length).toBe(6);
  });
});

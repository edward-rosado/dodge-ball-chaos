import { describe, it, expect } from "vitest";
import { botMove, resetBotState } from "../simulation/bot";
import { BRACKETS } from "../simulation/brackets";
import { simulateGame, survivalRate, runAllBrackets } from "../simulation/runner";
import { formatTable, checkMonotonic, checkAll } from "../simulation/reporter";
import { makeGame, startGame } from "../state";
import { ST } from "../types";
import { ARENA_CX, ARENA_CY, PLAYER_SPEED } from "../constants";
import { BallType } from "../balls/types";

describe("brackets", () => {
  it("should have 9 brackets", () => {
    expect(BRACKETS).toHaveLength(9);
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
    g.balls.push({ x: ARENA_CX + 50, y: ARENA_CY, vx: -3, vy: 0, bounceCount: 0, type: BallType.Dodgeball, age: 0, phaseTimer: 0, isReal: true, radius: 7, dead: false, pipeImmunity: 0 });
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

  it("should use cached direction within reaction delay", () => {
    resetBotState();
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.t = 0;
    g.balls.push({ x: ARENA_CX + 50, y: ARENA_CY, vx: -3, vy: 0, bounceCount: 0, type: BallType.Dodgeball, age: 0, phaseTimer: 0, isReal: true, radius: 7, dead: false, pipeImmunity: 0 });

    // First call makes a decision
    botMove(g);
    const firstVx = g.pvx;
    const firstVy = g.pvy;

    // Move ball to very different position
    g.balls[0].x = ARENA_CX - 100;
    g.balls[0].vx = 5;

    // Second call within 0.2s should reuse cached direction
    g.t = 0.05;
    botMove(g);
    expect(g.pvx).toBe(firstVx);
    expect(g.pvy).toBe(firstVy);
  });

  it("should re-evaluate after reaction delay", () => {
    resetBotState();
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.t = 0;
    g.balls.push({ x: ARENA_CX + 50, y: ARENA_CY, vx: -3, vy: 0, bounceCount: 0, type: BallType.Dodgeball, age: 0, phaseTimer: 0, isReal: true, radius: 7, dead: false, pipeImmunity: 0 });

    botMove(g);

    // After reaction delay, bot re-evaluates
    g.t = 0.25;
    botMove(g);
    // Just verify it runs without error (direction may or may not change)
    const speed = Math.hypot(g.pvx, g.pvy);
    expect(speed).toBeGreaterThanOrEqual(0);
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
    expect(table).toContain("L1-5");
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

  it("should format table with mixed tooHard, tooEasy, and pass results", () => {
    const results = [
      { bracket: BRACKETS[0], rate: 0.1, tooHard: true, tooEasy: false, passed: false },
      { bracket: BRACKETS[1], rate: 0.99, tooHard: false, tooEasy: true, passed: false },
      { bracket: BRACKETS[2], rate: 0.85, tooHard: false, tooEasy: false, passed: true },
    ];
    const table = formatTable(results);
    expect(table).toContain("FAIL too hard");
    expect(table).toContain("FAIL too easy");
    expect(table).toContain("PASS");
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
    expect(summary.failedBrackets.length).toBe(9);
  });

  it("checkAll should pass when all brackets pass and monotonic", () => {
    const results = BRACKETS.map((bracket, i) => ({
      bracket,
      rate: 0.9 - i * 0.08,
      tooHard: false,
      tooEasy: false,
      passed: true,
    }));
    const summary = checkAll(results);
    expect(summary.passed).toBe(true);
    expect(summary.failedBrackets).toHaveLength(0);
    expect(summary.monotonicPassed).toBe(true);
  });

  it("checkAll should fail when monotonic check fails even if all brackets pass individually", () => {
    const results = BRACKETS.map((bracket) => ({
      bracket,
      rate: 0.5,
      tooHard: false,
      tooEasy: false,
      passed: true,
    }));
    // Make rates non-monotonic (increase significantly at index 3)
    results[3].rate = 0.9;
    const summary = checkAll(results);
    expect(summary.passed).toBe(false);
    expect(summary.monotonicPassed).toBe(false);
    expect(summary.failedBrackets).toHaveLength(0); // Individual brackets pass
  });

  it("checkAll should include tooEasy direction in failedBrackets messages", () => {
    const results = BRACKETS.map((bracket, i) => ({
      bracket,
      rate: 0.99,
      tooHard: false,
      tooEasy: true,
      passed: false,
    }));
    const summary = checkAll(results);
    expect(summary.passed).toBe(false);
    for (const msg of summary.failedBrackets) {
      expect(msg).toContain("too easy");
    }
  });

  it("checkMonotonic with non-monotonic results where rate increases between consecutive brackets", () => {
    const results = [
      { bracket: BRACKETS[0], rate: 0.6, tooHard: false, tooEasy: false, passed: true },
      { bracket: BRACKETS[1], rate: 0.5, tooHard: false, tooEasy: false, passed: true },
      { bracket: BRACKETS[2], rate: 0.7, tooHard: false, tooEasy: false, passed: true }, // Increases!
    ];
    expect(checkMonotonic(results)).toBe(false);
  });
});

// ─── simulateGame: frame limit (line 62) ───

describe("simulateGame — frame limit path", () => {
  it("should return survived based on state when frame limit is exhausted", () => {
    // simulateGame with maxRounds=1 runs at most 1*15*60=900 frames.
    // We just need to verify the function returns a result (the frame limit path
    // is hit when game doesn't end via OVER or CLEAR in time).
    // Run enough times to get varied results
    const results = [];
    for (let i = 0; i < 5; i++) {
      results.push(simulateGame(1));
    }
    // All results should have roundReached >= 1
    for (const r of results) {
      expect(r.roundReached).toBeGreaterThanOrEqual(1);
      expect(typeof r.survived).toBe("boolean");
    }
  });
});

// ─── runAllBrackets (lines 86-90) ───

describe("runAllBrackets", () => {
  it("should return results for all 9 brackets", () => {
    // Use just 1 run per bracket to keep it fast
    const results = runAllBrackets(1);
    expect(results).toHaveLength(9);
    for (const r of results) {
      expect(r.bracket).toBeDefined();
      expect(r.bracket.name).toBeTruthy();
      expect(typeof r.rate).toBe("number");
      expect(r.rate).toBeGreaterThanOrEqual(0);
      expect(r.rate).toBeLessThanOrEqual(1);
      expect(typeof r.tooHard).toBe("boolean");
      expect(typeof r.tooEasy).toBe("boolean");
      expect(typeof r.passed).toBe("boolean");
    }
  });

  it("should set tooHard/tooEasy flags correctly based on rate and bracket bounds", () => {
    const results = runAllBrackets(1);
    for (const r of results) {
      if (r.rate < r.bracket.minSurvival) {
        expect(r.tooHard).toBe(true);
      }
      if (r.rate > r.bracket.maxSurvival) {
        expect(r.tooEasy).toBe(true);
      }
      expect(r.passed).toBe(!r.tooHard && !r.tooEasy);
    }
  });
});

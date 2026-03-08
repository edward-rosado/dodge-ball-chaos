import { describe, it, expect, vi, afterEach } from "vitest";
import { makeGame, initRound, startGame } from "../state";
import { update } from "../update";
import { ST, Ball, PowerUp } from "../types";
import { BallType } from "../balls/types";
import { PowerUpType, POWER_UP_CONFIGS } from "../powerups/types";
import { spawnPowerUp } from "../powerups/factory";
import { applyPowerUp } from "../powerups/effects";
import { BALL_R, ARENA_CX, ARENA_CY } from "../constants";

afterEach(() => vi.restoreAllMocks());

function makeBall(overrides: Partial<Ball> = {}): Ball {
  return {
    x: 200, y: 300, vx: 2, vy: 2, bounceCount: 0,
    type: BallType.Dodgeball, age: 0, phaseTimer: 0,
    isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    ...overrides,
  };
}

function makeDodgeState() {
  const g = makeGame();
  startGame(g);
  g.state = ST.DODGE;
  g.round = 3;
  g.launched = g.launchQueue;
  g.launchDelay = 999;
  return g;
}

// ─── Bug 1: Pipe Immunity ───

describe("pipe immunity", () => {
  it("should set pipeImmunity on balls re-emerging from pipe queue", () => {
    const g = makeDodgeState();
    g.pipeQueue = [{
      ball: makeBall({ x: 200, y: 350, vx: 2, vy: 1, pipeImmunity: 0 }),
      pipeIndex: 5,
      delay: 0.001,
      totalDelay: 2,
    }];
    g.chargingPipes = [5];
    g.balls = [];

    update(g, 1 / 60);

    expect(g.balls.length).toBeGreaterThanOrEqual(1);
    // Re-emerged ball should have pipeImmunity set
    const emerged = g.balls[0];
    expect(emerged.pipeImmunity).toBeGreaterThan(0);
  });

  it("should decrement pipeImmunity each frame", () => {
    const g = makeDodgeState();
    g.balls = [makeBall({ x: 200, y: 350, vx: 0, vy: 0, pipeImmunity: 0.5 })];

    update(g, 0.1);

    expect(g.balls[0].pipeImmunity).toBeCloseTo(0.4, 1);
  });

  it("should prevent pipe suck-in while immune", () => {
    const g = makeDodgeState();
    const pipe0 = g.pipes[0];
    // Ball at pipe center with immunity — should NOT be sucked in
    g.balls = [makeBall({ x: pipe0.x, y: pipe0.y, vx: 3, vy: 0, pipeImmunity: 0.5 })];

    vi.spyOn(Math, "random").mockReturnValue(0); // Would trigger suck-in

    update(g, 1 / 60);

    // Ball should still be alive (not sucked into pipe queue)
    const liveBalls = g.balls.filter(b => !b.dead);
    expect(liveBalls.length).toBe(1);
    expect(g.pipeQueue).toHaveLength(0);
  });

  it("should allow pipe suck-in after immunity expires", () => {
    const g = makeDodgeState();
    const pipe0 = g.pipes[0];
    // Ball at pipe center with expired immunity
    g.balls = [makeBall({ x: pipe0.x, y: pipe0.y, vx: 3, vy: 0, pipeImmunity: 0 })];

    let callIdx = 0;
    vi.spyOn(Math, "random").mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return 0; // Triggers suck-in
      return 0.5;
    });

    update(g, 1 / 60);

    // Ball should be sucked into pipe queue
    expect(g.pipeQueue.length).toBeGreaterThanOrEqual(1);
  });

  it("should have pipeImmunity: 0 on newly created balls", () => {
    const g = makeDodgeState();
    g.round = 5;
    g.launched = 0;
    g.launchQueue = 1;
    g.launchDelay = 0;

    update(g, 1 / 60);

    if (g.balls.length > 0) {
      expect(g.balls[0].pipeImmunity).toBe(0);
    }
  });
});

// ─── Bug 2: Lives Display (no max cap) ───

describe("lives - no max cap", () => {
  it("should allow senzu bean to add lives beyond 3", () => {
    const g = makeDodgeState();
    g.lives = 3;
    applyPowerUp(g, PowerUpType.SenzuBean);
    expect(g.lives).toBe(4);
  });

  it("should allow accumulating many lives", () => {
    const g = makeDodgeState();
    g.lives = 10;
    applyPowerUp(g, PowerUpType.SenzuBean);
    expect(g.lives).toBe(11);
  });
});

// ─── Bug 3: Victory at Level 50 ───

describe("victory at level 50", () => {
  it("should transition to VICTORY state when round 50 timer expires", () => {
    const g = makeDodgeState();
    g.round = 50;
    g.timer = 0.01;
    g.state = ST.DODGE;

    update(g, 0.02);

    expect(g.state).toBe(ST.VICTORY);
  });

  it("should set highScore on victory", () => {
    const g = makeDodgeState();
    g.round = 50;
    g.timer = 0.01;
    g.state = ST.DODGE;
    g.score = 5000;
    g.highScore = 0;

    update(g, 0.02);

    // Score gets round * 100 bonus (50 * 100 = 5000) before victory
    expect(g.highScore).toBe(10000);
  });

  it("should NOT transition to victory before round 50", () => {
    const g = makeDodgeState();
    g.round = 49;
    g.timer = 0.01;
    g.state = ST.DODGE;

    update(g, 0.02);

    // Should transition to CLEAR, not VICTORY
    expect(g.state).toBe(ST.CLEAR);
    expect(g.round).toBe(50);
  });

  it("should allow restart from VICTORY via startGame", () => {
    const g = makeDodgeState();
    g.state = ST.VICTORY;
    startGame(g);
    expect(g.state).toBe(ST.READY);
    expect(g.round).toBe(1);
    expect(g.lives).toBe(3);
  });
});

// ─── Bug 4: Power-up Persistence ───

describe("power-up persistence", () => {
  it("should keep non-expired power-ups across rounds", () => {
    const g = makeDodgeState();
    g.t = 10;
    g.powerUps = [{
      x: 200, y: 300, type: PowerUpType.Kaioken,
      collected: false, spawnTime: g.t - 5, // 5s old, within 15s lifetime
    }];

    initRound(g);
    expect(g.powerUps).toHaveLength(1);
  });

  it("should remove expired power-ups on round transition", () => {
    const g = makeDodgeState();
    g.t = 20;
    g.powerUps = [{
      x: 200, y: 300, type: PowerUpType.Kaioken,
      collected: false, spawnTime: 0, // 20s old, past 15s lifetime
    }];

    initRound(g);
    expect(g.powerUps).toHaveLength(0);
  });

  it("should expire power-ups by lifetime during DODGE", () => {
    const g = makeDodgeState();
    g.t = 20;
    g.powerUps = [{
      x: 200, y: 300, type: PowerUpType.Kaioken,
      collected: false, spawnTime: 0, // Very old
    }];

    update(g, 0.016);

    expect(g.powerUps).toHaveLength(0);
  });
});

// ─── Bug 5: Magnetic Pull ───

describe("power-up magnetic pull", () => {
  it("should pull power-ups toward player when within 60px", () => {
    const g = makeDodgeState();
    const puX = g.px + 50; // Within 60px magnet range
    g.powerUps = [{
      x: puX, y: g.py, type: PowerUpType.Kaioken,
      collected: false, spawnTime: g.t,
    }];

    update(g, 0.016);

    // Power-up should have moved closer to player (if not already collected)
    if (g.powerUps.length > 0) {
      expect(g.powerUps[0].x).toBeLessThan(puX);
    }
  });

  it("should NOT pull power-ups beyond magnet range", () => {
    const g = makeDodgeState();
    const puX = g.px + 100; // Beyond 60px magnet range
    g.powerUps = [{
      x: puX, y: g.py, type: PowerUpType.Kaioken,
      collected: false, spawnTime: g.t,
    }];

    update(g, 0.016);

    // Power-up should stay at original position (or be moved negligibly by floating point)
    if (g.powerUps.length > 0) {
      expect(g.powerUps[0].x).toBeCloseTo(puX, 0);
    }
  });

  it("should collect power-ups within 30px pickup radius", () => {
    const g = makeDodgeState();
    g.powerUps = [{
      x: g.px + 25, y: g.py, type: PowerUpType.Kaioken,
      collected: false, spawnTime: g.t,
    }];

    update(g, 0.016);

    expect(g.kaioken).toBe(true);
    expect(g.powerUps).toHaveLength(0);
  });
});

// ─── Bug 6: Power-up Labels ───

describe("power-up descriptive labels", () => {
  it("should have descriptive labels for all power-ups", () => {
    const labels = Object.values(POWER_UP_CONFIGS).map(c => c.label);
    // Each label should describe the effect
    expect(labels.find(l => l.includes("KAIOKEN"))).toContain("2X SPEED");
    expect(labels.find(l => l.includes("KI SHIELD"))).toContain("BLOCKS 1 HIT");
    expect(labels.find(l => l.includes("DESTRUCTO DISC"))).toContain("-1 BALL");
    expect(labels.find(l => l.includes("SOLAR FLARE"))).toContain("FREEZE");
    expect(labels.find(l => l.includes("TIME SKIP"))).toContain("SLOW");
    expect(labels.find(l => l.includes("SHRINK"))).toContain("HALF SIZE");
    expect(labels.find(l => l.includes("INSTANT TRANSMISSION"))).toContain("TELEPORT");
    expect(labels.find(l => l.includes("SENZU BEAN"))).toContain("+1 LIFE");
    expect(labels.find(l => l.includes("AFTERIMAGE"))).toContain("DECOY");
    expect(labels.find(l => l.includes("SPIRIT BOMB"))).toContain("HOLD STILL");
  });
});

// ─── Bug 7: lastPowerUp SFX signal ───

describe("power-up SFX signal", () => {
  it("should set lastPowerUp when collecting a power-up", () => {
    const g = makeDodgeState();
    g.powerUps = [{
      x: g.px + 5, y: g.py, type: PowerUpType.Kaioken,
      collected: false, spawnTime: g.t,
    }];

    update(g, 0.016);

    // lastPowerUp should have been set to the collected type
    // It may have been consumed by loop.ts in a real game, but in pure update it stays
    expect(g.lastPowerUp).toBe(PowerUpType.Kaioken);
  });
});

// ─── Bug 8: VICTORY state constant ───

describe("game states", () => {
  it("should include VICTORY state", () => {
    expect(ST.VICTORY).toBeDefined();
    expect(ST.VICTORY).toBe(7);
  });
});

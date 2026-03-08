import { describe, it, expect } from "vitest";
import { BallType } from "../balls/types";
import { createBall, createDodgeball } from "../balls/factory";
import { getAvailableTypes, getDodgeballCount, getThrowAngles } from "../balls/spawn";
import { updateBallByType } from "../balls/dispatcher";
import { makeGame, startGame, initRound } from "../state";
import { ST } from "../types";
import { ARENA_CX, ARENA_CY, BALL_R, getDifficulty } from "../constants";

describe("createBall", () => {
  it("should create a ball with correct type and defaults", () => {
    const pipe = { x: 100, y: 50, angle: Math.PI / 2 };
    const ball = createBall(BallType.Tracker, pipe, 3.0);
    expect(ball.type).toBe(BallType.Tracker);
    // Ball spawns offset inward from pipe (not at exact pipe position)
    expect(ball.x).toBeCloseTo(pipe.x + Math.cos(pipe.angle) * 22, 0);
    expect(ball.y).toBeCloseTo(pipe.y + Math.sin(pipe.angle) * 22, 0);
    expect(ball.isReal).toBe(true);
    expect(ball.dead).toBe(false);
    expect(ball.age).toBe(0);
    expect(ball.bounceCount).toBe(0);
  });

  it("should create a Giant with 3x radius and 0.6x speed", () => {
    const pipe = { x: 100, y: 50, angle: Math.PI / 2 };
    const ball = createBall(BallType.Giant, pipe, 3.0);
    expect(ball.radius).toBe(BALL_R * 3);
    const speed = Math.hypot(ball.vx, ball.vy);
    expect(speed).toBeCloseTo(3.0 * 0.6, 1);
  });

  it("should fire ball inward from pipe with spread", () => {
    const pipe = { x: 100, y: 0, angle: Math.PI / 2 }; // Top pipe, angle points inward (down)
    const ball = createBall(BallType.Tracker, pipe, 3.0);
    // Inward from top means moving downward (positive vy)
    expect(ball.vy).toBeGreaterThan(0);
  });
});

describe("createDodgeball", () => {
  it("should create a dodgeball at given position and angle", () => {
    const ball = createDodgeball(200, 300, -Math.PI / 2, 7);
    expect(ball.type).toBe(BallType.Dodgeball);
    expect(ball.x).toBe(200);
    expect(ball.y).toBe(300);
    expect(ball.vy).toBeLessThan(0); // Fired upward
    expect(ball.radius).toBe(BALL_R);
  });
});

describe("getAvailableTypes", () => {
  it("should never include Dodgeball in pipe spawn types", () => {
    for (const round of [1, 5, 6, 10, 11, 20, 21, 30, 31, 40, 41, 50]) {
      const types = getAvailableTypes(round);
      expect(types).not.toContain(BallType.Dodgeball);
    }
  });

  it("should return Zigzag and Ghost for rounds 1-5", () => {
    const types = getAvailableTypes(1);
    expect(types).toContain(BallType.Zigzag);
    expect(types).toContain(BallType.Ghost);
    expect(types).not.toContain(BallType.Tracker);
    expect(types).toHaveLength(2);
  });

  it("should focus on Zigzag at rounds 6-10", () => {
    const types = getAvailableTypes(6);
    expect(types).toContain(BallType.Zigzag);
    expect(types).not.toContain(BallType.Tracker);
    expect(types).toHaveLength(3); // 2x Zigzag + Ghost
  });

  it("should add Tracker and Ghost at rounds 11-20", () => {
    const types = getAvailableTypes(11);
    expect(types).toContain(BallType.Tracker);
    expect(types).toContain(BallType.Ghost);
    expect(types).toContain(BallType.Zigzag);
    expect(types).toHaveLength(3);
  });

  it("should add Ricochet and SpeedDemon at rounds 21-30", () => {
    const types = getAvailableTypes(21);
    expect(types).toContain(BallType.Ricochet);
    expect(types).toContain(BallType.SpeedDemon);
    expect(types).toHaveLength(5);
  });

  it("should add Splitter and Mirage at rounds 31-40", () => {
    const types = getAvailableTypes(31);
    expect(types).toContain(BallType.Splitter);
    expect(types).toContain(BallType.Mirage);
    expect(types).toHaveLength(7);
  });

  it("should have all non-Dodgeball types at round 41+", () => {
    const types = getAvailableTypes(41);
    expect(types).toContain(BallType.Giant);
    expect(types).toContain(BallType.Bomber);
    expect(types).toContain(BallType.GravityWell);
    expect(types).toHaveLength(10);
  });
});

describe("getDodgeballCount", () => {
  it("should return 1 dodgeball for rounds 1-9", () => {
    for (let r = 1; r <= 9; r++) {
      expect(getDodgeballCount(r)).toBe(1);
    }
  });

  it("should return 2 dodgeballs for rounds 10-19", () => {
    for (let r = 10; r <= 19; r++) {
      expect(getDodgeballCount(r)).toBe(2);
    }
  });

  it("should return 3 dodgeballs for rounds 20-29", () => {
    for (let r = 20; r <= 29; r++) {
      expect(getDodgeballCount(r)).toBe(3);
    }
  });

  it("should return 4 dodgeballs for rounds 30-39", () => {
    for (let r = 30; r <= 39; r++) {
      expect(getDodgeballCount(r)).toBe(4);
    }
  });

  it("should return 5 dodgeballs for rounds 40+", () => {
    for (let r = 40; r <= 50; r++) {
      expect(getDodgeballCount(r)).toBe(5);
    }
  });

  it("should add exactly 1 dodgeball every 10 rounds", () => {
    // Verify the milestone pattern: +1 dodgeball at round 10, 20, 30, 40
    expect(getDodgeballCount(9)).toBe(1);
    expect(getDodgeballCount(10)).toBe(2);
    expect(getDodgeballCount(19)).toBe(2);
    expect(getDodgeballCount(20)).toBe(3);
    expect(getDodgeballCount(29)).toBe(3);
    expect(getDodgeballCount(30)).toBe(4);
    expect(getDodgeballCount(39)).toBe(4);
    expect(getDodgeballCount(40)).toBe(5);
  });
});

describe("launchQueue (pipe balls = round - 1)", () => {
  it("should set launchQueue to round-1 for early rounds", () => {
    const g = makeGame();
    const band = getDifficulty(1);
    for (let r = 1; r <= 3; r++) {
      g.round = r;
      initRound(g);
      expect(g.launchQueue).toBe(Math.min(band.maxBalls, r - 1));
    }
  });

  it("should cap launchQueue by band maxBalls", () => {
    const g = makeGame();
    const band10 = getDifficulty(10);
    g.round = 10;
    initRound(g);
    expect(g.launchQueue).toBe(Math.min(band10.maxBalls, 9));

    const band15 = getDifficulty(15);
    g.round = 15;
    initRound(g);
    expect(g.launchQueue).toBe(Math.min(band15.maxBalls, 14));
  });
});

describe("Tracker", () => {
  it("should curve toward the player over time", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.px = ARENA_CX;
    g.py = ARENA_CY;

    const ball = {
      x: ARENA_CX - 100, y: ARENA_CY - 100,
      vx: 3, vy: 0,
      bounceCount: 0, type: BallType.Tracker,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };

    const initialAngle = Math.atan2(ball.vy, ball.vx);
    for (let i = 0; i < 30; i++) {
      updateBallByType(ball, g, []);
    }
    const newAngle = Math.atan2(ball.vy, ball.vx);

    // Angle should have shifted toward the player (downward-right)
    const targetAngle = Math.atan2(g.py - ball.y, g.px - ball.x);
    const initialDiff = Math.abs(targetAngle - initialAngle);
    const newDiff = Math.abs(targetAngle - newAngle);
    expect(newDiff).toBeLessThan(initialDiff);
  });

  it("should preserve speed while curving", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.px = ARENA_CX + 50;
    g.py = ARENA_CY + 50;

    const ball = {
      x: ARENA_CX - 50, y: ARENA_CY - 50,
      vx: 3, vy: 1,
      bounceCount: 0, type: BallType.Tracker,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };

    const initialSpeed = Math.hypot(ball.vx, ball.vy);
    for (let i = 0; i < 60; i++) {
      updateBallByType(ball, g, []);
    }
    const finalSpeed = Math.hypot(ball.vx, ball.vy);
    expect(finalSpeed).toBeCloseTo(initialSpeed, 1);
  });

  it("should not produce children or die", () => {
    const g = makeGame();
    startGame(g);
    const ball = {
      x: 100, y: 100, vx: 3, vy: 0,
      bounceCount: 0, type: BallType.Tracker,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const newBalls: any[] = [];
    updateBallByType(ball, g, newBalls);
    expect(newBalls).toHaveLength(0);
    expect(ball.dead).toBe(false);
  });
});

describe("Splitter", () => {
  it("should spawn 3 children on first bounce", () => {
    const ball = {
      x: 100, y: 100, vx: 3, vy: 0,
      bounceCount: 1, type: BallType.Splitter,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    const newBalls: any[] = [];
    updateBallByType(ball, g, newBalls);
    expect(newBalls).toHaveLength(3);
    expect(ball.dead).toBe(true);
    for (const child of newBalls) {
      expect(child.type).toBe(BallType.Splitter);
      expect(child.radius).toBe(Math.floor(BALL_R / 2));
    }
  });

  it("should not split again if already small", () => {
    const ball = {
      x: 100, y: 100, vx: 3, vy: 0,
      bounceCount: 1, type: BallType.Splitter,
      age: 0, phaseTimer: 0, isReal: true, radius: Math.floor(BALL_R / 2), dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    const newBalls: any[] = [];
    updateBallByType(ball, g, newBalls);
    expect(newBalls).toHaveLength(0);
    expect(ball.dead).toBe(false);
  });

  it("should not split before first bounce", () => {
    const ball = {
      x: 100, y: 100, vx: 3, vy: 0,
      bounceCount: 0, type: BallType.Splitter,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    const newBalls: any[] = [];
    updateBallByType(ball, g, newBalls);
    expect(newBalls).toHaveLength(0);
    expect(ball.dead).toBe(false);
  });

  it("children should have half speed of parent", () => {
    const ball = {
      x: 100, y: 100, vx: 4, vy: 3,
      bounceCount: 1, type: BallType.Splitter,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const parentSpeed = Math.hypot(ball.vx, ball.vy);
    const g = makeGame();
    const newBalls: any[] = [];
    updateBallByType(ball, g, newBalls);
    for (const child of newBalls) {
      const childSpeed = Math.hypot(child.vx, child.vy);
      expect(childSpeed).toBeCloseTo(parentSpeed * 0.5, 1);
    }
  });
});

describe("Ghost", () => {
  it("should toggle isReal every 120 frames", () => {
    const ball = {
      x: 100, y: 100, vx: 3, vy: 0,
      bounceCount: 0, type: BallType.Ghost,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();

    expect(ball.isReal).toBe(true);
    for (let i = 0; i < 120; i++) updateBallByType(ball, g, []);
    expect(ball.isReal).toBe(false);
    for (let i = 0; i < 120; i++) updateBallByType(ball, g, []);
    expect(ball.isReal).toBe(true);
  });

  it("should not die or produce children", () => {
    const ball = {
      x: 100, y: 100, vx: 3, vy: 0,
      bounceCount: 0, type: BallType.Ghost,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    const newBalls: any[] = [];
    for (let i = 0; i < 200; i++) updateBallByType(ball, g, newBalls);
    expect(newBalls).toHaveLength(0);
    expect(ball.dead).toBe(false);
  });
});

describe("Bomber", () => {
  it("should explode on 3rd bounce and mark as dead", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 3, type: BallType.Bomber,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.px = ARENA_CX;
    g.py = ARENA_CY;

    updateBallByType(ball, g, []);
    expect(ball.dead).toBe(true);
  });

  it("should damage player within 60px blast radius", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 3, type: BallType.Bomber,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.px = 230; // 30px away — within blast radius
    g.py = 200;
    g.shield = false;
    const oldLives = g.lives;

    updateBallByType(ball, g, []);
    expect(ball.dead).toBe(true);
    expect(g.lives).toBe(oldLives - 1);
  });

  it("should not explode before 3rd bounce", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 2, type: BallType.Bomber,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    updateBallByType(ball, g, []);
    expect(ball.dead).toBe(false);
  });

  it("should not damage player with shield active", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 3, type: BallType.Bomber,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.px = 210;
    g.py = 200;
    g.shield = true;
    const oldLives = g.lives;

    updateBallByType(ball, g, []);
    expect(ball.dead).toBe(true);
    expect(g.lives).toBe(oldLives); // No damage
  });
});

describe("Zigzag", () => {
  it("should apply sine-wave offset perpendicular to velocity", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 0, type: BallType.Zigzag,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();

    const yPositions: number[] = [];
    for (let i = 0; i < 60; i++) {
      updateBallByType(ball, g, []);
      yPositions.push(ball.y);
    }
    const minY = Math.min(...yPositions);
    const maxY = Math.max(...yPositions);
    expect(maxY - minY).toBeGreaterThan(5);
  });

  it("should not die or produce children", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 0, type: BallType.Zigzag,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    const newBalls: any[] = [];
    for (let i = 0; i < 60; i++) updateBallByType(ball, g, newBalls);
    expect(newBalls).toHaveLength(0);
    expect(ball.dead).toBe(false);
  });
});

describe("Giant", () => {
  it("should have no special update behavior (size/speed set by factory)", () => {
    const ball = {
      x: 200, y: 200, vx: 2, vy: 0,
      bounceCount: 0, type: BallType.Giant,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R * 3, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    updateBallByType(ball, g, []);
    expect(ball.dead).toBe(false);
    expect(ball.radius).toBe(BALL_R * 3);
  });
});

describe("SpeedDemon", () => {
  it("should cap speed at 8x base", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 5, type: BallType.SpeedDemon,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    // At 5 bounces, 2^5 = 32x, way over 8x cap
    updateBallByType(ball, g, []);
    const speed = Math.hypot(ball.vx, ball.vy);
    // Base speed = 3 / 2^5 = 0.09375, max = 0.09375 * 8 = 0.75
    expect(speed).toBeLessThanOrEqual(0.76);
  });

  it("should not cap speed below 8x multiplier", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 1, type: BallType.SpeedDemon,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    // At 1 bounce, 2^1 = 2x, under 8x cap — should not cap
    updateBallByType(ball, g, []);
    const speed = Math.hypot(ball.vx, ball.vy);
    expect(speed).toBeCloseTo(3, 1); // Unchanged
  });
});

describe("GravityWell", () => {
  it("should pull player toward it within 80px", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.px = 250;
    g.py = 200;

    const ball = {
      x: 200, y: 200, vx: 0, vy: 3,
      bounceCount: 0, type: BallType.GravityWell,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };

    const oldPx = g.px;
    updateBallByType(ball, g, []);
    expect(g.px).toBeLessThan(oldPx); // Pulled left toward ball
  });

  it("should not pull player beyond 80px", () => {
    const g = makeGame();
    startGame(g);
    g.px = 300;
    g.py = 200;

    const ball = {
      x: 200, y: 200, vx: 0, vy: 3,
      bounceCount: 0, type: BallType.GravityWell,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };

    const oldPx = g.px;
    updateBallByType(ball, g, []);
    expect(g.px).toBe(oldPx); // 100px away, no pull
  });

  it("should pull gently (0.3px per frame max)", () => {
    const g = makeGame();
    startGame(g);
    g.px = 210;
    g.py = 200;

    const ball = {
      x: 200, y: 200, vx: 0, vy: 3,
      bounceCount: 0, type: BallType.GravityWell,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };

    const oldPx = g.px;
    updateBallByType(ball, g, []);
    const pullAmount = Math.abs(g.px - oldPx);
    expect(pullAmount).toBeCloseTo(0.3, 1);
  });
});

describe("Mirage", () => {
  it("should spawn 2 fakes on first bounce", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 1, type: BallType.Mirage,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    const newBalls: any[] = [];
    updateBallByType(ball, g, newBalls);
    expect(newBalls).toHaveLength(2);
    for (const fake of newBalls) {
      expect(fake.isReal).toBe(false);
      expect(fake.type).toBe(BallType.Mirage);
    }
    expect(ball.phaseTimer).toBe(1);
  });

  it("should not spawn fakes again after first time", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 2, type: BallType.Mirage,
      age: 50, phaseTimer: 1, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    const newBalls: any[] = [];
    updateBallByType(ball, g, newBalls);
    expect(newBalls).toHaveLength(0);
  });

  it("should mark fakes as dead after 300 frames", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 0, type: BallType.Mirage,
      age: 299, phaseTimer: 0, isReal: false, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    updateBallByType(ball, g, []);
    expect(ball.dead).toBe(true);
  });

  it("should not kill real Mirage balls", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 0, type: BallType.Mirage,
      age: 500, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    updateBallByType(ball, g, []);
    expect(ball.dead).toBe(false);
  });
});

describe("Ricochet", () => {
  it("should have no special per-frame update", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 0, type: BallType.Ricochet,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    updateBallByType(ball, g, []);
    expect(ball.dead).toBe(false);
  });
});

// ─── Additional coverage tests ───

describe("Giant (direct import coverage)", () => {
  it("updateGiant is a no-op", async () => {
    const { updateGiant } = await import("../balls/giant");
    const ball = {
      x: 100, y: 100, vx: 2, vy: 0,
      bounceCount: 0, type: BallType.Giant,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R * 3, dead: false, pipeImmunity: 0,
    };
    updateGiant(ball);
    expect(ball.dead).toBe(false);
  });
});

describe("Ricochet (direct import coverage)", () => {
  it("updateRicochet is a no-op", async () => {
    const { updateRicochet } = await import("../balls/ricochet");
    const ball = {
      x: 100, y: 100, vx: 3, vy: 0,
      bounceCount: 0, type: BallType.Ricochet,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    updateRicochet(ball);
    expect(ball.dead).toBe(false);
  });
});

describe("Bomber — game over branch", () => {
  it("should set state to OVER when lives reach 0 after blast", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 3, type: BallType.Bomber,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.px = 210;
    g.py = 200;
    g.shield = false;
    g.lives = 1; // Will reach 0 after blast
    g.score = 42;
    g.highScore = 10;

    updateBallByType(ball, g, []);
    expect(ball.dead).toBe(true);
    expect(g.lives).toBe(0);
    expect(g.state).toBe(ST.OVER);
    expect(g.highScore).toBe(42); // Updated high score
  });

  it("should not update highScore if score is lower", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 3, type: BallType.Bomber,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.px = 210;
    g.py = 200;
    g.shield = false;
    g.lives = 1;
    g.score = 5;
    g.highScore = 100;

    updateBallByType(ball, g, []);
    expect(g.state).toBe(ST.OVER);
    expect(g.highScore).toBe(100); // Kept existing high score
  });

  it("should not damage player outside blast radius", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 3, type: BallType.Bomber,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.px = 400; // Far away
    g.py = 400;
    g.shield = false;
    const oldLives = g.lives;

    updateBallByType(ball, g, []);
    expect(ball.dead).toBe(true);
    expect(g.lives).toBe(oldLives); // No damage
  });
});

describe("Tracker — afterimage decoy targeting", () => {
  it("should curve toward afterimageDecoy when present", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.px = ARENA_CX;
    g.py = ARENA_CY;
    // Place decoy far from player
    g.afterimageDecoy = { x: ARENA_CX + 200, y: ARENA_CY + 200 };

    const ball = {
      x: ARENA_CX, y: ARENA_CY - 100,
      vx: 0, vy: 3,
      bounceCount: 0, type: BallType.Tracker,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };

    // Run multiple frames to allow curve
    for (let i = 0; i < 60; i++) {
      updateBallByType(ball, g, []);
    }
    const angleToDecoy = Math.atan2(
      g.afterimageDecoy.y - ball.y,
      g.afterimageDecoy.x - ball.x,
    );
    const ballAngle = Math.atan2(ball.vy, ball.vx);
    // Ball should have curved toward the decoy, not the player
    // The angle difference should be small
    let diff = Math.abs(angleToDecoy - ballAngle);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    expect(diff).toBeLessThan(Math.PI / 2);
  });

  it("should target player when no afterimageDecoy", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.px = ARENA_CX + 200;
    g.py = ARENA_CY + 200;
    g.afterimageDecoy = null;

    const ball = {
      x: ARENA_CX, y: ARENA_CY - 100,
      vx: 0, vy: 3,
      bounceCount: 0, type: BallType.Tracker,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };

    for (let i = 0; i < 60; i++) {
      updateBallByType(ball, g, []);
    }
    const angleToPlayer = Math.atan2(g.py - ball.y, g.px - ball.x);
    const ballAngle = Math.atan2(ball.vy, ball.vx);
    let diff = Math.abs(angleToPlayer - ballAngle);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    expect(diff).toBeLessThan(Math.PI / 2);
  });

  it("should normalize angle diff > PI", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    // Player behind the ball — forces large angle wrap
    g.px = ARENA_CX - 10;
    g.py = ARENA_CY;
    g.afterimageDecoy = null;

    // Ball moving away from player (angle ~0, target angle ~PI)
    const ball = {
      x: ARENA_CX, y: ARENA_CY,
      vx: 3, vy: 0.01, // Nearly horizontal right
      bounceCount: 0, type: BallType.Tracker,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };

    // This should trigger the while (diff > PI) branch
    updateBallByType(ball, g, []);
    // Ball should still be alive and moving
    expect(ball.dead).toBe(false);
    const speed = Math.hypot(ball.vx, ball.vy);
    expect(speed).toBeGreaterThan(0);
  });

  it("should normalize angle diff < -PI", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    // Player behind the ball — forces large negative angle wrap
    g.px = ARENA_CX + 10;
    g.py = ARENA_CY;
    g.afterimageDecoy = null;

    // Ball moving away from player (angle ~PI, target angle ~0)
    const ball = {
      x: ARENA_CX, y: ARENA_CY,
      vx: -3, vy: -0.01, // Nearly horizontal left
      bounceCount: 0, type: BallType.Tracker,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };

    // This should trigger the while (diff < -PI) branch
    updateBallByType(ball, g, []);
    expect(ball.dead).toBe(false);
    const speed = Math.hypot(ball.vx, ball.vy);
    expect(speed).toBeGreaterThan(0);
  });
});

describe("Zigzag — speed < 0.01 early return", () => {
  it("should return early when speed is near zero", () => {
    const ball = {
      x: 200, y: 200, vx: 0, vy: 0,
      bounceCount: 0, type: BallType.Zigzag,
      age: 5, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    const origX = ball.x;
    const origY = ball.y;
    updateBallByType(ball, g, []);
    // Position should not change since speed < 0.01
    expect(ball.x).toBe(origX);
    expect(ball.y).toBe(origY);
  });

  it("should return early for very small speed (0.005)", () => {
    const ball = {
      x: 200, y: 200, vx: 0.003, vy: 0.003,
      bounceCount: 0, type: BallType.Zigzag,
      age: 10, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, pipeImmunity: 0,
    };
    const g = makeGame();
    const origX = ball.x;
    const origY = ball.y;
    // speed = hypot(0.003, 0.003) ≈ 0.00424, which is < 0.01
    updateBallByType(ball, g, []);
    expect(ball.x).toBe(origX);
    expect(ball.y).toBe(origY);
  });
});

describe("getThrowAngles", () => {
  const UP = -Math.PI / 2;

  it("should return 1 angle for count=1", () => {
    const angles = getThrowAngles(1);
    expect(angles).toHaveLength(1);
    expect(angles[0]).toBeCloseTo(UP);
  });

  it("should return 2 spread angles for count=2", () => {
    const angles = getThrowAngles(2);
    expect(angles).toHaveLength(2);
    expect(angles[0]).toBeCloseTo(UP - Math.PI / 6);
    expect(angles[1]).toBeCloseTo(UP + Math.PI / 6);
  });

  it("should return 3 spread angles for count=3", () => {
    const angles = getThrowAngles(3);
    expect(angles).toHaveLength(3);
    expect(angles[0]).toBeCloseTo(UP - Math.PI / 6);
    expect(angles[1]).toBeCloseTo(UP);
    expect(angles[2]).toBeCloseTo(UP + Math.PI / 6);
  });

  it("should return 4 spread angles for count=4", () => {
    const angles = getThrowAngles(4);
    expect(angles).toHaveLength(4);
    expect(angles[0]).toBeCloseTo(UP - 5 * Math.PI / 18);
    expect(angles[1]).toBeCloseTo(UP - Math.PI / 9);
    expect(angles[2]).toBeCloseTo(UP + Math.PI / 9);
    expect(angles[3]).toBeCloseTo(UP + 5 * Math.PI / 18);
  });

  it("should return 5 spread angles for count=5", () => {
    const angles = getThrowAngles(5);
    expect(angles).toHaveLength(5);
    expect(angles[0]).toBeCloseTo(UP - 2 * Math.PI / 9);
    expect(angles[1]).toBeCloseTo(UP - Math.PI / 9);
    expect(angles[2]).toBeCloseTo(UP);
    expect(angles[3]).toBeCloseTo(UP + Math.PI / 9);
    expect(angles[4]).toBeCloseTo(UP + 2 * Math.PI / 9);
  });

  it("should return default [UP] for count=0", () => {
    const angles = getThrowAngles(0);
    expect(angles).toHaveLength(1);
    expect(angles[0]).toBeCloseTo(UP);
  });

  it("should return default [UP] for count=6+", () => {
    const angles = getThrowAngles(6);
    expect(angles).toHaveLength(1);
    expect(angles[0]).toBeCloseTo(UP);

    const angles10 = getThrowAngles(10);
    expect(angles10).toHaveLength(1);
    expect(angles10[0]).toBeCloseTo(UP);
  });
});

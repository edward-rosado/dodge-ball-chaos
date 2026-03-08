import { describe, it, expect } from "vitest";
import { BallType } from "../balls/types";
import { createBall, createDodgeball } from "../balls/factory";
import { getAvailableTypes, getDodgeballCount } from "../balls/spawn";
import { updateBallByType } from "../balls/dispatcher";
import { makeGame, startGame } from "../state";
import { ST } from "../types";
import { ARENA_CX, ARENA_CY, BALL_R } from "../constants";

describe("createBall", () => {
  it("should create a ball with correct type and defaults", () => {
    const pipe = { x: 100, y: 50, angle: Math.PI / 2 };
    const ball = createBall(BallType.Tracker, pipe, 3.0);
    expect(ball.type).toBe(BallType.Tracker);
    expect(ball.x).toBe(pipe.x);
    expect(ball.y).toBe(pipe.y);
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
    const pipe = { x: 100, y: 0, angle: -Math.PI / 2 }; // Top pipe, outward normal points up
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
  it("should return only Tracker, Zigzag, Giant for rounds 1-3", () => {
    const types = getAvailableTypes(1);
    expect(types).toContain(BallType.Tracker);
    expect(types).toContain(BallType.Zigzag);
    expect(types).toContain(BallType.Giant);
    expect(types).not.toContain(BallType.Bomber);
    expect(types).not.toContain(BallType.GravityWell);
    expect(types).toHaveLength(3);
  });

  it("should add Splitter, Ghost, Ricochet at round 4", () => {
    const types = getAvailableTypes(4);
    expect(types).toContain(BallType.Splitter);
    expect(types).toContain(BallType.Ghost);
    expect(types).toContain(BallType.Ricochet);
    expect(types).toHaveLength(6);
  });

  it("should add SpeedDemon, Mirage at round 7", () => {
    const types = getAvailableTypes(7);
    expect(types).toContain(BallType.SpeedDemon);
    expect(types).toContain(BallType.Mirage);
    expect(types).toHaveLength(8);
  });

  it("should have all 10 types at round 10", () => {
    const types = getAvailableTypes(10);
    expect(types).toContain(BallType.Bomber);
    expect(types).toContain(BallType.GravityWell);
    expect(types).toHaveLength(10);
  });
});

describe("getDodgeballCount", () => {
  it("should return 1 for rounds 1-9", () => {
    expect(getDodgeballCount(1)).toBe(1);
    expect(getDodgeballCount(9)).toBe(1);
  });

  it("should return 2 for rounds 10-19", () => {
    expect(getDodgeballCount(10)).toBe(2);
    expect(getDodgeballCount(19)).toBe(2);
  });

  it("should return 5 for rounds 40+", () => {
    expect(getDodgeballCount(40)).toBe(5);
    expect(getDodgeballCount(50)).toBe(5);
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
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
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
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
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
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
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
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
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
      age: 0, phaseTimer: 0, isReal: true, radius: Math.floor(BALL_R / 2), dead: false,
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
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
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
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
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
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
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
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
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
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
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
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
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
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
    };
    const g = makeGame();
    updateBallByType(ball, g, []);
    expect(ball.dead).toBe(false);
  });

  it("should not damage player with shield active", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 3, type: BallType.Bomber,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
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
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
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
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
    };
    const g = makeGame();
    const newBalls: any[] = [];
    for (let i = 0; i < 60; i++) updateBallByType(ball, g, newBalls);
    expect(newBalls).toHaveLength(0);
    expect(ball.dead).toBe(false);
  });
});

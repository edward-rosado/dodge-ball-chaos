import { describe, it, expect } from "vitest";
import { BallType } from "../balls/types";
import { createBall, createDodgeball } from "../balls/factory";
import { getAvailableTypes, getDodgeballCount } from "../balls/spawn";
import { BALL_R } from "../constants";

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

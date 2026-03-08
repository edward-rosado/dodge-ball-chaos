import { describe, it, expect, vi } from "vitest";
import { dist, circularClamp, bounceOffWall, checkPipeSuckIn } from "../physics";
import {
  ARENA_CX, ARENA_CY, ARENA_LEFT, ARENA_RIGHT, ARENA_TOP,
  BOUNCE_SPEED_BOOST, PLAYER_HITBOX, PIPE_RADIUS, BALL_R,
} from "../constants";
import { createPipes } from "../arena";
import { Ball, Pipe } from "../types";
import { BallType } from "../balls/types";

function makeBall(overrides: Partial<Ball> = {}): Ball {
  return { x: ARENA_CX, y: ARENA_CY, vx: 0, vy: 0, bounceCount: 0, type: BallType.Dodgeball, age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false, ...overrides };
}

describe("dist", () => {
  it("should return 0 for same point", () => {
    expect(dist({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });

  it("should calculate distance correctly", () => {
    expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe("circularClamp (rounded rectangle)", () => {
  it("should not move a point inside the arena", () => {
    const result = circularClamp(ARENA_CX + 10, ARENA_CY + 10);
    expect(result.x).toBe(ARENA_CX + 10);
    expect(result.y).toBe(ARENA_CY + 10);
  });

  it("should clamp a point past the right wall", () => {
    const farX = ARENA_RIGHT + 100;
    const result = circularClamp(farX, ARENA_CY);
    // Should be clamped to right wall minus player hitbox
    expect(result.x).toBeLessThanOrEqual(ARENA_RIGHT - PLAYER_HITBOX + 1);
    expect(result.y).toBeCloseTo(ARENA_CY, 5);
  });

  it("should clamp a point past the top wall", () => {
    const result = circularClamp(ARENA_CX, ARENA_TOP - 50);
    expect(result.y).toBeGreaterThanOrEqual(ARENA_TOP + PLAYER_HITBOX - 1);
  });

  it("should clamp at the boundary edge without moving", () => {
    // A point just inside the right wall
    const x = ARENA_RIGHT - PLAYER_HITBOX - 1;
    const result = circularClamp(x, ARENA_CY);
    expect(result.x).toBe(x);
  });
});

describe("bounceOffWall (rounded rectangle)", () => {
  it("should not bounce a ball inside the arena", () => {
    const ball = makeBall({ vx: 2, vy: 3 });
    const bounced = bounceOffWall(ball);
    expect(bounced).toBe(false);
    expect(ball.vx).toBe(2);
    expect(ball.vy).toBe(3);
    expect(ball.bounceCount).toBe(0);
  });

  it("should bounce a ball off the right wall", () => {
    const ball = makeBall({
      x: ARENA_RIGHT + 5,
      y: ARENA_CY,
      vx: 3,
      vy: 0,
    });
    const bounced = bounceOffWall(ball);
    expect(bounced).toBe(true);
    expect(ball.vx).toBeLessThan(0); // Reflected inward
    expect(ball.bounceCount).toBe(1);
  });

  it("should bounce a ball off the top wall", () => {
    const ball = makeBall({
      x: ARENA_CX,
      y: ARENA_TOP - 5,
      vx: 0,
      vy: -3,
    });
    const bounced = bounceOffWall(ball);
    expect(bounced).toBe(true);
    expect(ball.vy).toBeGreaterThan(0); // Reflected downward
    expect(ball.bounceCount).toBe(1);
  });

  it("should apply speed boost on bounce", () => {
    const ball = makeBall({
      x: ARENA_RIGHT + 5,
      y: ARENA_CY,
      vx: 3,
      vy: 0,
    });
    const speedBefore = Math.hypot(ball.vx, ball.vy);
    bounceOffWall(ball);
    const speedAfter = Math.hypot(ball.vx, ball.vy);
    expect(speedAfter).toBeCloseTo(speedBefore * BOUNCE_SPEED_BOOST, 5);
  });

  it("should push the ball back inside the arena after bounce", () => {
    const ball = makeBall({
      x: ARENA_RIGHT + 20,
      y: ARENA_CY,
      vx: 5,
      vy: 0,
    });
    bounceOffWall(ball);
    expect(ball.x).toBeLessThanOrEqual(ARENA_RIGHT);
  });

  it("should increment bounceCount each time", () => {
    const ball = makeBall({
      x: ARENA_RIGHT + 5,
      y: ARENA_CY,
      vx: 3,
      vy: 0,
    });
    bounceOffWall(ball);
    expect(ball.bounceCount).toBe(1);
    ball.x = ARENA_RIGHT + 5;
    ball.vx = 3;
    bounceOffWall(ball);
    expect(ball.bounceCount).toBe(2);
  });

  it("should reflect off flat wall correctly (horizontal velocity only)", () => {
    // Ball hits right wall moving right — should reverse vx, keep vy
    const ball = makeBall({
      x: ARENA_RIGHT + 5,
      y: ARENA_CY,
      vx: 3,
      vy: 2,
    });
    bounceOffWall(ball);
    expect(ball.vx).toBeLessThan(0);
    // vy direction should be preserved on a flat vertical wall
    expect(ball.vy).toBeGreaterThan(0);
  });
});

describe("checkPipeSuckIn", () => {
  function makePipes(): Pipe[] {
    return createPipes();
  }

  it("should return -1 when ball is far from all pipes", () => {
    const ball = makeBall({ vx: 2, vy: 2 });
    const result = checkPipeSuckIn(ball, makePipes());
    expect(result).toBe(-1);
  });

  it("should teleport ball to a different pipe on suck-in", () => {
    let callCount = 0;
    vi.spyOn(Math, "random").mockImplementation(() => {
      callCount++;
      return callCount === 1 ? 0 : 0.5;
    });

    const pipes = makePipes();
    const ball = makeBall({
      x: pipes[0].x,
      y: pipes[0].y,
      vx: 3,
      vy: 0,
    });

    const result = checkPipeSuckIn(ball, pipes);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).not.toBe(0);

    vi.restoreAllMocks();
  });

  it("should preserve ball speed after suck-in (with boost)", () => {
    let callCount = 0;
    vi.spyOn(Math, "random").mockImplementation(() => {
      callCount++;
      return callCount === 1 ? 0 : 0.5;
    });

    const pipes = makePipes();
    const ball = makeBall({
      x: pipes[0].x,
      y: pipes[0].y,
      vx: 3,
      vy: 4,
    });
    const speedBefore = Math.hypot(ball.vx, ball.vy);

    checkPipeSuckIn(ball, pipes);
    const speedAfter = Math.hypot(ball.vx, ball.vy);
    expect(speedAfter).toBeCloseTo(speedBefore * BOUNCE_SPEED_BOOST, 3);

    vi.restoreAllMocks();
  });

  it("should increment bounceCount on suck-in", () => {
    let callCount = 0;
    vi.spyOn(Math, "random").mockImplementation(() => {
      callCount++;
      return callCount === 1 ? 0 : 0.5;
    });

    const pipes = makePipes();
    const ball = makeBall({
      x: pipes[0].x,
      y: pipes[0].y,
      vx: 3,
      vy: 0,
    });

    checkPipeSuckIn(ball, pipes);
    expect(ball.bounceCount).toBe(1);

    vi.restoreAllMocks();
  });

  it("should have higher suck-in probability at pipe center than at edge", () => {
    const pipes = makePipes();
    const runs = 200;

    let centerSuckIns = 0;
    for (let i = 0; i < runs; i++) {
      const ball = makeBall({
        x: pipes[0].x,
        y: pipes[0].y,
        vx: 3,
        vy: 0,
      });
      const result = checkPipeSuckIn(ball, pipes);
      if (result >= 0) centerSuckIns++;
    }

    let edgeSuckIns = 0;
    const edgeOffset = PIPE_RADIUS * 0.9;
    for (let i = 0; i < runs; i++) {
      const ball = makeBall({
        x: pipes[0].x + edgeOffset,
        y: pipes[0].y,
        vx: 3,
        vy: 0,
      });
      const result = checkPipeSuckIn(ball, pipes);
      if (result >= 0) edgeSuckIns++;
    }

    const centerRate = centerSuckIns / runs;
    const edgeRate = edgeSuckIns / runs;

    expect(centerRate).toBeGreaterThan(edgeRate);
    expect(centerRate).toBeGreaterThanOrEqual(0.7);
    expect(edgeRate).toBeLessThanOrEqual(0.4);
  });

  it("should never suck in a ball outside pipe radius", () => {
    const pipes = makePipes();
    const outsideOffset = PIPE_RADIUS + 5;

    for (let i = 0; i < 100; i++) {
      const ball = makeBall({
        x: pipes[0].x + outsideOffset,
        y: pipes[0].y,
        vx: 3,
        vy: 0,
      });
      const result = checkPipeSuckIn(ball, pipes);
      expect(result).toBe(-1);
    }
  });
});

describe("bounceOffWall — type-specific", () => {
  it("Ricochet should randomize bounce angle", () => {
    const angles: number[] = [];
    for (let i = 0; i < 20; i++) {
      const b = makeBall({
        x: ARENA_LEFT - 5,
        y: ARENA_CY,
        vx: -3,
        vy: 0,
        type: BallType.Ricochet,
      });
      bounceOffWall(b);
      angles.push(Math.atan2(b.vy, b.vx));
    }

    const uniqueAngles = new Set(angles.map(a => Math.round(a * 100)));
    expect(uniqueAngles.size).toBeGreaterThan(1);
  });

  it("Ricochet should preserve speed after random angle offset", () => {
    const ball = makeBall({
      x: ARENA_LEFT - 5,
      y: ARENA_CY,
      vx: -3,
      vy: 2,
      type: BallType.Ricochet,
    });
    const speedBefore = Math.hypot(ball.vx, ball.vy);
    bounceOffWall(ball);
    const speedAfter = Math.hypot(ball.vx, ball.vy);
    expect(speedAfter).toBeCloseTo(speedBefore * BOUNCE_SPEED_BOOST, 2);
  });

  it("Ricochet angle offset should be within ±45°", () => {
    for (let i = 0; i < 50; i++) {
      const b = makeBall({
        x: ARENA_RIGHT + 5,
        y: ARENA_CY,
        vx: 3,
        vy: 0,
        type: BallType.Ricochet,
      });
      bounceOffWall(b);
      const speed = Math.hypot(b.vx, b.vy);
      // vy component can't exceed sin(45°) of total speed
      expect(Math.abs(b.vy / speed)).toBeLessThanOrEqual(Math.sin(Math.PI / 4) + 0.01);
    }
  });

  it("SpeedDemon should get 2x speed boost per bounce", () => {
    const ball = makeBall({
      x: ARENA_LEFT - 5,
      y: ARENA_CY,
      vx: -3,
      vy: 0,
      type: BallType.SpeedDemon,
    });
    const speedBefore = Math.hypot(ball.vx, ball.vy);
    bounceOffWall(ball);
    const speedAfter = Math.hypot(ball.vx, ball.vy);
    expect(speedAfter / speedBefore).toBeCloseTo(2, 0);
  });

  it("SpeedDemon should compound speed over multiple bounces", () => {
    const ball = makeBall({
      x: ARENA_LEFT - 5,
      y: ARENA_CY,
      vx: -3,
      vy: 0,
      type: BallType.SpeedDemon,
    });
    const originalSpeed = Math.hypot(ball.vx, ball.vy);
    bounceOffWall(ball);
    ball.x = ARENA_RIGHT + 5;
    ball.vx = Math.abs(ball.vx);
    bounceOffWall(ball);
    const speedAfter2 = Math.hypot(ball.vx, ball.vy);
    // After 2 bounces: ~4x original
    expect(speedAfter2 / originalSpeed).toBeCloseTo(4, 0);
  });

  it("regular Dodgeball should NOT get 2x speed boost", () => {
    const ball = makeBall({
      x: ARENA_LEFT - 5,
      y: ARENA_CY,
      vx: -3,
      vy: 0,
      type: BallType.Dodgeball,
    });
    const speedBefore = Math.hypot(ball.vx, ball.vy);
    bounceOffWall(ball);
    const speedAfter = Math.hypot(ball.vx, ball.vy);
    expect(speedAfter / speedBefore).toBeCloseTo(BOUNCE_SPEED_BOOST, 2);
  });

  it("Tracker should get standard bounce boost (not 2x)", () => {
    const ball = makeBall({
      x: ARENA_RIGHT + 5,
      y: ARENA_CY,
      vx: 3,
      vy: 0,
      type: BallType.Tracker,
    });
    const speedBefore = Math.hypot(ball.vx, ball.vy);
    bounceOffWall(ball);
    const speedAfter = Math.hypot(ball.vx, ball.vy);
    expect(speedAfter / speedBefore).toBeCloseTo(BOUNCE_SPEED_BOOST, 2);
  });

  it("Giant should get standard bounce boost", () => {
    const ball = makeBall({
      x: ARENA_RIGHT + 5,
      y: ARENA_CY,
      vx: 2,
      vy: 0,
      type: BallType.Giant,
      radius: BALL_R * 3,
    });
    const speedBefore = Math.hypot(ball.vx, ball.vy);
    bounceOffWall(ball);
    const speedAfter = Math.hypot(ball.vx, ball.vy);
    expect(speedAfter / speedBefore).toBeCloseTo(BOUNCE_SPEED_BOOST, 2);
  });

  it("Ghost should get standard bounce boost", () => {
    const ball = makeBall({
      x: ARENA_LEFT - 5,
      y: ARENA_CY,
      vx: -3,
      vy: 0,
      type: BallType.Ghost,
    });
    const speedBefore = Math.hypot(ball.vx, ball.vy);
    bounceOffWall(ball);
    const speedAfter = Math.hypot(ball.vx, ball.vy);
    expect(speedAfter / speedBefore).toBeCloseTo(BOUNCE_SPEED_BOOST, 2);
  });

  it("Splitter should get standard bounce boost", () => {
    const ball = makeBall({
      x: ARENA_RIGHT + 5,
      y: ARENA_CY,
      vx: 3,
      vy: 0,
      type: BallType.Splitter,
    });
    const speedBefore = Math.hypot(ball.vx, ball.vy);
    bounceOffWall(ball);
    const speedAfter = Math.hypot(ball.vx, ball.vy);
    expect(speedAfter / speedBefore).toBeCloseTo(BOUNCE_SPEED_BOOST, 2);
  });

  it("Bomber should get standard bounce boost and increment bounceCount", () => {
    const ball = makeBall({
      x: ARENA_RIGHT + 5,
      y: ARENA_CY,
      vx: 3,
      vy: 0,
      type: BallType.Bomber,
    });
    const speedBefore = Math.hypot(ball.vx, ball.vy);
    bounceOffWall(ball);
    expect(ball.bounceCount).toBe(1);
    const speedAfter = Math.hypot(ball.vx, ball.vy);
    expect(speedAfter / speedBefore).toBeCloseTo(BOUNCE_SPEED_BOOST, 2);
  });

  it("Mirage should get standard bounce boost", () => {
    const ball = makeBall({
      x: ARENA_LEFT - 5,
      y: ARENA_CY,
      vx: -3,
      vy: 0,
      type: BallType.Mirage,
    });
    const speedBefore = Math.hypot(ball.vx, ball.vy);
    bounceOffWall(ball);
    const speedAfter = Math.hypot(ball.vx, ball.vy);
    expect(speedAfter / speedBefore).toBeCloseTo(BOUNCE_SPEED_BOOST, 2);
  });

  it("Zigzag should get standard bounce boost", () => {
    const ball = makeBall({
      x: ARENA_RIGHT + 5,
      y: ARENA_CY,
      vx: 3,
      vy: 0,
      type: BallType.Zigzag,
    });
    const speedBefore = Math.hypot(ball.vx, ball.vy);
    bounceOffWall(ball);
    const speedAfter = Math.hypot(ball.vx, ball.vy);
    expect(speedAfter / speedBefore).toBeCloseTo(BOUNCE_SPEED_BOOST, 2);
  });
});

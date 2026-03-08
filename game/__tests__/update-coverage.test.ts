import { describe, it, expect, vi, afterEach } from "vitest";
import { makeGame, startGame } from "../state";
import { update } from "../update";
import { ST, Ball } from "../types";
import { BallType } from "../balls/types";
import { BALL_R, ARENA_CX, ARENA_CY, PLAYER_HITBOX } from "../constants";

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

// ─── THROW state: balls in-flight without bouncing ───

describe("THROW state - in-flight balls", () => {
  it("should move thrown balls and return early without transitioning when no bounce/pipe", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.THROW;
    // Place thrown balls in the center, moving slowly so they won't hit walls
    g.thrown = [
      makeBall({ x: ARENA_CX, y: ARENA_CY, vx: 0.5, vy: -0.5, bounceCount: 0 }),
    ];

    const prevX = g.thrown[0].x;
    const prevY = g.thrown[0].y;

    update(g, 1 / 60);

    // State should still be THROW (no wall contact, no pipe suck-in)
    expect(g.state).toBe(ST.THROW);
    // Balls should have moved
    expect(g.thrown[0].x).not.toBe(prevX);
    expect(g.thrown[0].y).not.toBe(prevY);
    // Balls should NOT have been added to g.balls
    expect(g.balls.length).toBe(0);
  });

  it("should transition to DODGE when a thrown ball bounces off wall", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.THROW;
    // Place ball at wall edge so it will bounce
    g.thrown = [
      makeBall({ x: 5, y: 300, vx: -5, vy: 0, bounceCount: 0 }),
    ];
    // Mock random to prevent pipe suck-in (high value = no suck-in)
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    update(g, 1 / 60);

    // Should have transitioned to DODGE
    expect(g.state).toBe(ST.DODGE);
    // Thrown array should be empty, balls should have the ball
    expect(g.thrown.length).toBe(0);
    expect(g.balls.length).toBeGreaterThanOrEqual(1);
  });

  it("should transition to DODGE when a thrown ball is sucked into a pipe", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.THROW;
    // Place ball directly at a pipe location
    const pipe = g.pipes[0];
    g.thrown = [
      makeBall({ x: pipe.x, y: pipe.y, vx: 0.1, vy: 0.1, bounceCount: 0 }),
    ];

    vi.spyOn(Math, "random").mockReturnValue(0.5);

    update(g, 1 / 60);

    // Should have transitioned to DODGE (pipe suck-in counts as bounce)
    expect(g.state).toBe(ST.DODGE);
    // Ball sucked in should be in pipeQueue
    expect(g.pipeQueue.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Game Over on collision with lives <= 1 ───

describe("game over on collision", () => {
  it("should transition to OVER when player has 1 life and collides with a ball", () => {
    const g = makeDodgeState();
    g.lives = 1;
    // Place a real ball right on top of the player
    g.balls = [
      makeBall({
        x: g.px,
        y: g.py,
        vx: 0,
        vy: 0,
        isReal: true,
        radius: BALL_R,
      }),
    ];

    update(g, 1 / 60);

    expect(g.state).toBe(ST.OVER);
    expect(g.lives).toBe(0);
  });

  it("should set highScore on game over", () => {
    const g = makeDodgeState();
    g.lives = 1;
    g.score = 1500;
    g.highScore = 500;
    g.balls = [
      makeBall({ x: g.px, y: g.py, vx: 0, vy: 0, isReal: true }),
    ];

    update(g, 1 / 60);

    expect(g.state).toBe(ST.OVER);
    expect(g.highScore).toBe(1500);
  });

  it("should transition to HIT (not OVER) when player has 2+ lives", () => {
    const g = makeDodgeState();
    g.lives = 2;
    g.balls = [
      makeBall({ x: g.px, y: g.py, vx: 0, vy: 0, isReal: true }),
    ];

    update(g, 1 / 60);

    expect(g.state).toBe(ST.HIT);
    expect(g.lives).toBe(1);
  });

  it("should not trigger collision with non-real balls (ghosts)", () => {
    const g = makeDodgeState();
    g.lives = 1;
    g.balls = [
      makeBall({ x: g.px, y: g.py, vx: 0, vy: 0, isReal: false }),
    ];

    update(g, 1 / 60);

    // Should stay in DODGE since the ball is not real
    expect(g.state).toBe(ST.DODGE);
    expect(g.lives).toBe(1);
  });

  it("should not trigger collision when ball is out of hitbox range", () => {
    const g = makeDodgeState();
    g.lives = 1;
    g.balls = [
      makeBall({
        x: g.px + PLAYER_HITBOX + BALL_R + 50,
        y: g.py,
        vx: 0,
        vy: 0,
        isReal: true,
      }),
    ];

    update(g, 1 / 60);

    expect(g.state).toBe(ST.DODGE);
    expect(g.lives).toBe(1);
  });
});

// ─── Death animation timer ───

describe("Death animation", () => {
  it("sets deathAnimTimer and deathX/Y on player hit", () => {
    const g = makeDodgeState();
    g.balls = [
      makeBall({
        x: ARENA_CX, y: ARENA_CY,
        vx: 0, vy: 0, isReal: true,
        radius: PLAYER_HITBOX + 5,
      }),
    ];
    g.lives = 3;
    update(g, 1 / 60);
    expect(g.deathAnimTimer).toBeGreaterThan(0);
    expect(g.deathX).toBeCloseTo(ARENA_CX, 0);
    expect(g.deathY).toBeCloseTo(ARENA_CY, 0);
  });

  it("deathAnimTimer counts down each frame", () => {
    const g = makeDodgeState();
    g.deathAnimTimer = 0.5;
    update(g, 0.1);
    expect(g.deathAnimTimer).toBeCloseTo(0.4, 1);
  });
});

// ─── Pipe emergence animations ───

describe("Pipe emergence animations", () => {
  it("ticks pipeEmergeAnims timer and removes expired ones", () => {
    const g = makeDodgeState();
    g.pipeEmergeAnims = [
      { x: 100, y: 100, timer: 0.1, duration: 0.4, radius: 6, color: "#ff0000" },
    ];
    update(g, 0.15);
    // Timer expired, should be removed
    expect(g.pipeEmergeAnims.length).toBe(0);
  });

  it("keeps pipeEmergeAnims that haven't expired", () => {
    const g = makeDodgeState();
    g.pipeEmergeAnims = [
      { x: 100, y: 100, timer: 0.5, duration: 0.4, radius: 6, color: "#ff0000" },
    ];
    update(g, 0.1);
    expect(g.pipeEmergeAnims.length).toBe(1);
    expect(g.pipeEmergeAnims[0].timer).toBeCloseTo(0.4, 1);
  });

  it("spawns emergence anim when ball exits pipe queue", () => {
    const g = makeDodgeState();
    const ball = makeBall({ x: 100, y: 100, vx: 2, vy: 0 });
    g.pipeQueue = [{
      ball,
      pipeIndex: 0,
      delay: 0.01,
      totalDelay: 1,
    }];
    g.chargingPipes = [0];
    update(g, 0.02);
    expect(g.pipeEmergeAnims.length).toBe(1);
    expect(g.pipeEmergeAnims[0].x).toBe(g.pipes[0].x);
  });
});

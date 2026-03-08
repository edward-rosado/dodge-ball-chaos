import { describe, it, expect } from "vitest";
import { BallType } from "../balls/types";
import { createBall, createDodgeball } from "../balls/factory";
import { getAvailableTypes, getDodgeballCount } from "../balls/spawn";
import { updateBallByType } from "../balls/dispatcher";
import { makeGame, startGame, initRound } from "../state";
import { ST } from "../types";
import { ARENA_CX, ARENA_CY, BALL_R } from "../constants";

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
  it("should return Dodgeball, Zigzag, and Ghost for rounds 1-5", () => {
    const types = getAvailableTypes(1);
    expect(types).toContain(BallType.Dodgeball);
    expect(types).toContain(BallType.Zigzag);
    expect(types).toContain(BallType.Ghost);
    expect(types).not.toContain(BallType.Tracker);
    expect(types).toHaveLength(4); // 2x Dodgeball + Zigzag + Ghost
  });

  it("should introduce Zigzag at rounds 6-10", () => {
    const types = getAvailableTypes(6);
    expect(types).toContain(BallType.Zigzag);
    expect(types).not.toContain(BallType.Tracker);
  });

  it("should add Tracker and Ghost at rounds 11-20", () => {
    const types = getAvailableTypes(11);
    expect(types).toContain(BallType.Tracker);
    expect(types).toContain(BallType.Ghost);
    expect(types).toContain(BallType.Zigzag);
    expect(types).toHaveLength(4);
  });

  it("should add Ricochet and SpeedDemon at rounds 21-30", () => {
    const types = getAvailableTypes(21);
    expect(types).toContain(BallType.Ricochet);
    expect(types).toContain(BallType.SpeedDemon);
    expect(types).toHaveLength(6);
  });

  it("should add Splitter and Mirage at rounds 31-40", () => {
    const types = getAvailableTypes(31);
    expect(types).toContain(BallType.Splitter);
    expect(types).toContain(BallType.Mirage);
    expect(types).toHaveLength(8);
  });

  it("should have all 11 types at round 41+", () => {
    const types = getAvailableTypes(41);
    expect(types).toContain(BallType.Giant);
    expect(types).toContain(BallType.Bomber);
    expect(types).toContain(BallType.GravityWell);
    expect(types).toHaveLength(11);
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
    for (let r = 1; r <= 5; r++) {
      g.round = r;
      initRound(g);
      // launchQueue = min(maxBalls, round - 1)
      expect(g.launchQueue).toBe(Math.min(2, r - 1)); // L1-10 band maxBalls=2
    }
  });

  it("should cap launchQueue by band maxBalls", () => {
    const g = makeGame();
    // Round 10: min(2, 9) = 2 (L1-10 band maxBalls=2)
    g.round = 10;
    initRound(g);
    expect(g.launchQueue).toBe(2);

    // Round 15: min(3, 14) = 3 (L11-20 band maxBalls=3)
    g.round = 15;
    initRound(g);
    expect(g.launchQueue).toBe(3);
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

describe("Giant", () => {
  it("should have no special update behavior (size/speed set by factory)", () => {
    const ball = {
      x: 200, y: 200, vx: 2, vy: 0,
      bounceCount: 0, type: BallType.Giant,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R * 3, dead: false,
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
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
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
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
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
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
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
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
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
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
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
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
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
      age: 50, phaseTimer: 1, isReal: true, radius: BALL_R, dead: false,
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
      age: 299, phaseTimer: 0, isReal: false, radius: BALL_R, dead: false,
    };
    const g = makeGame();
    updateBallByType(ball, g, []);
    expect(ball.dead).toBe(true);
  });

  it("should not kill real Mirage balls", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 0, type: BallType.Mirage,
      age: 500, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
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
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
    };
    const g = makeGame();
    updateBallByType(ball, g, []);
    expect(ball.dead).toBe(false);
  });
});

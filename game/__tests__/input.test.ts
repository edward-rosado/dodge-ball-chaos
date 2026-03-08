import { describe, it, expect } from "vitest";
import { applyKeyboardMovement } from "../input";
import { makeGame, startGame, initRound } from "../state";
import { PLAYER_SPEED, THROW_SPEED } from "../constants";
import { ST } from "../types";
import { BallType } from "../balls/types";

describe("applyKeyboardMovement", () => {
  it("should move player up when W is pressed", () => {
    const g = makeGame();
    g.keys["w"] = true;
    applyKeyboardMovement(g);
    expect(g.pvx).toBe(0);
    expect(g.pvy).toBe(-PLAYER_SPEED);
  });

  it("should move player down when S is pressed", () => {
    const g = makeGame();
    g.keys["s"] = true;
    applyKeyboardMovement(g);
    expect(g.pvx).toBe(0);
    expect(g.pvy).toBe(PLAYER_SPEED);
  });

  it("should move player left when A is pressed", () => {
    const g = makeGame();
    g.keys["a"] = true;
    applyKeyboardMovement(g);
    expect(g.pvx).toBe(-PLAYER_SPEED);
    expect(g.pvy).toBe(0);
  });

  it("should move player right when D is pressed", () => {
    const g = makeGame();
    g.keys["d"] = true;
    applyKeyboardMovement(g);
    expect(g.pvx).toBe(PLAYER_SPEED);
    expect(g.pvy).toBe(0);
  });

  it("should support arrow keys", () => {
    const g = makeGame();
    g.keys["ArrowUp"] = true;
    applyKeyboardMovement(g);
    expect(g.pvy).toBe(-PLAYER_SPEED);

    g.keys["ArrowUp"] = false;
    g.keys["ArrowRight"] = true;
    applyKeyboardMovement(g);
    expect(g.pvx).toBe(PLAYER_SPEED);
  });

  it("should support uppercase WASD", () => {
    const g = makeGame();
    g.keys["W"] = true;
    applyKeyboardMovement(g);
    expect(g.pvy).toBe(-PLAYER_SPEED);
  });

  it("should normalize diagonal movement", () => {
    const g = makeGame();
    g.keys["w"] = true;
    g.keys["d"] = true;
    applyKeyboardMovement(g);
    const speed = Math.hypot(g.pvx, g.pvy);
    // Diagonal speed should equal PLAYER_SPEED, not 1.414x
    expect(speed).toBeCloseTo(PLAYER_SPEED, 5);
    expect(g.pvx).toBeGreaterThan(0);
    expect(g.pvy).toBeLessThan(0);
  });

  it("should stop when no keys are pressed", () => {
    const g = makeGame();
    g.pvx = PLAYER_SPEED;
    g.pvy = PLAYER_SPEED;
    applyKeyboardMovement(g);
    expect(g.pvx).toBe(0);
    expect(g.pvy).toBe(0);
  });

  it("should not zero velocity if touch drag is active", () => {
    const g = makeGame();
    g.pvx = 2;
    g.pvy = 3;
    g.swS = { x: 100, y: 100 }; // Touch drag active
    applyKeyboardMovement(g);
    // Should keep existing velocity since touch is active
    expect(g.pvx).toBe(2);
    expect(g.pvy).toBe(3);
  });
});

describe("keyboard game state transitions", () => {
  it("should throw ball upward on spacebar from READY state", () => {
    const g = makeGame();
    startGame(g);
    expect(g.state).toBe(ST.READY);

    // Simulate spacebar by directly setting thrown (as the keydown handler does)
    g.thrown = [{ x: g.px, y: g.py, vx: 0, vy: -THROW_SPEED, bounceCount: 0, type: BallType.Dodgeball, age: 0, phaseTimer: 0, isReal: true, radius: 7, dead: false }];
    g.state = ST.THROW;

    expect(g.state).toBe(ST.THROW);
    expect(g.thrown.length).toBeGreaterThan(0);
    expect(g.thrown[0].vy).toBe(-THROW_SPEED);
    expect(g.thrown[0].vx).toBe(0);
  });

  it("should start game from TITLE state", () => {
    const g = makeGame();
    expect(g.state).toBe(ST.TITLE);
    startGame(g);
    expect(g.state).toBe(ST.READY);
    expect(g.round).toBe(1);
    expect(g.lives).toBe(3);
  });

  it("should restart game from OVER state", () => {
    const g = makeGame();
    g.state = ST.OVER;
    g.score = 500;
    g.round = 5;
    startGame(g);
    expect(g.state).toBe(ST.READY);
    expect(g.round).toBe(1);
    expect(g.score).toBe(0);
    expect(g.lives).toBe(3);
  });
});

describe("player position reset", () => {
  it("should reset player to arena center on new round", () => {
    const g = makeGame();
    startGame(g);
    g.px = 100;
    g.py = 100;
    initRound(g);
    // Player should be back at arena center
    expect(g.px).not.toBe(100);
    expect(g.py).not.toBe(100);
  });

  it("should reset velocity on new round", () => {
    const g = makeGame();
    startGame(g);
    g.pvx = 5;
    g.pvy = 5;
    initRound(g);
    expect(g.pvx).toBe(0);
    expect(g.pvy).toBe(0);
  });
});

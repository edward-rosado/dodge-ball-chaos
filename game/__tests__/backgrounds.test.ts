import { describe, it, expect } from "vitest";
import { getBackgroundIdForRound, getBackgroundConfigFactory } from "../renderer/backgrounds";

// Background IDs: 0=Kami's Lookout, 1=Desert Wasteland, 2=King Kai's Planet, 3=Time Chamber, 4=Frieza's Ship, 5=Mega Man Style, 6=Gravity Room, 7=Tournament

describe("getBackgroundIdForRound", () => {
  it("should return 6 (Gravity Room) for round 50 — final boss area", () => {
    expect(getBackgroundIdForRound(50)).toBe(6);
  });

  it("should return 4 for rounds 40-49 (Frieza's Ship)", () => {
    for (let r = 40; r <= 49; r++) {
      expect(getBackgroundIdForRound(r)).toBe(4);
    }
  });

  it("should return 3 (Time Chamber) for rounds 30-39", () => {
    for (let r = 30; r <= 39; r++) {
      expect(getBackgroundIdForRound(r)).toBe(3);
    }
  });

  it("should return 2 (King Kai's Planet) for rounds 20-29", () => {
    for (let r = 20; r <= 29; r++) {
      expect(getBackgroundIdForRound(r)).toBe(2);
    }
  });

  it("should return 1 (Desert Wasteland) for rounds 10-19", () => {
    for (let r = 10; r <= 19; r++) {
      expect(getBackgroundIdForRound(r)).toBe(1);
    }
  });

  it("should return 0 (Kami's Lookout) for rounds 1-9 — starting area", () => {
    for (let r = 1; r <= 9; r++) {
      expect(getBackgroundIdForRound(r)).toBe(0);
    }
  });

  it("is stable: same round always returns the same ID (no randomness)", () => {
    const id = getBackgroundIdForRound(25);
    for (let i = 0; i < 100; i++) {
      expect(getBackgroundIdForRound(25)).toBe(id);
    }
  });
});

describe("getBackgroundConfigFactory", () => {
  it("should return a function for valid IDs 0-7", () => {
    for (let id = 0; id <= 7; id++) {
      const fn = getBackgroundConfigFactory(id);
      expect(typeof fn).toBe("function");
    }
  });

  it("should fallback to BACKGROUNDS[0] for invalid ID", () => {
    const fallback = getBackgroundConfigFactory(0);
    expect(getBackgroundConfigFactory(99)).toBe(fallback);
    expect(getBackgroundConfigFactory(-1)).toBe(fallback);
  });
});
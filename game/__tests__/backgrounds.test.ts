import { describe, it, expect } from "vitest";
import { getBackgroundIdForRound, getBackgroundDrawFn } from "../renderer/backgrounds";

// Background IDs: 0=KamisLookout, 1=DesertWasteland, 2=KingKaiPlanet, 3=TimeChamber, 4=FriezaShip

describe("getBackgroundIdForRound", () => {
  it("should return 4 (Frieza's Ship) for round 50 — final boss area", () => {
    expect(getBackgroundIdForRound(50)).toBe(4);
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

describe("getBackgroundDrawFn", () => {
  it("should return a function for valid IDs 0-4", () => {
    for (let id = 0; id <= 4; id++) {
      const fn = getBackgroundDrawFn(id);
      expect(typeof fn).toBe("function");
    }
  });

  it("should fallback to BACKGROUNDS[0] for invalid ID", () => {
    const fallback = getBackgroundDrawFn(0);
    expect(getBackgroundDrawFn(99)).toBe(fallback);
    expect(getBackgroundDrawFn(-1)).toBe(fallback);
  });
});

import { describe, it, expect } from "vitest";
import { getLevelConfig, isMilestoneLevel } from "../progression";

describe("getLevelConfig", () => {
  it("Level 1 returns 1 dodgeball and training music", () => {
    const cfg = getLevelConfig(1);
    expect(cfg.dodgeballs).toBe(1);
    expect(cfg.musicTrack).toBe("training");
    expect(cfg.isMilestone).toBe(false);
    expect(cfg.isBossFight).toBe(false);
  });

  it("Level 10 is milestone with 2 dodgeballs and ultraInstinct music", () => {
    const cfg = getLevelConfig(10);
    expect(cfg.dodgeballs).toBe(2);
    expect(cfg.musicTrack).toBe("ultraInstinct");
    expect(cfg.isMilestone).toBe(true);
    expect(cfg.isUltraInstinct).toBe(true);
  });

  it("Level 50 is boss fight with Frieza's Ship in background pool", () => {
    const cfg = getLevelConfig(50);
    expect(cfg.isBossFight).toBe(true);
    expect(cfg.backgroundPool).toContain(5); // Frieza's Ship
    expect(cfg.musicTrack).toBe("ultraInstinct");
    expect(cfg.dodgeballs).toBe(5);
  });

  it("All milestone levels (10, 20, 30, 40, 50) have isUltraInstinct = true", () => {
    for (const round of [10, 20, 30, 40, 50]) {
      const cfg = getLevelConfig(round);
      expect(cfg.isUltraInstinct).toBe(true);
      expect(cfg.isMilestone).toBe(true);
    }
  });

  it("Non-milestone levels have isUltraInstinct = false", () => {
    for (const round of [1, 5, 9, 11, 15, 25, 35, 45, 49]) {
      const cfg = getLevelConfig(round);
      expect(cfg.isUltraInstinct).toBe(false);
    }
  });

  it("Dodgeball counts follow the design table exactly", () => {
    // Levels 1-9: 1 dodgeball
    for (let r = 1; r <= 9; r++) {
      expect(getLevelConfig(r).dodgeballs).toBe(1);
    }
    // Level 10: 2
    expect(getLevelConfig(10).dodgeballs).toBe(2);
    // Levels 11-19: 2
    for (let r = 11; r <= 19; r++) {
      expect(getLevelConfig(r).dodgeballs).toBe(2);
    }
    // Level 20: 3
    expect(getLevelConfig(20).dodgeballs).toBe(3);
    // Levels 21-29: 3
    for (let r = 21; r <= 29; r++) {
      expect(getLevelConfig(r).dodgeballs).toBe(3);
    }
    // Level 30: 4
    expect(getLevelConfig(30).dodgeballs).toBe(4);
    // Levels 31-39: 4
    for (let r = 31; r <= 39; r++) {
      expect(getLevelConfig(r).dodgeballs).toBe(4);
    }
    // Level 40: 5
    expect(getLevelConfig(40).dodgeballs).toBe(5);
    // Levels 41-50: 5
    for (let r = 41; r <= 50; r++) {
      expect(getLevelConfig(r).dodgeballs).toBe(5);
    }
  });

  it("Music tracks follow the phase table", () => {
    // 1-9: training
    for (let r = 1; r <= 9; r++) {
      expect(getLevelConfig(r).musicTrack).toBe("training");
    }
    // 10: ultraInstinct
    expect(getLevelConfig(10).musicTrack).toBe("ultraInstinct");
    // 11-19: battle
    for (let r = 11; r <= 19; r++) {
      expect(getLevelConfig(r).musicTrack).toBe("battle");
    }
    // 20: ultraInstinct
    expect(getLevelConfig(20).musicTrack).toBe("ultraInstinct");
    // 21-29: heavyBattle
    for (let r = 21; r <= 29; r++) {
      expect(getLevelConfig(r).musicTrack).toBe("heavyBattle");
    }
    // 30: ultraInstinct
    expect(getLevelConfig(30).musicTrack).toBe("ultraInstinct");
    // 31-39: escalating
    for (let r = 31; r <= 39; r++) {
      expect(getLevelConfig(r).musicTrack).toBe("escalating");
    }
    // 40: ultraInstinct
    expect(getLevelConfig(40).musicTrack).toBe("ultraInstinct");
    // 41-49: peak
    for (let r = 41; r <= 49; r++) {
      expect(getLevelConfig(r).musicTrack).toBe("peak");
    }
    // 50: ultraInstinct
    expect(getLevelConfig(50).musicTrack).toBe("ultraInstinct");
  });

  it("Power-up chance increases with round", () => {
    const chance1 = getLevelConfig(1).powerUpChance;
    const chance25 = getLevelConfig(25).powerUpChance;
    const chance50 = getLevelConfig(50).powerUpChance;
    expect(chance1).toBeCloseTo(0.1, 2);
    expect(chance25).toBeGreaterThan(chance1);
    expect(chance50).toBeGreaterThan(chance25);
    expect(chance50).toBeCloseTo(0.6, 2);
  });

  it("Bonus life at correct intervals (every 5th round from 10)", () => {
    // No bonus before round 10
    for (let r = 1; r <= 9; r++) {
      expect(getLevelConfig(r).bonusLife).toBe(false);
    }
    // Bonus at 10, 15, 20, 25, 30, 35, 40, 45, 50
    for (const r of [10, 15, 20, 25, 30, 35, 40, 45, 50]) {
      expect(getLevelConfig(r).bonusLife).toBe(true);
    }
    // No bonus at non-5th rounds after 10
    for (const r of [11, 12, 13, 14, 16, 21, 22, 33, 49]) {
      expect(getLevelConfig(r).bonusLife).toBe(false);
    }
  });

  it("Background pool for levels 1-9 is Kami's Lookout and Namek", () => {
    for (let r = 1; r <= 9; r++) {
      const cfg = getLevelConfig(r);
      expect(cfg.backgroundPool).toEqual([0, 1]);
    }
  });

  it("Background pool for level 50 includes Frieza's Ship", () => {
    const cfg = getLevelConfig(50);
    expect(cfg.backgroundPool).toContain(5);
    expect(cfg.backgroundPool).toContain(1); // Namek
  });
});

describe("isMilestoneLevel", () => {
  it("returns true for milestone levels", () => {
    expect(isMilestoneLevel(10)).toBe(true);
    expect(isMilestoneLevel(20)).toBe(true);
    expect(isMilestoneLevel(30)).toBe(true);
    expect(isMilestoneLevel(40)).toBe(true);
    expect(isMilestoneLevel(50)).toBe(true);
  });

  it("returns false for non-milestone levels", () => {
    expect(isMilestoneLevel(1)).toBe(false);
    expect(isMilestoneLevel(9)).toBe(false);
    expect(isMilestoneLevel(15)).toBe(false);
    expect(isMilestoneLevel(25)).toBe(false);
    expect(isMilestoneLevel(49)).toBe(false);
  });
});

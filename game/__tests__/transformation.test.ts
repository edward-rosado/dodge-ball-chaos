import { describe, it, expect } from "vitest";
import { SaiyanForm, getFormForRound, getHairPalette, getEyeColor, getAuraColor } from "../transformation";

describe("getFormForRound", () => {
  it("returns Base for rounds 1-9", () => {
    expect(getFormForRound(1)).toBe(SaiyanForm.Base);
    expect(getFormForRound(5)).toBe(SaiyanForm.Base);
    expect(getFormForRound(9)).toBe(SaiyanForm.Base);
  });

  it("returns SSJ for rounds 10-19", () => {
    expect(getFormForRound(10)).toBe(SaiyanForm.SSJ);
    expect(getFormForRound(15)).toBe(SaiyanForm.SSJ);
    expect(getFormForRound(19)).toBe(SaiyanForm.SSJ);
  });

  it("returns SSJ2 for rounds 20-29", () => {
    expect(getFormForRound(20)).toBe(SaiyanForm.SSJ2);
    expect(getFormForRound(25)).toBe(SaiyanForm.SSJ2);
    expect(getFormForRound(29)).toBe(SaiyanForm.SSJ2);
  });

  it("returns SSJ3 for rounds 30-39", () => {
    expect(getFormForRound(30)).toBe(SaiyanForm.SSJ3);
    expect(getFormForRound(35)).toBe(SaiyanForm.SSJ3);
    expect(getFormForRound(39)).toBe(SaiyanForm.SSJ3);
  });

  it("returns SSJBlue for rounds 40-49", () => {
    expect(getFormForRound(40)).toBe(SaiyanForm.SSJBlue);
    expect(getFormForRound(45)).toBe(SaiyanForm.SSJBlue);
    expect(getFormForRound(49)).toBe(SaiyanForm.SSJBlue);
  });

  it("returns UltraInstinct for round 50+", () => {
    expect(getFormForRound(50)).toBe(SaiyanForm.UltraInstinct);
    expect(getFormForRound(99)).toBe(SaiyanForm.UltraInstinct);
  });
});

describe("getHairPalette", () => {
  it("returns dark colors for Base form", () => {
    const p = getHairPalette(SaiyanForm.Base);
    expect(p.main).toMatch(/^#1/); // Dark color starts with #1
  });

  it("returns golden colors for SSJ", () => {
    const p = getHairPalette(SaiyanForm.SSJ);
    expect(p.main).toBe("#f5c542");
  });

  it("returns blue colors for SSJBlue", () => {
    const p = getHairPalette(SaiyanForm.SSJBlue);
    expect(p.main).toBe("#3a86ff");
  });

  it("returns silver for Ultra Instinct", () => {
    const p = getHairPalette(SaiyanForm.UltraInstinct);
    expect(p.main).toBe("#c0c0d0");
  });
});

describe("getEyeColor", () => {
  it("has dark eyes at Base", () => {
    expect(getEyeColor(SaiyanForm.Base)).toBe("#222222");
  });

  it("has green eyes at SSJ", () => {
    expect(getEyeColor(SaiyanForm.SSJ)).toMatch(/^#2a/);
  });

  it("has blue eyes at SSJBlue", () => {
    expect(getEyeColor(SaiyanForm.SSJBlue)).toBe("#3a86ff");
  });
});

describe("getAuraColor", () => {
  it("returns null for Base (no aura)", () => {
    expect(getAuraColor(SaiyanForm.Base)).toBeNull();
  });

  it("returns golden for SSJ", () => {
    expect(getAuraColor(SaiyanForm.SSJ)).toContain("245");
  });

  it("returns blue for SSJBlue", () => {
    expect(getAuraColor(SaiyanForm.SSJBlue)).toContain("58,134,255");
  });

  it("returns null for UI (uses special glow)", () => {
    expect(getAuraColor(SaiyanForm.UltraInstinct)).toBeNull();
  });
});

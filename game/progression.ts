// ─── Level Progression System ───
// Provides configuration for all 50 levels based on the approved design doc.

export interface LevelConfig {
  round: number;
  dodgeballs: number;
  backgroundPool: number[];     // Background IDs from backgrounds/index.ts
  musicTrack: string;           // Track name for audio system
  isMilestone: boolean;         // Levels 10, 20, 30, 40, 50
  isUltraInstinct: boolean;     // Same as milestone
  isBossFight: boolean;         // Level 50
  powerUpChance: number;        // Probability of power-up spawn (0..1, scales with level)
  bonusLife: boolean;           // +1 life on clear (every 5th round from 10)
}

/** Milestone rounds that trigger Ultra Instinct visual + bonus effects. */
const MILESTONES = new Set([10, 20, 30, 40, 50]);

/** Background IDs:
 *  0: Kami's Lookout
 *  1: Namek
 *  2: Hyperbolic Time Chamber
 *  3: Gravity Room
 *  4: World Tournament
 *  5: Frieza's Ship
 */
const ALL_BACKGROUNDS = [0, 1, 2, 3, 4, 5];
const ALL_EXCEPT_FRIEZA = [0, 1, 2, 3, 4];

/**
 * Check if a round is a milestone level (10, 20, 30, 40, 50).
 */
export function isMilestoneLevel(round: number): boolean {
  return MILESTONES.has(round);
}

/**
 * Configuration for each level band, indexed by the first round of the band.
 * Covers rounds 1–50 with exact values; rounds >50 fall back to band 40.
 */
const BAND_CONFIGS: Record<number, { dodgeballs: number; backgroundPool: number[]; musicTrack: string }> = {
  1:  { dodgeballs: 1, backgroundPool: [0, 1],              musicTrack: "training" },
  10: { dodgeballs: 2, backgroundPool: ALL_EXCEPT_FRIEZA,   musicTrack: "ultraInstinct" },
  11: { dodgeballs: 2, backgroundPool: [3, 4],              musicTrack: "battle" },
  20: { dodgeballs: 3, backgroundPool: ALL_EXCEPT_FRIEZA,   musicTrack: "ultraInstinct" },
  21: { dodgeballs: 3, backgroundPool: [2, 0],              musicTrack: "heavyBattle" },
  30: { dodgeballs: 4, backgroundPool: ALL_EXCEPT_FRIEZA,   musicTrack: "ultraInstinct" },
  31: { dodgeballs: 4, backgroundPool: ALL_EXCEPT_FRIEZA,   musicTrack: "escalating" },
  40: { dodgeballs: 5, backgroundPool: ALL_EXCEPT_FRIEZA,   musicTrack: "ultraInstinct" },
  41: { dodgeballs: 5, backgroundPool: ALL_BACKGROUNDS,     musicTrack: "peak" },
  50: { dodgeballs: 5, backgroundPool: [5, 1],              musicTrack: "ultraInstinct" },
};

/**
 * Get full level configuration for a given round number (1-50+).
 * Rounds above 50 use level 50 config with scaling power-up chance.
 */
export function getLevelConfig(round: number): LevelConfig {
  const clamped = Math.max(1, round);
  const milestone = isMilestoneLevel(clamped);
  const bonusLife = clamped >= 10 && clamped % 5 === 0;

  // Power-up chance scales linearly from 0.1 at round 1 to 0.6 at round 50
  const powerUpChance = Math.min(0.6, 0.1 + (clamped - 1) * (0.5 / 49));

  // Boss fight is level 50
  const isBossFight = clamped === 50;

  // Look up band config — milestones use their own entry, non-milestones use the band start.
  const bandKey = clamped <= 9 ? 1 : clamped <= 19 ? 11 : clamped <= 29 ? 21 : clamped <= 39 ? 31 : clamped <= 49 ? 41 : 50;
  const band = milestone ? BAND_CONFIGS[clamped] : BAND_CONFIGS[bandKey];

  return {
    round: clamped,
    ...band,
    isMilestone: milestone,
    isUltraInstinct: milestone,
    isBossFight,
    powerUpChance,
    bonusLife,
  };
}
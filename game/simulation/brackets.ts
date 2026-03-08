/** Difficulty gates per level bracket — one-sided minimum survival. */
export interface Bracket {
  readonly name: string;
  readonly maxRound: number;
  readonly minSurvival: number; // Too hard if below
  readonly maxSurvival: number; // Upper bound (set high to allow flexibility)
}

export const BRACKETS: readonly Bracket[] = [
  { name: "L1-10",  maxRound: 10, minSurvival: 0.80, maxSurvival: 1.00 },
  { name: "L11-20", maxRound: 20, minSurvival: 0.70, maxSurvival: 1.00 },
  { name: "L21-30", maxRound: 30, minSurvival: 0.60, maxSurvival: 1.00 },
  { name: "L31-40", maxRound: 40, minSurvival: 0.50, maxSurvival: 1.00 },
  { name: "L41-49", maxRound: 49, minSurvival: 0.40, maxSurvival: 1.00 },
  { name: "L50",    maxRound: 50, minSurvival: 0.35, maxSurvival: 1.00 },
] as const;

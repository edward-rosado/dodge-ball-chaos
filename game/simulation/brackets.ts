/** Two-sided difficulty gates per level bracket. */
export interface Bracket {
  readonly name: string;
  readonly maxRound: number;
  readonly minSurvival: number; // Too hard if below
  readonly maxSurvival: number; // Too easy if above
}

export const BRACKETS: readonly Bracket[] = [
  { name: "L1-10",  maxRound: 10, minSurvival: 0.60, maxSurvival: 0.70 },
  { name: "L11-20", maxRound: 20, minSurvival: 0.50, maxSurvival: 0.60 },
  { name: "L21-30", maxRound: 30, minSurvival: 0.40, maxSurvival: 0.50 },
  { name: "L31-40", maxRound: 40, minSurvival: 0.30, maxSurvival: 0.40 },
  { name: "L41-49", maxRound: 49, minSurvival: 0.25, maxSurvival: 0.35 },
  { name: "L50",    maxRound: 50, minSurvival: 0.20, maxSurvival: 0.30 },
] as const;

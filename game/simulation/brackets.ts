/** Difficulty gates per level bracket — survival range for nerfed bot. */
export interface Bracket {
  readonly name: string;
  readonly maxRound: number;
  readonly minSurvival: number; // Too hard if below
  readonly maxSurvival: number; // Too easy if above
}

export const BRACKETS: readonly Bracket[] = [
  { name: "L1-5",   maxRound: 5,  minSurvival: 0.95, maxSurvival: 1.00 },  // Basically free
  { name: "L6-10",  maxRound: 10, minSurvival: 0.88, maxSurvival: 1.00 },  // Very easy
  { name: "L11-15", maxRound: 15, minSurvival: 0.80, maxSurvival: 1.00 },  // Easy
  { name: "L16-20", maxRound: 20, minSurvival: 0.70, maxSurvival: 1.00 },  // Moderate
  { name: "L21-25", maxRound: 25, minSurvival: 0.55, maxSurvival: 1.00 },  // Average player ceiling
  { name: "L26-30", maxRound: 30, minSurvival: 0.40, maxSurvival: 1.00 },  // Challenging
  { name: "L31-40", maxRound: 40, minSurvival: 0.25, maxSurvival: 1.00 },  // Hard
  { name: "L41-49", maxRound: 49, minSurvival: 0.15, maxSurvival: 1.00 },  // Very hard
  { name: "L50",    maxRound: 50, minSurvival: 0.10, maxSurvival: 1.00 },  // Near impossible
] as const;

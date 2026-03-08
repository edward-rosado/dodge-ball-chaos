/** Two-sided difficulty gates per level bracket.
 *  Both bounds enforced: too easy (no fail rate) is just as bad as too hard. */
export interface Bracket {
  readonly name: string;
  readonly maxRound: number;
  readonly minSurvival: number; // Too hard if below
  readonly maxSurvival: number; // Too easy if above
}

export const BRACKETS: readonly Bracket[] = [
  { name: "L1-5",   maxRound: 5,  minSurvival: 0.95, maxSurvival: 1.00 },  // Basically free
  { name: "L6-10",  maxRound: 10, minSurvival: 0.88, maxSurvival: 0.99 },  // Very easy — ~1-12% fail
  { name: "L11-15", maxRound: 15, minSurvival: 0.80, maxSurvival: 0.92 },  // Easy — ~8-20% fail
  { name: "L16-20", maxRound: 20, minSurvival: 0.70, maxSurvival: 0.85 },  // Moderate — ~15-30% fail
  { name: "L21-25", maxRound: 25, minSurvival: 0.55, maxSurvival: 0.72 },  // Above avg — ~28-45% fail
  { name: "L26-30", maxRound: 30, minSurvival: 0.40, maxSurvival: 0.58 },  // Challenging — ~42-60% fail
  { name: "L31-40", maxRound: 40, minSurvival: 0.25, maxSurvival: 0.42 },  // Hard — ~58-75% fail
  { name: "L41-49", maxRound: 49, minSurvival: 0.15, maxSurvival: 0.28 },  // Very hard — ~72-85% fail
  { name: "L50",    maxRound: 50, minSurvival: 0.10, maxSurvival: 0.22 },  // Near impossible — ~78-90% fail
] as const;

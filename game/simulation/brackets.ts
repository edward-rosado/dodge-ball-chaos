/** Two-sided difficulty gates per level bracket.
 *  Both bounds enforced: too easy (no fail rate) is just as bad as too hard.
 *  Bounds widened to ±5% to account for 100-run simulation variance. */
export interface Bracket {
  readonly name: string;
  readonly maxRound: number;
  readonly minSurvival: number; // Too hard if below
  readonly maxSurvival: number; // Too easy if above
}

export const BRACKETS: readonly Bracket[] = [
  { name: "L1-5",   maxRound: 5,  minSurvival: 0.93, maxSurvival: 1.00 },  // Basically free
  { name: "L6-10",  maxRound: 10, minSurvival: 0.85, maxSurvival: 1.00 },  // Very easy — ~0-15% fail
  { name: "L11-15", maxRound: 15, minSurvival: 0.75, maxSurvival: 0.95 },  // Easy — ~5-25% fail
  { name: "L16-20", maxRound: 20, minSurvival: 0.65, maxSurvival: 0.88 },  // Moderate — ~12-35% fail
  { name: "L21-25", maxRound: 25, minSurvival: 0.50, maxSurvival: 0.75 },  // Above avg — ~25-50% fail
  { name: "L26-30", maxRound: 30, minSurvival: 0.35, maxSurvival: 0.62 },  // Challenging — ~38-65% fail
  { name: "L31-40", maxRound: 40, minSurvival: 0.22, maxSurvival: 0.45 },  // Hard — ~55-78% fail
  { name: "L41-49", maxRound: 49, minSurvival: 0.10, maxSurvival: 0.30 },  // Very hard — ~70-90% fail
  { name: "L50",    maxRound: 50, minSurvival: 0.05, maxSurvival: 0.25 },  // Near impossible — ~75-95% fail
] as const;

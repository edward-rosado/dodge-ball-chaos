import { BracketResult } from "./runner";

/** Format bracket results as an ASCII table for CLI output. */
export function formatTable(results: BracketResult[]): string {
  const lines: string[] = [];
  lines.push("+---------+------+---------+-------------+");
  lines.push("| Bracket | Rate | Target  | Status      |");
  lines.push("+---------+------+---------+-------------+");

  for (const r of results) {
    const name = r.bracket.name.padEnd(7);
    const rate = (Math.round(r.rate * 100) + "%").padStart(4);
    const maxPct = Math.round(r.bracket.maxSurvival * 100);
    const target = maxPct >= 100
      ? `${Math.round(r.bracket.minSurvival * 100)}%+`
      : `${Math.round(r.bracket.minSurvival * 100)}-${maxPct}%`;
    const targetPad = target.padEnd(7);
    let status: string;
    if (r.tooHard) status = "FAIL too hard";
    else if (r.tooEasy) status = "FAIL too easy";
    else status = "PASS";
    const statusPad = status.padEnd(11);
    lines.push(`| ${name} | ${rate} | ${targetPad} | ${statusPad} |`);
  }

  lines.push("+---------+------+---------+-------------+");
  return lines.join("\n");
}

/** Check if rates are monotonically non-increasing across brackets.
 *  Allows a small tolerance (2%) to account for simulation variance. */
export function checkMonotonic(results: BracketResult[]): boolean {
  for (let i = 1; i < results.length; i++) {
    if (results[i].rate > results[i - 1].rate + 0.02) return false;
  }
  return true;
}

/** Check all results and return summary. */
export function checkAll(results: BracketResult[]): {
  passed: boolean;
  failedBrackets: string[];
  monotonicPassed: boolean;
} {
  const failedBrackets = results
    .filter((r) => !r.passed)
    .map((r) => {
      const dir = r.tooHard ? "too hard" : "too easy";
      return `${r.bracket.name}: ${Math.round(r.rate * 100)}% (${dir})`;
    });

  const monotonicPassed = checkMonotonic(results);

  return {
    passed: failedBrackets.length === 0 && monotonicPassed,
    failedBrackets,
    monotonicPassed,
  };
}

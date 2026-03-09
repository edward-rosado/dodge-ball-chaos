import { runAllBrackets } from "../game/simulation/runner";
import { formatTable, checkAll } from "../game/simulation/reporter";

const RUNS = parseInt(process.env.BEATABILITY_RUNS || "100", 10);

console.log(`\nBeatability Report (${RUNS} runs per bracket)\n`);

const results = runAllBrackets(RUNS);
console.log(formatTable(results));

const summary = checkAll(results);

if (summary.monotonicPassed) {
  console.log("\nDifficulty curve: PASS (monotonic decrease)");
} else {
  console.log("\nDifficulty curve: FAIL (not monotonically decreasing)");
}

if (summary.passed) {
  console.log(`\nResult: PASS (${results.length}/${results.length} brackets in range)\n`);
  process.exit(0);
} else {
  console.log(`\nResult: FAIL`);
  for (const f of summary.failedBrackets) {
    console.log(`  - ${f}`);
  }
  console.log();
  process.exit(1);
}

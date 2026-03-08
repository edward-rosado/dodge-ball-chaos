# Phase 6: Beatability Testing + Balance Framework

**Date:** 2026-03-08
**Status:** Approved
**Goal:** Headless simulation framework with two-sided difficulty gates, CLI reporter, and pre-push hook.

---

## Decision: Move Phase 6 Before Phase 2

Phase 6 (beatability testing) is implemented before Phase 2 (ball types) so that every gameplay change is automatically validated against the difficulty curve. This prevents silent difficulty regressions.

---

## 1. Core Refactor — Separate Update from Render

Split `loop.ts` into pure game logic and rendering:

```
game/
  update.ts    # Pure logic: update(g, dt, moveProvider?) — no canvas
  loop.ts      # Thin shell: tick(ctx, g, dt) calls update() then renders
```

`update(g, dt, moveProvider?)` handles:
- Player movement (via `moveProvider` callback — keyboard for real game, bot for simulation)
- Ball launching from pipes
- Ball physics (bounce + pipe suck-in)
- Collision detection
- Power-up collection
- Round timer + state transitions

**Why:** Single source of truth. When Phase 2 adds ball types or Phase 3 adds power-ups, the simulation automatically picks up the changes. No drift between real game and headless sim.

---

## 2. Simulation Modules

```
game/simulation/
  bot.ts         # botMove(g): predictive threat avoidance + power-up collection
  brackets.ts    # Bracket config: difficulty bands per level range
  runner.ts      # simulateGame(), survivalRate(), runAllBrackets()
  reporter.ts    # ASCII table formatter, pass/fail checker
```

### bot.ts — Predictive Threat Avoidance AI

Extracted from current `beatability.test.ts`. Capabilities:
- Evaluates 16 candidate directions + standing still
- Checks 3 time horizons (5, 10, 20 frames ahead)
- Maximizes minimum distance from predicted ball positions
- Center bonus (prefers positions with more escape room)
- Wall penalty (avoids getting trapped at edges)
- **NEW:** Power-up collection when safe (detour toward power-up if no immediate threat)

### brackets.ts — Two-Sided Difficulty Gates

```typescript
export const BRACKETS = [
  { name: "L1-10",  maxRound: 10, minSurvival: 0.60, maxSurvival: 0.70 },
  { name: "L11-20", maxRound: 20, minSurvival: 0.50, maxSurvival: 0.60 },
  { name: "L21-30", maxRound: 30, minSurvival: 0.40, maxSurvival: 0.50 },
  { name: "L31-40", maxRound: 40, minSurvival: 0.30, maxSurvival: 0.40 },
  { name: "L41-49", maxRound: 49, minSurvival: 0.25, maxSurvival: 0.35 },
  { name: "L50",    maxRound: 50, minSurvival: 0.20, maxSurvival: 0.30 },
] as const;
```

| Bracket | Too Hard (fail) | Sweet Spot | Too Easy (fail) |
|---------|----------------|------------|-----------------|
| L1-10   | < 60%          | 60-70%     | > 70%           |
| L11-20  | < 50%          | 50-60%     | > 60%           |
| L21-30  | < 40%          | 40-50%     | > 50%           |
| L31-40  | < 30%          | 30-40%     | > 40%           |
| L41-49  | < 25%          | 25-35%     | > 35%           |
| L50     | < 20%          | 20-30%     | > 30%           |

Both sides are hard gates — too easy is just as much a failure as too hard.

### runner.ts — Headless Game Runner

- `simulateGame(maxRounds)` — Runs a full game with bot AI, returns `{ roundReached, survived }`
- `survivalRate(maxRounds, runs)` — Runs N simulations, returns survival fraction
- `runAllBrackets(runsPerBracket)` — Runs all brackets, returns results array
- Uses `update(g, dt, botMove)` — no rendering, no canvas dependency

### reporter.ts — CLI Output + Pass/Fail

- `formatTable(results)` — ASCII table with bracket, rate, target range, status
- `checkThresholds(results)` — Returns `{ passed: boolean, failures: string[] }`

---

## 3. Vitest Integration

`beatability.test.ts` becomes a thin wrapper importing from simulation modules:

```typescript
import { BRACKETS } from "../simulation/brackets";
import { survivalRate } from "../simulation/runner";

describe("beatability — not too hard", () => {
  for (const b of BRACKETS) {
    it(`${b.name}: survival ≥ ${b.minSurvival * 100}%`, { timeout: 30000 }, () => {
      const rate = survivalRate(b.maxRound, 50);
      expect(rate).toBeGreaterThanOrEqual(b.minSurvival);
    });
  }
});

describe("beatability — not too easy", () => {
  for (const b of BRACKETS) {
    it(`${b.name}: survival ≤ ${b.maxSurvival * 100}%`, { timeout: 30000 }, () => {
      const rate = survivalRate(b.maxRound, 50);
      expect(rate).toBeLessThanOrEqual(b.maxSurvival);
    });
  }
});
```

Plus: monotonic difficulty curve test, game mechanics sanity tests.

---

## 4. CLI Script

`scripts/test-beatability.ts` — Run via `npm run test:beatability` or `npx tsx scripts/test-beatability.ts`

- Runs 100 simulations per bracket (more samples than Vitest for higher confidence)
- Prints formatted ASCII table to stdout
- Exits with code 0 on pass, code 1 on any bracket failure
- Shows which direction failed ("too hard" or "too easy")

**Example output:**
```
Beatability Report (100 runs per bracket)
┌──────────┬───────┬─────────┬──────────┐
│ Bracket  │ Rate  │ Target  │ Status   │
├──────────┼───────┼─────────┼──────────┤
│ L1-10    │  65%  │ 60-70%  │    PASS  │
│ L11-20   │  54%  │ 50-60%  │    PASS  │
│ L21-30   │  43%  │ 40-50%  │    PASS  │
│ L31-40   │  35%  │ 30-40%  │    PASS  │
│ L41-49   │  28%  │ 25-35%  │    PASS  │
│ L50      │  22%  │ 20-30%  │    PASS  │
└──────────┴───────┴─────────┴──────────┘
Difficulty curve: PASS (monotonic decrease)
Result: PASS (6/6 brackets in range)
```

---

## 5. Pre-Push Git Hook

### Setup

- `.githooks/pre-push` — Shell script that runs the beatability CLI
- `package.json` adds `"prepare": "git config core.hooksPath .githooks"`
- Auto-configured on `npm install` via the `prepare` lifecycle script

### Hook behavior

```bash
#!/bin/bash
echo "Running beatability check..."
npx tsx scripts/test-beatability.ts
if [ $? -ne 0 ]; then
  echo "Beatability check FAILED. Fix difficulty balance before pushing."
  exit 1
fi
```

Blocks `git push` if any bracket is out of range (too hard OR too easy).

---

## 6. File Changes Summary

### New Files
| File | Purpose |
|------|---------|
| `game/update.ts` | Pure game logic extracted from loop.ts |
| `game/simulation/bot.ts` | Bot AI (predictive avoidance + power-up collection) |
| `game/simulation/brackets.ts` | Bracket config with two-sided gates |
| `game/simulation/runner.ts` | Headless game runner |
| `game/simulation/reporter.ts` | ASCII table formatter + pass/fail |
| `scripts/test-beatability.ts` | CLI entry point |
| `.githooks/pre-push` | Git pre-push hook |

### Modified Files
| File | Change |
|------|--------|
| `game/loop.ts` | Extract update logic to `update.ts`, keep render shell |
| `game/__tests__/beatability.test.ts` | Thin wrapper importing from simulation/ |
| `package.json` | Add `prepare`, `test:beatability` scripts |

---

## 7. MoveProvider Interface

```typescript
/** Callback that sets player velocity on the game state. */
export type MoveProvider = (g: GameState) => void;
```

- Real game: `applyKeyboardMovement` (from `input.ts`)
- Simulation: `botMove` (from `simulation/bot.ts`)
- `update(g, dt, moveProvider)` calls the provider each frame

This clean separation means the bot can be swapped, improved, or extended without touching game logic.

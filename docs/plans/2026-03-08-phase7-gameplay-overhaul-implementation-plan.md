# Phase 7: Gameplay Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the game significantly easier and more fun. An average player should reach ~Level 25 on their first few attempts. Improve visual feedback for power-ups, redesign pipes as Mario-style warp tubes, persist timer/power-ups across deaths, and retune the beatability framework to match a human-realistic bot.

**Design context:** Player feedback indicates the game is nearly impossible to reach Level 5. Root causes: throw speed too fast, power-ups too rare and reset on death, timer resets on death, pipes too small with no visual warning, bot simulation unrealistically good (doesn't model human limitations).

**Depends on:** All prior phases (1-6) complete.

---

## Summary of Changes

| Area | Current | Target |
|------|---------|--------|
| Pipe count | 16 | 32 |
| Pipe visual | 14px cyan square | ~28px Mario-style green warp tube with lip |
| Pipe launch warning | None | Charging animation (glow + shake) before ball exits |
| Pipe suck-in delay | Instant re-fire | Random 1-3s delay before ball emerges from destination pipe |
| Throw speed | 7 (same as max ball speed) | 3.5 (gentle lob) |
| Timer on death | Resets to full round time | Persists — resume with remaining time |
| Timer on new round | Resets | Resets (no change) |
| Power-ups on death | Cleared | Persist on screen across deaths |
| Power-up spawn timer | 5-8s | 2-4s |
| Power-up max on screen | 2 | 3 |
| Power-up activation | Already auto on pickup | No change (verify) |
| Shield visual | Minimal | Visible bubble/force field aura around character |
| Kaioken visual | None apparent | Red glow/aura pulsing around character |
| Instant Transmission visual | None apparent | Teleport trail + afterimage at departure point |
| Ball types L1-5 | Dodgeball only | Dodgeball + Zigzag + Ghost (variety from round 1) |
| Bot simulation | Perfect dodger | Nerfed: reaction delay, reduced lookahead, random jitter |
| Beatability L1-5 | ~80% survival | 95-100% survival (basically free) |
| Beatability target | Unclear | Average human reaches ~L25 |

---

## Task 1: Increase Pipe Count to 32 and Update Layout

**Files:**
- Modify: `game/constants.ts`
- Modify: `game/arena.ts`

**Step 1: Update PIPE_COUNT and pipe size constants**

In `game/constants.ts`:
- Change `PIPE_COUNT` from `16` to `32`
- Change `PIPE_HALF` from `7` to `14` (half of 28px pipe)
- Add `PIPE_WIDTH = 28` and `PIPE_HEIGHT = 36` constants for the Mario tube dimensions
- Add `PIPE_LIP_HEIGHT = 8` for the tube lip/rim
- Update `ARENA_LEFT`, `ARENA_RIGHT`, `ARENA_TOP`, `ARENA_BOTTOM` to account for the larger pipe size (using new `PIPE_HALF`)
- Update `PIPE_RADIUS` from `14` to `20` for collision radius (larger pipes = larger suck-in zone)

**Step 2: Update pipe layout in arena.ts**

In `game/arena.ts`:
- Update `SIDES` array to distribute 32 pipes: `{ count: 10, edge: "top" }, { count: 6, edge: "right" }, { count: 10, edge: "bottom" }, { count: 6, edge: "left" }`
- Verify `pipePos()` still distributes evenly along the straight segments (excluding corners)
- Ensure `createPipes()` returns 32 pipes

**Step 3: Verify**

Run: `npx tsc --noEmit`
Run: `npx vitest run game/__tests__/arena.test.ts`
- Arena tests should pass with updated pipe count
- Fix any test assertions that hardcode 16

**Step 4: Commit**

```bash
git add game/constants.ts game/arena.ts game/__tests__/arena.test.ts
git commit -m "feat: increase pipe count from 16 to 32 with larger pipe dimensions"
```

---

## Task 2: Redesign Pipe Renderer as Mario-Style Warp Tubes

**Files:**
- Modify: `game/renderer/pipe.ts`
- Modify: `game/constants.ts` (add colors if needed)

**Step 1: Replace pipe drawing with Mario tube style**

In `game/renderer/pipe.ts`, replace the current 14px square with a Mario-style warp pipe:
- Green cylindrical tube body (`#2ecc40` main, `#1a8c2a` shadow, `#4ae060` highlight)
- Wider lip/rim at the opening (the part that faces the arena)
- The tube extends outward from the arena edge (into the wall)
- Orientation based on `pipe.angle`: top pipes face down, bottom pipes face up, left pipes face right, right pipes face left
- Use `PIPE_WIDTH` (28px) and `PIPE_HEIGHT` (36px) from constants
- Lip is `PIPE_LIP_HEIGHT` (8px) tall and ~4px wider than the tube body on each side
- Dark inner opening (black/dark green oval) to show the tube hole
- Keep the active glow effect but apply it to the whole tube

**Step 2: Add pipe charging animation state**

Add a `charging` visual state to the pipe renderer:
- When a ball is about to exit (during the suck-in delay from Task 5), the pipe glows brighter
- Inner opening flashes red/orange
- Subtle shake effect (±1px random offset)
- This requires a `chargingPipe` index or array on GameState (added in Task 5)

**Step 3: Verify visually**

Run `npm run dev` and confirm:
- 32 green Mario-style tubes around the arena perimeter
- Correct orientation (opening faces inward)
- Active pipe glows
- No visual overlap between adjacent pipes

**Step 4: Commit**

```bash
git add game/renderer/pipe.ts game/constants.ts
git commit -m "feat: redesign pipes as Mario-style warp tubes with charging animation"
```

---

## Task 3: Reduce Throw Speed

**Files:**
- Modify: `game/constants.ts`

**Step 1: Reduce THROW_SPEED**

In `game/constants.ts`:
- Change `THROW_SPEED` from `7` to `3.5`

This makes the initial throw feel like a gentle lob rather than a rocket. The ball still bounces into the arena and starts the dodge phase, but the player has more time to react.

**Step 2: Verify**

Run: `npx vitest run`
- All tests should pass (throw speed is not hardcoded in tests beyond the constant import)

**Step 3: Commit**

```bash
git add game/constants.ts
git commit -m "feat: reduce throw speed from 7 to 3.5 for gentler initial throw"
```

---

## Task 4: Timer Persists Across Deaths (No Reset on Hit)

**Files:**
- Modify: `game/state.ts`
- Modify: `game/types.ts` (add `roundStartTimer` field)

**Step 1: Add roundStartTimer to GameState**

In `game/types.ts`, add to the `GameState` interface:
```typescript
roundStartTimer: number; // Timer value at start of round (for full reset on new round)
```

**Step 2: Track round start timer**

In `game/state.ts`:
- In `initRound()`: save the calculated timer to `g.roundStartTimer` when it's a NEW round
- Add a `restoreAfterHit()` function that resets player position, balls, and power-up effects BUT keeps `g.timer` at its current value (does NOT recalculate timer)
- `initRound()` should only be called on new rounds (CLEAR transition)
- HIT transition should call `restoreAfterHit()` instead of `initRound()`

**Step 3: Update HIT transition in update.ts**

In `game/update.ts`:
- Change the HIT → READY transition (line 231) to call `restoreAfterHit(g)` instead of `initRound(g)`
- CLEAR → READY transition continues to call `initRound(g)` (full timer reset)

**Step 4: Create restoreAfterHit function**

In `game/state.ts`, create:
```typescript
export function restoreAfterHit(g: GameState): void {
  g.px = ARENA_CX;
  g.py = ARENA_CY;
  g.pvx = 0;
  g.pvy = 0;
  g.thrown = [];
  g.balls = [];
  g.activePipe = -1;
  g.state = ST.READY;
  // DO NOT reset g.timer — keep remaining time
  // DO NOT reset g.powerUps — keep them on screen (Task 6)
  // Reset timed power-up effects
  g.slow = false;
  g.slowTimer = 0;
  g.kaioken = false;
  g.kaiokenTimer = 0;
  g.solarFlare = false;
  g.solarFlareTimer = 0;
  g.afterimageDecoy = null;
  g.afterimageTimer = 0;
  g.shrink = false;
  g.shrinkTimer = 0;
  g.spiritBombCharging = false;
  g.spiritBombTimer = 0;
  g.swS = null;
  g.swE = null;
  // Recalculate launch queue based on remaining time proportion
  const diff = getDifficulty(g.round);
  g.launchQueue = Math.min(diff.maxBalls, Math.max(0, g.round - 1));
  g.launchDelay = 0;
  g.launched = 0;
  g.msg = "ROUND " + g.round;
  g.msgTimer = 1.5;
}
```

**Step 5: Verify**

Run: `npx vitest run`
- Write a new test in `game/__tests__/state.test.ts`:
  - Start a game, advance to DODGE, tick timer down 3 seconds, trigger HIT
  - After HIT recovery, verify `g.timer` is approximately the remaining time (not reset to full)
  - After CLEAR + initRound, verify `g.timer` IS reset to full

**Step 6: Commit**

```bash
git add game/state.ts game/types.ts game/update.ts game/__tests__/state.test.ts
git commit -m "feat: timer persists across deaths, only resets on new round"
```

---

## Task 5: Pipe Suck-In Delay (Random 1-3s Before Re-Emergence)

**Files:**
- Modify: `game/types.ts` (add pipe queue to GameState)
- Modify: `game/update.ts`
- Modify: `game/physics.ts`

**Step 1: Add pipe queue to GameState**

In `game/types.ts`, add to `GameState`:
```typescript
pipeQueue: PipeQueueEntry[]; // Balls waiting inside pipes before re-emerging
chargingPipes: number[];     // Pipe indices currently charging (for renderer)
```

Add new interface:
```typescript
interface PipeQueueEntry {
  ball: Ball;
  pipeIndex: number;    // Destination pipe
  delay: number;        // Seconds remaining before emergence
  totalDelay: number;   // Original delay (for animation progress)
}
```

**Step 2: Modify suck-in behavior**

In `game/update.ts`, when `checkPipeSuckIn()` returns a pipe index >= 0:
- Instead of immediately re-positioning the ball, REMOVE the ball from `g.balls`
- Pick a random destination pipe (excluding the entry pipe)
- Generate a random delay: `1 + Math.random() * 2` (1-3 seconds)
- Push a `PipeQueueEntry` onto `g.pipeQueue`
- Add destination pipe index to `g.chargingPipes`

**Step 3: Process pipe queue each frame**

In `game/update.ts`, during DODGE state:
- Tick down all `pipeQueue` entries by `dt`
- When an entry's delay reaches 0:
  - Re-create the ball at the destination pipe position with a random inward angle
  - Push it onto `g.balls`
  - Remove the entry from `pipeQueue`
  - Remove from `chargingPipes`
  - Set `g.activePipe` to destination pipe index (for the flash effect)

**Step 4: Clear pipe queue on death/round transition**

In `game/state.ts`:
- `initRound()`: set `g.pipeQueue = []` and `g.chargingPipes = []`
- `restoreAfterHit()`: set `g.pipeQueue = []` and `g.chargingPipes = []`

**Step 5: Verify**

Run: `npx vitest run`
- Add a test: ball enters pipe, doesn't appear for at least 1 second, then re-emerges from a different pipe

**Step 6: Commit**

```bash
git add game/types.ts game/update.ts game/physics.ts game/state.ts game/__tests__/physics.test.ts
git commit -m "feat: balls held inside pipes for 1-3s before re-emerging with charging animation"
```

---

## Task 6: Power-Ups Persist Across Deaths and Spawn Faster

**Files:**
- Modify: `game/state.ts`
- Modify: `game/update.ts`
- Modify: `game/powerups/factory.ts`
- Modify: `game/constants.ts` (or inline in update.ts)

**Step 1: Don't clear power-ups on death**

In `game/state.ts`, in `restoreAfterHit()`:
- Do NOT reset `g.powerUps` — leave them on screen
- Do NOT reset `g.powerUpSpawnTimer` — continue the existing timer

In `initRound()` (new round after clear):
- Also keep `g.powerUps` (persist across rounds too)
- Reset `g.powerUpSpawnTimer` for the new round

**Step 2: Increase spawn frequency**

In `game/powerups/factory.ts`:
- Change `randomSpawnTimer()` from `5 + Math.random() * 3` (5-8s) to `2 + Math.random() * 2` (2-4s)

**Step 3: Increase max power-ups on screen**

In `game/update.ts`:
- Change `MAX_POWER_UPS` from `2` to `3`

**Step 4: Allow power-ups from round 1**

In `game/update.ts`:
- Change the condition `g.round > 1` to `g.round >= 1` so power-ups can spawn from the very first round

**Step 5: Verify**

Run: `npx vitest run`
- Add a test: spawn power-ups, trigger HIT, verify power-ups array is preserved
- Add a test: verify 3 power-ups can exist simultaneously

**Step 6: Commit**

```bash
git add game/state.ts game/update.ts game/powerups/factory.ts game/__tests__/powerups.test.ts
git commit -m "feat: power-ups persist across deaths, spawn every 2-4s, max 3 on screen"
```

---

## Task 7: Enhanced Power-Up Visual Feedback

**Files:**
- Modify: `game/renderer/player.ts`
- Modify: `game/renderer/effects.ts`

**Step 1: Ki Shield — visible force field bubble**

In `game/renderer/player.ts` or a new section in `effects.ts`:
- When `g.shield === true`, draw a semi-transparent golden bubble around the player
- Pulsing opacity (0.2 to 0.5) with a `sin(t * 4)` cycle
- Outer ring: 2px gold (#ffd60a) circle at radius ~30px from player center
- Inner fill: radial gradient from transparent center to semi-transparent gold edge
- Small sparkle particles orbiting the shield

**Step 2: Kaioken — red aura glow**

When `g.kaioken === true`:
- Draw a pulsing red aura around the entire character
- Use `ctx.shadowColor = "#ff2222"` with `shadowBlur = 15 + sin(t * 8) * 8`
- Add red energy particles rising upward from the character (3-5 particles)
- Slight red tint overlay on the character sprite (multiply blend or red-shifted colors)
- The aura intensity pulses with the Kaioken timer (stronger at start, fading near end)

**Step 3: Instant Transmission — teleport trail**

When IT is activated (in `effects.ts` `activateInstantTransmission`):
- Set a visual state: `g.itFlashTimer = 0.4` (new field on GameState)
- At the DEPARTURE point, draw a fading afterimage of the player for 0.4 seconds
  - Ghost-like semi-transparent copy of Goku at old position, fading out
- At the ARRIVAL point, draw a brief blue energy burst (expanding ring)
- Draw a thin blue line between departure and arrival for ~0.2 seconds

In renderer, check `g.itFlashTimer > 0`:
- Draw departure afterimage at stored departure position
- Draw arrival burst at current player position

**Step 4: Add new visual state fields to GameState**

In `game/types.ts`:
```typescript
itFlashTimer: number;
itDepartX: number;
itDepartY: number;
```

Initialize in `makeGame()` and reset appropriately.

**Step 5: Verify visually**

Run `npm run dev`:
- Collect Ki Shield: golden bubble visible and pulsing around character
- Collect Kaioken: red glow/aura visible, particles rising
- Use Instant Transmission: afterimage at old position, blue burst at new position
- All effects are immediately obvious — no squinting required

**Step 6: Commit**

```bash
git add game/renderer/player.ts game/renderer/effects.ts game/types.ts game/state.ts
git commit -m "feat: enhanced power-up visuals — shield bubble, kaioken aura, IT teleport trail"
```

---

## Task 8: Introduce Ball Type Variety from Round 1

**Files:**
- Modify: `game/balls/spawn.ts`

**Step 1: Update getAvailableTypes for early rounds**

In `game/balls/spawn.ts`, change the L1-5 band:
```typescript
// L1-5: Dodgeball + mild variants (learn while seeing variety)
if (round <= 5) return [BallType.Dodgeball, BallType.Dodgeball, BallType.Zigzag, BallType.Ghost];
```

This gives Dodgeball double weight (more likely) but introduces Zigzag and Ghost from the start so the player sees variety immediately. Ghost phasing in/out teaches awareness, Zigzag teaches unpredictable paths.

**Step 2: Keep dodgeball count unchanged**

Verify `getDodgeballCount()` still returns:
- 1 for rounds 1-9
- 2 for rounds 10-19
- etc.

This is already correct — no changes needed.

**Step 3: Verify**

Run: `npx vitest run game/__tests__/balls.test.ts`
- Update any tests that assert L1-5 returns `[BallType.Dodgeball]` only

**Step 4: Commit**

```bash
git add game/balls/spawn.ts game/__tests__/balls.test.ts
git commit -m "feat: introduce Zigzag and Ghost ball types from round 1"
```

---

## Task 9: Nerf Simulation Bot to Model Human Limitations

**Files:**
- Modify: `game/simulation/bot.ts`

**Step 1: Add reaction delay**

The bot currently evaluates every frame (60fps). A human has ~200-300ms reaction time.
- Add a `lastDecisionTime` tracker (use `g.t`)
- Only re-evaluate direction every 0.2 seconds (12 frames)
- Between decisions, maintain the last chosen direction
- Store state via closure or module-level variable keyed to game instance

**Step 2: Reduce lookahead**

Current horizons: `[5, 10, 20]` frames.
- Reduce to `[3, 6, 10]` — humans can't predict 20 frames ahead reliably

**Step 3: Add random jitter under pressure**

When the nearest ball is within 50px (high pressure):
- 15% chance per decision to pick a random direction instead of optimal
- This models panic/mistakes under pressure
When nearest ball is >100px (low pressure):
- 5% chance of suboptimal direction (general human imprecision)

**Step 4: Reduce candidate directions**

Current: 16 directions + stationary.
- Reduce to 8 directions + stationary — humans think in cardinal + diagonal, not 16 angles

**Step 5: Verify**

Run: `npx vitest run game/__tests__/simulation.test.ts`
Run: `npx vitest run game/__tests__/beatability.test.ts`
- Bot should perform measurably worse
- Survival rates will drop — this is expected and will be corrected in Task 10

**Step 6: Commit**

```bash
git add game/simulation/bot.ts
git commit -m "feat: nerf simulation bot with reaction delay, reduced lookahead, and jitter"
```

---

## Task 10: Retune Beatability Brackets and Difficulty Bands

**Files:**
- Modify: `game/simulation/brackets.ts`
- Modify: `game/constants.ts` (difficulty BANDS)

**Step 1: Update brackets for new target curve**

In `game/simulation/brackets.ts`, update to match the new goals:
```typescript
export const BRACKETS: readonly Bracket[] = [
  { name: "L1-5",   maxRound: 5,  minSurvival: 0.95, maxSurvival: 1.00 },  // Basically free
  { name: "L6-10",  maxRound: 10, minSurvival: 0.88, maxSurvival: 0.99 },  // Very easy
  { name: "L11-15", maxRound: 15, minSurvival: 0.80, maxSurvival: 0.95 },  // Easy
  { name: "L16-20", maxRound: 20, minSurvival: 0.70, maxSurvival: 0.90 },  // Moderate
  { name: "L21-25", maxRound: 25, minSurvival: 0.55, maxSurvival: 0.80 },  // Average player ceiling
  { name: "L26-30", maxRound: 30, minSurvival: 0.40, maxSurvival: 0.70 },  // Challenging
  { name: "L31-40", maxRound: 40, minSurvival: 0.25, maxSurvival: 0.55 },  // Hard
  { name: "L41-49", maxRound: 49, minSurvival: 0.15, maxSurvival: 0.40 },  // Very hard
  { name: "L50",    maxRound: 50, minSurvival: 0.10, maxSurvival: 0.30 },  // Near impossible
];
```

Key design: L21-25 has 55-80% survival for the nerfed bot, which corresponds to an average human reaching ~L25. The curve drops steeply after that.

**Step 2: Retune difficulty bands if needed**

In `game/constants.ts`, adjust `BANDS` to hit the new survival targets. Likely changes:
- Reduce `speedPerRound` in early bands (slower difficulty ramp)
- Increase `launchDelayMin` in early bands (more time between pipe launches)
- Increase `roundTimerMin` in early bands (longer rounds = easier)

Start with these values and iterate based on simulation results:
```typescript
const BANDS: { maxRound: number; diff: BandDifficulty }[] = [
  { maxRound: 10,  diff: { speedPerRound: 0.02,  maxBalls: 2,  launchDelayMin: 1.0,  roundTimerMin: 10, timerDecay: 0.02 } },
  { maxRound: 20,  diff: { speedPerRound: 0.025, maxBalls: 3,  launchDelayMin: 0.8,  roundTimerMin: 8,  timerDecay: 0.04 } },
  { maxRound: 30,  diff: { speedPerRound: 0.03,  maxBalls: 3,  launchDelayMin: 0.7,  roundTimerMin: 7,  timerDecay: 0.05 } },
  { maxRound: 40,  diff: { speedPerRound: 0.035, maxBalls: 4,  launchDelayMin: 0.6,  roundTimerMin: 6,  timerDecay: 0.04 } },
  { maxRound: 49,  diff: { speedPerRound: 0.035, maxBalls: 4,  launchDelayMin: 0.55, roundTimerMin: 5,  timerDecay: 0.03 } },
  { maxRound: 999, diff: { speedPerRound: 0.03,  maxBalls: 5,  launchDelayMin: 0.5,  roundTimerMin: 5,  timerDecay: 0.03 } },
];
```

**Step 3: Run simulation and iterate**

```bash
npx vitest run game/__tests__/beatability.test.ts
```

If brackets fail:
- Too hard (below minSurvival): reduce `speedPerRound`, increase `launchDelayMin`, increase `roundTimerMin`
- Too easy (above maxSurvival): increase `speedPerRound`, decrease `launchDelayMin`
- Iterate until all brackets pass within their min/max range
- The monotonic decreasing test must also pass

**Step 4: Update beatability test**

In `game/__tests__/beatability.test.ts`:
- Update bracket references to match new 9-bracket structure
- Keep the monotonically decreasing survival rate test
- Keep game mechanics sanity tests

**Step 5: Commit**

```bash
git add game/simulation/brackets.ts game/constants.ts game/__tests__/beatability.test.ts
git commit -m "feat: retune difficulty bands and beatability brackets for L25 average target"
```

---

## Task 11: Update Tests Across the Board

**Files:**
- Modify: `game/__tests__/arena.test.ts`
- Modify: `game/__tests__/state.test.ts`
- Modify: `game/__tests__/powerups.test.ts`
- Modify: `game/__tests__/balls.test.ts`
- Modify: `game/__tests__/simulation.test.ts`

**Step 1: Fix arena tests**

- Update any assertions that reference `PIPE_COUNT = 16` to `32`
- Update pipe position tests for new layout (10/6/10/6 distribution)

**Step 2: Add timer persistence tests**

In `state.test.ts`:
- Test: timer does NOT reset on HIT → restoreAfterHit
- Test: timer DOES reset on CLEAR → initRound
- Test: power-ups persist through restoreAfterHit

**Step 3: Update power-up tests**

In `powerups.test.ts`:
- Update spawn timer expectations (2-4s instead of 5-8s)
- Update max power-ups (3 instead of 2)
- Add test: power-ups available from round 1

**Step 4: Update ball type tests**

In `balls.test.ts`:
- Update L1-5 available types to include Zigzag and Ghost

**Step 5: Run full suite**

```bash
npx vitest run
```

All tests must pass.

**Step 6: Commit**

```bash
git add game/__tests__/
git commit -m "test: update all tests for Phase 7 gameplay changes"
```

---

## Task 12: Update CONTEXT.md and README.md

**Files:**
- Modify: `CONTEXT.md`
- Modify: `README.md`

**Step 1: Update CONTEXT.md**

Update the following sections:
- **Key Constants table**: new PIPE_COUNT, THROW_SPEED, spawn timer, MAX_POWER_UPS values
- **What's Implemented**: add pipe suck-in delay, timer persistence, power-up persistence, enhanced visuals
- **Power-Ups section**: note auto-activate, persistence, enhanced visuals

**Step 2: Update README.md**

- Update gameplay description to reflect easier difficulty
- Update pipe/cannon description (32 Mario-style tubes)
- Note the timer persistence mechanic
- Update power-up behavior description

**Step 3: Commit**

```bash
git add CONTEXT.md README.md
git commit -m "docs: update CONTEXT.md and README.md for Phase 7 changes"
```

---

## Implementation Order and Dependencies

```
Task 1  (Pipe count + layout)
  └── Task 2  (Pipe renderer — Mario tubes)
Task 3  (Throw speed) — independent
Task 4  (Timer persistence)
  └── Task 5  (Pipe suck-in delay) — needs pipeQueue on GameState
Task 6  (Power-up persistence + faster spawns)
  └── Task 7  (Power-up visuals)
Task 8  (Ball type variety) — independent
Task 9  (Nerf bot)
  └── Task 10 (Retune brackets) — must run AFTER bot nerf
Task 11 (Fix all tests) — after all gameplay changes
Task 12 (Update docs) — last
```

**Parallelizable groups:**
- Group A: Tasks 1, 2 (pipes)
- Group B: Tasks 3, 8 (ball tuning)
- Group C: Tasks 4, 5 (timer + pipe delay)
- Group D: Tasks 6, 7 (power-ups)
- Group E: Tasks 9, 10 (beatability)
- Sequential: Task 11 (tests), then Task 12 (docs)

Groups A-D are independent and can be done in parallel. Group E should be done after A-D since beatability depends on all gameplay changes being in place.

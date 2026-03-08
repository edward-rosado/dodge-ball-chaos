# Phase 6: Beatability Framework — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract headless simulation from test file into reusable modules, add two-sided difficulty gates, CLI reporter, and pre-push git hook.

**Architecture:** Split `loop.ts` into `update.ts` (pure logic) + `loop.ts` (render shell). Extract bot AI and runner into `game/simulation/`. Add CLI script and git hook for pre-push validation.

**Tech Stack:** TypeScript, Vitest, tsx (CLI runner), plain git hooks

**Design doc:** `docs/plans/2026-03-08-phase6-beatability-framework-design.md`

---

## Task 1: Add MoveProvider type to types.ts

**Files:**
- Modify: `game/types.ts`

**Step 1: Add MoveProvider type**

Add at the end of `game/types.ts`:

```typescript
/** Callback that sets player velocity on the game state each frame. */
export type MoveProvider = (g: GameState) => void;
```

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add game/types.ts
git commit -m "feat: add MoveProvider type for update/bot separation"
```

---

## Task 2: Extract update.ts from loop.ts

**Files:**
- Create: `game/update.ts`
- Modify: `game/loop.ts`

**Step 1: Create game/update.ts**

Extract the DODGE-state update logic from `loop.ts` lines 131-221 into a pure function. Also extract the THROW-state logic (lines 103-128). The function must have NO canvas/renderer imports.

```typescript
import { GameState, ST, MoveProvider } from "./types";
import {
  PIPE_COUNT,
  BASE_BALL_SPEED,
  HIT_DIST,
} from "./constants";
import { dist, circularClamp, bounceOffWall, checkPipeSuckIn } from "./physics";
import { initRound } from "./state";

/**
 * Pure game logic update — no rendering, no canvas.
 * Called each frame by both the real game loop and headless simulation.
 */
export function update(g: GameState, dt: number, moveProvider?: MoveProvider): void {
  g.t += dt;

  // ── Timers (always tick) ──
  if (g.msgTimer > 0) g.msgTimer -= dt;
  if (g.flash > 0) g.flash -= dt;
  if (g.slow) {
    g.slowTimer -= dt;
    if (g.slowTimer <= 0) g.slow = false;
  }
  if (g.shield) {
    g.shieldTimer -= dt;
    if (g.shieldTimer <= 0) g.shield = false;
  }

  // ── THROW ──
  if (g.state === ST.THROW) {
    if (g.thrown) {
      g.thrown.x += g.thrown.vx;
      g.thrown.y += g.thrown.vy;

      const suckPipe = checkPipeSuckIn(g.thrown, g.pipes);
      if (suckPipe >= 0) g.activePipe = suckPipe;

      const bounced = bounceOffWall(g.thrown);
      if (bounced || suckPipe >= 0) {
        g.balls.push(g.thrown);
        g.thrown = null;
        g.state = ST.DODGE;
        g.launchDelay = 0.6;
      }
    }
    return;
  }

  // ── DODGE ──
  if (g.state === ST.DODGE) {
    // Movement (keyboard for real game, bot for simulation)
    if (moveProvider) moveProvider(g);

    // Move player + clamp to arena boundary
    const clamped = circularClamp(g.px + g.pvx, g.py + g.pvy);
    g.px = clamped.x;
    g.py = clamped.y;

    // Launch balls from pipes
    g.launchDelay -= dt;
    if (g.launched < g.launchQueue && g.launchDelay <= 0) {
      const pi = Math.floor(Math.random() * PIPE_COUNT);
      const p = g.pipes[pi];
      const a = p.angle + Math.PI;
      const spd = BASE_BALL_SPEED + g.round * 0.25;
      const spread = (Math.random() - 0.5) * 0.4;
      g.balls.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(a + spread) * spd,
        vy: Math.sin(a + spread) * spd,
        bounceCount: 0,
      });
      g.activePipe = pi;
      g.launched++;
      g.launchDelay = Math.max(0.3, 1.2 - g.round * 0.08);
    }

    // Update balls
    const sm = g.slow ? 0.4 : 1;
    for (const b of g.balls) {
      b.x += b.vx * sm;
      b.y += b.vy * sm;
      const suckPipe = checkPipeSuckIn(b, g.pipes);
      if (suckPipe >= 0) {
        g.activePipe = suckPipe;
      } else {
        bounceOffWall(b);
      }
    }

    // Collision detection
    if (!g.shield) {
      for (const b of g.balls) {
        if (dist({ x: g.px, y: g.py }, b) < HIT_DIST) {
          g.lives--;
          g.flash = 0.5;
          if (g.lives <= 0) {
            g.state = ST.OVER;
            g.highScore = Math.max(g.highScore, g.score);
          } else {
            g.state = ST.HIT;
            g.msgTimer = 1.2;
            g.msg = "HIT!";
          }
          return;
        }
      }
    }

    // Power-up collection
    if (g.powerUp && !g.powerUp.collected && dist({ x: g.px, y: g.py }, g.powerUp) < 20) {
      g.powerUp.collected = true;
      if (g.powerUp.type === "slow") {
        g.slow = true;
        g.slowTimer = 3;
        g.msg = "SLOW MOTION!";
        g.msgTimer = 1;
      } else {
        g.shield = true;
        g.shieldTimer = 2.5;
        g.msg = "SHIELD!";
        g.msgTimer = 1;
      }
    }

    // Round timer
    g.timer -= dt;
    if (g.timer <= 0 && g.state === ST.DODGE) {
      g.score += g.round * 100;
      g.round++;
      g.state = ST.CLEAR;
      g.msgTimer = 1.5;
      g.msg = "CLEAR!";
    }
  }

  // ── HIT / CLEAR transitions ──
  if (g.state === ST.HIT && g.msgTimer <= 0) initRound(g);
  if (g.state === ST.CLEAR && g.msgTimer <= 0) initRound(g);
}
```

**Step 2: Rewrite loop.ts as a thin render shell**

Replace `loop.ts` to import `update()` and only handle rendering:

```typescript
import { GameState, ST } from "./types";
import { CW, CH, C } from "./constants";
import { applyKeyboardMovement } from "./input";
import { update } from "./update";
import { drawGrid, drawArenaBoundary } from "./renderer/background";
import { drawGoku } from "./renderer/player";
import { drawBall } from "./renderer/ball";
import { drawPipe } from "./renderer/pipe";
import { drawHUD, drawText } from "./renderer/hud";
import { drawPowerUp } from "./renderer/powerup";

/** Core update + render. Called each frame via requestAnimationFrame. */
export function tick(
  ctx: CanvasRenderingContext2D,
  g: GameState,
  dt: number
): void {
  // ── Update game logic ──
  update(g, dt, applyKeyboardMovement);

  // ── Render ──
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, CW, CH);
  drawGrid(ctx, CW, CH, g.t * 8);
  drawArenaBoundary(ctx);

  // ── TITLE ──
  if (g.state === ST.TITLE) {
    drawGoku(ctx, CW / 2, CH / 2 - 40, false);
    drawText(ctx, "DODGE BALL", CH / 2 + 30, C.title, 18);
    drawText(ctx, "CHAOS", CH / 2 + 56, C.title, 18);
    ctx.font = "9px monospace";
    ctx.fillStyle = C.hudDim;
    ctx.textAlign = "center";
    const blink = Math.sin(g.t * 3) > 0;
    if (blink) ctx.fillText("TAP / CLICK / SPACE", CW / 2, CH / 2 + 100);
    ctx.fillStyle = C.hudDim;
    ctx.fillText("SWIPE OR WASD TO MOVE", CW / 2, CH / 2 + 118);
    return;
  }

  if (g.state === ST.OVER) {
    drawText(ctx, "GAME OVER", CH / 2 - 30, C.gameOver, 18);
    drawText(ctx, "SCORE: " + g.score, CH / 2 + 10, C.hud, 12);
    drawText(ctx, "BEST: " + g.highScore, CH / 2 + 36, C.hudDim, 10);
    ctx.font = "9px monospace";
    ctx.fillStyle = C.hudDim;
    ctx.textAlign = "center";
    const blink = Math.sin(g.t * 3) > 0;
    if (blink) ctx.fillText("TAP TO RETRY", CW / 2, CH / 2 + 80);
    return;
  }

  // ── Draw pipes ──
  g.pipes.forEach((p, i) => drawPipe(ctx, p, i === g.activePipe, g.t));
  drawPowerUp(ctx, g.powerUp, g.t);

  // ── Message overlay ──
  if (g.msgTimer > 0) {
    drawText(ctx, g.msg, CH / 2, C.round, 14);
  }

  // ── READY ──
  if (g.state === ST.READY) {
    drawGoku(ctx, g.px, g.py, false);
    drawBall(ctx, g.px, g.py - 20, false);
    if (g.swS && g.swE) {
      ctx.beginPath();
      ctx.moveTo(g.swS.x, g.swS.y);
      ctx.lineTo(g.swE.x, g.swE.y);
      ctx.strokeStyle = C.swipe;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    drawHUD(ctx, g.round, g.lives, g.timer, g.score);
    return;
  }

  // ── THROW ──
  if (g.state === ST.THROW) {
    if (g.thrown) drawBall(ctx, g.thrown.x, g.thrown.y, true);
    drawGoku(ctx, g.px, g.py, false);
    drawHUD(ctx, g.round, g.lives, g.timer, g.score);
    return;
  }

  // ── DODGE ──
  if (g.state === ST.DODGE) {
    g.balls.forEach((b) => drawBall(ctx, b.x, b.y, true));

    if (g.shield) {
      ctx.beginPath();
      ctx.arc(g.px, g.py, 22, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,214,10," + (0.5 + Math.sin(g.t * 8) * 0.3) + ")";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (g.slow) {
      ctx.font = "8px monospace";
      ctx.fillStyle = C.powerSlow;
      ctx.textAlign = "center";
      ctx.fillText("SLOW " + g.slowTimer.toFixed(1) + "s", CW / 2, 72);
    }
  }

  drawGoku(ctx, g.px, g.py, g.flash > 0);
  drawHUD(ctx, g.round, g.lives, g.timer, g.score);
}
```

**Step 3: Run existing tests**

Run: `npm run test`
Expected: All 72 tests pass (game behavior unchanged)

**Step 4: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add game/update.ts game/loop.ts
git commit -m "refactor: extract update.ts from loop.ts — pure game logic without rendering"
```

---

## Task 3: Create game/simulation/brackets.ts

**Files:**
- Create: `game/simulation/brackets.ts`

**Step 1: Write brackets config**

```typescript
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
```

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add game/simulation/brackets.ts
git commit -m "feat: add bracket config with two-sided difficulty gates"
```

---

## Task 4: Create game/simulation/bot.ts

**Files:**
- Create: `game/simulation/bot.ts`

**Step 1: Extract bot AI from beatability.test.ts**

Move the `botMove` and `predictBall` functions from `game/__tests__/beatability.test.ts` (lines 26-113) into `game/simulation/bot.ts`. Add power-up collection logic.

```typescript
import { GameState, Ball, Point, MoveProvider } from "../types";
import {
  ARENA_CX,
  ARENA_CY,
  ARENA_RADIUS,
  PLAYER_SPEED,
} from "../constants";
import { dist, circularClamp } from "../physics";

/** Predict ball position N frames ahead (simple linear extrapolation). */
function predictBall(b: Ball, frames: number): Point {
  return { x: b.x + b.vx * frames, y: b.y + b.vy * frames };
}

/**
 * Bot AI: predictive multi-frame threat avoidance + power-up collection.
 * Evaluates 16 candidate directions at 3 time horizons,
 * picking the direction that maximizes minimum distance from all balls.
 * Implements MoveProvider interface for use with update().
 */
export const botMove: MoveProvider = (g: GameState): void => {
  if (g.balls.length === 0) {
    // No balls — drift toward center or power-up
    const target = (g.powerUp && !g.powerUp.collected)
      ? { x: g.powerUp.x, y: g.powerUp.y }
      : { x: ARENA_CX, y: ARENA_CY };
    const dx = target.x - g.px;
    const dy = target.y - g.py;
    const m = Math.hypot(dx, dy);
    if (m > 5) {
      g.pvx = (dx / m) * PLAYER_SPEED * 0.5;
      g.pvy = (dy / m) * PLAYER_SPEED * 0.5;
    } else {
      g.pvx = 0;
      g.pvy = 0;
    }
    return;
  }

  const NUM_DIRS = 16;
  const candidates: { dx: number; dy: number }[] = [];
  for (let i = 0; i < NUM_DIRS; i++) {
    const a = (Math.PI * 2 * i) / NUM_DIRS;
    candidates.push({ dx: Math.cos(a), dy: Math.sin(a) });
  }
  candidates.push({ dx: 0, dy: 0 });

  const horizons = [5, 10, 20];

  let bestScore = -Infinity;
  let bestDx = 0;
  let bestDy = 0;

  for (const c of candidates) {
    let worstMinDist = Infinity;

    for (const h of horizons) {
      const futureX = g.px + c.dx * PLAYER_SPEED * h;
      const futureY = g.py + c.dy * PLAYER_SPEED * h;
      const clamped = circularClamp(futureX, futureY);

      let minBallDist = Infinity;
      for (const b of g.balls) {
        const futureB = predictBall(b, h);
        const d = dist(clamped, futureB);
        if (d < minBallDist) minBallDist = d;
      }

      if (minBallDist < worstMinDist) worstMinDist = minBallDist;
    }

    const futurePos = circularClamp(
      g.px + c.dx * PLAYER_SPEED * 10,
      g.py + c.dy * PLAYER_SPEED * 10,
    );
    const centerDist = dist(futurePos, { x: ARENA_CX, y: ARENA_CY });
    const centerBonus = ((ARENA_RADIUS - centerDist) / ARENA_RADIUS) * 8;
    const wallProximity = ARENA_RADIUS - centerDist;
    const wallPenalty = wallProximity < 30 ? (30 - wallProximity) * 0.5 : 0;

    // Power-up bonus: prefer directions toward uncollected power-up when safe
    let powerUpBonus = 0;
    if (g.powerUp && !g.powerUp.collected && worstMinDist > 40) {
      const puDist = dist(futurePos, g.powerUp);
      powerUpBonus = Math.max(0, (100 - puDist) / 100) * 15;
    }

    const score = worstMinDist + centerBonus - wallPenalty + powerUpBonus;
    if (score > bestScore) {
      bestScore = score;
      bestDx = c.dx;
      bestDy = c.dy;
    }
  }

  const mm = Math.hypot(bestDx, bestDy);
  if (mm > 0.01) {
    g.pvx = (bestDx / mm) * PLAYER_SPEED;
    g.pvy = (bestDy / mm) * PLAYER_SPEED;
  } else {
    g.pvx = 0;
    g.pvy = 0;
  }
};
```

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add game/simulation/bot.ts
git commit -m "feat: extract bot AI into simulation/bot.ts with power-up collection"
```

---

## Task 5: Create game/simulation/runner.ts

**Files:**
- Create: `game/simulation/runner.ts`

**Step 1: Write headless runner**

Extract `simulateGame`, `survivalRate`, and `throwAndTransition` from `beatability.test.ts`. Use `update()` from `update.ts` with `botMove` as the move provider.

```typescript
import { GameState, ST } from "../types";
import { THROW_SPEED } from "../constants";
import { bounceOffWall, checkPipeSuckIn } from "../physics";
import { makeGame, startGame, initRound } from "../state";
import { update } from "../update";
import { botMove } from "./bot";
import { BRACKETS, Bracket } from "./brackets";

const DT = 1 / 60;

/** Throw the dodgeball and fast-forward until it bounces into DODGE state. */
function throwAndTransition(g: GameState): void {
  g.thrown = { x: g.px, y: g.py, vx: 0, vy: -THROW_SPEED, bounceCount: 0 };
  g.state = ST.THROW;
  for (let i = 0; i < 120; i++) {
    if (!g.thrown) break;
    g.thrown.x += g.thrown.vx;
    g.thrown.y += g.thrown.vy;
    const suck = checkPipeSuckIn(g.thrown, g.pipes);
    const bounced = bounceOffWall(g.thrown);
    if (bounced || suck >= 0) {
      g.balls.push(g.thrown);
      g.thrown = null;
      g.state = ST.DODGE;
      g.launchDelay = 0.6;
      break;
    }
  }
}

/** Run a full headless game simulation. Returns the round reached. */
export function simulateGame(maxRounds: number): { roundReached: number; survived: boolean } {
  const g = makeGame();
  startGame(g);
  throwAndTransition(g);

  const maxFrames = maxRounds * 15 * 60;
  for (let frame = 0; frame < maxFrames; frame++) {
    if (g.state === ST.OVER) break;

    if (g.state === ST.DODGE || g.state === ST.THROW) {
      update(g, DT, botMove);
    } else if (g.state === ST.HIT || g.state === ST.CLEAR) {
      initRound(g);
      if (g.round > maxRounds) {
        return { roundReached: g.round - 1, survived: true };
      }
      throwAndTransition(g);
    }
  }

  return { roundReached: g.round, survived: g.state !== ST.OVER };
}

/** Run N simulations, return survival rate as a fraction 0-1. */
export function survivalRate(maxRounds: number, runs: number): number {
  let survivals = 0;
  for (let i = 0; i < runs; i++) {
    const result = simulateGame(maxRounds);
    if (result.survived) survivals++;
  }
  return survivals / runs;
}

/** Result for a single bracket run. */
export interface BracketResult {
  bracket: Bracket;
  rate: number;
  tooHard: boolean;
  tooEasy: boolean;
  passed: boolean;
}

/** Run all brackets with N runs each. Returns results array. */
export function runAllBrackets(runsPerBracket: number): BracketResult[] {
  return BRACKETS.map((bracket) => {
    const rate = survivalRate(bracket.maxRound, runsPerBracket);
    const tooHard = rate < bracket.minSurvival;
    const tooEasy = rate > bracket.maxSurvival;
    return { bracket, rate, tooHard, tooEasy, passed: !tooHard && !tooEasy };
  });
}
```

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add game/simulation/runner.ts
git commit -m "feat: add headless game runner using update() with bot AI"
```

---

## Task 6: Create game/simulation/reporter.ts

**Files:**
- Create: `game/simulation/reporter.ts`

**Step 1: Write reporter**

```typescript
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
    const target = `${Math.round(r.bracket.minSurvival * 100)}-${Math.round(r.bracket.maxSurvival * 100)}%`;
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

/** Check if rates are monotonically decreasing across brackets. */
export function checkMonotonic(results: BracketResult[]): boolean {
  for (let i = 1; i < results.length; i++) {
    if (results[i].rate > results[i - 1].rate) return false;
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
```

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add game/simulation/reporter.ts
git commit -m "feat: add CLI reporter with ASCII table and pass/fail checker"
```

---

## Task 7: Write tests for simulation modules

**Files:**
- Create: `game/__tests__/simulation.test.ts`

**Step 1: Write unit tests for bot, runner, brackets, reporter**

```typescript
import { describe, it, expect } from "vitest";
import { botMove } from "../simulation/bot";
import { BRACKETS } from "../simulation/brackets";
import { simulateGame, survivalRate, runAllBrackets } from "../simulation/runner";
import { formatTable, checkMonotonic, checkAll } from "../simulation/reporter";
import { makeGame, startGame } from "../state";
import { ST } from "../types";
import { ARENA_CX, ARENA_CY, PLAYER_SPEED } from "../constants";

describe("brackets", () => {
  it("should have 6 brackets", () => {
    expect(BRACKETS).toHaveLength(6);
  });

  it("should have minSurvival < maxSurvival for every bracket", () => {
    for (const b of BRACKETS) {
      expect(b.minSurvival).toBeLessThan(b.maxSurvival);
    }
  });

  it("should have decreasing targets as rounds increase", () => {
    for (let i = 1; i < BRACKETS.length; i++) {
      expect(BRACKETS[i].minSurvival).toBeLessThanOrEqual(BRACKETS[i - 1].minSurvival);
    }
  });
});

describe("botMove", () => {
  it("should set player velocity when balls are present", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.balls.push({ x: ARENA_CX + 50, y: ARENA_CY, vx: -3, vy: 0, bounceCount: 0 });
    botMove(g);
    const speed = Math.hypot(g.pvx, g.pvy);
    expect(speed).toBeCloseTo(PLAYER_SPEED, 0);
  });

  it("should drift toward center when no balls", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.px = ARENA_CX + 100;
    g.py = ARENA_CY;
    botMove(g);
    expect(g.pvx).toBeLessThan(0); // Moving left toward center
  });
});

describe("simulateGame", () => {
  it("should return roundReached >= 1", () => {
    const result = simulateGame(5);
    expect(result.roundReached).toBeGreaterThanOrEqual(1);
  });

  it("should return survived=true when bot survives all rounds", () => {
    // Run many tries — at least one should survive round 1
    let anySurvived = false;
    for (let i = 0; i < 20; i++) {
      const result = simulateGame(1);
      if (result.survived) { anySurvived = true; break; }
    }
    expect(anySurvived).toBe(true);
  });
});

describe("survivalRate", () => {
  it("should return a number between 0 and 1", () => {
    const rate = survivalRate(1, 10);
    expect(rate).toBeGreaterThanOrEqual(0);
    expect(rate).toBeLessThanOrEqual(1);
  });
});

describe("reporter", () => {
  it("should format a table with all brackets", () => {
    const results = BRACKETS.map((bracket) => ({
      bracket,
      rate: 0.5,
      tooHard: false,
      tooEasy: false,
      passed: true,
    }));
    const table = formatTable(results);
    expect(table).toContain("L1-10");
    expect(table).toContain("L50");
    expect(table).toContain("PASS");
  });

  it("should show FAIL too hard when rate is below min", () => {
    const results = [{
      bracket: BRACKETS[0],
      rate: 0.3,
      tooHard: true,
      tooEasy: false,
      passed: false,
    }];
    const table = formatTable(results);
    expect(table).toContain("FAIL too hard");
  });

  it("should show FAIL too easy when rate is above max", () => {
    const results = [{
      bracket: BRACKETS[0],
      rate: 0.9,
      tooHard: false,
      tooEasy: true,
      passed: false,
    }];
    const table = formatTable(results);
    expect(table).toContain("FAIL too easy");
  });

  it("checkMonotonic should return true for decreasing rates", () => {
    const results = BRACKETS.map((bracket, i) => ({
      bracket,
      rate: 0.7 - i * 0.1,
      tooHard: false,
      tooEasy: false,
      passed: true,
    }));
    expect(checkMonotonic(results)).toBe(true);
  });

  it("checkMonotonic should return false for non-decreasing rates", () => {
    const results = BRACKETS.map((bracket) => ({
      bracket,
      rate: 0.5,
      tooHard: false,
      tooEasy: false,
      passed: true,
    }));
    // All same rate — not strictly decreasing but checkMonotonic allows equal
    // Let's make one go up
    results[2].rate = 0.8;
    expect(checkMonotonic(results)).toBe(false);
  });

  it("checkAll should report failures", () => {
    const results = BRACKETS.map((bracket) => ({
      bracket,
      rate: 0.1,
      tooHard: true,
      tooEasy: false,
      passed: false,
    }));
    const summary = checkAll(results);
    expect(summary.passed).toBe(false);
    expect(summary.failedBrackets.length).toBe(6);
  });
});
```

**Step 2: Run tests**

Run: `npm run test`
Expected: All tests pass (old + new)

**Step 3: Commit**

```bash
git add game/__tests__/simulation.test.ts
git commit -m "test: add unit tests for simulation modules"
```

---

## Task 8: Rewrite beatability.test.ts as thin wrapper

**Files:**
- Modify: `game/__tests__/beatability.test.ts`

**Step 1: Replace beatability.test.ts**

Replace the entire file. It now imports from simulation modules instead of inlining everything.

```typescript
import { describe, it, expect } from "vitest";
import { BRACKETS } from "../simulation/brackets";
import { survivalRate } from "../simulation/runner";
import { makeGame, startGame, initRound } from "../state";
import { ST } from "../types";
import { update } from "../update";
import { botMove } from "../simulation/bot";
import {
  ARENA_CX,
  ARENA_CY,
  ARENA_LEFT,
  ARENA_RIGHT,
  ARENA_TOP,
  ARENA_BOTTOM,
  BASE_BALL_SPEED,
  PLAYER_HITBOX,
} from "../constants";

// ─── Two-sided beatability gates ───
// Each bracket must be within its sweet spot: not too hard AND not too easy.

describe("beatability — not too hard", () => {
  for (const b of BRACKETS) {
    it(`${b.name}: survival >= ${b.minSurvival * 100}%`, { timeout: 60000 }, () => {
      const rate = survivalRate(b.maxRound, 50);
      expect(rate).toBeGreaterThanOrEqual(b.minSurvival);
    });
  }
});

describe("beatability — not too easy", () => {
  for (const b of BRACKETS) {
    it(`${b.name}: survival <= ${b.maxSurvival * 100}%`, { timeout: 60000 }, () => {
      const rate = survivalRate(b.maxRound, 50);
      expect(rate).toBeLessThanOrEqual(b.maxSurvival);
    });
  }
});

describe("beatability — difficulty curve", () => {
  it("should have monotonically decreasing survival rates", { timeout: 60000 }, () => {
    const rates = BRACKETS.map((b) => survivalRate(b.maxRound, 50));
    for (let i = 1; i < rates.length; i++) {
      expect(rates[i]).toBeLessThanOrEqual(rates[i - 1]);
    }
  });
});

// ─── Game mechanics sanity ───

const DT = 1 / 60;

describe("game mechanics sanity", () => {
  it("should have exactly round-1 pipe balls launched per round", () => {
    const g = makeGame();
    startGame(g);
    expect(g.launchQueue).toBe(0);

    g.round = 2;
    initRound(g);
    expect(g.launchQueue).toBe(1);

    g.round = 5;
    initRound(g);
    expect(g.launchQueue).toBe(4);
  });

  it("should decrease timer as rounds increase (harder rounds are shorter)", () => {
    const g = makeGame();
    startGame(g);
    const timer1 = g.timer;

    g.round = 5;
    initRound(g);
    const timer5 = g.timer;

    g.round = 10;
    initRound(g);
    const timer10 = g.timer;

    expect(timer1).toBeGreaterThan(timer5);
    expect(timer5).toBeGreaterThan(timer10);
  });

  it("should enforce minimum timer of 4 seconds", () => {
    const g = makeGame();
    g.round = 100;
    initRound(g);
    expect(g.timer).toBeGreaterThanOrEqual(4);
  });

  it("should increase ball speed with round number", () => {
    const speed1 = BASE_BALL_SPEED + 1 * 0.25;
    const speed10 = BASE_BALL_SPEED + 10 * 0.25;
    expect(speed10).toBeGreaterThan(speed1);
  });

  it("should keep player inside the arena during simulation", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.balls.push({ x: ARENA_CX + 50, y: ARENA_CY, vx: -3, vy: 2, bounceCount: 0 });

    for (let i = 0; i < 600; i++) {
      update(g, DT, botMove);
      if (g.state !== ST.DODGE) break;
      expect(g.px).toBeGreaterThanOrEqual(ARENA_LEFT + PLAYER_HITBOX - 1);
      expect(g.px).toBeLessThanOrEqual(ARENA_RIGHT - PLAYER_HITBOX + 1);
      expect(g.py).toBeGreaterThanOrEqual(ARENA_TOP + PLAYER_HITBOX - 1);
      expect(g.py).toBeLessThanOrEqual(ARENA_BOTTOM - PLAYER_HITBOX + 1);
    }
  });

  it("should keep all balls inside the arena (bouncing)", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5;
      g.balls.push({
        x: ARENA_CX + Math.cos(a) * 50,
        y: ARENA_CY + Math.sin(a) * 50,
        vx: Math.cos(a) * 4,
        vy: Math.sin(a) * 4,
        bounceCount: 0,
      });
    }

    const margin = 5;
    for (let i = 0; i < 300; i++) {
      update(g, DT, botMove);
      if (g.state !== ST.DODGE) break;
      for (const b of g.balls) {
        expect(b.x).toBeGreaterThanOrEqual(ARENA_LEFT - margin);
        expect(b.x).toBeLessThanOrEqual(ARENA_RIGHT + margin);
        expect(b.y).toBeGreaterThanOrEqual(ARENA_TOP - margin);
        expect(b.y).toBeLessThanOrEqual(ARENA_BOTTOM + margin);
      }
    }
  });
});
```

**Step 2: Run tests**

Run: `npm run test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add game/__tests__/beatability.test.ts
git commit -m "refactor: beatability tests use simulation modules, two-sided gates"
```

---

## Task 9: Create CLI script

**Files:**
- Create: `scripts/test-beatability.ts`
- Modify: `package.json`

**Step 1: Install tsx as dev dependency**

Run: `npm install --save-dev tsx`

**Step 2: Create scripts/test-beatability.ts**

```typescript
import { runAllBrackets } from "../game/simulation/runner";
import { formatTable, checkAll } from "../game/simulation/reporter";

const RUNS = 100;

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
```

**Step 3: Add npm scripts to package.json**

Add to `"scripts"`:

```json
"test:beatability": "tsx scripts/test-beatability.ts",
"prepare": "git config core.hooksPath .githooks"
```

**Step 4: Test the CLI**

Run: `npm run test:beatability`
Expected: ASCII table printed, exits with 0 or 1

**Step 5: Commit**

```bash
git add scripts/test-beatability.ts package.json
git commit -m "feat: add CLI beatability reporter with npm run test:beatability"
```

---

## Task 10: Create pre-push git hook

**Files:**
- Create: `.githooks/pre-push`

**Step 1: Create the hook script**

```bash
#!/bin/bash
echo ""
echo "=== Pre-push: Running beatability check ==="
echo ""
npx tsx scripts/test-beatability.ts
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "Beatability check FAILED. Fix difficulty balance before pushing."
  echo "Run 'npm run test:beatability' for details."
  echo ""
  exit 1
fi

echo ""
echo "=== Beatability check passed ==="
echo ""
exit 0
```

**Step 2: Make it executable**

Run: `chmod +x .githooks/pre-push`

**Step 3: Configure git hooks path**

Run: `git config core.hooksPath .githooks`

**Step 4: Verify hook is configured**

Run: `git config core.hooksPath`
Expected: `.githooks`

**Step 5: Commit**

```bash
git add .githooks/pre-push package.json
git commit -m "feat: add pre-push hook for beatability validation"
```

---

## Task 11: Tune difficulty to hit bracket targets

**Files:**
- Modify: `game/constants.ts` (if needed)
- Modify: `game/state.ts` (if needed)

**Step 1: Run the CLI to see current rates**

Run: `npm run test:beatability`

**Step 2: Analyze results**

- If any bracket shows "too hard": reduce `BASE_BALL_SPEED`, `BOUNCE_SPEED_BOOST`, or increase round timer
- If any bracket shows "too easy": increase `BASE_BALL_SPEED`, reduce round timer decay, or add more balls per round

**Step 3: Iterate until all brackets pass**

Adjust constants in `game/constants.ts` and `game/state.ts`, re-run `npm run test:beatability` until all 6 brackets show PASS.

**Step 4: Run full test suite**

Run: `npm run test`
Expected: All tests pass

**Step 5: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add game/constants.ts game/state.ts
git commit -m "feat: tune difficulty to hit all bracket targets (two-sided gates)"
```

---

## Task 12: Final verification

**Step 1: Run full test suite**

Run: `npm run test`
Expected: All tests pass

**Step 2: Run CLI beatability**

Run: `npm run test:beatability`
Expected: All brackets PASS, monotonic curve PASS

**Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 5: Verify pre-push hook fires**

Run: `git push --dry-run origin main 2>&1` (or push to a test branch)
Expected: Beatability check runs before push

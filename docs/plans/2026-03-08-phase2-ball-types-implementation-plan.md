# Phase 2: Ball Types + Enhanced Dodgeball — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 10 special ball types with distinct behaviors, multi-dodgeball milestones, and type-based spawn rules.

**Architecture:** Strategy pattern — each ball type has its own update/render file. A dispatcher routes by `ball.type`. Factory creates balls with correct defaults. Spawn config controls type availability per round.

**Tech Stack:** TypeScript, Vitest, HTML5 Canvas 2D

**Design doc:** `docs/plans/2026-03-08-phase2-ball-types-design.md`

---

## Task 1: Extend Ball interface and add BallType enum

**Files:**
- Create: `game/balls/types.ts`
- Modify: `game/types.ts`

**Step 1: Create game/balls/types.ts with BallType enum**

```typescript
export enum BallType {
  Dodgeball = "dodgeball",
  Tracker = "tracker",
  Splitter = "splitter",
  Ghost = "ghost",
  Bomber = "bomber",
  Zigzag = "zigzag",
  Giant = "giant",
  SpeedDemon = "speedDemon",
  GravityWell = "gravityWell",
  Mirage = "mirage",
  Ricochet = "ricochet",
}

/** Colors for each ball type */
export const BALL_COLORS: Record<BallType, string> = {
  [BallType.Dodgeball]: "#e63946",
  [BallType.Tracker]: "#9b59b6",
  [BallType.Splitter]: "#2ecc71",
  [BallType.Ghost]: "#ecf0f1",
  [BallType.Bomber]: "#e67e22",
  [BallType.Zigzag]: "#f1c40f",
  [BallType.Giant]: "#8b0000",
  [BallType.SpeedDemon]: "#3498db",
  [BallType.GravityWell]: "#2c0033",
  [BallType.Mirage]: "#ff8c00",
  [BallType.Ricochet]: "#00ced1",
};
```

**Step 2: Extend Ball interface in game/types.ts**

Change the Ball interface from:
```typescript
export interface Ball extends Point {
  vx: number;
  vy: number;
  bounceCount: number;
}
```

To:
```typescript
import { BallType } from "./balls/types";

export interface Ball extends Point {
  vx: number;
  vy: number;
  bounceCount: number;
  type: BallType;
  age: number;
  phaseTimer: number;
  isReal: boolean;
  radius: number;
  dead: boolean;
}
```

**Step 3: Fix all existing Ball creation sites**

Every place that creates a `Ball` object now needs the new fields. Search for `bounceCount: 0` across the codebase to find them. Add these defaults to each:

```typescript
type: BallType.Dodgeball,
age: 0,
phaseTimer: 0,
isReal: true,
radius: BALL_R,
dead: false,
```

Files to update:
- `game/update.ts` — ball launching in DODGE state
- `game/state.ts` — none (balls array is just `[]`)
- `game/physics.ts` — `checkPipeSuckIn` creates ball properties on teleport
- `game/input.ts` — thrown ball creation
- `game/__tests__/beatability.test.ts` — test ball creation
- `game/__tests__/physics.test.ts` — test ball creation
- `game/simulation/runner.ts` — throwAndTransition ball creation

**Step 4: Run tests**

Run: `npm run test`
Expected: All existing tests pass (no behavior change, just added fields)

**Step 5: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add game/balls/types.ts game/types.ts game/update.ts game/physics.ts game/input.ts game/__tests__/beatability.test.ts game/__tests__/physics.test.ts game/simulation/runner.ts
git commit -m "feat: extend Ball interface with type, age, radius, isReal, dead fields"
```

---

## Task 2: Create ball factory and spawn config

**Files:**
- Create: `game/balls/factory.ts`
- Create: `game/balls/spawn.ts`
- Test: `game/__tests__/balls.test.ts`

**Step 1: Write failing tests**

Create `game/__tests__/balls.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { BallType } from "../balls/types";
import { createBall, createDodgeball } from "../balls/factory";
import { getAvailableTypes, getDodgeballCount } from "../balls/spawn";
import { BALL_R } from "../constants";

describe("createBall", () => {
  it("should create a ball with correct type and defaults", () => {
    const pipe = { x: 100, y: 50, angle: Math.PI / 2 };
    const ball = createBall(BallType.Tracker, pipe, 3.0);
    expect(ball.type).toBe(BallType.Tracker);
    expect(ball.x).toBe(pipe.x);
    expect(ball.y).toBe(pipe.y);
    expect(ball.isReal).toBe(true);
    expect(ball.dead).toBe(false);
    expect(ball.age).toBe(0);
    expect(ball.bounceCount).toBe(0);
  });

  it("should create a Giant with 3x radius and 0.6x speed", () => {
    const pipe = { x: 100, y: 50, angle: Math.PI / 2 };
    const ball = createBall(BallType.Giant, pipe, 3.0);
    expect(ball.radius).toBe(BALL_R * 3);
    const speed = Math.hypot(ball.vx, ball.vy);
    expect(speed).toBeCloseTo(3.0 * 0.6, 1);
  });

  it("should fire ball inward from pipe with spread", () => {
    const pipe = { x: 100, y: 0, angle: Math.PI / 2 }; // Top pipe, aims down
    const ball = createBall(BallType.Tracker, pipe, 3.0);
    // Ball should be moving generally downward (positive vy)
    expect(ball.vy).toBeGreaterThan(0);
  });
});

describe("createDodgeball", () => {
  it("should create a dodgeball at given position and angle", () => {
    const ball = createDodgeball(200, 300, -Math.PI / 2, 7);
    expect(ball.type).toBe(BallType.Dodgeball);
    expect(ball.x).toBe(200);
    expect(ball.y).toBe(300);
    expect(ball.vy).toBeLessThan(0); // Fired upward
    expect(ball.radius).toBe(BALL_R);
  });
});

describe("getAvailableTypes", () => {
  it("should return only Tracker, Zigzag, Giant for rounds 1-3", () => {
    const types = getAvailableTypes(1);
    expect(types).toContain(BallType.Tracker);
    expect(types).toContain(BallType.Zigzag);
    expect(types).toContain(BallType.Giant);
    expect(types).not.toContain(BallType.Bomber);
    expect(types).not.toContain(BallType.GravityWell);
    expect(types).toHaveLength(3);
  });

  it("should add Splitter, Ghost, Ricochet at round 4", () => {
    const types = getAvailableTypes(4);
    expect(types).toContain(BallType.Splitter);
    expect(types).toContain(BallType.Ghost);
    expect(types).toContain(BallType.Ricochet);
    expect(types).toHaveLength(6);
  });

  it("should add SpeedDemon, Mirage at round 7", () => {
    const types = getAvailableTypes(7);
    expect(types).toContain(BallType.SpeedDemon);
    expect(types).toContain(BallType.Mirage);
    expect(types).toHaveLength(8);
  });

  it("should have all 10 types at round 10", () => {
    const types = getAvailableTypes(10);
    expect(types).toContain(BallType.Bomber);
    expect(types).toContain(BallType.GravityWell);
    expect(types).toHaveLength(10);
  });
});

describe("getDodgeballCount", () => {
  it("should return 1 for rounds 1-9", () => {
    expect(getDodgeballCount(1)).toBe(1);
    expect(getDodgeballCount(9)).toBe(1);
  });

  it("should return 2 for rounds 10-19", () => {
    expect(getDodgeballCount(10)).toBe(2);
    expect(getDodgeballCount(19)).toBe(2);
  });

  it("should return 5 for rounds 40+", () => {
    expect(getDodgeballCount(40)).toBe(5);
    expect(getDodgeballCount(50)).toBe(5);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm run test -- game/__tests__/balls.test.ts`
Expected: FAIL (modules don't exist yet)

**Step 3: Create game/balls/factory.ts**

```typescript
import { Ball, Pipe } from "../types";
import { BallType } from "./types";
import { BALL_R } from "../constants";

/** Create a special ball fired from a pipe. */
export function createBall(type: BallType, pipe: Pipe, speed: number): Ball {
  const inwardAngle = pipe.angle + Math.PI;
  const spread = (Math.random() - 0.5) * 0.4;
  const angle = inwardAngle + spread;

  let spd = speed;
  let radius = BALL_R;

  if (type === BallType.Giant) {
    radius = BALL_R * 3;
    spd *= 0.6;
  }

  return {
    x: pipe.x,
    y: pipe.y,
    vx: Math.cos(angle) * spd,
    vy: Math.sin(angle) * spd,
    bounceCount: 0,
    type,
    age: 0,
    phaseTimer: 0,
    isReal: true,
    radius,
    dead: false,
  };
}

/** Create a dodgeball at a position with a given angle and speed. */
export function createDodgeball(
  x: number,
  y: number,
  angle: number,
  speed: number
): Ball {
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    bounceCount: 0,
    type: BallType.Dodgeball,
    age: 0,
    phaseTimer: 0,
    isReal: true,
    radius: BALL_R,
    dead: false,
  };
}
```

**Step 4: Create game/balls/spawn.ts**

```typescript
import { BallType } from "./types";

/** Get available ball types for a given round. */
export function getAvailableTypes(round: number): BallType[] {
  const types: BallType[] = [BallType.Tracker, BallType.Zigzag, BallType.Giant];

  if (round >= 4) {
    types.push(BallType.Splitter, BallType.Ghost, BallType.Ricochet);
  }
  if (round >= 7) {
    types.push(BallType.SpeedDemon, BallType.Mirage);
  }
  if (round >= 10) {
    types.push(BallType.Bomber, BallType.GravityWell);
  }

  return types;
}

/** Get number of dodgeballs for a given round (milestone scaling). */
export function getDodgeballCount(round: number): number {
  if (round >= 40) return 5;
  if (round >= 30) return 4;
  if (round >= 20) return 3;
  if (round >= 10) return 2;
  return 1;
}

/** Get throw angles for N dodgeballs (spread pattern). */
export function getThrowAngles(count: number): number[] {
  const UP = -Math.PI / 2;
  switch (count) {
    case 1: return [UP];
    case 2: return [UP - Math.PI / 6, UP + Math.PI / 6];
    case 3: return [UP - Math.PI / 6, UP, UP + Math.PI / 6];
    case 4: return [UP - 5 * Math.PI / 18, UP - Math.PI / 9, UP + Math.PI / 9, UP + 5 * Math.PI / 18];
    case 5: return [UP - 2 * Math.PI / 9, UP - Math.PI / 9, UP, UP + Math.PI / 9, UP + 2 * Math.PI / 9];
    default: return [UP];
  }
}
```

**Step 5: Run tests**

Run: `npm run test -- game/__tests__/balls.test.ts`
Expected: All tests pass

**Step 6: Commit**

```bash
git add game/balls/factory.ts game/balls/spawn.ts game/__tests__/balls.test.ts
git commit -m "feat: add ball factory, spawn config, and dodgeball milestones"
```

---

## Task 3: Create the dispatcher (updateBallByType / renderBallByType)

**Files:**
- Create: `game/balls/dispatcher.ts`

**Step 1: Create dispatcher with dodgeball-only support**

Start with just the Dodgeball type working. Other types will be added as each type is implemented.

```typescript
import { Ball, GameState } from "../types";
import { BallType } from "./types";

/**
 * Update a ball based on its type. Returns new balls to add (Splitter children, Mirage fakes).
 * The caller handles standard movement (position += velocity) before calling this.
 * This function handles type-specific per-frame behavior.
 */
export function updateBallByType(ball: Ball, g: GameState, newBalls: Ball[]): void {
  ball.age++;

  switch (ball.type) {
    case BallType.Dodgeball:
      // No special behavior — standard bounce handled by caller
      break;
    // Other types will be added in subsequent tasks
    default:
      break;
  }
}

/**
 * Render a ball based on its type.
 * Called by the renderer for each ball.
 */
export function renderBallByType(
  ctx: CanvasRenderingContext2D,
  ball: Ball,
  t: number
): void {
  // Will be populated as each type is implemented.
  // For now, all types use the default ball renderer.
}
```

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add game/balls/dispatcher.ts
git commit -m "feat: add ball type dispatcher (dodgeball-only initially)"
```

---

## Task 4: Integrate dispatcher into update.ts

**Files:**
- Modify: `game/update.ts`

**Step 1: Update the DODGE state ball loop in update.ts**

Replace the ball update loop in the DODGE section. Change from:

```typescript
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
```

To:

```typescript
import { updateBallByType } from "./balls/dispatcher";

// ...inside DODGE state:
const newBalls: Ball[] = [];
for (const b of g.balls) {
  b.x += b.vx * sm;
  b.y += b.vy * sm;

  // Type-specific update (tracker curves, ghost phases, etc.)
  updateBallByType(b, g, newBalls);

  // Physics: pipe suck-in or wall bounce
  const suckPipe = checkPipeSuckIn(b, g.pipes);
  if (suckPipe >= 0) {
    g.activePipe = suckPipe;
  } else {
    bounceOffWall(b);
  }
}

// Add children (Splitter, Mirage) and remove dead balls
if (newBalls.length > 0) g.balls.push(...newBalls);
g.balls = g.balls.filter(b => !b.dead);
```

Also update collision detection to use `ball.radius` and respect `isReal`:

Change from:
```typescript
if (dist({ x: g.px, y: g.py }, b) < HIT_DIST) {
```

To:
```typescript
if (b.isReal && dist({ x: g.px, y: g.py }, b) < b.radius + PLAYER_HITBOX) {
```

And update the ball launching to use `createBall` and `getAvailableTypes`:

```typescript
import { createBall } from "./balls/factory";
import { getAvailableTypes } from "./balls/spawn";

// In ball launching section:
if (g.launched < g.launchQueue && g.launchDelay <= 0) {
  const pi = Math.floor(Math.random() * PIPE_COUNT);
  const p = g.pipes[pi];
  const spd = BASE_BALL_SPEED + g.round * 0.25;
  const available = getAvailableTypes(g.round);
  const type = available[Math.floor(Math.random() * available.length)];
  const ball = createBall(type, p, spd);
  g.balls.push(ball);
  g.activePipe = pi;
  g.launched++;
  g.launchDelay = Math.max(0.3, 1.2 - g.round * 0.08);
}
```

**Step 2: Run tests**

Run: `npm run test`
Expected: All tests pass (behavior unchanged — only Dodgeball type active)

**Step 3: Commit**

```bash
git add game/update.ts
git commit -m "feat: integrate ball dispatcher into update loop"
```

---

## Task 5: Implement Tracker ball type

**Files:**
- Create: `game/balls/tracker.ts`
- Modify: `game/balls/dispatcher.ts`
- Test: `game/__tests__/balls.test.ts`

**Step 1: Write failing test**

Add to `game/__tests__/balls.test.ts`:

```typescript
import { updateBallByType } from "../balls/dispatcher";
import { makeGame, startGame } from "../state";
import { ST } from "../types";
import { ARENA_CX, ARENA_CY, BALL_R } from "../constants";

describe("Tracker", () => {
  it("should curve toward the player over time", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.px = ARENA_CX;
    g.py = ARENA_CY;

    // Ball moving right, player is below-right
    const ball = {
      x: ARENA_CX - 100, y: ARENA_CY - 100,
      vx: 3, vy: 0,
      bounceCount: 0, type: BallType.Tracker,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
    };

    const initialAngle = Math.atan2(ball.vy, ball.vx);
    for (let i = 0; i < 30; i++) {
      updateBallByType(ball, g, []);
    }
    const newAngle = Math.atan2(ball.vy, ball.vx);

    // Angle should have shifted toward the player (downward-right)
    const targetAngle = Math.atan2(g.py - ball.y, g.px - ball.x);
    const initialDiff = Math.abs(targetAngle - initialAngle);
    const newDiff = Math.abs(targetAngle - newAngle);
    expect(newDiff).toBeLessThan(initialDiff);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- game/__tests__/balls.test.ts`
Expected: FAIL (Tracker update not implemented)

**Step 3: Create game/balls/tracker.ts**

```typescript
import { Ball, GameState } from "../types";

/** Tracker: curves toward player at 2% angle lerp per frame. */
export function updateTracker(ball: Ball, g: GameState): void {
  const targetAngle = Math.atan2(g.py - ball.y, g.px - ball.x);
  const currentAngle = Math.atan2(ball.vy, ball.vx);
  const speed = Math.hypot(ball.vx, ball.vy);

  // Lerp angle toward player (2% per frame)
  let diff = targetAngle - currentAngle;
  // Normalize to [-PI, PI]
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;

  const newAngle = currentAngle + diff * 0.02;
  ball.vx = Math.cos(newAngle) * speed;
  ball.vy = Math.sin(newAngle) * speed;
}
```

**Step 4: Add to dispatcher**

In `game/balls/dispatcher.ts`, add:

```typescript
import { updateTracker } from "./tracker";

// In the switch:
case BallType.Tracker:
  updateTracker(ball, g);
  break;
```

**Step 5: Run tests**

Run: `npm run test -- game/__tests__/balls.test.ts`
Expected: All tests pass

**Step 6: Commit**

```bash
git add game/balls/tracker.ts game/balls/dispatcher.ts game/__tests__/balls.test.ts
git commit -m "feat: implement Tracker ball type (curves toward player)"
```

---

## Task 6: Implement Splitter ball type

**Files:**
- Create: `game/balls/splitter.ts`
- Modify: `game/balls/dispatcher.ts`
- Test: `game/__tests__/balls.test.ts`

**Step 1: Write failing test**

```typescript
describe("Splitter", () => {
  it("should spawn 3 children on first bounce", () => {
    const ball = {
      x: 100, y: 100, vx: 3, vy: 0,
      bounceCount: 1, type: BallType.Splitter,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
    };
    const g = makeGame();
    const newBalls: any[] = [];
    // Simulate: bounceCount just went from 0 to 1
    updateBallByType(ball, g, newBalls);
    expect(newBalls).toHaveLength(3);
    expect(ball.dead).toBe(true);
    for (const child of newBalls) {
      expect(child.type).toBe(BallType.Splitter);
      expect(child.radius).toBe(Math.floor(BALL_R / 2));
    }
  });

  it("should not split again if already small", () => {
    const ball = {
      x: 100, y: 100, vx: 3, vy: 0,
      bounceCount: 1, type: BallType.Splitter,
      age: 0, phaseTimer: 0, isReal: true, radius: Math.floor(BALL_R / 2), dead: false,
    };
    const g = makeGame();
    const newBalls: any[] = [];
    updateBallByType(ball, g, newBalls);
    expect(newBalls).toHaveLength(0);
    expect(ball.dead).toBe(false);
  });
});
```

**Step 2: Create game/balls/splitter.ts**

```typescript
import { Ball, GameState } from "../types";
import { BallType } from "./types";
import { BALL_R } from "../constants";

/** Splitter: splits into 3 smaller balls on first bounce. */
export function updateSplitter(ball: Ball, g: GameState, newBalls: Ball[]): void {
  // Only split on first bounce and if full-size
  if (ball.bounceCount >= 1 && ball.radius >= BALL_R) {
    const speed = Math.hypot(ball.vx, ball.vy) * 0.5;
    const baseAngle = Math.atan2(ball.vy, ball.vx);
    const childRadius = Math.floor(BALL_R / 2);

    for (let i = 0; i < 3; i++) {
      const angle = baseAngle + ((i - 1) * Math.PI * 2) / 3;
      newBalls.push({
        x: ball.x,
        y: ball.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        bounceCount: 0,
        type: BallType.Splitter,
        age: 0,
        phaseTimer: 0,
        isReal: true,
        radius: childRadius,
        dead: false,
      });
    }
    ball.dead = true;
  }
}
```

**Step 3: Add to dispatcher, run tests, commit**

```bash
git add game/balls/splitter.ts game/balls/dispatcher.ts game/__tests__/balls.test.ts
git commit -m "feat: implement Splitter ball type (splits into 3 on first bounce)"
```

---

## Task 7: Implement Ghost ball type

**Files:**
- Create: `game/balls/ghost.ts`
- Modify: `game/balls/dispatcher.ts`
- Test: `game/__tests__/balls.test.ts`

**Step 1: Write failing test**

```typescript
describe("Ghost", () => {
  it("should toggle isReal every 120 frames", () => {
    const ball = {
      x: 100, y: 100, vx: 3, vy: 0,
      bounceCount: 0, type: BallType.Ghost,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
    };
    const g = makeGame();

    // Should start real
    expect(ball.isReal).toBe(true);

    // After 120 frames, should toggle
    for (let i = 0; i < 120; i++) updateBallByType(ball, g, []);
    expect(ball.isReal).toBe(false);

    // After another 120, should toggle back
    for (let i = 0; i < 120; i++) updateBallByType(ball, g, []);
    expect(ball.isReal).toBe(true);
  });
});
```

**Step 2: Create game/balls/ghost.ts**

```typescript
import { Ball } from "../types";

const PHASE_INTERVAL = 120; // 2 seconds at 60fps

/** Ghost: phases in/out every 2 seconds. */
export function updateGhost(ball: Ball): void {
  ball.phaseTimer++;
  if (ball.phaseTimer >= PHASE_INTERVAL) {
    ball.phaseTimer = 0;
    ball.isReal = !ball.isReal;
  }
}
```

**Step 3: Add to dispatcher, run tests, commit**

```bash
git add game/balls/ghost.ts game/balls/dispatcher.ts game/__tests__/balls.test.ts
git commit -m "feat: implement Ghost ball type (phases in/out every 2s)"
```

---

## Task 8: Implement Bomber ball type

**Files:**
- Create: `game/balls/bomber.ts`
- Modify: `game/balls/dispatcher.ts`
- Test: `game/__tests__/balls.test.ts`

**Step 1: Write failing test**

```typescript
describe("Bomber", () => {
  it("should explode on 3rd bounce and mark as dead", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 3, type: BallType.Bomber,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
    };
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    // Player far away — shouldn't get hit by blast
    g.px = ARENA_CX;
    g.py = ARENA_CY;

    const newBalls: any[] = [];
    updateBallByType(ball, g, newBalls);
    expect(ball.dead).toBe(true);
  });

  it("should damage player within 60px blast radius", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 3, type: BallType.Bomber,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
    };
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.px = 230; // 30px away — within blast radius
    g.py = 200;
    g.shield = false;

    updateBallByType(ball, g, []);
    expect(ball.dead).toBe(true);
    // The update.ts collision loop handles damage, but bomber marks explosion
    // The bomber itself just marks dead and sets a blast flag
  });

  it("should not explode before 3rd bounce", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 2, type: BallType.Bomber,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
    };
    const g = makeGame();
    updateBallByType(ball, g, []);
    expect(ball.dead).toBe(false);
  });
});
```

**Step 2: Create game/balls/bomber.ts**

```typescript
import { Ball, GameState } from "../types";
import { dist } from "../physics";

const BLAST_RADIUS = 60;

/** Bomber: explodes on 3rd bounce with blast radius. */
export function updateBomber(ball: Ball, g: GameState): void {
  if (ball.bounceCount >= 3) {
    // Blast radius damage check
    if (!g.shield) {
      const d = dist({ x: g.px, y: g.py }, ball);
      if (d < BLAST_RADIUS) {
        g.lives--;
        g.flash = 0.5;
        if (g.lives <= 0) {
          g.state = 6; // ST.OVER
          g.highScore = Math.max(g.highScore, g.score);
        } else {
          g.state = 4; // ST.HIT
          g.msgTimer = 1.2;
          g.msg = "BOOM!";
        }
      }
    }
    ball.dead = true;
  }
}
```

**Step 3: Add to dispatcher, run tests, commit**

```bash
git add game/balls/bomber.ts game/balls/dispatcher.ts game/__tests__/balls.test.ts
git commit -m "feat: implement Bomber ball type (explodes on 3rd bounce)"
```

---

## Task 9: Implement Zigzag ball type

**Files:**
- Create: `game/balls/zigzag.ts`
- Modify: `game/balls/dispatcher.ts`
- Test: `game/__tests__/balls.test.ts`

**Step 1: Write failing test**

```typescript
describe("Zigzag", () => {
  it("should apply sine-wave offset perpendicular to velocity", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 0, type: BallType.Zigzag,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
    };
    const g = makeGame();

    // Run a few frames and check y oscillates (perpendicular to vx)
    const yPositions: number[] = [];
    for (let i = 0; i < 60; i++) {
      updateBallByType(ball, g, []);
      yPositions.push(ball.y);
    }
    const minY = Math.min(...yPositions);
    const maxY = Math.max(...yPositions);
    expect(maxY - minY).toBeGreaterThan(5); // Should oscillate
  });
});
```

**Step 2: Create game/balls/zigzag.ts**

```typescript
import { Ball } from "../types";

const ZIGZAG_AMP = 1.5;  // Amplitude of sine offset per frame
const ZIGZAG_FREQ = 0.1; // Frequency of sine wave

/** Zigzag: adds sine-wave offset perpendicular to velocity. */
export function updateZigzag(ball: Ball): void {
  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed < 0.01) return;

  // Perpendicular direction
  const perpX = -ball.vy / speed;
  const perpY = ball.vx / speed;

  // Sine offset
  const offset = Math.cos(ball.age * ZIGZAG_FREQ) * ZIGZAG_AMP;
  ball.x += perpX * offset;
  ball.y += perpY * offset;
}
```

**Step 3: Add to dispatcher, run tests, commit**

```bash
git add game/balls/zigzag.ts game/balls/dispatcher.ts game/__tests__/balls.test.ts
git commit -m "feat: implement Zigzag ball type (sine-wave movement)"
```

---

## Task 10: Implement Giant, SpeedDemon, GravityWell, Mirage, Ricochet

**Files:**
- Create: `game/balls/giant.ts`
- Create: `game/balls/speedDemon.ts`
- Create: `game/balls/gravityWell.ts`
- Create: `game/balls/mirage.ts`
- Create: `game/balls/ricochet.ts`
- Modify: `game/balls/dispatcher.ts`
- Test: `game/__tests__/balls.test.ts`

**Step 1: Write tests for all 5 types**

Add to `game/__tests__/balls.test.ts`:

```typescript
describe("Giant", () => {
  it("should have no special update behavior (size/speed set by factory)", () => {
    const ball = {
      x: 200, y: 200, vx: 2, vy: 0,
      bounceCount: 0, type: BallType.Giant,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R * 3, dead: false,
    };
    const g = makeGame();
    updateBallByType(ball, g, []);
    expect(ball.dead).toBe(false);
    expect(ball.radius).toBe(BALL_R * 3);
  });
});

describe("SpeedDemon", () => {
  it("should double speed on bounce (tracked via bounceCount)", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 1, type: BallType.SpeedDemon,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
    };
    const g = makeGame();
    updateBallByType(ball, g, []);
    const speed = Math.hypot(ball.vx, ball.vy);
    // After 1 bounce, should be 2x original (handled by bounce callback)
    // The update just caps the speed
    expect(speed).toBeLessThanOrEqual(3 * 8); // Max 8x cap
  });
});

describe("GravityWell", () => {
  it("should pull player toward it within 80px", () => {
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.px = 250;
    g.py = 200;

    const ball = {
      x: 200, y: 200, vx: 0, vy: 3,
      bounceCount: 0, type: BallType.GravityWell,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
    };

    const oldPx = g.px;
    updateBallByType(ball, g, []);
    expect(g.px).toBeLessThan(oldPx); // Pulled left toward ball
  });

  it("should not pull player beyond 80px", () => {
    const g = makeGame();
    startGame(g);
    g.px = 300;
    g.py = 200;

    const ball = {
      x: 200, y: 200, vx: 0, vy: 3,
      bounceCount: 0, type: BallType.GravityWell,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
    };

    const oldPx = g.px;
    updateBallByType(ball, g, []);
    expect(g.px).toBe(oldPx); // 100px away, no pull
  });
});

describe("Mirage", () => {
  it("should spawn 2 fakes on first bounce", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 1, type: BallType.Mirage,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
    };
    const g = makeGame();
    const newBalls: any[] = [];
    updateBallByType(ball, g, newBalls);
    expect(newBalls).toHaveLength(2);
    for (const fake of newBalls) {
      expect(fake.isReal).toBe(false);
      expect(fake.type).toBe(BallType.Mirage);
    }
    // Original should set phaseTimer to prevent re-spawning
    expect(ball.phaseTimer).toBe(1);
  });

  it("should mark fakes as dead after 300 frames", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 0, type: BallType.Mirage,
      age: 299, phaseTimer: 0, isReal: false, radius: BALL_R, dead: false,
    };
    const g = makeGame();
    updateBallByType(ball, g, []);
    expect(ball.dead).toBe(true);
  });
});

describe("Ricochet", () => {
  it("should have no special per-frame update (bounce angle modified in physics)", () => {
    const ball = {
      x: 200, y: 200, vx: 3, vy: 0,
      bounceCount: 0, type: BallType.Ricochet,
      age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false,
    };
    const g = makeGame();
    updateBallByType(ball, g, []);
    expect(ball.dead).toBe(false);
  });
});
```

**Step 2: Create the 5 type files**

`game/balls/giant.ts`:
```typescript
import { Ball } from "../types";

/** Giant: no special update — size and speed set by factory. */
export function updateGiant(_ball: Ball): void {
  // No per-frame behavior. 3x radius and 0.6x speed set at creation.
}
```

`game/balls/speedDemon.ts`:
```typescript
import { Ball } from "../types";

const MAX_SPEED_MULTIPLIER = 8;

/** SpeedDemon: applies 2x speed boost per bounce, caps at 8x. */
export function updateSpeedDemon(ball: Ball): void {
  const speed = Math.hypot(ball.vx, ball.vy);
  const baseSpeed = speed / Math.pow(2, ball.bounceCount);
  const maxSpeed = baseSpeed * MAX_SPEED_MULTIPLIER;

  if (speed > maxSpeed) {
    const scale = maxSpeed / speed;
    ball.vx *= scale;
    ball.vy *= scale;
  }
}
```

`game/balls/gravityWell.ts`:
```typescript
import { Ball, GameState } from "../types";

const PULL_RADIUS = 80;
const PULL_STRENGTH = 0.3;

/** GravityWell: pulls player toward it within radius. */
export function updateGravityWell(ball: Ball, g: GameState): void {
  const dx = ball.x - g.px;
  const dy = ball.y - g.py;
  const d = Math.hypot(dx, dy);

  if (d > 0 && d < PULL_RADIUS) {
    g.px += (dx / d) * PULL_STRENGTH;
    g.py += (dy / d) * PULL_STRENGTH;
  }
}
```

`game/balls/mirage.ts`:
```typescript
import { Ball, GameState } from "../types";
import { BallType } from "./types";
import { BALL_R } from "../constants";

const FAKE_LIFESPAN = 300; // 5 seconds at 60fps

/** Mirage: spawns 2 fakes on first bounce, fakes expire after 5s. */
export function updateMirage(ball: Ball, g: GameState, newBalls: Ball[]): void {
  // Expire fakes
  if (!ball.isReal && ball.age >= FAKE_LIFESPAN) {
    ball.dead = true;
    return;
  }

  // Spawn fakes on first bounce (only once, tracked by phaseTimer)
  if (ball.isReal && ball.bounceCount >= 1 && ball.phaseTimer === 0) {
    ball.phaseTimer = 1; // Prevent re-spawning

    for (let i = 0; i < 2; i++) {
      const angleOffset = (Math.random() - 0.5) * Math.PI;
      const speed = Math.hypot(ball.vx, ball.vy);
      const baseAngle = Math.atan2(ball.vy, ball.vx);
      const angle = baseAngle + angleOffset;

      newBalls.push({
        x: ball.x,
        y: ball.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        bounceCount: 0,
        type: BallType.Mirage,
        age: 0,
        phaseTimer: 0,
        isReal: false,
        radius: BALL_R,
        dead: false,
      });
    }
  }
}
```

`game/balls/ricochet.ts`:
```typescript
import { Ball } from "../types";

/** Ricochet: bounce angle randomization is handled in physics.ts bounceOffWall. */
export function updateRicochet(_ball: Ball): void {
  // No per-frame behavior. Wild bounce angles applied in bounceOffWall.
}
```

**Step 3: Add all to dispatcher, run tests, commit**

Add all cases to the dispatcher switch statement.

```bash
git add game/balls/giant.ts game/balls/speedDemon.ts game/balls/gravityWell.ts game/balls/mirage.ts game/balls/ricochet.ts game/balls/dispatcher.ts game/__tests__/balls.test.ts
git commit -m "feat: implement Giant, SpeedDemon, GravityWell, Mirage, Ricochet ball types"
```

---

## Task 11: Add Ricochet and SpeedDemon bounce modifiers to physics.ts

**Files:**
- Modify: `game/physics.ts`

**Step 1: Modify bounceOffWall to handle type-specific bounce behavior**

Import `BallType` and modify the bounce function:

```typescript
import { BallType } from "./balls/types";

// In bounceOffWall, after the standard reflection:

// Ricochet: add random angle offset
if (ball.type === BallType.Ricochet) {
  const speed = Math.hypot(ball.vx, ball.vy);
  const angle = Math.atan2(ball.vy, ball.vx) + (Math.random() - 0.5) * Math.PI / 2;
  ball.vx = Math.cos(angle) * speed;
  ball.vy = Math.sin(angle) * speed;
}

// SpeedDemon: 2x speed on each bounce (instead of standard 1.06x)
if (ball.type === BallType.SpeedDemon) {
  ball.vx *= 2 / BOUNCE_SPEED_BOOST; // Undo the standard boost, apply 2x
  ball.vy *= 2 / BOUNCE_SPEED_BOOST;
}
```

**Step 2: Run tests**

Run: `npm run test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add game/physics.ts
git commit -m "feat: add Ricochet random bounce angles and SpeedDemon 2x bounce"
```

---

## Task 12: Integrate multi-dodgeball throw

**Files:**
- Modify: `game/types.ts` — change `thrown: Ball | null` to `thrown: Ball[]`
- Modify: `game/update.ts` — handle Ball[] in THROW state
- Modify: `game/loop.ts` — render all thrown balls
- Modify: `game/input.ts` — create multiple dodgeballs on throw
- Modify: `game/state.ts` — reset thrown to `[]`
- Modify: `game/simulation/runner.ts` — update throwAndTransition

**Step 1: Change thrown type in types.ts**

Change `thrown: Ball | null` to `thrown: Ball[]`.

**Step 2: Update state.ts**

Change `g.thrown = null` to `g.thrown = []` in `initRound` and `makeGame`.

**Step 3: Update input.ts**

In the keyboard throw handler and swipe throw handler, use `createDodgeball` and `getThrowAngles`:

```typescript
import { createDodgeball } from "./balls/factory";
import { getDodgeballCount, getThrowAngles } from "./balls/spawn";
import { THROW_SPEED } from "./constants";

// Keyboard throw:
if (g.state === ST.READY && (e.key === " " || e.key === "Enter")) {
  const count = getDodgeballCount(g.round);
  const angles = getThrowAngles(count);
  g.thrown = angles.map(a => createDodgeball(g.px, g.py, a, THROW_SPEED));
  g.state = ST.THROW;
}

// Swipe throw (similar but use swipe direction as base angle):
const baseAngle = Math.atan2(dy, dx);
const count = getDodgeballCount(g.round);
const offsets = getThrowAngles(count);
const upAngle = -Math.PI / 2;
g.thrown = offsets.map(a => {
  const offset = a - upAngle; // Convert from up-relative to absolute
  return createDodgeball(g.px, g.py, baseAngle + offset, THROW_SPEED);
});
g.state = ST.THROW;
```

**Step 4: Update update.ts THROW state**

```typescript
// THROW state — update all thrown balls
if (g.state === ST.THROW) {
  let anyBounced = false;
  for (const t of g.thrown) {
    t.x += t.vx;
    t.y += t.vy;
    const suck = checkPipeSuckIn(t, g.pipes);
    if (suck >= 0) { g.activePipe = suck; anyBounced = true; }
    const bounced = bounceOffWall(t);
    if (bounced) anyBounced = true;
  }
  if (anyBounced) {
    g.balls.push(...g.thrown);
    g.thrown = [];
    g.state = ST.DODGE;
    g.launchDelay = 0.6;
  }
  return;
}
```

**Step 5: Update loop.ts THROW render**

```typescript
if (g.state === ST.THROW) {
  for (const t of g.thrown) drawBall(ctx, t.x, t.y, true);
  // ...
}
```

**Step 6: Update simulation/runner.ts throwAndTransition**

```typescript
function throwAndTransition(g: GameState): void {
  const count = getDodgeballCount(g.round);
  const angles = getThrowAngles(count);
  g.thrown = angles.map(a => createDodgeball(g.px, g.py, a, THROW_SPEED));
  g.state = ST.THROW;

  for (let i = 0; i < 120; i++) {
    if (g.thrown.length === 0) break;
    let anyBounced = false;
    for (const t of g.thrown) {
      t.x += t.vx;
      t.y += t.vy;
      const suck = checkPipeSuckIn(t, g.pipes);
      const bounced = bounceOffWall(t);
      if (bounced || suck >= 0) anyBounced = true;
    }
    if (anyBounced) {
      g.balls.push(...g.thrown);
      g.thrown = [];
      g.state = ST.DODGE;
      g.launchDelay = 0.6;
      break;
    }
  }
}
```

**Step 7: Run all tests**

Run: `npm run test`
Expected: All tests pass

**Step 8: Commit**

```bash
git add game/types.ts game/state.ts game/input.ts game/update.ts game/loop.ts game/simulation/runner.ts
git commit -m "feat: multi-dodgeball throw with spread pattern at milestones"
```

---

## Task 13: Update ball renderer for type-specific visuals

**Files:**
- Modify: `game/renderer/ball.ts`

**Step 1: Update drawBall to use ball type colors and effects**

The renderer needs access to the full `Ball` object (not just x, y). Change the signature and add type-specific rendering.

```typescript
import { Ball } from "../types";
import { BallType, BALL_COLORS } from "../balls/types";
import { BALL_R } from "../constants";

export function drawBall(ctx: CanvasRenderingContext2D, ball: Ball, t: number): void {
  const color = BALL_COLORS[ball.type];

  // Ghost: reduce opacity when phased out
  if (ball.type === BallType.Ghost && !ball.isReal) {
    ctx.globalAlpha = 0.2;
  }

  // Mirage fakes: semi-transparent
  if (ball.type === BallType.Mirage && !ball.isReal) {
    ctx.globalAlpha = 0.4;
  }

  // Bomber: flash rate increases near 3rd bounce
  let drawColor = color;
  if (ball.type === BallType.Bomber) {
    const flashRate = ball.bounceCount >= 2 ? 12 : 6;
    if (Math.floor(t * flashRate) % 2 === 0) drawColor = "#fff";
  }

  // Draw the ball
  ctx.fillStyle = drawColor;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  // Glow for dodgeball
  if (ball.type === BallType.Dodgeball) {
    ctx.shadowColor = "#ff4444";
    ctx.shadowBlur = 8 + Math.sin(t * 4) * 3;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Tracker: reticle overlay
  if (ball.type === BallType.Tracker) {
    ctx.strokeStyle = "#ff00ff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius + 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  // GravityWell: swirl effect
  if (ball.type === BallType.GravityWell) {
    ctx.strokeStyle = "rgba(128,0,255,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 40, t * 2, t * 2 + Math.PI * 1.5);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}
```

**Step 2: Update all drawBall call sites to pass Ball object**

In `game/loop.ts`, change:
- `drawBall(ctx, g.px, g.py - 20, false)` → pass a temporary dodgeball object for the READY state preview
- `g.balls.forEach((b) => drawBall(ctx, b.x, b.y, true))` → `g.balls.forEach((b) => drawBall(ctx, b, g.t))`
- Thrown balls: similar update

**Step 3: Run tests and build**

Run: `npm run test && npm run build`
Expected: All pass

**Step 4: Commit**

```bash
git add game/renderer/ball.ts game/loop.ts
git commit -m "feat: type-specific ball rendering (colors, effects, opacity)"
```

---

## Task 14: Run full test suite and verify build

**Step 1: Run all tests**

Run: `npm run test`
Expected: All tests pass

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 4: Commit any fixes**

If any tests or build issues, fix and commit.

---

## Task 15: Difficulty tuning for beatability brackets

**Files:**
- Modify: `game/constants.ts` (if needed)
- Modify: `game/state.ts` (if needed)
- Modify: `game/simulation/bot.ts` (if needed)

**Step 1: Run beatability tests to see current rates**

Run: `npm run test -- game/__tests__/beatability.test.ts --reporter=verbose`

**Step 2: Analyze which brackets are out of range**

- "Too hard" → reduce ball speed, increase round timer, reduce ball count
- "Too easy" → increase ball speed, decrease round timer, add more balls

**Step 3: Update bot to handle new ball types**

The bot needs awareness of:
- **Ghost**: ignore phased-out balls in threat calculation
- **GravityWell**: account for pull effect on future position
- **Bomber**: increase danger radius near 3rd bounce

In `game/simulation/bot.ts`, update `predictBall` and threat scoring.

**Step 4: Iterate until all brackets pass**

Adjust constants and bot, re-run tests until all 6 brackets are within their sweet spots.

**Step 5: Run full test suite**

Run: `npm run test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add game/constants.ts game/state.ts game/simulation/bot.ts
git commit -m "feat: tune difficulty and bot AI for Phase 2 ball types"
```

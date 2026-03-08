# Phase 2: Ball Types + Enhanced Dodgeball — Design

**Date:** 2026-03-08
**Status:** Approved
**Goal:** 10 special ball types with distinct behaviors, persistent bouncing dodgeball, multi-dodgeball milestones.

---

## 1. Extended Ball Type

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

export interface Ball extends Point {
  vx: number;
  vy: number;
  bounceCount: number;
  type: BallType;
  age: number;           // Frames alive
  phaseTimer: number;    // Ghost: visibility toggle timer
  isReal: boolean;       // Mirage: false for fake copies
  radius: number;        // Giant: 3x BALL_R, others: BALL_R
  dead: boolean;         // Marks for removal (Bomber explosion, expired fakes)
}
```

Children (Splitter, Mirage) are added directly to `g.balls[]`. Dead balls are filtered out at end of each frame.

---

## 2. Ball Type Behaviors

### Strategy Pattern Architecture

Each ball type has its own file with `update(ball, game)` and `render(ctx, ball, time)` functions. A dispatcher routes by `ball.type`.

| # | Type | Movement | Collision | Visual |
|---|------|----------|-----------|--------|
| 0 | Dodgeball | Standard bounce, +6%/bounce | Normal hitbox | Red, ki glow |
| 1 | Tracker | Curves toward player (2%/frame angle lerp) | Normal | Purple, homing reticle |
| 2 | Splitter | Standard → splits into 3 on 1st bounce (120° spread, half size/speed) | Half hitbox for children | Green, pulses before split |
| 3 | Ghost | Standard, toggles visibility every 120 frames (2s) | Only when visible (`isReal`) | White, fades to 20% opacity |
| 4 | Bomber | Standard → explodes on 3rd bounce (60px blast radius), respawns from pipe | Blast radius on explode | Red/orange, flash rate increases |
| 5 | Zigzag | Sine-wave perpendicular to velocity | Normal | Yellow, lightning trail |
| 6 | Giant | 0.6x speed, 3x radius (21px) | 3x hitbox | Large dark red |
| 7 | SpeedDemon | 2x speed multiplier per bounce (caps at 8x) | Normal | Blue, motion blur trail |
| 8 | GravityWell | Standard + pulls player ~0.3px/frame within 80px radius | Normal | Dark purple, swirl |
| 9 | Mirage | Standard → spawns 2 fakes on 1st bounce (5s lifespan, `isReal=false`) | Fakes don't collide | Orange, fakes at 40% opacity |
| 10 | Ricochet | Standard but bounce angle ±45° random offset | Normal | Cyan, sparks on bounce |

### Key Behavior Details

- **Tracker** re-acquires target after each bounce/pipe teleport
- **Splitter** children won't split again (checked via `radius < BALL_R`)
- **Bomber** respawns from a random pipe after exploding
- **Ghost** cannot hurt player when phased (`isReal = false`)
- **GravityWell** pull is gentle (0.3px/frame), doesn't override player input
- **Mirage** fakes disappear after 300 frames (5s at 60fps)
- **SpeedDemon** speed cap prevents balls from becoming invisible

---

## 3. Spawn Rules

### Special Balls Per Round

Round N launches `(N-1)` special balls from pipes with staggered timing (same as current pipe ball system).

### Type Availability by Round

Prevents overwhelming the early game:

| Rounds | Available Types |
|--------|----------------|
| 1-3 | Tracker, Zigzag, Giant |
| 4-6 | + Splitter, Ghost, Ricochet |
| 7-9 | + SpeedDemon, Mirage |
| 10+ | + Bomber, GravityWell (all types) |

Type is randomly selected from the available pool for that round.

---

## 4. Multi-Dodgeball Milestones

| Level Range | Dodgeballs |
|-------------|------------|
| L1-9 | 1 |
| L10-19 | 2 |
| L20-29 | 3 |
| L30-39 | 4 |
| L40-50 | 5 |

### Throw Pattern

All dodgeballs thrown simultaneously at round start in a spread:

| Count | Angles (from straight up) |
|-------|---------------------------|
| 1 | 0° |
| 2 | ±30° |
| 3 | -30°, 0°, +30° |
| 4 | ±20°, ±50° |
| 5 | -40°, -20°, 0°, +20°, +40° |

The `thrown` field changes from `Ball | null` to `Ball[]` to support multiple simultaneous throws. All are moved into `g.balls` when the first one bounces/gets sucked in.

---

## 5. File Structure

```
game/
  types.ts                  # MODIFY — extend Ball, add BallType enum
  balls/
    types.ts                # BallType enum, BallConfig, ball defaults
    tracker.ts              # updateTracker(), renderTracker()
    splitter.ts             # updateSplitter(), renderSplitter()
    ghost.ts                # updateGhost(), renderGhost()
    bomber.ts               # updateBomber(), renderBomber()
    zigzag.ts               # updateZigzag(), renderZigzag()
    giant.ts                # updateGiant(), renderGiant()
    speedDemon.ts           # updateSpeedDemon(), renderSpeedDemon()
    gravityWell.ts          # updateGravityWell(), renderGravityWell()
    mirage.ts               # updateMirage(), renderMirage()
    ricochet.ts             # updateRicochet(), renderRicochet()
    dispatcher.ts           # updateBallByType(), renderBallByType()
    factory.ts              # createBall(type, pipe), createDodgeball(x, y, angle)
    spawn.ts                # getAvailableTypes(round), getDodgeballCount(round)
  update.ts                 # MODIFY — use dispatcher for ball updates
  renderer/ball.ts          # MODIFY — use dispatcher for ball rendering
  state.ts                  # MODIFY — multi-dodgeball in initRound
  constants.ts              # MODIFY — add ball type colors
  __tests__/
    balls.test.ts           # NEW — per-type behavior tests
```

---

## 6. Integration with update.ts

Changes to the update loop:
- Ball movement calls `updateBallByType(ball, game, newBalls)` instead of raw `b.x += b.vx`
- Each type's update handles its own movement, then calls `bounceOffWall`/`checkPipeSuckIn`
- `newBalls` array collects children (Splitter, Mirage) — merged after iteration
- After all updates: `g.balls = g.balls.filter(b => !b.dead).concat(newBalls)`
- Collision detection uses `ball.radius` instead of fixed `HIT_DIST`
- Ghost/Mirage balls with `isReal = false` skip collision check

### THROW State Changes

- `g.thrown` becomes `Ball[]` (array of dodgeballs)
- All move simultaneously during THROW
- Transition to DODGE when first ball bounces or gets sucked in
- All thrown balls move into `g.balls` at that point

---

## 7. Colors (added to constants.ts)

```typescript
export const BALL_COLORS = {
  dodgeball: "#e63946",
  tracker: "#9b59b6",
  splitter: "#2ecc71",
  ghost: "#ecf0f1",
  bomber: "#e67e22",
  zigzag: "#f1c40f",
  giant: "#8b0000",
  speedDemon: "#3498db",
  gravityWell: "#2c0033",
  mirage: "#ff8c00",
  ricochet: "#00ced1",
} as const;
```

---

## 8. Testing Strategy

### Unit Tests (per type)
- Each ball type gets 2-3 tests verifying its unique behavior
- Tracker: verify angle curves toward player position
- Splitter: verify 3 children created on 1st bounce, no split on 2nd
- Ghost: verify `isReal` toggles every 120 frames
- Bomber: verify explosion on 3rd bounce, blast radius hit detection
- Zigzag: verify sine-wave offset applied
- Giant: verify 3x radius, 0.6x speed
- SpeedDemon: verify 2x speed on bounce, caps at 8x
- GravityWell: verify player pull within 80px
- Mirage: verify 2 fakes spawned, `isReal=false`, expire after 300 frames
- Ricochet: verify bounce angle has random offset

### Integration Tests
- Spawn rules: correct types available per round
- Multi-dodgeball: correct count per milestone level
- Factory: `createBall()` produces correct defaults per type
- Dead ball cleanup: `dead` balls removed from array

### Beatability
- Existing beatability tests in `beatability.test.ts` will validate that the new ball types don't break the difficulty curve
- The bot in `simulation/bot.ts` may need updates to handle special behaviors (Ghost phasing, GravityWell pull)

# How to Add a New Power-Up Item

> **Quick reference** — Use this checklist every time you add a new power-up.
> Missing even one step will cause a build failure or runtime bug.

---

## 1. Define the Type and Config

**File:** `game/powerups/types.ts`

```typescript
// Add to the enum
export enum PowerUpType {
  // ... existing types ...
  MyNewPowerUp = "myNewPowerUp",
}

// Add config entry
export const POWER_UP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  // ... existing configs ...
  [PowerUpType.MyNewPowerUp]: {
    type: PowerUpType.MyNewPowerUp,
    label: "DESCRIPTION OF EFFECT",
    icon: "ICON TEXT",
    color: "#hexcolor",
    glowColor: "#hexcolor",
    minRound: 1,       // when it starts appearing
    weight: 5,         // spawn frequency (higher = more common)
  },
};
```

**Checklist:**
- [ ] Added to `PowerUpType` enum
- [ ] Added config entry to `POWER_UP_CONFIGS`
- [ ] Unique label, icon, color, glowColor
- [ ] Reasonable `minRound` and `weight`

---

## 2. Add State Fields to `EffectsState`

**File:** `game/types.ts`

```typescript
export interface EffectsState {
  // ... existing fields ...
  myNewPowerUpFlag: boolean;       // e.g., active/inactive
  myNewPowerUpTimer: number;       // seconds remaining (0 = inactive)
}
```

**Checklist:**
- [ ] Added to `EffectsState` interface (not a separate object)
- [ ] Boolean flag for "active" state
- [ ] Numeric timer field for duration
- [ ] Clear naming convention: `<name>Flag`, `<name>Timer`

---

## 3. Initialize in `makeEffectsState()`

**File:** `game/state.ts`

```typescript
function makeEffectsState(): EffectsState {
  return {
    // ... existing fields ...
    myNewPowerUpFlag: false,
    myNewPowerUpTimer: 0,
  };
}
```

**Checklist:**
- [ ] Added initialization in `makeEffectsState()`
- [ ] Boolean defaults to `false`
- [ ] Timer defaults to `0`

---

## 4. Add Effect Application Logic

**File:** `game/powerups/effects.ts`

```typescript
export function applyPowerUp(g: GameState, type: PowerUpType): void {
  // ... existing switch cases ...
  case PowerUpType.MyNewPowerUp:
    g.effects.myNewPowerUpFlag = true;
    g.effects.myNewPowerUpTimer = 5;  // duration in seconds
    g.meta.msg = "EFFECT MESSAGE!";
    g.meta.msgTimer = 0.8;
    break;
}
```

**Checklist:**
- [ ] Added `case` in `applyPowerUp()` switch statement
- [ ] Sets flag to `true` and timer to duration
- [ ] Shows activation message in `g.meta.msg`
- [ ] Plays any needed SFX (via `audio.playSFX("name")`)

---

## 5. Add Timer Ticking to `update.ts`

**File:** `game/update.ts` (in the "always tick" section, NOT inside a state block)

```typescript
// Always tick — outside any state-specific block
if (fx.myNewPowerUpFlag) {
  fx.myNewPowerUpTimer -= dt;
  if (fx.myNewPowerUpTimer <= 0) {
    fx.myNewPowerUpFlag = false;
    fx.myNewPowerUpTimer = 0;
  }
}
```

**Critical:** Place this in the **"always tick" section** near the top of `update()`, alongside other timed effects (kaioken, solarFlare, etc.). Do NOT put it inside a `ST.DODGE` or other state block.

**Checklist:**
- [ ] Added in the "always tick" section (top of `update()`)
- [ ] Does NOT decrement inside `ST.DODGE` or other state blocks
- [ ] Clears flag and sets timer to 0 when elapsed

---

## 6. Handle Collision Behavior (if applicable)

**File:** `game/update.ts` (collision detection section)

```typescript
for (const b of g.balls) {
  if (b.isReal && dist({ x: ps.px, y: ps.py }, b) < b.radius + hitboxRadius) {
    // Your new collision logic here
    if (fx.myNewPowerUpFlag) {
      b.dead = true;
      // Add explosion or other visual feedback
      meta.explosions.push({ x: b.x, y: b.y, color: "#color", timer: 0.8 });
      continue;
    }
    // ... existing damage logic ...
  }
}
```

**Checklist:**
- [ ] Added collision check in `update()` collision detection
- [ ] Uses `fx.myNewPowerUpFlag` to branch behavior
- [ ] Adds visual feedback (explosions, particles, etc.)
- [ ] Does NOT cause damage if the power-up is protective

---

## 7. Update Rendering

**File:** `game/renderer/player.ts`

```typescript
export function drawGoku(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  flash: boolean,
  t: number = 0,
  vx: number = 0,
  vy: number = 0,
  form: SaiyanForm = SaiyanForm.Base,
  kaioken: boolean = false,
  myNewPowerUpFlag: boolean = false  // NEW PARAMETER
): void {
  // ... existing rendering ...

  // Visual effect when active
  if (myNewPowerUpFlag) {
    // Draw aura, particles, glow, etc.
  }
}
```

**Checklist:**
- [ ] Added new parameter to `drawGoku()` function signature
- [ ] Added visual rendering when flag is true
- [ ] Uses `t` (time) for animations (pulsing, orbiting, etc.)

---

## 8. Pass Flag to Renderer in `loop.ts`

**File:** `game/loop.ts`

```typescript
// Find all calls to drawGoku() and add the new parameter
drawGoku(ctx, g.player.px, g.player.py, g.meta.flash > 0, g.meta.t,
         g.player.pvx, g.player.pvy, form, g.effects.kaioken,
         g.effects.myNewPowerUpFlag);  // NEW ARGUMENT
```

**Checklist:**
- [ ] Updated ALL `drawGoku()` calls in `loop.ts`
- [ ] Passes `g.effects.myNewPowerUpFlag` as the last argument
- [ ] Also updated shrink-scaled rendering path (if applicable)
- [ ] Also updated power-up render (if it uses drawGoku)

---

## 9. Update Save System (CRITICAL — common failure point)

### 9a. Add to `SaveData` interface

**File:** `game/save.ts`

```typescript
export interface SaveData {
  effects: {
    // ... existing fields ...
    myNewPowerUpFlag: boolean;
    myNewPowerUpTimer: number;
  };
}
```

### 9b. Add to `serialize()`

```typescript
export function serialize(g: GameState): SaveData {
  return {
    // ... existing fields ...
    effects: {
      // ... existing fields ...
      myNewPowerUpFlag: g.effects.myNewPowerUpFlag,
      myNewPowerUpTimer: g.effects.myNewPowerUpTimer,
    },
  };
}
```

### 9c. Add to `restore()`

```typescript
export function restore(data: SaveData): GameState {
  const g = makeGame();
  // ... restore other fields ...
  g.effects = {
    // ... existing fields ...
    myNewPowerUpFlag: data.effects.myNewPowerUpFlag ?? false,
    myNewPowerUpTimer: data.effects.myNewPowerUpTimer ?? 0,
  };
  return g;
}
```

**Checklist:**
- [ ] Added to `SaveData.effects` interface
- [ ] Added to `serialize()` function
- [ ] Added to `restore()` function (with `?? false` / `?? 0` defaults)
- [ ] **This is the #1 cause of build failures** — always update all three locations

---

## 10. Update Round Resets

**File:** `game/state.ts`

```typescript
export function initRound(g: GameState): void {
  // ... existing resets ...
  const fx = g.effects;
  // ... existing resets ...
  fx.myNewPowerUpFlag = false;
  fx.myNewPowerUpTimer = 0;
}

export function restoreAfterHit(g: GameState): void {
  // ... existing resets ...
  const fx = g.effects;
  // ... existing resets ...
  fx.myNewPowerUpFlag = false;
  fx.myNewPowerUpTimer = 0;
}
```

**Checklist:**
- [ ] Added reset in `initRound()` (called when round starts)
- [ ] Added reset in `restoreAfterHit()` (called when player takes damage)
- [ ] Does NOT persist across rounds (unless intentionally designed to)

---

## 11. Write Tests

**File:** `game/__tests__/powerup-visuals.test.ts` (or create a new test file)

```typescript
describe("MyNewPowerUp power-up", () => {
  let g: GameState;

  beforeEach(() => {
    g = makeDodgeState();
  });

  it("sets active flag and timer on collection", () => {
    applyPowerUp(g, PowerUpType.MyNewPowerUp);
    expect(g.effects.myNewPowerUpFlag).toBe(true);
    expect(g.effects.myNewPowerUpTimer).toBe(5);
  });

  it("timer decrements and clears flag when elapsed", () => {
    applyPowerUp(g, PowerUpType.MyNewPowerUp);
    g.effects.myNewPowerUpTimer = 0.01;
    update(g, 0.02);
    expect(g.effects.myNewPowerUpFlag).toBe(false);
    expect(g.effects.myNewPowerUpTimer).toBe(0);
  });

  it("provides expected game behavior while active", () => {
    applyPowerUp(g, PowerUpType.MyNewPowerUp);
    // Test collision behavior, visual feedback, etc.
  });

  it("can combine with other power-ups without conflict", () => {
    applyPowerUp(g, PowerUpType.MyNewPowerUp);
    applyPowerUp(g, PowerUpType.Kaioken);
    expect(g.effects.myNewPowerUpFlag).toBe(true);
    expect(g.effects.kaioken).toBe(true);
  });
});
```

**Checklist:**
- [ ] At least 4 tests: setup, timer expiration, behavior, combination
- [ ] Tests timer expiration by setting timer to a small value and ticking once
- [ ] Tests collision behavior (if applicable)
- [ ] Tests combination with other power-ups
- [ ] Updated power-up count in `powerups.test.ts` if adding to enum

---

## 12. Verify Locally

```bash
# Run tests
npx vitest run --exclude="**/beatability*"

# Build locally
npm run build
```

**Checklist:**
- [ ] All 578+ tests pass
- [ ] `npm run build` succeeds (no TypeScript errors)
- [ ] Manually test the power-up in the game

---

## Common Mistakes to Avoid

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Forgetting to update `SaveData` interface | Build fails: "Property does not exist" | Always update all 3 save locations |
| Forgetting to update `serialize()` | Build fails: missing properties | Same as above |
| Forgetting to update `restore()` | Build fails: missing properties | Always use `?? false` / `?? 0` defaults |
| Putting timer tick inside `ST.DODGE` block | Timer stops when game state changes | Always put in "always tick" section |
| Forgetting to update `drawGoku()` parameter | No visual rendering | Update function signature AND all call sites |
| Forgetting to update `loop.ts` draw calls | No visual rendering | Find ALL `drawGoku()` calls |
| Forgetting to reset in `initRound()` or `restoreAfterHit()` | Effect persists across rounds unintentionally | Always reset in both functions |
| Not updating power-up count in tests | Test fails: "expected N types but got N+1" | Update count in `powerups.test.ts` |

---

## Quick Reference: Files to Edit

| File | What to Change |
|------|---------------|
| `game/powerups/types.ts` | Add enum entry + config |
| `game/types.ts` | Add fields to `EffectsState` |
| `game/state.ts` | Initialize in `makeEffectsState()`, reset in `initRound()` and `restoreAfterHit()` |
| `game/powerups/effects.ts` | Add `case` in `applyPowerUp()` |
| `game/update.ts` | Add timer tick (always section) + collision handling |
| `game/renderer/player.ts` | Add parameter + visual rendering |
| `game/loop.ts` | Pass new parameter to all `drawGoto()` calls |
| `game/save.ts` | Add to `SaveData`, `serialize()`, `restore()` |
| `game/__tests__/powerup-visuals.test.ts` | Add test suite |
| `game/__tests__/powerups.test.ts` | Update power-up count |

---

## Example: InvincibleStar Implementation

This session implemented `InvincibleStar` following this exact guide. See the commit `57468ef` for the full diff.

Key decisions made:
- 3-second duration, weight 1 (very rare)
- Golden star explosions when balls contact player
- Pulsating golden aura with orbiting star particles
- Does NOT persist across rounds (resets on `initRound` and `restoreAfterHit`)
- Collision: ball explodes, player takes no damage

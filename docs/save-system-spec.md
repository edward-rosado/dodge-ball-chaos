# Save System – Design Spec & Session Notes

> Last updated: Save feature iteration (single slot, milestone-only)

## Core Requirements

### Title Screen
- **"NEW GAME"** button – always visible, starts a fresh game
- **"LOAD GAME"** button – only visible when a save exists in localStorage
- Both buttons handle mouse/touch clicks and keyboard (Space/Enter)

### In-Game Save
- **SAVE button**: always visible during gameplay (top-right corner, outside title/game-over/victory screens)
- Clicking SAVE opens the save/load menu overlay
- **Manual save is only allowed at milestone rounds: 10, 20, 30, 40**
  - Trying to save at any other round shows a toast: "Can only save at milestones: rounds 10, 20, 30, 40"
- **Single save slot** – all milestone saves go to slot 0, each overwriting the previous

### Save/Load Behavior
- Saving at round 30 preserves: round number, lives, score, all power-ups, player position, all game state
- Loading from that save restores the exact same state (lives, items, round, score)
- If you die at round 30, you can load back to round 30 with the same lives and items you had when you saved

### Auto-Save
- Triggers on VICTORY state (winning a round)
- Only saves if the round is a milestone (10, 20, 30, 40)
- Auto-save toast only appears when the save actually happens

## Architecture

### Files
| File | Responsibility |
|------|---------------|
| `game/save.ts` | Serialization, deserialization, localStorage persistence, save info, milestone logic |
| `components/DodgeBallChaos.tsx` | Save/menu UI, save/load action handlers, game loop integration |
| `game/input.ts` | Title screen button hit testing (NEW GAME / LOAD GAME) |

### Key Functions
- `serialize(g: GameState) → SaveData` – strips transient data, produces JSON-serializable object
- `deserialize(data: SaveData) → GameState` – restores full game state from save data
- `saveGameToSlot(g, index)` – writes to localStorage
- `loadGameFromSlot(index) → GameState | null` – reads from localStorage
- `getAllSaveInfos() → (SaveInfo | null)[]` – returns metadata for all slots
- `hasSlot(index) → boolean` – checks if slot has data
- `isMilestoneRound(round) → boolean` – true for rounds 10, 20, 30, 40 only
- `milestoneSlotIndex(round) → number` – always returns 0 (single slot)
- `shouldAutoSave(prevState, newState) → boolean` – true only on VICTORY

### Save Data Format (v2)
```typescript
interface SaveData {
  version: number;
  timestamp: number;
  state: GameStateType;
  round: number;
  lives: number;
  score: number;
  timer: number;
  player: { px, py, pvx, pvy };
  effects: { /* all power-up states and timers */ };
  meta: { highScore, t, backgroundId };
  launch: { launched, launchDelay, launchQueue };
  balls: Ball[];
  thrown: Ball[];
  pipes: Pipe[];
  powerUps: PowerUp[];
  activePipe: number;
  powerUpSpawnTimer: number;
  activePowerUpQueue: string[];
  pipeQueue: PipeQueueEntry[];
  chargingPipes: number[];
}
```

### UI Flow
```
Title Screen (ST.TITLE)
  ├── NEW GAME → startGame() → ST.READY → game begins
  └── LOAD GAME (if _hasSave) → loadGameFromSlot(0) → copy state → game continues

Gameplay (ST.READY/THROW/DODGE/HIT/CLEAR)
  └── SAVE button (top-right) → setShowSaveMenu(true) → save menu overlay

Save Menu Overlay
  ├── SAVE NOW → saveGameToSlot(g, 0) → toast "Game saved!"
  ├── LOAD GAME → loadGameFromSlot(0) → gRef.current = loaded state → toast "Game loaded!"
  ├── DELETE → deleteAllSaves() → toast "Save deleted."
  └── CANCEL → setShowSaveMenu(false)

Game Over / Victory (ST.OVER/ST.VICTORY)
  └── Click anywhere → startGame() → back to title screen
```

## Bugs Fixed in This Iteration

1. **Save menu overlay only rendered at milestone rounds** – The JSX had `isMilestoneRound(gRef.current.round)` as a rendering condition, so clicking the always-visible SAVE button at non-milestone rounds did nothing visually. Fixed by removing that condition from rendering; the milestone check now only applies in `handleSave()`.

2. **Title screen LOAD GAME button never appeared** – `_hasSave` was set on mount but reset to `false` whenever `makeGame()` was called (e.g., after game over). Fixed by re-checking `hasSlot(0)` in the game loop whenever `g.state === ST.TITLE`.

3. **Auto-save toast showed even when save was skipped** – The toast was outside the `isMilestoneRound` check, so "Game saved!" would appear even when the save was skipped for non-milestone rounds. Fixed by moving toast inside the inner `if`.

4. **5 save slots instead of 1** – Reduced `MAX_SAVE_SLOTS` from 5 to 1. All milestone saves now go to slot 0.

5. **Round 50 was a valid milestone** – Removed from `VALID_MILESTONES`. Only rounds 10, 20, 30, 40 are valid save points.

## Themes & Habits for Future Iteration

### Code Organization
- Save system is split between `game/save.ts` (logic/persistence) and `components/DodgeBallChaos.tsx` (UI)
- Keep this separation: save logic is framework-agnostic, UI is React-specific

### State Management
- Game state lives in a mutable `GameState` object referenced by `gRef`
- Save data is serialized/deserialized as JSON via localStorage
- Save info (metadata) is stored in React state (`saveInfo`, `showSaveMenu`, `toast`)
- Title screen button visibility is driven by `g.meta._hasSave`

### UI Patterns
- Save menu is an absolute-positioned overlay (full-screen, semi-transparent background)
- Toast notifications are short-lived (2s), centered at top, shown via React state
- Canvas game renders behind React overlays
- Save button is always visible during gameplay (not hidden behind menus)

### Input Handling
- Title screen buttons handled in `game/input.ts` via canvas-space hit testing
- Mouse/touch coordinates converted to canvas space via `toCanvas()`
- Keyboard shortcuts: Space/Enter for NEW GAME, H for help, M for music
- Save button is React JSX (not canvas-drawn), positioned absolutely

### Common Pitfalls
- **Conditional rendering vs. conditional logic**: Don't gate UI rendering on the same conditions that gate business logic. The save menu should always render when `showSaveMenu` is true; the milestone check belongs in `handleSave()`, not in the JSX condition.
- **State resets on game restart**: `makeGame()` creates a fresh state with defaults. Any persistent flags (like `_hasSave`) must be re-checked after game state is reset.
- **localStorage race conditions**: Save/load operations are synchronous but localStorage can throw in sandboxed environments. Always wrap in try/catch.
- **TypeScript serializability**: `GameState` contains functions and complex objects. Serialization must explicitly strip transient data (functions, animation arrays not in save format).

### Testing Considerations
- Save system should be tested with:
  - Saving at valid milestones (10, 20, 30, 40)
  - Attempting to save at non-milestones (should show toast, not save)
  - Loading a save and verifying lives, round, score, power-ups match
  - Overwriting a save and verifying the new state replaces the old
  - Deleting a save and verifying the LOAD GAME button disappears from title screen
  - Auto-save on victory at milestone vs. non-milestone rounds

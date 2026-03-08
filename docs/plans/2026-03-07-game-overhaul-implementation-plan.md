# Dodge Ball Chaos — Game Overhaul Implementation Plan

## Context

The game has an **approved design document** at `docs/plans/2026-03-07-game-overhaul-design.md` that expands v0.1 (simple dodgeball arcade game) into a 50-level DBZ-themed arena game. The current implementation is a single 496-line component (`components/DodgeBallChaos.tsx`). This plan breaks the overhaul into phases, each delivering a playable increment.

---

## Phase 0: Run claude-setup for this repo
**Goal**: Set up project-level Claude configuration using `~/claude-setup/setup.sh`.

- Run `~/claude-setup/setup.sh` to initialize project-level `.claude/` config
- Verify CLAUDE.md and project rules are created
- This gives us project-specific context for the game development work

---

## Phase 1: Module Architecture + Circular Arena
**Goal**: Decompose monolith, 16-pipe circular arena, keyboard/mouse controls. Same gameplay, new structure.

### Create
```
game/
  types.ts           # GameState, Ball, Pipe, PowerUp, Entity interfaces
  constants.ts       # CW, CH, ARENA_RADIUS, PIPE_COUNT=16, speeds, colors
  state.ts           # makeGame(), initRound(), state transitions
  loop.ts            # tick/update/render orchestration
  physics.ts         # dist, clamp, circularClamp, collision, ball-wall bounce
  input.ts           # InputManager: touch, mouse, WASD/arrows, spacebar throw
  arena.ts           # Circular boundary, pipe ring layout, player clamping
  renderer/
    background.ts    # Grid background (current)
    player.ts        # drawGoku (current)
    ball.ts          # drawBall + ball update
    pipe.ts          # drawPipe (16 circular)
    hud.ts           # drawHUD, drawText, overlays
    powerup.ts       # drawPowerUp (current 2 types)
```

### Modify
- `components/DodgeBallChaos.tsx` → thin React shell (canvas setup, refs, mounts game loop)

### Verify
- Game plays identically but with 16 circular pipes
- Balls bounce off circular walls instead of disappearing
- WASD/arrows + spacebar work
- `npm run build` + `npm run lint` pass
- **Visual test**: Launch the game (`npm run dev`), take a screenshot, and verify:
  - 16 pipes evenly spaced in a circle around the arena
  - Player correctly clamped within the circular boundary
  - Balls bounce off the circular wall (not disappearing off-screen)
  - HUD (score, lives, round) renders cleanly without overlapping the arena
  - Grid background renders correctly behind/outside the pipe ring
  - No visual artifacts, clipping, or misaligned elements

---

## Phase 2: Ball Types + Enhanced Dodgeball
**Goal**: 10 special ball types, persistent bouncing dodgeball, multi-ball milestones.

### Create
```
game/balls/
  types.ts           # BallType enum, BallConfig
  tracker.ts         # Curves toward player
  splitter.ts        # Splits into 3 on first bounce
  ghost.ts           # Phases in/out every 2s
  bomber.ts          # Explodes on 3rd bounce
  zigzag.ts          # Sine-wave movement
  giant.ts           # 3x size, slower
  speedDemon.ts      # 2x speed per bounce
  gravityWell.ts     # Pulls player within radius
  mirage.ts          # Spawns 2 fakes on bounce
  ricochet.ts        # Wild bounce angles
  factory.ts         # createBall(type, pipe, angle)
  update.ts          # Per-type update dispatcher
  render.ts          # Per-type draw dispatcher
```

### Modify
- `game/types.ts` — extend Ball: `type`, `bounceCount`, `age`, `phaseTimer`, `children`, `isReal`
- `game/physics.ts` — ball-pipe probability gradient (95% suck-in at center → 5% at edge)
- `game/state.ts` — level-based spawn rules, multi-dodgeball milestones (2@L10, 3@L20, 4@L30, 5@L40)

### Verify
- All 10 ball types spawn with correct behaviors and visuals
- Dodgeball persists, bounces, gains +5% speed per bounce
- Multi-dodgeball appears at milestones
- 20+ balls on screen without performance issues
- **Visual test**: Launch the game (`npm run dev`), take a screenshot, and verify:
  - Each of the 10 ball types has a distinct, recognizable visual (color, trail, size)
  - Ball movements match their type (Tracker curves, Zigzag sine-waves, Ghost phases, etc.)
  - Balls are clearly visible against the background at all times
  - Player can visually distinguish dangerous balls from harmless ghost-phase balls
  - Splitter split animation is visible; Bomber explosion radius is clear
  - Multiple dodgeballs render without overlapping or visual confusion
  - No balls get stuck, disappear unexpectedly, or clip through walls

---

## Phase 3: Power-Ups, Character Art, DBZ Backgrounds
**Goal**: Full DBZ visual identity, 10 power-ups, animated 80x80px Goku.

### Create
```
game/powerups/
  types.ts                # PowerUpType enum, config (duration, uses, rarity)
  instantTransmission.ts  # 3 teleport uses
  kiShield.ts             # Blocks one hit
  kaioken.ts              # 2x speed, red glow, 5s
  solarFlare.ts           # Freeze all balls, 3s
  senzuBean.ts            # +1 life
  timeSkip.ts             # 0.3x ball speed, 4s
  destructoDisc.ts        # Destroy one random special ball
  afterimage.ts           # Decoy, 4s
  shrink.ts               # Half hitbox, 5s
  spiritBombCharge.ts     # Channel 3s, destroy all special balls
  factory.ts              # Spawn logic, rarity gating
  render.ts               # Pulsing capsule with DBZ icon
game/renderer/
  player.ts               # Rewrite: 80x80px SNES-quality Goku
  background.ts           # 6 DBZ backgrounds (procedural canvas)
  effects.ts              # Aura, Ultra Instinct glow, particle trails
game/sprites.ts           # Pixel art drawing utilities
```

### Verify
- All 10 power-ups work correctly (Spirit Bomb requires standing still 3s, etc.)
- Goku animations: idle bob, running pose, hit flash
- Ultra Instinct visual at milestone levels
- All 6 backgrounds render per level phase

---

## Phase 4: 50-Level Progression + Music System
**Goal**: Full campaign L1-49, synthesized chiptune soundtrack.

### Create
```
game/progression.ts      # getLevelConfig(level): dodgeballs, backgrounds, music, difficulty
game/audio/
  engine.ts              # Web Audio API setup, master gain, crossfade
  oscillator.ts          # Square wave, triangle, noise channels
  sequencer.ts           # Note patterns, tempo, looping
  tracks/
    training.ts          # L1-9: chill chiptune
    battle.ts            # L11-19: intense battle
    heavyBattle.ts       # L21-29: heavier
    escalating.ts        # L31-39: escalating
    peak.ts              # L41-49: peak intensity
    ultraInstinct.ts     # Milestone levels: ethereal + driving beat
  sfx.ts                 # Throw, hit, powerup, clear, level-up sounds
```

### Verify
- Levels 1-49 playable with correct difficulty scaling
- Music crossfades between phases
- SFX on all game events
- Ultra Instinct theme at milestone levels

---

## Phase 5: Frieza Boss Fight (Level 50)
**Goal**: The highlight feature — Frieza boss fight.

### Create
```
game/boss/
  frieza.ts              # 100x100px entity, HP, state machine
  ai.ts                  # Pattern selection, reuses ball-type movements
  patterns.ts            # Tracker chase, zigzag, speed demon dash, dodge logic
  render.ts              # Pixel art Frieza, HP bar, damage flash
  collision.ts           # Frieza-ball damage, Frieza-player dash damage
game/renderer/
  bossHud.ts             # Boss HP bar, name plate
  victory.ts             # Victory screen with stats
```

### Key Design
- Frieza AI cycles through ball-type movement patterns (tracker, zigzag, speed demon dash)
- Telegraphed dash attack (0.5s windup flash)
- Takes damage from dodgeballs (major) and special balls (minor)
- No timer — fight until someone dies
- HP tuned for ~60-90s fight

### Verify
- Boss fight loads at level 50 with Frieza's Ship background
- Frieza uses recognizable ball-type patterns
- HP bar depletes, Frieza takes damage
- Dash attack damages player
- Victory screen shows stats on win
- ~25% bot survival rate (Phase 6)

---

## Phase 6: Beatability Testing + Balance
**Goal**: Headless simulation framework, validate difficulty curve.

### Create
```
game/simulation/
  headless.ts            # Game logic without canvas
  bot.ts                 # Threat avoidance AI, power-up collection
  runner.ts              # N simulations per level, stats
  reporter.ts            # Survival rates table, pass/fail
scripts/
  test-beatability.ts    # CLI entry: npm run test:beatability
```

### Target Survival Rates
| Bracket | Target |
|---------|--------|
| L1-10   | 60%+   |
| L11-20  | 50%+   |
| L21-30  | 40%+   |
| L31-40  | 30%+   |
| L41-49  | 25%+   |
| L50     | 20%+   |

---

## Phase 7: Polish + Release
**Goal**: Responsive design, particles, screen shake, performance, deployment.

### Create
```
game/renderer/particles.ts    # Ball trails, explosions, sparkles
game/renderer/screenShake.ts  # Camera shake on hit
game/responsive.ts            # Viewport scaling, DPI, orientation
```

### Polish Items
- Particle trails on all ball types
- Screen shake on hit
- localStorage high score persistence
- 60fps on mobile with 20+ balls
- GitHub Pages deployment verified

---

## Dependency Graph
```
Phase 1 (Modules + Arena)
  └→ Phase 2 (Ball Types)
       ├→ Phase 3 (Power-ups + Visuals)
       │    └→ Phase 4 (Progression + Music)
       └→ Phase 5 (Frieza Boss — reuses ball patterns)
            └→ Phase 6 (Beatability Testing)
                 └→ Phase 7 (Polish + Release)
```

## Critical Files
- `components/DodgeBallChaos.tsx` — current monolith to decompose (Phase 1)
- `docs/plans/2026-03-07-game-overhaul-design.md` — approved design (reference)
- `CONTEXT.md` — development context
- `game/types.ts` (new) — central types, foundation for all phases
- `game/loop.ts` (new) — must separate update from render for headless simulation
- `game/balls/factory.ts` (new) — ball creation; boss AI reuses these patterns

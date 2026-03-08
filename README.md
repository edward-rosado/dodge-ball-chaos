# Dodge Ball Chaos

A DBZ-themed, 50-level arcade game where you control Goku through Super Saiyan transformations, dodge 10 unique ball types fired from 32 Mario-style warp pipes, collect power-ups, and survive increasingly chaotic rounds — all rendered in pixel art on HTML5 Canvas.

## Play Now

**https://edward-rosado.github.io/dodge-ball-chaos/**

[Source Code](https://github.com/edward-rosado/dodge-ball-chaos)

---

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation (Step-by-Step)](#installation-step-by-step)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Gameplay & Mechanics](#gameplay--mechanics)
- [Saiyan Transformation System](#saiyan-transformation-system)
- [Game State Machine](#game-state-machine)
- [Tuning Reference](#tuning-reference)
- [Deployment](#deployment)
- [AI Agent & Tooling Guide](#ai-agent--tooling-guide)
- [Roadmap](#roadmap)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
git clone https://github.com/edward-rosado/dodge-ball-chaos.git
cd dodge-ball-chaos
npm run setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — best on mobile or Chrome DevTools mobile view (toggle with `Ctrl+Shift+M`).

---

## Prerequisites

| Tool | Version | Check | Install |
|------|---------|-------|---------|
| Node.js | >= 18.17.0 (20 recommended) | `node --version` | [nodejs.org](https://nodejs.org) or `nvm install` (reads `.nvmrc`) |
| npm | >= 9.0.0 | `npm --version` | Bundled with Node.js |
| Git | any recent version | `git --version` | [git-scm.com](https://git-scm.com) |

If you use **nvm**, the repo includes a `.nvmrc` file:

```bash
nvm install    # installs Node 20
nvm use        # switches to Node 20
```

---

## Installation (Step-by-Step)

### 1. Clone the repository

```bash
git clone https://github.com/edward-rosado/dodge-ball-chaos.git
cd dodge-ball-chaos
```

### 2. Install dependencies

```bash
npm install
```

This reads `package-lock.json` and installs exact dependency versions. If you see peer dependency warnings, they are safe to ignore — the build will still succeed.

### 3. Verify the build

```bash
npm run build
```

Expected output — you should see:

```
✓ Compiled successfully
✓ Generating static pages (4/4)

Route (app)                              Size     First Load JS
┌ ○ /                                    3.73 kB        91.1 kB
└ ○ /_not-found                          873 B          88.3 kB
```

If the build fails, see [Troubleshooting](#troubleshooting).

### 4. Run locally

```bash
npm run dev
```

Opens a dev server at [http://localhost:3000](http://localhost:3000). The game renders on a canvas — swipe/click+drag to play.

### 5. (Optional) Run linter

```bash
npm run lint
```

Should return `✔ No ESLint warnings or errors`.

---

## Available Scripts

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Starts Next.js dev server on port 3000 with hot reload |
| `npm run build` | Production build → static export to `out/` directory |
| `npm run start` | Serves the production build locally |
| `npm run test` | Runs all 297+ tests via Vitest |
| `npm run test:quick` | Runs tests excluding beatability simulations |
| `npm run lint` | Runs ESLint across all TypeScript/TSX files |
| `npm run clean` | Deletes `.next/`, `out/`, and `node_modules/` |
| `npm run setup` | One-command fresh install: runs `npm install` then `npm run build` |

**Common workflows:**

```bash
# Fresh start (nuke everything, reinstall, rebuild)
npm run clean && npm run setup

# Quick dev iteration
npm run dev

# Verify everything is shippable
npm run lint && npm run build
```

---

## Project Structure

```
dodge-ball-chaos/
├── .github/workflows/deploy.yml    # CI/CD: lint → test → build → deploy to GitHub Pages
├── app/
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # Root layout: meta tags, viewport, fonts
│   └── page.tsx                    # Entry point — mounts <DodgeBallChaos />
├── components/
│   └── DodgeBallChaos.tsx          # Thin React shell (canvas setup, refs, game loop mount)
├── game/
│   ├── types.ts                    # GameState, Ball, Pipe, PowerUp interfaces
│   ├── constants.ts                # Canvas dims, arena bounds, speeds, difficulty bands
│   ├── state.ts                    # makeGame(), initRound(), state transitions
│   ├── loop.ts                     # tick() — update + render orchestration
│   ├── update.ts                   # Core game logic (collisions, power-ups, ball physics)
│   ├── physics.ts                  # Distance, clamping, bounce, pipe suck-in
│   ├── input.ts                    # Touch, mouse, WASD/arrows, spacebar
│   ├── arena.ts                    # Pipe ring layout, player clamping
│   ├── transformation.ts           # Saiyan form system (Base → SSJ → ... → Ultra Instinct)
│   ├── progression.ts              # getLevelConfig(): backgrounds, music, dodgeballs per round
│   ├── sprites.ts                  # Pixel art drawing utilities
│   ├── balls/
│   │   ├── types.ts                # BallType enum (10 types)
│   │   ├── factory.ts              # createBall(type, pipe, angle)
│   │   ├── spawn.ts                # Level-based ball type progression
│   │   ├── dispatcher.ts           # Per-type update dispatcher
│   │   ├── tracker.ts              # Curves toward player
│   │   ├── splitter.ts             # Splits into 3 on first bounce
│   │   ├── ghost.ts                # Phases in/out every 2s
│   │   ├── bomber.ts               # Explodes on 3rd bounce
│   │   ├── zigzag.ts               # Sine-wave movement
│   │   ├── giant.ts                # 3x size, slower
│   │   ├── speedDemon.ts           # 2x speed per bounce
│   │   ├── gravityWell.ts          # Pulls player within radius
│   │   ├── mirage.ts               # Spawns 2 fakes on bounce
│   │   └── ricochet.ts             # Wild bounce angles
│   ├── powerups/
│   │   ├── types.ts                # 10 power-up types (Kaioken, Ki Shield, Senzu Bean, etc.)
│   │   ├── factory.ts              # Spawn logic with rarity gating
│   │   ├── effects.ts              # Power-up activation/deactivation logic
│   │   └── render.ts               # Power-up capsule + status HUD rendering
│   ├── audio/
│   │   ├── engine.ts               # Web Audio API singleton, crossfade, master gain
│   │   ├── oscillator.ts           # Square wave, triangle, noise channels
│   │   ├── sequencer.ts            # Note patterns, tempo, looping
│   │   ├── sfx.ts                  # Throw, hit, powerup, clear, level-up sounds
│   │   └── tracks/                 # 6 chiptune tracks (training → ultra instinct)
│   ├── renderer/
│   │   ├── background.ts           # Grid + arena boundary
│   │   ├── backgrounds/            # 6 DBZ backgrounds (Namek, Gravity Room, etc.)
│   │   ├── player.ts               # 80x80px Goku with form-based rendering
│   │   ├── ball.ts                 # Per-type ball rendering
│   │   ├── pipe.ts                 # 32 Mario-style warp pipes
│   │   ├── hud.ts                  # Score, lives, timer, round display
│   │   ├── effects.ts              # Aura, Ultra Instinct glow, particles
│   │   └── powerup.ts              # Power-up capsule drawing
│   ├── simulation/
│   │   ├── bot.ts                  # Threat avoidance AI for testing
│   │   ├── runner.ts               # N simulations per level
│   │   ├── brackets.ts             # Survival rate targets per difficulty band
│   │   └── reporter.ts             # Pass/fail reporting
│   └── __tests__/                  # 297+ tests (Vitest)
├── docs/plans/                     # Design docs and implementation plans
├── vitest.config.ts                # Test configuration
└── next.config.ts                  # Static export + GitHub Pages basePath
```

---

## Architecture & Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 14 (App Router) | Static export mode — no server required |
| Language | TypeScript (strict) | Full type coverage with interfaces for game state |
| Rendering | HTML5 Canvas 2D | No game engine; raw `ctx` drawing calls |
| Audio | Web Audio API | Chiptune synthesis via oscillators — no audio files |
| Testing | Vitest | 297+ unit tests + headless beatability simulations |
| Font | Press Start 2P (Google Fonts) | Loaded via `<link>` tag |
| Deployment | GitHub Pages | Automated via GitHub Actions on push to `main` |
| CI/CD | GitHub Actions | Lint → Test → Build → Deploy |

**Why no game engine?** Canvas-based approach keeps the bundle tiny and avoids framework lock-in. All game state lives in a `useRef` to avoid React re-render overhead during the 60fps game loop.

**Why static export?** The game is entirely client-side — no API routes, no SSR needed. `next.config.ts` sets `output: 'export'` to produce a flat `out/` directory that GitHub Pages serves directly.

---

## Gameplay & Mechanics

### Controls

| Phase | Touch (Mobile) | Mouse (Desktop) | Keyboard |
|-------|---------------|-----------------|----------|
| Title/Game Over | Tap anywhere | Click anywhere | Space |
| Ready (throw) | Swipe in any direction | Click + drag + release | Space (random) |
| Dodge | Drag to move | Click + drag to move | WASD / Arrow keys |

### Core Loop

1. **Round starts** — player is centered, ball appears above character
2. **Throw** — swipe to launch the ball in any direction
3. **Dodge** — balls fire from 32 Mario-style warp pipes; move to avoid them
4. **Round clears** when timer expires → score increases → next round begins
5. **Hit** — lose a life, timer persists (resume with remaining time)
6. **Game Over** — all 3 lives lost; shows score and high score

### Ball Types (10)

| Ball | Unlocks | Behavior |
|------|---------|----------|
| Dodgeball | L1 | Standard bouncing ball |
| Zigzag | L1 | Sine-wave movement (early variety) |
| Ghost | L1 | Phases in/out every 2s (early variety) |
| Tracker | L11 | Curves toward player |
| Splitter | L31 | Splits into 3 on first bounce |
| Bomber | L17 | Explodes on 3rd bounce |
| Giant | L21 | 3x size, slower |
| Speed Demon | L25 | 2x speed per bounce |
| Gravity Well | L31 | Pulls player within radius |
| Mirage | L36 | Spawns 2 fakes on bounce |

### Power-Ups (10)

| Power-Up | Effect |
|----------|--------|
| Instant Transmission | 3 teleport uses |
| Ki Shield | Blocks one hit |
| Kaioken | 2x speed, red glow, 5s |
| Solar Flare | Freeze all balls, 3s |
| Senzu Bean | +1 life |
| Time Skip | 0.3x ball speed, 4s |
| Destructo Disc | Destroy one random special ball |
| Afterimage | Decoy that attracts balls, 4s |
| Shrink | Half hitbox, 5s |
| Spirit Bomb Charge | Channel 3s, destroy all special balls |

---

## Saiyan Transformation System

Goku transforms as you progress through levels, changing hair color, eye color, and aura effects:

| Levels | Form | Hair | Eyes | Aura |
|--------|------|------|------|------|
| 1-9 | Base | Black | Dark | None |
| 10-19 | Super Saiyan | Golden | Green | Golden glow |
| 20-29 | SSJ2 | Golden + sparks | Green | Golden + electric |
| 30-39 | SSJ3 | Long golden spikes | Green | Intense golden |
| 40-49 | SSJ Blue | Blue | Blue | Blue glow |
| 50 | Ultra Instinct | Silver | Silver | Silver shimmer |

---

## Game State Machine

```
TITLE ──(tap)──→ READY ──(swipe)──→ THROW ──(ball exits)──→ DODGE
                   ↑                                          │
                   │                              ┌───────────┤
                   │                              ↓           ↓
                   ├──────────────────────────── HIT        CLEAR
                   │                           (lives>0)   (score+)
                   │                                          │
                   │                                          ↓
                   └──────────────────────────────────────── READY
                                                           (next round)
                                                    HIT
                                                 (lives=0)
                                                    ↓
                                                   OVER ──(tap)──→ READY
```

States are defined as constants in `ST` object: `TITLE=0, READY=1, THROW=2, DODGE=3, HIT=4, CLEAR=5, OVER=6`

---

## Tuning Reference

All constants are in `game/constants.ts`:

| Constant | Value | What It Controls |
|----------|-------|-----------------|
| `CW x CH` | 400 x 680 | Canvas pixel dimensions |
| `PIPE_COUNT` | 32 | Mario-style warp pipes around the arena |
| `THROW_SPEED` | 3.5 | Gentle lob throw speed |
| `PLAYER_SPEED` | 4.2 | Player movement speed (pixels per frame) |
| `BASE_BALL_SPEED` | 2.0 | Starting ball velocity |
| `PLAYER_HITBOX` | 12 | Collision detection radius (pixels) |
| `BASE_ROUND_TIME` | 12 | Starting round duration (seconds) |
| `BALL_R` | 7 | Ball render radius (pixels) |
| `BOUNCE_SPEED_BOOST` | 1.003 | +0.3% speed per wall bounce |
| `PIPE_RADIUS` | 20 | Pipe suck-in detection radius |

### Difficulty Bands

Difficulty scales per 10-level band with separate tuning for speed, max balls, launch delay, and timer:

| Band | Speed/Round | Max Balls | Min Launch Delay | Min Timer |
|------|------------|-----------|-----------------|-----------|
| L1-10 | 0.02 | 2 | 1.0s | 10s |
| L11-20 | 0.025 | 3 | 0.8s | 8s |
| L21-30 | 0.03 | 3 | 0.7s | 7s |
| L31-40 | 0.035 | 4 | 0.6s | 6s |
| L41-49 | 0.035 | 4 | 0.55s | 5s |
| L50+ | 0.03 | 5 | 0.5s | 5s |

---

## Deployment

**Live URL:** https://edward-rosado.github.io/dodge-ball-chaos/

### Automatic (GitHub Actions)

Every push to `main` triggers `.github/workflows/deploy.yml`:

1. Checks out code
2. Installs Node 22 + runs `npm ci`
3. Runs lint + tests
4. Builds with `npm run build` (static export → `out/`)
5. Deploys `out/` to GitHub Pages

**First-time setup**: In your repo settings, go to **Settings → Pages → Source** and select **"GitHub Actions"** (not "Deploy from a branch").

The `next.config.ts` sets `basePath: '/dodge-ball-chaos'` and `assetPrefix: '/dodge-ball-chaos/'` for production so all asset paths resolve correctly under the GitHub Pages subdirectory.

### Manual Deploy

```bash
npm run build
# Upload contents of out/ to any static host
```

---

## AI Agent & Tooling Guide

This section is designed for AI coding agents (Claude, Cursor, Copilot Workspace, Aider, etc.) to onboard instantly.

### For AI Agents: Read These First

1. **`CONTEXT.md`** — Full development context: what's built, what's not, architecture decisions
2. **This README** — Setup, structure, and tuning reference
3. **`game/types.ts`** — All game interfaces and state definitions
4. **`game/constants.ts`** — All tuning constants and difficulty bands

### Repository Access

- **Owner**: `edward-rosado`
- **Repo**: `dodge-ball-chaos`
- **Branch**: `main` (single branch workflow)
- **CI**: GitHub Actions deploys on every push to `main`
- A personal access token (PAT) with `repo` scope is required for programmatic pushes

### How to Pick Up Development

```
1. Clone the repo
2. Read CONTEXT.md for full project state
3. Read this README for setup + architecture
4. game/types.ts — all interfaces (GameState, Ball, Pipe, PowerUp)
5. game/constants.ts — all tuning constants and difficulty bands
6. game/loop.ts — tick() orchestrates update + render each frame
7. game/update.ts — core game logic (collisions, power-ups, physics)
8. components/DodgeBallChaos.tsx — thin React shell mounting the game loop
```

### Coding Conventions

- **TypeScript strict mode** — all types must be explicit
- **Modular game architecture** — game logic split across `game/` directory
- **No React state for game data** — game state lives in a `useRef<GameState>` to avoid re-renders during the 60fps loop
- **Canvas-only rendering** — no DOM elements inside the game; everything is drawn via `CanvasRenderingContext2D`
- **Constants centralized** — all tuning values in `game/constants.ts`
- **Draw functions are pure** — they take `ctx` + data, draw, return nothing
- **State machine pattern** — game flow controlled by `g.state` matching `ST.*` constants

### Making Changes

| Task | Where to Edit |
|------|--------------|
| Adjust difficulty | `game/constants.ts` — BANDS array and base values |
| Add a new ball type | `game/balls/types.ts`, new file in `game/balls/`, update `dispatcher.ts` + `spawn.ts` |
| Add a new power-up | `game/powerups/types.ts`, `effects.ts`, `factory.ts`, `render.ts` |
| Add a new game state | `game/types.ts` ST enum, transition logic in `game/update.ts`, render in `game/loop.ts` |
| Change visual style | `game/constants.ts` C object, renderer files in `game/renderer/` |
| Add music track | `game/audio/tracks/`, register in `game/audio/engine.ts` |
| Add a new background | `game/renderer/backgrounds/`, register in `index.ts` |
| Modify CI/CD | `.github/workflows/deploy.yml` |
| Change deployment target | `next.config.ts` — update `basePath` and `assetPrefix` |

### Validation Checklist

Before pushing any changes, run:

```bash
npm run lint          # Should show: ✔ No ESLint warnings or errors
npm run build         # Should show: ✓ Compiled successfully
```

Both must pass — the CI pipeline runs the same checks.

---

## Roadmap

### Completed

- [x] Module architecture (monolith decomposed into `game/` directory)
- [x] 16-pipe arena with circular layout
- [x] 10 special ball types with unique behaviors
- [x] 10 DBZ power-ups (Kaioken, Ki Shield, Spirit Bomb, etc.)
- [x] Saiyan transformation system (Base through Ultra Instinct)
- [x] 6 DBZ-themed backgrounds (Namek, Gravity Room, Time Chamber, etc.)
- [x] Chiptune audio engine with 6 tracks + SFX
- [x] 50-level progression system
- [x] WASD/Arrow key controls
- [x] Beatability testing framework with bot simulation
- [x] 297+ automated tests
- [x] Phase 7 gameplay overhaul (easier difficulty, timer persistence, pipe suck-in delay, enhanced visuals)

### In Progress

- [ ] **Frieza Boss Fight (Level 50)** — boss entity with HP, AI patterns, dash attacks
- [ ] **Polish** — particle trails, screen shake, responsive scaling
- [ ] **PWA support** — offline play, install to home screen

---

## Troubleshooting

### `npm install` fails

```bash
# Clear npm cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Build fails with TypeScript errors

```bash
# Check TypeScript version
npx tsc --version

# If types are stale, reset
rm -rf .next node_modules
npm install
npm run build
```

### Port 3000 already in use

```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>

# Or use a different port
npm run dev -- -p 3001
```

### GitHub Pages shows 404

1. Go to repo **Settings → Pages → Source** → select **"GitHub Actions"**
2. Ensure the workflow ran successfully in the **Actions** tab
3. Verify the site URL is `https://edward-rosado.github.io/dodge-ball-chaos/` (trailing slash matters)

### Game canvas is blank

- Check browser console for errors (`F12` → Console tab)
- Ensure JavaScript is enabled
- Try a hard refresh (`Ctrl+Shift+R`)
- Verify the Google Font loaded (slow networks may delay the HUD text rendering)

### Clean reset (nuclear option)

```bash
npm run clean && npm run setup
```

This deletes all build artifacts and `node_modules`, then reinstalls and rebuilds from scratch.

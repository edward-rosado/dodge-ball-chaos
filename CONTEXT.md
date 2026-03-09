# CONTEXT.md — Dodge Ball Chaos Development Context

> This document captures the full project context so development can be continued in any Claude session.

## Project Overview

**Dodge Ball Chaos** is a DBZ-themed, 50-level arcade game built with Next.js and HTML5 Canvas.
The player controls a pixel-art Goku who throws a ball, then dodges incoming balls
fired from 48 Mario-style warp pipes around the arena. Features 10 unique ball types,
10 DBZ power-ups, Saiyan transformation system, chiptune audio, and a beatability simulation framework.

**Live URL**: https://edward-rosado.github.io/dodge-ball-chaos/
**Repo**: https://github.com/edward-rosado/dodge-ball-chaos

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Rendering**: HTML5 Canvas (no game engine)
- **Audio**: Web Audio API (chiptune synthesis, no audio files)
- **Testing**: Vitest (580+ tests across 19 files)
- **Styling**: Inline styles + globals.css (no Tailwind)
- **Font**: Press Start 2P (Google Fonts)
- **Deployment**: GitHub Pages via GitHub Actions (static export)
- **CI/CD**: `.github/workflows/deploy.yml` — lint → test → build → deploy on push to `main`

## Project Structure

```
dodge-ball-chaos/
├── .github/workflows/deploy.yml   # CI/CD pipeline
├── app/
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout with font + meta tags
│   └── page.tsx                   # Main page (loads game component)
├── components/
│   └── DodgeBallChaos.tsx         # Thin React shell (canvas setup, game loop mount)
├── game/
│   ├── types.ts                   # GameState, Ball, Pipe, PowerUp, PipeQueueEntry
│   ├── constants.ts               # Canvas dims, arena bounds, speeds, difficulty bands
│   ├── state.ts                   # makeGame(), initRound(), restoreAfterHit(), startGame()
│   ├── loop.ts                    # tick() — update + render orchestration
│   ├── update.ts                  # Core game logic (collisions, pipe queue, power-ups)
│   ├── physics.ts                 # Distance, clamping, bounce, pipe suck-in detection
│   ├── input.ts                   # Touch, mouse, WASD/arrows, spacebar
│   ├── arena.ts                   # 48-pipe layout, randomPipe()
│   ├── transformation.ts          # Saiyan form system (Base → SSJ → ... → Ultra Instinct)
│   ├── progression.ts             # getLevelConfig(): backgrounds, music, per-round config
│   ├── balls/                     # 10 ball types with factory + dispatcher
│   ├── powerups/                  # 10 power-ups with effects, factory, render
│   ├── audio/                     # Chiptune engine with 6 tracks + SFX
│   ├── renderer/                  # Background, player, ball, pipe, HUD, effects
│   ├── simulation/                # Bot AI, runner, brackets, reporter
│   └── __tests__/                 # 580+ tests across 19 files (Vitest)
├── docs/plans/                    # Design docs and implementation plans
└── next.config.ts                 # Static export + GitHub Pages basePath
```

## What's Implemented

### Core Mechanics
- **Swipe/space to throw**: Launch red dodgeball(s); round timer starts
- **Dodge phase**: Balls fire from 48 Mario-style green warp pipes
- **Pipe suck-in delay**: Balls near pipes have a probability-based suck-in; held 1-3s before re-emerging from a random different pipe with charging animation
- **Timer persists across deaths**: Getting hit resumes with remaining time (via `restoreAfterHit()`)
- **Timer resets on new round**: Clearing a round calls `initRound()` for full reset
- **Round progression**: `launchQueue = round - 1` random balls per round
- **Dodgeball milestones**: 1 per rounds 1-9, 2 per rounds 10-19, etc. (up to 5 at L40+)
- **3 lives**: Hit = lose a life; 0 lives = game over
- **Score**: round × 100 points per cleared round

### Power-Ups (10 types, spawn from round 1)
- Spawn every 2-4 seconds, max 3 on screen
- **Persist across deaths** — uncollected power-ups stay on screen
- **Enhanced visuals**: Ki Shield (golden bubble with orbiting sparkles), Kaioken (red aura + rising particles), IT teleport trail (departure afterimage + arrival burst)
- **Queue-based activation**: Most power-ups auto-activate on pickup; IT, Afterimage, and Spirit Bomb are queued and activated via spacebar/double-tap
- **SpeechSynthesis**: Anime-style shouts announce power-up names on activation
- **Music mute**: Independent gain control via `musicGain` node

### Ball Types (10 types, variety from round 1)
- L1-5: Dodgeball + Zigzag + Ghost (early variety)
- L6-10: Dodgeball + Zigzag
- Higher levels progressively unlock all 10 types

### Controls
- **Touch**: Swipe to throw (READY), drag to move (DODGE)
- **Mouse**: Click+drag (desktop)
- **Keyboard**: WASD/arrows to move, spacebar to throw (READY) / activate queued power-up (DODGE)

### Beatability Framework
- Nerfed bot: 200ms reaction delay, 8 directions, reduced lookahead, panic jitter
- 9 difficulty brackets (L1-5 through L50) with survival rate targets
- Target: average human reaches ~Level 25

## Key Constants (tuning reference)

| Constant | Value | Purpose |
|---|---|---|
| CW × CH | 400 × 680 | Canvas dimensions |
| PIPE_COUNT | 48 | Mario-style warp pipes around arena |
| PIPE_WIDTH × PIPE_HEIGHT | 28 × 36 | Pipe dimensions |
| PIPE_RADIUS | 20 | Suck-in detection radius |
| PLAYER_SPEED | 4.2 | Movement speed (px/frame) |
| BASE_BALL_SPEED | 2.0 | Starting ball speed |
| THROW_SPEED | 3.5 | Gentle lob throw speed |
| PLAYER_HITBOX | 12 | Collision radius |
| BASE_ROUND_TIME | 12s | Starting round duration |
| BOUNCE_SPEED_BOOST | 1.003 | +0.3% speed per bounce |
| Power-up spawn | 2-4s | Spawn timer |
| Max power-ups | 3 | On screen at once |

### Difficulty Bands

| Band | Speed/Round | Max Balls | Min Launch Delay | Min Timer |
|------|------------|-----------|-----------------|-----------|
| L1-10 | 0.02 | 2 | 1.0s | 10s |
| L11-20 | 0.025 | 3 | 0.8s | 8s |
| L21-30 | 0.03 | 3 | 0.7s | 7s |
| L31-40 | 0.035 | 4 | 0.6s | 6s |
| L41-49 | 0.035 | 4 | 0.55s | 5s |
| L50+ | 0.03 | 5 | 0.5s | 5s |

## Game States

```
TITLE → READY → THROW → DODGE → CLEAR → (next round READY)
                            ↓
                          HIT → READY (same round, -1 life, timer persists)
                            ↓
                          OVER → (tap to restart)

DODGE/CLEAR (L50 clear or Spirit Bomb @L50) → VICTORY
```

## GitHub Access

The repo owner is `edward-rosado`. A personal access token with `repo` scope is needed
for pushing commits and managing the repository programmatically.

# Dodge Ball Chaos 🏐⚡

A mobile-first, touch-based arcade game where you control a Goku-inspired pixel art character who throws a ball and dodges incoming balls fired from random pipes.

**[Play Live](https://edward-rosado.github.io/dodge-ball-chaos/)** · **[Repo](https://github.com/edward-rosado/dodge-ball-chaos)**

---

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation (Step-by-Step)](#installation-step-by-step)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Gameplay & Mechanics](#gameplay--mechanics)
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
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions: build + deploy to GitHub Pages
├── app/
│   ├── globals.css                 # Global styles (reset, background, tap-highlight)
│   ├── layout.tsx                  # Root layout: meta tags, viewport, font loading
│   └── page.tsx                    # Entry point — mounts <DodgeBallChaos />
├── components/
│   └── DodgeBallChaos.tsx          # ★ Core game file — ALL game logic lives here
├── public/
│   └── .nojekyll                   # Tells GitHub Pages not to process with Jekyll
├── .eslintrc.json                  # ESLint config (extends next/core-web-vitals)
├── .gitignore                      # Ignores node_modules, .next, out, IDE files
├── .nvmrc                          # Node version pin (20)
├── CONTEXT.md                      # Deep development context for AI continuity
├── README.md                       # This file
├── next.config.js                  # Static export + GitHub Pages basePath config
├── package.json                    # Dependencies, scripts, engine requirements
├── package-lock.json               # Locked dependency tree (committed for CI)
└── tsconfig.json                   # TypeScript config (strict mode, bundler resolution)
```

**Key file:** `components/DodgeBallChaos.tsx` — this single file contains all game rendering, physics, input handling, state management, and drawing. It's a self-contained React component using HTML5 Canvas.

---

## Architecture & Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 14 (App Router) | Static export mode — no server required |
| Language | TypeScript (strict) | Full type coverage with interfaces for game state |
| Rendering | HTML5 Canvas 2D | No game engine; raw `ctx` drawing calls |
| Styling | Inline styles + `globals.css` | No Tailwind or CSS-in-JS |
| Font | Press Start 2P (Google Fonts) | Loaded via `<link>` tag — canvas `ctx.font` needs the family name directly |
| Deployment | GitHub Pages | Automated via GitHub Actions on push to `main` |
| CI/CD | GitHub Actions | `.github/workflows/deploy.yml` |

**Why no game engine?** The game is simple enough that a canvas-based approach keeps the bundle tiny (~3.7 kB) and avoids framework lock-in. All game state lives in a single `useRef` to avoid React re-render overhead during the 60fps game loop.

**Why static export?** The game is entirely client-side — no API routes, no SSR needed. `next.config.js` sets `output: 'export'` to produce a flat `out/` directory that GitHub Pages serves directly.

---

## Gameplay & Mechanics

### Controls

| Phase | Touch (Mobile) | Mouse (Desktop) |
|-------|---------------|-----------------|
| Title/Game Over | Tap anywhere | Click anywhere |
| Ready (throw) | Swipe in any direction | Click + drag + release |
| Dodge | Drag to move character | Click + drag to move |

The entire screen is the input area — no buttons.

### Core Loop

1. **Round starts** — player is centered, ball appears above character
2. **Throw** — swipe to launch the ball in any direction
3. **Dodge** — balls fire from random pipes; drag to move and avoid them
4. **Round clears** when timer expires → score increases → next round begins
5. **Hit** — lose a life, round restarts at same number
6. **Game Over** — all 3 lives lost; shows score and high score

### Progression

- Each round adds +1 incoming ball
- Ball speed increases: `BASE_BALL_SPEED + round × 0.25`
- Round timer decreases: `max(4s, 10s - round × 0.4s)`
- Ball spawn delay tightens: `max(0.3s, 1.2s - round × 0.08s)`

### Power-Ups

Appear after round 2 with a 40% chance per round.

| Power-Up | Color | Effect | Duration |
|----------|-------|--------|----------|
| Slow Motion | Blue (S) | All balls move at 40% speed | 3 seconds |
| Shield | Gold (★) | Player is invincible, glowing ring | 2.5 seconds |

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

All constants are at the top of `components/DodgeBallChaos.tsx`:

| Constant | Value | What It Controls |
|----------|-------|-----------------|
| `CW × CH` | 400 × 680 | Canvas pixel dimensions |
| `PIPE_COUNT` | 8 | Number of ball-spawning pipes around the arena |
| `PLAYER_SPEED` | 3.8 | Player movement speed (pixels per frame) |
| `BASE_BALL_SPEED` | 2.8 | Starting ball velocity |
| `HIT_DIST` | 18 | Collision detection radius (pixels) |
| `BASE_ROUND_TIME` | 10 | Starting round duration (seconds) |
| `BALL_R` | 7 | Ball render radius (pixels) |

### Difficulty Scaling Formulas

```
ball_speed    = 2.8 + (round × 0.25)
round_timer   = max(4, 10 - (round × 0.4))
launch_delay  = max(0.3, 1.2 - (round × 0.08))
balls_per_round = round
powerup_chance  = 40% (if round > 2)
```

---

## Deployment

### Automatic (GitHub Actions)

Every push to `main` triggers `.github/workflows/deploy.yml`:

1. Checks out code
2. Installs Node 20 + runs `npm ci`
3. Builds with `npm run build` (static export → `out/`)
4. Deploys `out/` to GitHub Pages

**First-time setup**: In your repo settings, go to **Settings → Pages → Source** and select **"GitHub Actions"** (not "Deploy from a branch").

The `next.config.js` sets `basePath: '/dodge-ball-chaos'` and `assetPrefix: '/dodge-ball-chaos/'` for production so all asset paths resolve correctly under the GitHub Pages subdirectory.

### Manual Deploy

```bash
npm run build
# Upload contents of out/ to any static host
```

---

## AI Agent & Tooling Guide

This section is designed for AI coding agents (Claude, Cursor, Copilot Workspace, Aider, etc.) to onboard instantly.

### For AI Agents: Read These First

1. **`CONTEXT.md`** — Full development context: what's built, what's not, architecture decisions, and session continuity notes
2. **This README** — Setup, structure, and tuning reference
3. **`components/DodgeBallChaos.tsx`** — The entire game in one file

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
4. The game is ONE file: components/DodgeBallChaos.tsx
5. All game constants are at the top of that file
6. All game state is in the GameState interface
7. All rendering is in draw* functions
8. The game loop is in the useEffect that calls requestAnimationFrame
```

### Coding Conventions

- **TypeScript strict mode** — all types must be explicit
- **Single-file game component** — all game logic in `DodgeBallChaos.tsx`
- **No React state for game data** — game state lives in a `useRef<GameState>` to avoid re-renders during the 60fps loop
- **Canvas-only rendering** — no DOM elements inside the game; everything is drawn via `CanvasRenderingContext2D`
- **Constants at top** — all tuning values are named constants, not magic numbers
- **Draw functions are pure** — they take `ctx` + data, draw, return nothing
- **State machine pattern** — game flow is controlled by `g.state` matching `ST.*` constants

### Making Changes

| Task | Where to Edit |
|------|--------------|
| Adjust difficulty | Constants at top of `DodgeBallChaos.tsx` |
| Add a new power-up | `PowerUp` interface, `initRound` spawning logic, collision check in DODGE block, `drawPowerUp` function |
| Add a new game state | Add to `ST` object, add transition logic in game loop, add rendering block |
| Change visual style | `C` color constants object, individual `draw*` functions |
| Add sound | Create new file, import in component, trigger in game loop at relevant state transitions |
| Add a new page/route | Create new file in `app/` directory (Next.js App Router convention) |
| Modify CI/CD | `.github/workflows/deploy.yml` |
| Change deployment target | `next.config.js` — update `basePath` and `assetPrefix` |

### Validation Checklist

Before pushing any changes, run:

```bash
npm run lint          # Should show: ✔ No ESLint warnings or errors
npm run build         # Should show: ✓ Compiled successfully
```

Both must pass — the CI pipeline runs the same checks.

---

## Roadmap

### Not Yet Implemented (from PRD)

- [ ] **Sound & Music** — ambient beats for early rounds, intensifying at round 10 (Ultra Instinct dramatic drop), sound cues for throw/hit/clear/power-up
- [ ] **Multiple ball types** — different speeds, sizes, trajectories, or behaviors
- [ ] **Bounce boost power-up** — mentioned in original PRD
- [ ] **Advanced round scaling** — increased randomness and unpredictability at higher rounds

### Future Ideas

- [ ] Persistent high score (cross-session storage)
- [ ] Leaderboard
- [ ] Character skins / unlockables
- [ ] Screen shake on hit
- [ ] Particle effects (ball trails, hit explosions)
- [ ] Ball wall-bounce mechanics
- [ ] Boss rounds
- [ ] PWA support (offline play, install to home screen)

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

# CONTEXT.md — Dodge Ball Chaos Development Context

> This document captures the full project context so development can be continued in any Claude session.

## Project Overview

**Dodge Ball Chaos** is a mobile-first, touch-based arcade game built with Next.js and HTML5 Canvas.
The player controls a Goku-inspired pixel art character who throws a ball, then dodges incoming balls
fired from random pipes around the arena.

**Live URL**: https://edward-rosado.github.io/dodge-ball-chaos/
**Repo**: https://github.com/edward-rosado/dodge-ball-chaos

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Rendering**: HTML5 Canvas (no game engine)
- **Styling**: Inline styles + globals.css (no Tailwind)
- **Font**: Press Start 2P (Google Fonts)
- **Deployment**: GitHub Pages via GitHub Actions (static export)
- **CI/CD**: `.github/workflows/deploy.yml` — builds on push to `main`, deploys to Pages

## Project Structure

```
dodge-ball-chaos/
├── .github/workflows/deploy.yml   # CI/CD pipeline
├── app/
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # Root layout with font + meta tags
│   └── page.tsx                    # Main page (loads game component)
├── components/
│   └── DodgeBallChaos.tsx          # Core game component (all game logic)
├── public/                         # Static assets (empty for now)
├── next.config.js                  # Static export + basePath config
├── package.json
├── tsconfig.json
├── .eslintrc.json
├── .gitignore
├── CONTEXT.md                      # This file
└── README.md
```

## What's Implemented (v0.1)

### Core Mechanics
- **Swipe to throw**: Player swipes in any direction to launch a red ball; round timer starts
- **Dodge phase**: After throw, balls fire from 8 pipes around the arena edges
- **Round progression**: Each round adds +1 ball; timer shortens by 0.4s per round (min 4s)
- **Ball speed scaling**: Base 2.8 + round × 0.25
- **Launch timing**: Balls stagger with decreasing delay (max 0.3s gap at high rounds)
- **3 lives**: Hit = lose a life + round restarts; 0 lives = game over
- **Score**: round × 100 points per cleared round
- **High score**: Tracked per session (resets on page reload)

### Power-Ups (appear after round 2, 40% chance)
- **Slow Motion (blue "S")**: Slows all balls to 40% speed for 3 seconds
- **Shield (gold "★")**: Invincibility for 2.5 seconds with glowing ring

### Controls
- **Touch**: Swipe to throw (READY), drag to move (DODGE)
- **Mouse**: Click+drag for both (desktop fallback)
- **Tap/click** to start or retry from title/game over screens

### Visual Style
- Pixel art character with Goku-inspired spiky hair silhouette
- Dark retro-futuristic grid background (animated scroll)
- Glowing cyan pipes with activation flash
- Red dodge balls with highlight
- Press Start 2P arcade font for HUD
- Blinking "TAP TO START" prompt
- Hit flash effect (white glow on player)

### Game States
```
TITLE → READY → THROW → DODGE → CLEAR → (next round READY)
                            ↓
                          HIT → READY (same round, -1 life)
                            ↓
                          OVER → (tap to restart)
```

## What's NOT Yet Implemented (from PRD)

### Priority Items
1. **Sound & Music**
   - Ambient beats for early rounds
   - Intensifying music at round 10 (Ultra Instinct style dramatic drop)
   - Sound cues for power-up collection, ball throw, hit, round clear
2. **Multiple ball types** — different speeds, sizes, or behaviors
3. **Advanced round scaling** — faster ball speed randomness at higher rounds
4. **Bounce boost power-up** — mentioned in PRD but not implemented

### Future Iteration Ideas
- Persistent high score (localStorage or backend)
- Leaderboard
- Character skins
- Screen shake on hit
- Particle effects (ball trail, explosion on hit)
- Ball bounce off walls mechanic
- Boss rounds
- Mobile PWA support (offline play)

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) does:
1. Triggers on push to `main` or manual dispatch
2. Checks out code
3. Installs Node 20 + npm deps
4. Runs `npm run build` (Next.js static export → `./out/`)
5. Uploads `./out/` as Pages artifact
6. Deploys to GitHub Pages

**Important**: GitHub Pages must be enabled on the repo with source set to "GitHub Actions".
The `next.config.js` sets `basePath` and `assetPrefix` to `/dodge-ball-chaos` for production.

## Key Constants (tuning reference)

| Constant | Value | Purpose |
|---|---|---|
| CW × CH | 400 × 680 | Canvas dimensions |
| PLAYER_SPEED | 3.8 | Movement speed (px/frame) |
| BASE_BALL_SPEED | 2.8 | Starting ball speed |
| Ball speed growth | +0.25/round | Speed increase per round |
| HIT_DIST | 18 | Collision radius |
| BASE_ROUND_TIME | 10s | Starting round duration |
| Timer shrink | -0.4s/round | Min 4 seconds |
| Launch delay | max(0.3, 1.2 - round×0.08) | Time between ball spawns |
| Power-up chance | 40% after round 2 | Spawn probability |
| Slow duration | 3s at 40% speed | Slow Motion effect |
| Shield duration | 2.5s | Invincibility window |

## GitHub Access

The repo owner is `edward-rosado`. A personal access token with `repo` scope is needed
for pushing commits and managing the repository programmatically.

# Dodge Ball Chaos 🏐⚡

A mobile-first, touch-based arcade game where you control a Goku-inspired pixel art character who throws a ball and dodges incoming balls from random pipes.

**[Play Live](https://edward-rosado.github.io/dodge-ball-chaos/)**

## Quick Start

```bash
# Clone
git clone https://github.com/edward-rosado/dodge-ball-chaos.git
cd dodge-ball-chaos

# Install + build (one command)
npm run setup

# Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — best on mobile or Chrome DevTools mobile view.

### Requirements
- Node.js 18.17+ (see `.nvmrc`)
- npm 9+

### Available Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build (static export to `out/`) |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |
| `npm run clean` | Remove `.next/`, `out/`, `node_modules/` |
| `npm run setup` | Fresh install + build in one step |

## Gameplay
- **Swipe/drag** to throw the ball and start the round
- **Swipe/drag** to move and dodge incoming balls from 8 pipes
- Each round adds more balls — survive as long as you can
- Collect power-ups: **Slow Motion** (blue) and **Shield** (gold)
- 3 lives per game, rounds get progressively harder

## Tech Stack
- Next.js 14 (App Router, static export)
- TypeScript
- HTML5 Canvas rendering (no game engine)
- GitHub Pages deployment via GitHub Actions

## Deployment
Pushes to `main` automatically deploy to GitHub Pages via `.github/workflows/deploy.yml`. No manual steps needed.

## Status
🚧 Active development

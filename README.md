# Dodge Ball Chaos 🏐⚡

A mobile-first, touch-based arcade game where you control a Goku-inspired pixel art character who throws a ball and dodges incoming balls from random pipes.

**[▶ Play Now](https://edward-rosado.github.io/dodge-ball-chaos/)**

## Gameplay
- **Swipe** to throw the ball and start the round
- **Drag** to dodge incoming balls from 8 pipes around the arena
- Each round adds more balls — survive as long as you can!
- Collect **power-ups**: Slow Motion (blue) and Shield (gold)
- 3 lives per game, rounds get progressively harder

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- HTML5 Canvas rendering (no game engine)
- GitHub Actions CI/CD → GitHub Pages

## Development
```bash
npm install
npm run dev
```

## Deployment
Pushes to `main` automatically build and deploy to GitHub Pages via GitHub Actions.

See [CONTEXT.md](./CONTEXT.md) for full project context and development notes.

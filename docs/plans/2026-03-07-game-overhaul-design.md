# Dodge Ball Chaos — Game Overhaul Design

**Date**: 2026-03-07
**Status**: Approved

---

## Overview

Major overhaul of Dodge Ball Chaos from a simple pixel-art dodgeball game to a SNES-era (Mega Man X style) DBZ-themed arena game with persistent bouncing balls, pipe/cannon mechanics, 10 special ball types, 10 power-ups, progressive difficulty through 50 levels, and a Frieza boss fight.

---

## 1. Arena & Pipes

### Circular Pipe Ring
- **16 pipes** evenly spaced forming a full circle around the play area
- Each pipe is a large (~40x40px) metallic cannon with SNES-style shading and muzzle flash on fire
- Player **cannot leave** the pipe ring — movement clamped to circular boundary
- Player slides along the circle edge when pushing against boundary

### Ball-Pipe Interaction (Probability Gradient)
- Distance from ball impact to pipe center determines behavior
- **Dead center**: 95% suck-in (teleport to random other pipe, fired out at random angle)
- **Pipe edge**: 5% suck-in (95% bounce with reflection angle physics)
- Linear interpolation between center and edge
- Teleported balls exit destination pipe at random angle into arena

### Backgrounds (outside the circle)
Randomly selected per round from the current phase pool:
- Kami's Lookout
- Namek (green sky, blue grass)
- Hyperbolic Time Chamber (white void, tiled floor)
- Gravity Room (red-tinted metal interior)
- World Tournament Arena
- Frieza's Ship (level 50 only)

---

## 2. Player Character & Controls

### Character Design
- DBZ fighter (Goku), SNES Mega Man X-level pixel art detail
- ~80x80px sprite, procedurally drawn
- Spiky hair, gi outfit, muscle definition, belt sash
- **Animations**: idle bob, running pose, hit knockback flash
- **Ultra Instinct mode** (milestone levels): silver/white hair recolor, aura glow

### Controls
- **Touch/drag**: Mobile movement
- **WASD / Arrow Keys**: 8-directional keyboard movement
- **Swipe / Spacebar**: Throw dodgeball at round start
- **Mouse aim** (desktop): Throw direction follows cursor
- **Tap/click**: Activate Instant Transmission power-up

### Movement
- Clamped to circular boundary (pipe ring inner edge)
- Distance from center must be <= arena radius minus player hitbox
- Smooth sliding along circle edge

### Throw Mechanic
- Round start: player holds dodgeball(s)
- Swipe (mobile) or click direction (desktop) to throw
- Level 10+: two balls throw in opposite directions
- Level 20+: three balls in spread, etc.

---

## 3. Ball System

### The Dodgeball (Persistent)
- Red energy ball with ki aura glow
- Player throws at start of each round — stays alive entire round
- **+5% speed per pipe bounce** (caps at reasonable max)
- Additional dodgeballs at milestones: 2 at L10, 3 at L20, 4 at L30, 5 at L40-50

### 10 Special Ball Types (Fired from Pipes, Persistent)

| # | Type | Movement | Visual | Bounce Behavior |
|---|------|----------|--------|-----------------|
| 1 | Tracker | Slowly curves toward player | Purple, homing reticle | Re-acquires target after bounce |
| 2 | Splitter | Straight line | Green, pulses | Splits into 3 smaller balls on 1st bounce |
| 3 | Ghost | Straight, phases in/out every 2s | White, fades | Normal bounce, invisible on schedule |
| 4 | Bomber | Straight line | Red/orange, flashes | Explodes on 3rd bounce (blast radius), respawns from pipe |
| 5 | Zigzag | Sine-wave pattern | Yellow, lightning trail | Continues zigzag after bounce |
| 6 | Giant | Straight, slower | Large dark red, 3x size | Normal bounce |
| 7 | Speed Demon | Starts slow, 2x speed per bounce | Blue, motion blur trail | Dangerously fast over time |
| 8 | Gravity Well | Straight line | Dark purple, swirl | Pulls player within radius |
| 9 | Mirage | Straight line | Orange | Spawns 2 transparent fakes on bounce |
| 10 | Ricochet | Straight line | Cyan, sparks | Wild unpredictable bounce angles |

### Spawn Rules
- Round N: (N-1) random special balls + dodgeball(s)
- Special balls fire from random pipes with staggered timing
- Type selected randomly per spawn
- All balls persist and bounce — arena gets increasingly chaotic

---

## 4. Power-Ups

| # | Power-Up | Effect | Duration/Uses |
|---|----------|--------|---------------|
| 1 | Instant Transmission | Tap/click to teleport | 3 uses |
| 2 | Ki Shield | Blocks one lethal hit | Until hit |
| 3 | Kaioken | 2x move speed, red glow | 5 seconds |
| 4 | Solar Flare | Freezes all balls | 3 seconds |
| 5 | Senzu Bean | +1 life | Permanent |
| 6 | Time Skip | Balls at 0.3x speed | 4 seconds |
| 7 | Destructo Disc | Destroys one random special ball | Instant |
| 8 | Afterimage | Decoy draws ball aggro | 4 seconds |
| 9 | Shrink | Hitbox halves | 5 seconds |
| 10 | Spirit Bomb Charge | Stand still 3s, destroy ALL special balls (dodgeballs survive) | Channeled |

### Spawn Rules
- Spawn every 5-8 seconds
- Max 2 on screen at once
- Random safe positions (not on top of balls)
- Higher rounds unlock rarer power-ups (Senzu Bean, Spirit Bomb: round 5+)
- Visual: pulsing capsule with DBZ-style icon

---

## 5. Progression & Music

### Level Phases

| Levels | Dodgeballs | Background Pool | Music |
|--------|-----------|-----------------|-------|
| 1-9 | 1 | Kami's Lookout, Namek | Chill training chiptune |
| 10 | 2 | Random | Ultra Instinct |
| 11-19 | 2 | Gravity Room, Tournament | Intense battle chiptune |
| 20 | 3 | Random | Ultra Instinct |
| 21-29 | 3 | Hyperbolic Time Chamber, Namek | Heavier battle music |
| 30 | 4 | Random | Ultra Instinct |
| 31-39 | 4 | Mixed | Escalating intensity |
| 40 | 5 | Random | Ultra Instinct |
| 41-49 | 5 | Mixed | Peak intensity |
| 50 | 5 | Frieza's Ship / Namek | Ultra Instinct (boss) |

### Music System
- Web Audio API synthesized chiptune (no external files)
- SNES-style channels: square wave, triangle, noise
- Smooth crossfade between tracks
- Ultra Instinct theme: ethereal pads + driving beat at milestone levels (10, 20, 30, 40, 50)

---

## 6. Frieza Boss (Level 50)

### Frieza Character
- ~100x100px Final Form Frieza, SNES pixel art
- HP bar at top of screen
- Takes damage from dodgeballs (main) and special balls (minor)

### Frieza AI (Reuses Ball Movement Patterns)
- Picks movement pattern from the 10 ball types and executes it
- Cycles: tracker (chase player), zigzag, speed demon dash, etc.
- Periodically dashes at player (damages on contact)
- Also dodges balls — Frieza has ball collision too
- Gets hit by dodgeballs/special balls, reducing HP

### Win/Lose
- No timer — fight until someone dies
- Player wins: Victory screen with stats
- Player dies: Game over as normal

---

## 7. Automated Beatability Testing

### Playtest Bot
- Headless game simulation (no rendering, just physics/logic)
- Bot uses avoidance AI: move away from nearest threat, collect power-ups when safe
- Runs each level 100 times, tracks survival rate
- Command: `npm run test:beatability`

### Target Survival Rates

| Levels | Bot Survival Rate | Difficulty |
|--------|-------------------|------------|
| 1-10 | 60%+ | Easy |
| 11-20 | 50%+ | Moderate |
| 21-30 | 40%+ | Challenging |
| 31-40 | 30%+ | Hard |
| 41-49 | 20%+ | Very hard |
| 50 (Frieza) | 25%+ | Boss fight |

If a level bracket falls below threshold, tune ball speeds, spawn rates, or power-up frequency.

---

## 8. Responsive Design

- Canvas scales to viewport maintaining aspect ratio
- Mobile: full screen width, touch controls
- Desktop: centered canvas with max-width, keyboard/mouse
- HUD scales with canvas
- Touch targets min 44px
- Portrait preferred on mobile, landscape on desktop

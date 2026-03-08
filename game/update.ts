import { GameState, Ball, ST, MoveProvider } from "./types";
import {
  PIPE_COUNT,
  BASE_BALL_SPEED,
  PLAYER_HITBOX,
  getDifficulty,
} from "./constants";
import { dist, circularClamp, bounceOffWall, checkPipeSuckIn } from "./physics";
import { initRound, restoreAfterHit } from "./state";
import { updateBallByType } from "./balls/dispatcher";
import { createBall } from "./balls/factory";
import { getAvailableTypes } from "./balls/spawn";
import { spawnPowerUp, randomSpawnTimer } from "./powerups/factory";
import { applyPowerUp, completeSpiritBomb, cancelSpiritBomb } from "./powerups/effects";
import { getLevelConfig } from "./progression";

/** Max power-ups on screen at once. */
const MAX_POWER_UPS = 2;

/**
 * Pure game logic update — no rendering, no canvas.
 * Called each frame by both the real game loop and headless simulation.
 */
export function update(g: GameState, dt: number, moveProvider?: MoveProvider): void {
  g.t += dt;

  // ── Timers (always tick) ──
  if (g.msgTimer > 0) g.msgTimer -= dt;
  if (g.flash > 0) g.flash -= dt;
  if (g.slow) {
    g.slowTimer -= dt;
    if (g.slowTimer <= 0) g.slow = false;
  }
  // Ki Shield: no timer — stays until consumed by a hit (shieldTimer unused for Ki Shield)
  if (g.kaioken) {
    g.kaiokenTimer -= dt;
    if (g.kaiokenTimer <= 0) { g.kaioken = false; g.kaiokenTimer = 0; }
  }
  if (g.solarFlare) {
    g.solarFlareTimer -= dt;
    if (g.solarFlareTimer <= 0) {
      g.solarFlare = false;
      g.solarFlareTimer = 0;
      // Restore frozen ball velocities
      for (const b of g.balls) {
        if (b.savedVx !== undefined && b.savedVy !== undefined) {
          b.vx = b.savedVx;
          b.vy = b.savedVy;
          b.savedVx = undefined;
          b.savedVy = undefined;
        }
      }
    }
  }
  if (g.afterimageDecoy) {
    g.afterimageTimer -= dt;
    if (g.afterimageTimer <= 0) {
      g.afterimageDecoy = null;
      g.afterimageTimer = 0;
    }
  }
  if (g.shrink) {
    g.shrinkTimer -= dt;
    if (g.shrinkTimer <= 0) { g.shrink = false; g.shrinkTimer = 0; }
  }

  // Spirit Bomb channeling
  if (g.spiritBombCharging) {
    g.spiritBombTimer -= dt;
    if (g.spiritBombTimer <= 0) {
      completeSpiritBomb(g);
    }
  }

  // ── THROW ──
  if (g.state === ST.THROW) {
    let anyBounced = false;
    for (const t of g.thrown) {
      t.x += t.vx;
      t.y += t.vy;
      const suckPipe = checkPipeSuckIn(t, g.pipes);
      if (suckPipe >= 0) { g.activePipe = suckPipe; anyBounced = true; }
      const bounced = bounceOffWall(t);
      if (bounced) anyBounced = true;
    }
    if (anyBounced) {
      g.balls.push(...g.thrown);
      g.thrown = [];
      g.state = ST.DODGE;
      g.launchDelay = 0.6;
    }
    return;
  }

  // ── DODGE ──
  if (g.state === ST.DODGE) {
    // Movement (keyboard for real game, bot for simulation)
    if (moveProvider) moveProvider(g);

    // Spirit Bomb cancel on movement
    if (g.spiritBombCharging) {
      const movedDist = Math.hypot(g.px + g.pvx - g.spiritBombX, g.py + g.pvy - g.spiritBombY);
      if (movedDist > 3) {
        cancelSpiritBomb(g);
      }
    }

    // Move speed modifier (Kaioken = 2x)
    const speedMult = g.kaioken ? 2 : 1;

    // Move player + clamp to arena boundary
    const clamped = circularClamp(g.px + g.pvx * speedMult, g.py + g.pvy * speedMult);
    g.px = clamped.x;
    g.py = clamped.y;

    // Launch balls from pipes
    g.launchDelay -= dt;
    if (g.launched < g.launchQueue && g.launchDelay <= 0) {
      const pi = Math.floor(Math.random() * PIPE_COUNT);
      const p = g.pipes[pi];
      const diff = getDifficulty(g.round);
      const spd = BASE_BALL_SPEED + g.round * diff.speedPerRound;
      const available = getAvailableTypes(g.round);
      const type = available[Math.floor(Math.random() * available.length)];
      const ball = createBall(type, p, spd);
      g.balls.push(ball);
      g.activePipe = pi;
      g.launched++;
      g.launchDelay = Math.max(diff.launchDelayMin, 1.2 - g.round * 0.03);
    }

    // Update balls
    const sm = g.slow ? 0.3 : 1; // TimeSkip: 0.3x speed
    const frozen = g.solarFlare; // Solar Flare: balls completely frozen
    const newBalls: Ball[] = [];
    for (const b of g.balls) {
      if (!frozen) {
        b.x += b.vx * sm;
        b.y += b.vy * sm;
      }

      // Type-specific update (tracker curves, ghost phases, etc.)
      if (!frozen) {
        updateBallByType(b, g, newBalls);
      }

      // Physics: pipe suck-in or wall bounce
      if (!frozen) {
        const suckPipe = checkPipeSuckIn(b, g.pipes);
        if (suckPipe >= 0) {
          g.activePipe = suckPipe;
        } else {
          bounceOffWall(b);
        }
      }
    }

    // Add children (Splitter, Mirage) and remove dead balls
    if (newBalls.length > 0) g.balls.push(...newBalls);
    g.balls = g.balls.filter(b => !b.dead);

    // Collision detection
    const hitboxRadius = g.shrink ? PLAYER_HITBOX / 2 : PLAYER_HITBOX;
    for (const b of g.balls) {
      if (b.isReal && dist({ x: g.px, y: g.py }, b) < b.radius + hitboxRadius) {
        // Ki Shield absorbs hit
        if (g.shield) {
          g.shield = false;
          g.shieldTimer = 0;
          g.msg = "SHIELD ABSORBED!";
          g.msgTimer = 0.8;
          b.dead = true;
          continue;
        }

        g.lives--;
        g.flash = 0.5;
        if (g.lives <= 0) {
          g.state = ST.OVER;
          g.highScore = Math.max(g.highScore, g.score);
        } else {
          g.state = ST.HIT;
          g.msgTimer = 1.2;
          g.msg = "HIT!";
        }
        return;
      }
    }

    // Power-up spawn timer
    g.powerUpSpawnTimer -= dt;
    if (g.powerUpSpawnTimer <= 0 && g.round > 1) {
      const uncollected = g.powerUps.filter(p => !p.collected);
      if (uncollected.length < MAX_POWER_UPS) {
        g.powerUps.push(spawnPowerUp(g.round, g.balls));
      }
      g.powerUpSpawnTimer = randomSpawnTimer();
    }

    // Power-up collection
    for (const pu of g.powerUps) {
      if (!pu.collected && dist({ x: g.px, y: g.py }, pu) < 20) {
        pu.collected = true;
        applyPowerUp(g, pu.type);
      }
    }

    // Clean up collected power-ups
    g.powerUps = g.powerUps.filter(pu => !pu.collected);

    // Round timer
    g.timer -= dt;
    if (g.timer <= 0 && g.state === ST.DODGE) {
      g.score += g.round * 100;
      // Bonus life based on level progression config
      const levelCfg = getLevelConfig(g.round);
      if (levelCfg.bonusLife) {
        g.lives++;
        g.msg = "CLEAR! +1 LIFE!";
      } else {
        g.msg = "CLEAR!";
      }
      g.round++;
      g.state = ST.CLEAR;
      g.msgTimer = 1.5;
    }
  }

  // ── HIT / CLEAR transitions ──
  if (g.state === ST.HIT && g.msgTimer <= 0) restoreAfterHit(g);
  if (g.state === ST.CLEAR && g.msgTimer <= 0) initRound(g);
}

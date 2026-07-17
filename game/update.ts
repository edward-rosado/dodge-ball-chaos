import { GameState, Ball, ST, MoveProvider } from "./types";
import {
  PIPE_COUNT,
  BASE_BALL_SPEED,
  PLAYER_HITBOX,
  BOUNCE_SPEED_BOOST,
  getDifficulty,
  MAX_POWER_UPS,
  POWER_UP_LIFETIME,
  POWER_UP_MAGNET_RANGE,
  POWER_UP_MAGNET_SPEED,
  POWER_UP_PICKUP_RADIUS,
  DECOY_MAGNET_RANGE,
  DECOY_MAGNET_STRENGTH,
  SUCK_ANIM_DURATION,
  EMERGE_ANIM_DURATION,
} from "./constants";
import { dist, circularClamp, bounceOffWall, checkPipeSuckIn } from "./physics";
import { randomPipe } from "./arena";
import { initRound, restoreAfterHit } from "./state";
import { updateBallByType } from "./balls/dispatcher";
import { createBall } from "./balls/factory";
import { getAvailableTypes } from "./balls/spawn";
import { BALL_COLORS } from "./balls/types";
import { spawnPowerUp, randomSpawnTimer } from "./powerups/factory";
import { applyPowerUp, completeSpiritBomb, cancelSpiritBomb } from "./powerups/effects";
import { getLevelConfig } from "./progression";

/** Spawn a visual suck-in animation at a pipe for a ball. */
function spawnSuckAnim(g: GameState, ball: Ball, pipeIdx: number): void {
  const p = g.pipes[pipeIdx];
  g.pipeSystem.pipeSuckAnims.push({
    x: p.x, y: p.y,
    timer: SUCK_ANIM_DURATION,
    duration: SUCK_ANIM_DURATION,
    radius: ball.radius,
    color: BALL_COLORS[ball.type] || "#e63946",
  });
}

/**
 * Pure game logic update — no rendering, no canvas.
 * Called each frame by both the real game loop and headless simulation.
 */
export function update(g: GameState, dt: number, moveProvider?: MoveProvider): void {
  const ps = g.player;
  const fx = g.effects;
  const meta = g.meta;
  const pipeSys = g.pipeSystem;
  const inp = g.input;
  const launch = g.launch;

  meta.t += dt;

  // Tick pipe suck-in animations
  for (let i = pipeSys.pipeSuckAnims.length - 1; i >= 0; i--) {
    pipeSys.pipeSuckAnims[i].timer -= dt;
    if (pipeSys.pipeSuckAnims[i].timer <= 0) pipeSys.pipeSuckAnims.splice(i, 1);
  }
  // Tick pipe emergence animations
  for (let i = pipeSys.pipeEmergeAnims.length - 1; i >= 0; i--) {
    pipeSys.pipeEmergeAnims[i].timer -= dt;
    if (pipeSys.pipeEmergeAnims[i].timer <= 0) pipeSys.pipeEmergeAnims.splice(i, 1);
  }

  // ── Timers (always tick) ──
  if (meta.msgTimer > 0) meta.msgTimer -= dt;
  if (meta.flash > 0) meta.flash -= dt;
  if (meta.deathAnimTimer > 0) meta.deathAnimTimer -= dt;
  if (meta.itFlashTimer > 0) meta.itFlashTimer -= dt;
  if (fx.slow) {
    fx.slowTimer -= dt;
    if (fx.slowTimer <= 0) fx.slow = false;
  }
  // Ki Shield: no timer — stays until consumed by a hit (shieldTimer unused for Ki Shield)
  if (fx.kaioken) {
    fx.kaiokenTimer -= dt;
    if (fx.kaiokenTimer <= 0) { fx.kaioken = false; fx.kaiokenTimer = 0; }
  }
  if (fx.solarFlare) {
    fx.solarFlareTimer -= dt;
    if (fx.solarFlareTimer <= 0) {
      fx.solarFlare = false;
      fx.solarFlareTimer = 0;
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
  if (fx.afterimageDecoy) {
    fx.afterimageTimer -= dt;
    if (fx.afterimageTimer <= 0) {
      fx.afterimageDecoy = null;
      fx.afterimageTimer = 0;
    }
  }
  if (fx.shrink) {
    fx.shrinkTimer -= dt;
    if (fx.shrinkTimer <= 0) { fx.shrink = false; fx.shrinkTimer = 0; }
  }

  // Spirit Bomb channeling
  if (fx.spiritBombCharging) {
    fx.spiritBombTimer -= dt;
    if (fx.spiritBombTimer <= 0) {
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
      if (suckPipe >= 0) {
        // Spawn suck-in animation at entry pipe
        spawnSuckAnim(g, t, suckPipe);
        // Queue ball through pipe system instead of adding directly
        const destIdx = randomPipe(suckPipe);
        const delay = 1 + Math.random() * 2;
        const spd = Math.hypot(t.vx, t.vy);
        const destPipe = g.pipes[destIdx];
        const entryAngle = Math.atan2(t.vy, t.vx);
        const queuedBall: Ball = {
          ...t,
          x: destPipe.x,
          y: destPipe.y,
          vx: Math.cos(entryAngle) * spd * BOUNCE_SPEED_BOOST,
          vy: Math.sin(entryAngle) * spd * BOUNCE_SPEED_BOOST,
          bounceCount: t.bounceCount + 1,
          pipeImmunity: 0.5,
        };
        pipeSys.pipeQueue.push({ ball: queuedBall, pipeIndex: destIdx, delay, totalDelay: delay });
        if (!pipeSys.chargingPipes.includes(destIdx)) pipeSys.chargingPipes.push(destIdx);
        t.dead = true; // Mark as consumed by pipe
        anyBounced = true;
      }
      const bounced = bounceOffWall(t);
      if (bounced) anyBounced = true;
    }
    if (anyBounced) {
      // Only add thrown balls that weren't sucked into pipes
      g.balls.push(...g.thrown.filter(t => !t.dead));
      g.thrown = [];
      g.state = ST.DODGE;
      launch.launchDelay = 0.6;
    }
    return;
  }

  // ── DODGE ──
  if (g.state === ST.DODGE) {
    // Movement (keyboard for real game, bot for simulation)
    if (moveProvider) moveProvider(g);

    // Spirit Bomb cancel on movement
    if (fx.spiritBombCharging) {
      const movedDist = Math.hypot(ps.px + ps.pvx - fx.spiritBombX, ps.py + ps.pvy - fx.spiritBombY);
      if (movedDist > 10) {
        cancelSpiritBomb(g);
      }
    }

    // Move speed modifier (Kaioken = 2x)
    const speedMult = fx.kaioken ? 2 : 1;

    // Move player + clamp to arena boundary
    const clamped = circularClamp(ps.px + ps.pvx * speedMult, ps.py + ps.pvy * speedMult);
    ps.px = clamped.x;
    ps.py = clamped.y;

    // Launch balls from pipes
    launch.launchDelay -= dt;
    if (launch.launched < launch.launchQueue && launch.launchDelay <= 0) {
      const pi = Math.floor(Math.random() * PIPE_COUNT);
      const p = g.pipes[pi];
      const diff = getDifficulty(g.round);
      const spd = BASE_BALL_SPEED + g.round * diff.speedPerRound;
      const available = getAvailableTypes(g.round);
      const type = available[Math.floor(Math.random() * available.length)];
      const ball = createBall(type, p, spd);
      g.balls.push(ball);
      g.activePipe = pi;
      launch.launched++;
      launch.launchDelay = Math.max(diff.launchDelayMin, 1.2 - g.round * 0.03);
    }

    // Update balls
    const sm = fx.slow ? 0.3 : 1; // TimeSkip: 0.3x speed
    const frozen = fx.solarFlare; // Solar Flare: balls completely frozen
    const newBalls: Ball[] = [];
    for (const b of g.balls) {
      if (!frozen) {
        b.x += b.vx * sm;
        b.y += b.vy * sm;
      }

      // Afterimage decoy magnetism — balls are drawn toward the decoy
      if (!frozen && fx.afterimageDecoy) {
        const dDecoy = dist(fx.afterimageDecoy, b);
        if (dDecoy < DECOY_MAGNET_RANGE && dDecoy > 1) {
          const pull = DECOY_MAGNET_STRENGTH * (1 - dDecoy / DECOY_MAGNET_RANGE);
          b.vx += ((fx.afterimageDecoy.x - b.x) / dDecoy) * pull;
          b.vy += ((fx.afterimageDecoy.y - b.y) / dDecoy) * pull;
        }
      }

      // Type-specific update (tracker curves, ghost phases, etc.)
      if (!frozen) {
        updateBallByType(b, g, newBalls);
      }

      // Tick pipe immunity
      if (b.pipeImmunity > 0) b.pipeImmunity -= dt;

      // Physics: pipe suck-in (queue with delay) or wall bounce
      if (!frozen) {
        const suckPipe = b.pipeImmunity > 0 ? -1 : checkPipeSuckIn(b, g.pipes);
        if (suckPipe >= 0) {
          // Spawn suck-in animation at entry pipe
          spawnSuckAnim(g, b, suckPipe);
          // Ball was sucked in — queue it for delayed re-emergence
          const destIdx = randomPipe(suckPipe);
          const delay = 1 + Math.random() * 2; // 1-3 seconds
          const spd = Math.hypot(b.vx, b.vy);
          const destPipe = g.pipes[destIdx];
          // Preserve entry angle — ball exits at same direction it entered
          const entryAngle = Math.atan2(b.vy, b.vx);
          const queuedBall: Ball = {
            ...b,
            x: destPipe.x + Math.cos(destPipe.angle) * 22,
            y: destPipe.y + Math.sin(destPipe.angle) * 22,
            vx: Math.cos(entryAngle) * spd * BOUNCE_SPEED_BOOST,
            vy: Math.sin(entryAngle) * spd * BOUNCE_SPEED_BOOST,
            bounceCount: b.bounceCount + 1,
          };
          pipeSys.pipeQueue.push({ ball: queuedBall, pipeIndex: destIdx, delay, totalDelay: delay });
          if (!pipeSys.chargingPipes.includes(destIdx)) pipeSys.chargingPipes.push(destIdx);
          b.dead = true; // Remove from active balls
        } else {
          bounceOffWall(b);
        }
      }
    }

    // Process pipe queue — tick delays and re-emerge balls
    for (let i = pipeSys.pipeQueue.length - 1; i >= 0; i--) {
      const entry = pipeSys.pipeQueue[i];
      entry.delay -= dt;
      if (entry.delay <= 0) {
        entry.ball.pipeImmunity = 0.5; // Immune to re-suck for 0.5s
        g.balls.push(entry.ball);
        g.activePipe = entry.pipeIndex;
        // Spawn emergence animation at destination pipe
        const ep = g.pipes[entry.pipeIndex];
        pipeSys.pipeEmergeAnims.push({
          x: ep.x, y: ep.y,
          timer: EMERGE_ANIM_DURATION,
          duration: EMERGE_ANIM_DURATION,
          radius: entry.ball.radius,
          color: BALL_COLORS[entry.ball.type] || "#e63946",
        });
        pipeSys.chargingPipes = pipeSys.chargingPipes.filter(p => p !== entry.pipeIndex);
        pipeSys.pipeQueue.splice(i, 1);
      }
    }

    // Add children (Splitter, Mirage) and remove dead balls
    if (newBalls.length > 0) g.balls.push(...newBalls);
    g.balls = g.balls.filter(b => !b.dead);

    // Collision detection
    const hitboxRadius = fx.shrink ? PLAYER_HITBOX / 2 : PLAYER_HITBOX;
    for (const b of g.balls) {
      if (b.isReal && dist({ x: ps.px, y: ps.py }, b) < b.radius + hitboxRadius) {
        // Ki Shield absorbs hit
        if (fx.shield) {
          fx.shield = false;
          fx.shieldTimer = 0;
          meta.msg = "SHIELD ABSORBED!";
          meta.msgTimer = 0.8;
          b.dead = true;
          continue;
        }

        g.lives--;
        meta.flash = 0.5;
        meta.deathAnimTimer = 1.0;
        meta.deathX = ps.px;
        meta.deathY = ps.py;
        if (g.lives <= 0) {
          g.state = ST.OVER;
          meta.highScore = Math.max(meta.highScore, g.score);
        } else {
          g.state = ST.HIT;
          meta.msgTimer = 1.2;
          meta.msg = "HIT!";
        }
        return;
      }
    }

    // Power-up spawn timer
    g.powerUpSpawnTimer -= dt;
    if (g.powerUpSpawnTimer <= 0 && g.round >= 1) {
      const uncollected = g.powerUps.filter(pu => !pu.collected);
      if (uncollected.length < MAX_POWER_UPS) {
        g.powerUps.push(spawnPowerUp(g.round, g.balls, meta.t));
      }
      g.powerUpSpawnTimer = randomSpawnTimer();
    }

    // Power-up magnetic pull + collection
    for (const pu of g.powerUps) {
      if (pu.collected) continue;
      const d = dist({ x: ps.px, y: ps.py }, pu);

      // Magnetic pull: move toward player when close
      if (d < POWER_UP_MAGNET_RANGE && d > 1) {
        const pull = POWER_UP_MAGNET_SPEED * (1 - d / POWER_UP_MAGNET_RANGE);
        pu.x += ((ps.px - pu.x) / d) * pull;
        pu.y += ((ps.py - pu.y) / d) * pull;
      }

      // Collection (larger radius)
      if (d < POWER_UP_PICKUP_RADIUS) {
        pu.collected = true;
        meta.lastPowerUp = pu.type; // Signal for SFX in loop.ts
        applyPowerUp(g, pu.type);
      }
    }

    // Clean up collected and expired power-ups
    g.powerUps = g.powerUps.filter(
      pu => !pu.collected && (meta.t - pu.spawnTime) < POWER_UP_LIFETIME
    );

    // Round timer
    g.timer -= dt;
    if (g.timer <= 0 && g.state === ST.DODGE) {
      g.score += g.round * 100;
      // Bonus life based on level progression config
      const levelCfg = getLevelConfig(g.round);
      if (levelCfg.bonusLife) {
        g.lives++;
        meta.msg = "CLEAR! +1 LIFE!";
      } else {
        meta.msg = "CLEAR!";
      }
      // Victory after clearing round 50
      if (g.round >= 50) {
        g.state = ST.VICTORY;
        meta.highScore = Math.max(meta.highScore, g.score);
        meta.msgTimer = 999;
        return;
      }

      g.round++;
      g.state = ST.CLEAR;
      meta.msgTimer = 1.5;
    }
  }

  // ── HIT / CLEAR transitions ──
  if (g.state === ST.HIT && meta.msgTimer <= 0) restoreAfterHit(g);
  if (g.state === ST.CLEAR && meta.msgTimer <= 0) initRound(g);
}
import { GameState, Ball, ST } from "../types";
import {
  ARENA_LEFT,
  ARENA_RIGHT,
  ARENA_TOP,
  ARENA_BOTTOM,
} from "../constants";
import { dist } from "../physics";
import { BallType, BALL_COLORS } from "../balls/types";
import { PowerUpType, POWER_UP_CONFIGS } from "./types";
import { audio } from "../audio/engine";

/** Maximum Instant Transmission uses the player can hold at once. */
export const MAX_IT_USES = 3;
/** Maximum Afterimage decoy uses the player can hold at once. */
export const MAX_AFTERIMAGE_USES = 3;

/** Find a safe teleport position >60px from all balls. */
function findTeleportPosition(balls: Ball[]): { x: number; y: number } {
  const margin = 40;
  const xMin = ARENA_LEFT + margin;
  const xMax = ARENA_RIGHT - margin;
  const yMin = ARENA_TOP + margin;
  const yMax = ARENA_BOTTOM - margin;

  for (let attempt = 0; attempt < 30; attempt++) {
    const x = xMin + Math.random() * (xMax - xMin);
    const y = yMin + Math.random() * (yMax - yMin);
    let safe = true;
    for (const b of balls) {
      if (dist({ x, y }, b) < 60) {
        safe = false;
        break;
      }
    }
    if (safe) return { x, y };
  }
  // Fallback
  return { x: (xMin + xMax) / 2, y: (yMin + yMax) / 2 };
}

/**
 * Apply a power-up effect when collected.
 * Updates game state based on the power-up type.
 */
export function applyPowerUp(g: GameState, type: PowerUpType): void {
  const cfg = POWER_UP_CONFIGS[type];
  g.meta.msg = cfg.label;
  g.meta.msgTimer = 1;

  switch (type) {
    case PowerUpType.InstantTransmission:
      g.effects.instantTransmissionUses = Math.min(MAX_IT_USES, g.effects.instantTransmissionUses + 1);
      // Add to activation queue if not already queued
      if (!g.activePowerUpQueue.includes("it")) {
        g.activePowerUpQueue.push("it");
      }
      break;

    case PowerUpType.KiShield:
      g.effects.shield = true;
      // Ki Shield: no timer — stays until hit
      g.effects.shieldTimer = 0;
      break;

    case PowerUpType.Kaioken:
      g.effects.kaioken = true;
      g.effects.kaiokenTimer = 5;
      break;

    case PowerUpType.SolarFlare: {
      g.effects.solarFlare = true;
      g.effects.solarFlareTimer = 3;
      // Store ball velocities and freeze them
      for (const b of g.balls) {
        b.savedVx = b.vx;
        b.savedVy = b.vy;
        b.vx = 0;
        b.vy = 0;
      }
      break;
    }

    case PowerUpType.SenzuBean:
      g.lives++;
      break;

    case PowerUpType.TimeSkip:
      g.effects.slow = true;
      g.effects.slowTimer = 4;
      break;

    case PowerUpType.DestructoDisc: {
      // Destroy one random non-Dodgeball ball
      const specials = g.balls.filter(
        (b) => b.type !== BallType.Dodgeball && !b.dead
      );
      if (specials.length > 0) {
        const target = specials[Math.floor(Math.random() * specials.length)];
        target.dead = true;
        // Big explosive flash — long timer, bright color for maximum visibility
        g.meta.explosions.push({
          x: target.x,
          y: target.y,
          color: BALL_COLORS[target.type] || "#ff6600",
          timer: 1.4, // extended from 0.8s so destruction is clearly readable
        });
        // Stronger flash to draw eye — doubles as subtle screen-shake hint
        g.meta.flash = 0.5;
      }
      break;
    }

    case PowerUpType.Afterimage:
      // Cap at 1 decoy use at a time
      g.effects.afterimageUses = Math.min(MAX_AFTERIMAGE_USES, g.effects.afterimageUses + 1);
      // Add to activation queue if not already queued
      if (!g.activePowerUpQueue.includes("afterimage")) {
        g.activePowerUpQueue.push("afterimage");
      }
      break;

    case PowerUpType.Shrink:
      g.effects.shrink = true;
      g.effects.shrinkTimer = 5;
      break;

    case PowerUpType.SpiritBombCharge:
      // Queue for spacebar activation — don't auto-start charging
      g.effects.spiritBombReady = true;
      if (!g.activePowerUpQueue.includes("spiritBomb")) {
        g.activePowerUpQueue.push("spiritBomb");
      }
      break;
  }
}

/**
 * Activate the next usable power-up from the queue (spacebar / double-tap).
 * If skipAhead > 0, skips that many items first.
 * Shows a brief activation flash and message for visual feedback.
 * Returns true if something was activated.
 */
export function activateNextPowerUp(g: GameState): boolean {
  // Show activation flash
  g.effects.activationFlash = 0.5;
  g.effects.activationMsg = "ACTIVATED!";

  // Skip ahead if requested
  let skipCount = g.effects.skipAhead;
  g.effects.skipAhead = 0;

  // Walk the queue and activate the first one that has uses remaining
  let skipped = 0;
  for (let i = 0; i < g.activePowerUpQueue.length; i++) {
    const entry = g.activePowerUpQueue[i];
    // Skip over items if skipAhead is set
    if (skipCount > 0) {
      if (entry === "it" && g.effects.instantTransmissionUses > 0) {
        skipCount--;
        continue;
      }
      if (entry === "afterimage" && g.effects.afterimageUses > 0 && !g.effects.afterimageDecoy) {
        skipCount--;
        continue;
      }
      if (entry === "spiritBomb" && g.effects.spiritBombReady && !g.effects.spiritBombCharging) {
        skipCount--;
        continue;
      }
    }

    if (entry === "it" && g.effects.instantTransmissionUses > 0) {
      activateInstantTransmission(g);
      if (g.effects.instantTransmissionUses <= 0) {
        g.activePowerUpQueue.splice(i, 1);
      }
      return true;
    }
    if (entry === "afterimage" && g.effects.afterimageUses > 0 && !g.effects.afterimageDecoy) {
      activateAfterimage(g);
      if (g.effects.afterimageUses <= 0) {
        g.activePowerUpQueue.splice(i, 1);
      }
      return true;
    }
    if (entry === "spiritBomb" && g.effects.spiritBombReady && !g.effects.spiritBombCharging) {
      activateSpiritBomb(g);
      g.activePowerUpQueue.splice(i, 1);
      return true;
    }
  }
  // Clean up exhausted entries
  g.activePowerUpQueue = g.activePowerUpQueue.filter(e =>
    (e === "it" && g.effects.instantTransmissionUses > 0) ||
    (e === "afterimage" && g.effects.afterimageUses > 0) ||
    (e === "spiritBomb" && g.effects.spiritBombReady && !g.effects.spiritBombCharging)
  );
  return false;
}

/**
 * Skip ahead N items in the power-up queue.
 * Next activation will skip these items and activate the next available one.
 */
export function skipAheadInQueue(g: GameState, count: number): void {
  g.effects.skipAhead += count;
  g.effects.activationFlash = 0.3;
  g.effects.activationMsg = `SKIPPED ${count}!`;
}

/**
 * Use Instant Transmission: teleport to a random safe position.
 * Returns true if teleport was used, false if no uses remaining.
 */
export function activateInstantTransmission(g: GameState): boolean {
  if (g.effects.instantTransmissionUses <= 0) return false;
  g.effects.instantTransmissionUses--;
  // Record departure for visual trail
  g.effects.itDepartX = g.player.px;
  g.effects.itDepartY = g.player.py;
  g.effects.itFlashTimer = 0.4;
  const pos = findTeleportPosition(g.balls);
  g.player.px = pos.x;
  g.player.py = pos.y;
  g.meta.msg = "INSTANT TRANSMISSION!";
  g.meta.msgTimer = 0.5;
  // Play teleport SFX
  audio.playSFX("instantTransmission");
  return true;
}

/**
 * Deploy an afterimage decoy at the player's current position.
 * Returns true if deployed, false if no uses remaining.
 */
export function activateAfterimage(g: GameState): boolean {
  if (g.effects.afterimageUses <= 0) return false;
  if (g.effects.afterimageDecoy) return false; // Only 1 active decoy at a time
  g.effects.afterimageUses--;
  g.effects.afterimageDecoy = { x: g.player.px, y: g.player.py };
  g.effects.afterimageTimer = 4;
  g.meta.msg = "AFTERIMAGE!";
  g.meta.msgTimer = 0.5;
  audio.playSFX("afterimage");
  return true;
}

/**
 * Charge a Spirit Bomb at the player's position.
 * Returns true if charging started, false if already charging.
 */
export function activateSpiritBomb(g: GameState): boolean {
  if (g.effects.spiritBombCharging) return false;
  if (!g.effects.spiritBombReady) return false;
  g.effects.spiritBombReady = false;
  g.effects.spiritBombCharging = true;
  g.effects.spiritBombTimer = 3;
  g.effects.spiritBombX = g.player.px;
  g.effects.spiritBombY = g.player.py;
  g.meta.msg = "SPIRIT BOMB!";
  g.meta.msgTimer = 0.5;
  audio.playSFX("spiritBombCharge");
  return true;
}

/**
 * Cancel a charging Spirit Bomb (player moved too far).
 */
export function cancelSpiritBomb(g: GameState): void {
  g.effects.spiritBombCharging = false;
  g.effects.spiritBombTimer = 0;
  g.effects.spiritBombX = 0;
  g.effects.spiritBombY = 0;
  g.meta.msg = "SPIRIT BOMB CANCELLED!";
  g.meta.msgTimer = 0.8;
}

/**
 * Complete a Spirit Bomb: destroy all non-Dodgeball balls near the player.
 */
export function completeSpiritBomb(g: GameState): void {
  g.effects.spiritBombCharging = false;
  g.effects.spiritBombTimer = 0;
  const bombX = g.effects.spiritBombX;
  const bombY = g.effects.spiritBombY;
  const blastRadius = 60;

  for (const b of g.balls) {
    if (b.type !== BallType.Dodgeball && !b.dead) {
      const d = dist({ x: bombX, y: bombY }, b);
      if (d < blastRadius) {
        b.dead = true;
      }
    }
  }

  // Milestone skip: advance to next milestone level (10, 20, 30, 40, 50)
  const nextMilestone = Math.ceil(g.round / 10) * 10;
  if (nextMilestone > g.round && nextMilestone <= 50) {
    g.score = (nextMilestone - g.round) * 100;
    g.meta.msg = `SPIRIT BOMB! +${nextMilestone}!`;
    g.meta.msgTimer = 2;
    g.round = nextMilestone;
    g.meta.highScore = Math.max(g.meta.highScore, g.score);
  }
  // Victory on round 50+
  if (g.round >= 50) {
    g.state = ST.VICTORY;
    g.meta.highScore = Math.max(g.meta.highScore, g.score);
    g.meta.msg = "YOU WIN!";
    g.meta.msgTimer = 999;
    return;
  }
  g.meta.msg = `SPIRIT BOMB! +${nextMilestone}!`;
  g.meta.msgTimer = 1.5;
  g.meta.flash = 0.5;
  audio.playSFX("explosion");
}
import { GameState, Ball, ST } from "../types";
import {
  ARENA_LEFT,
  ARENA_RIGHT,
  ARENA_TOP,
  ARENA_BOTTOM,
} from "../constants";
import { dist } from "../physics";
import { BallType } from "../balls/types";
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
  g.msg = cfg.label;
  g.msgTimer = 1;

  switch (type) {
    case PowerUpType.InstantTransmission:
      g.instantTransmissionUses = Math.min(MAX_IT_USES, g.instantTransmissionUses + 1);
      // Add to activation queue if not already queued
      if (!g.activePowerUpQueue.includes("it")) {
        g.activePowerUpQueue.push("it");
      }
      break;

    case PowerUpType.KiShield:
      g.shield = true;
      // Ki Shield: no timer — stays until hit
      g.shieldTimer = 0;
      break;

    case PowerUpType.Kaioken:
      g.kaioken = true;
      g.kaiokenTimer = 5;
      break;

    case PowerUpType.SolarFlare: {
      g.solarFlare = true;
      g.solarFlareTimer = 3;
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
      g.slow = true;
      g.slowTimer = 4;
      break;

    case PowerUpType.DestructoDisc: {
      // Destroy one random non-Dodgeball ball
      const specials = g.balls.filter(
        (b) => b.type !== BallType.Dodgeball && !b.dead
      );
      if (specials.length > 0) {
        const target = specials[Math.floor(Math.random() * specials.length)];
        target.dead = true;
      }
      break;
    }

    case PowerUpType.Afterimage:
      // Cap at 1 decoy use at a time
      g.afterimageUses = Math.min(MAX_AFTERIMAGE_USES, g.afterimageUses + 1);
      // Add to activation queue if not already queued
      if (!g.activePowerUpQueue.includes("afterimage")) {
        g.activePowerUpQueue.push("afterimage");
      }
      break;

    case PowerUpType.Shrink:
      g.shrink = true;
      g.shrinkTimer = 5;
      break;

    case PowerUpType.SpiritBombCharge:
      // Queue for spacebar activation — don't auto-start charging
      g.spiritBombReady = true;
      if (!g.activePowerUpQueue.includes("spiritBomb")) {
        g.activePowerUpQueue.push("spiritBomb");
      }
      break;
  }
}

/**
 * Activate the next usable power-up from the queue (spacebar / double-tap).
 * Uses whichever was picked up first.
 * Returns true if something was activated.
 */
export function activateNextPowerUp(g: GameState): boolean {
  // Walk the queue and activate the first one that has uses remaining
  for (let i = 0; i < g.activePowerUpQueue.length; i++) {
    const entry = g.activePowerUpQueue[i];
    if (entry === "it" && g.instantTransmissionUses > 0) {
      activateInstantTransmission(g);
      // Remove from queue if no uses left
      if (g.instantTransmissionUses <= 0) {
        g.activePowerUpQueue.splice(i, 1);
      }
      return true;
    }
    if (entry === "afterimage" && g.afterimageUses > 0 && !g.afterimageDecoy) {
      activateAfterimage(g);
      // Remove from queue if no uses left
      if (g.afterimageUses <= 0) {
        g.activePowerUpQueue.splice(i, 1);
      }
      return true;
    }
    if (entry === "spiritBomb" && g.spiritBombReady && !g.spiritBombCharging) {
      activateSpiritBomb(g);
      g.activePowerUpQueue.splice(i, 1);
      return true;
    }
  }
  // Clean up exhausted entries
  g.activePowerUpQueue = g.activePowerUpQueue.filter(e =>
    (e === "it" && g.instantTransmissionUses > 0) ||
    (e === "afterimage" && g.afterimageUses > 0) ||
    (e === "spiritBomb" && g.spiritBombReady && !g.spiritBombCharging)
  );
  return false;
}

/**
 * Use Instant Transmission: teleport to a random safe position.
 * Returns true if teleport was used, false if no uses remaining.
 */
export function activateInstantTransmission(g: GameState): boolean {
  if (g.instantTransmissionUses <= 0) return false;
  g.instantTransmissionUses--;
  // Record departure for visual trail
  g.itDepartX = g.px;
  g.itDepartY = g.py;
  g.itFlashTimer = 0.4;
  const pos = findTeleportPosition(g.balls);
  g.px = pos.x;
  g.py = pos.y;
  g.msg = "INSTANT TRANSMISSION!";
  g.msgTimer = 0.5;
  // Play teleport SFX
  audio.playSFX("instantTransmission");
  return true;
}

/**
 * Deploy an afterimage decoy at the player's current position.
 * Returns true if deployed, false if no uses remaining.
 */
export function activateAfterimage(g: GameState): boolean {
  if (g.afterimageUses <= 0) return false;
  if (g.afterimageDecoy) return false; // Only 1 active decoy at a time
  g.afterimageUses--;
  g.afterimageDecoy = { x: g.px, y: g.py };
  g.afterimageTimer = 4;
  g.msg = "AFTERIMAGE!";
  g.msgTimer = 0.5;
  audio.playSFX("afterimage");
  return true;
}

/**
 * Start Spirit Bomb channeling (activated via spacebar / double-tap).
 */
export function activateSpiritBomb(g: GameState): boolean {
  if (!g.spiritBombReady || g.spiritBombCharging) return false;
  g.spiritBombReady = false;
  g.spiritBombCharging = true;
  g.spiritBombTimer = 3;
  g.spiritBombX = g.px;
  g.spiritBombY = g.py;
  g.msg = "SPIRIT BOMB! HOLD STILL!";
  g.msgTimer = 1;
  audio.playSFX("spiritBombCharge");
  return true;
}

/**
 * Complete Spirit Bomb: destroy all non-Dodgeball balls and skip to next milestone.
 * Milestones are levels 10, 20, 30, 40, 50.
 */
export function completeSpiritBomb(g: GameState): void {
  for (const b of g.balls) {
    if (b.type !== BallType.Dodgeball) {
      b.dead = true;
    }
  }
  g.spiritBombCharging = false;
  g.spiritBombTimer = 0;

  // On level 50 (or beyond), Spirit Bomb = instant victory
  if (g.round >= 50) {
    g.state = ST.VICTORY;
    g.highScore = Math.max(g.highScore, g.score);
    g.msg = "SPIRIT BOMB!!! YOU WIN!!!";
    g.msgTimer = 999;
    return;
  }

  // Skip to next milestone level
  const milestones = [10, 20, 30, 40, 50];
  const nextMilestone = milestones.find(m => m > g.round);
  if (nextMilestone) {
    const skipped = nextMilestone - g.round;
    g.score += skipped * 100; // Bonus score for skipped levels
    g.round = nextMilestone;
    g.msg = "SPIRIT BOMB!!! SKIP TO LVL " + nextMilestone + "!";
  } else {
    g.msg = "SPIRIT BOMB!!!";
  }
  g.msgTimer = 2;
  // Force round clear
  g.timer = 0;
}

/**
 * Cancel Spirit Bomb (player moved during channeling).
 */
export function cancelSpiritBomb(g: GameState): void {
  g.spiritBombCharging = false;
  g.spiritBombTimer = 0;
  g.msg = "SPIRIT BOMB CANCELLED!";
  g.msgTimer = 1;
}

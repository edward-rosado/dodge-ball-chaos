import { GameState, Ball } from "../types";
import {
  ARENA_LEFT,
  ARENA_RIGHT,
  ARENA_TOP,
  ARENA_BOTTOM,
} from "../constants";
import { dist } from "../physics";
import { BallType } from "../balls/types";
import { PowerUpType, POWER_UP_CONFIGS } from "./types";

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
      g.instantTransmissionUses += 3;
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
      // Grant uses — player deploys with button press
      g.afterimageUses += 2;
      break;

    case PowerUpType.Shrink:
      g.shrink = true;
      g.shrinkTimer = 5;
      break;

    case PowerUpType.SpiritBombCharge:
      g.spiritBombCharging = true;
      g.spiritBombTimer = 3;
      // Record position so we can detect movement
      g.spiritBombX = g.px;
      g.spiritBombY = g.py;
      break;
  }
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
  return true;
}

/**
 * Deploy an afterimage decoy at the player's current position.
 * Returns true if deployed, false if no uses remaining.
 */
export function activateAfterimage(g: GameState): boolean {
  if (g.afterimageUses <= 0) return false;
  g.afterimageUses--;
  g.afterimageDecoy = { x: g.px, y: g.py };
  g.afterimageTimer = 4;
  g.msg = "AFTERIMAGE!";
  g.msgTimer = 0.5;
  return true;
}

/**
 * Complete Spirit Bomb: destroy all non-Dodgeball balls.
 */
export function completeSpiritBomb(g: GameState): void {
  for (const b of g.balls) {
    if (b.type !== BallType.Dodgeball) {
      b.dead = true;
    }
  }
  g.spiritBombCharging = false;
  g.spiritBombTimer = 0;
  g.msg = "SPIRIT BOMB!!!";
  g.msgTimer = 1.5;
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

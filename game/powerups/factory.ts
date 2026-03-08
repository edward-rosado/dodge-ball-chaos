import { PowerUp, Ball } from "../types";
import {
  ARENA_LEFT,
  ARENA_RIGHT,
  ARENA_TOP,
  ARENA_BOTTOM,
} from "../constants";
import { dist } from "../physics";
import { PowerUpType, POWER_UP_CONFIGS, PowerUpConfig } from "./types";

/** Get power-up types available at a given round. */
export function getAvailablePowerUps(round: number): PowerUpConfig[] {
  return Object.values(POWER_UP_CONFIGS).filter(
    (cfg) => round >= cfg.minRound
  );
}

/** Pick a random power-up type weighted by config weights. */
export function pickRandomPowerUpType(round: number): PowerUpType {
  const available = getAvailablePowerUps(round);
  const totalWeight = available.reduce((sum, cfg) => sum + cfg.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const cfg of available) {
    roll -= cfg.weight;
    if (roll <= 0) return cfg.type;
  }
  return available[available.length - 1].type;
}

/** Margin from arena edges for spawning. */
const SPAWN_MARGIN = 40;

/** Find a safe spawn position that's at least minDist from all balls. */
function findSafePosition(balls: Ball[], minDist: number): { x: number; y: number } {
  const xMin = ARENA_LEFT + SPAWN_MARGIN;
  const xMax = ARENA_RIGHT - SPAWN_MARGIN;
  const yMin = ARENA_TOP + SPAWN_MARGIN;
  const yMax = ARENA_BOTTOM - SPAWN_MARGIN;

  for (let attempt = 0; attempt < 20; attempt++) {
    const x = xMin + Math.random() * (xMax - xMin);
    const y = yMin + Math.random() * (yMax - yMin);
    let safe = true;
    for (const b of balls) {
      if (dist({ x, y }, b) < minDist) {
        safe = false;
        break;
      }
    }
    if (safe) return { x, y };
  }

  // Fallback: return center-ish position
  return {
    x: xMin + Math.random() * (xMax - xMin),
    y: yMin + Math.random() * (yMax - yMin),
  };
}

/** Spawn a new power-up at a safe position. */
export function spawnPowerUp(round: number, balls: Ball[]): PowerUp {
  const type = pickRandomPowerUpType(round);
  const pos = findSafePosition(balls, 60);
  return {
    x: pos.x,
    y: pos.y,
    type,
    collected: false,
  };
}

/** Generate a random spawn timer between 3 and 5 seconds. */
export function randomSpawnTimer(): number {
  return 3 + Math.random() * 2;
}

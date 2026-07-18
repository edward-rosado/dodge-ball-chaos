import { drawKamisLookout } from "./kamis-lookout";
import { drawDesertWasteland } from "./desert-wasteland";
import { drawKingKaiPlanet } from "./king-kai-planet";
import { drawTimeChamber } from "./time-chamber";
import { drawFriezaShip } from "./frieza-ship";

export type BackgroundDrawFn = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
) => void;

/** All backgrounds indexed by ID for stable round-based lookup. */
const BACKGROUNDS: BackgroundDrawFn[] = [
  drawKamisLookout,     // 0 — Kami's Lookout (Band 1: Levels 1-9)
  drawDesertWasteland,  // 1 — Desert Wasteland (Band 2: Levels 10-19)
  drawKingKaiPlanet,    // 2 — King Kai's Planet (Band 3: Levels 20-29)
  drawTimeChamber,      // 3 — Hyperbolic Time Chamber (Band 4: Levels 30-39)
  drawFriezaShip,       // 4 — Frieza's Spaceship (Band 5: Levels 40-49 / Boss)
];

/**
 * Select a background ID for the given round. Called once per round in initRound.
 * Returns a STABLE numeric ID so it can be stored in GameState.
 *
 * Backgrounds are FIXED per milestone band (no randomness):
 *   Levels 1-9   → 0: Kami's Lookout (Dragon Valley / Sacred Land of Korin)
 *   Levels 10-19 → 1: Desert Wasteland (King Piccolo's domain, orange dunes)
 *   Levels 20-29 → 2: King Kai's Planet (red dust surface, giant planet sky)
 *   Levels 30-39 → 3: Hyperbolic Time Chamber (endless green void with pillars)
 *   Levels 40-50 → 4: Frieza's Spaceship (metallic corridor, red energy cores)
 */
export function getBackgroundIdForRound(round: number): number {
  if (round >= 40) return 4;       // Frieza's Ship — final area / boss
  if (round >= 30) return 3;       // Hyperbolic Time Chamber
  if (round >= 20) return 2;       // King Kai's Planet
  if (round >= 10) return 1;       // Desert Wasteland
  return 0;                        // Kami's Lookout — starting area
}

/** Get the draw function for a given background ID. */
export function getBackgroundDrawFn(id: number): BackgroundDrawFn {
  return BACKGROUNDS[id] ?? BACKGROUNDS[0];
}

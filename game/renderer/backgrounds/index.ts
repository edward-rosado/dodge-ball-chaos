import { KAMIS_LOOKOUT_CONFIG } from "./kamis-lookout";
import { DESERT_WASTELAND_CONFIG } from "./desert-wasteland";
import { KING_KAI_PLANET_CONFIG } from "./king-kai-planet";
import { TIME_CHAMBER_CONFIG } from "./time-chamber";
import { FRIEZA_SHIP_CONFIG } from "./frieza-ship";
import { MEGA_MAN_STYLE_CONFIG } from "./mega_man_style";
import { GRAVITY_ROOM_CONFIG } from "./gravity-room";
import { TOURNAMENT_CONFIG } from "./tournament";

/** Factory functions returning a BackgroundConfig for a given height. */
export type BackgroundConfigFactory = (h: number) => any;

/** All backgrounds indexed by ID for stable round-based lookup. */
const BACKGROUND_FACTORIES: BackgroundConfigFactory[] = [
  KAMIS_LOOKOUT_CONFIG,     // 0 — Kami's Lookout (Band 1: Levels 1-9)
  DESERT_WASTELAND_CONFIG,  // 1 — Desert Wasteland (Band 2: Levels 10-19)
  KING_KAI_PLANET_CONFIG,   // 2 — King Kai's Planet (Band 3: Levels 20-29)
  TIME_CHAMBER_CONFIG,       // 3 — Hyperbolic Time Chamber (Band 4: Levels 30-39)
  FRIEZA_SHIP_CONFIG,        // 4 — Frieza's Spaceship (Band 5: Levels 40-49 / Boss)
  MEGA_MAN_STYLE_CONFIG,    // 5 — Mega Man 2 Style (Cyber City / 8-bit)
  GRAVITY_ROOM_CONFIG,       // 6 — Gravity Room
  TOURNAMENT_CONFIG,         // 7 — Tournament
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
 *   Levels 50+  → 5: Mega Man 2 Style (Cyber City / 8-bit)
 *   Levels 50+  → 6: Gravity Room
 *   Levels 50+  → 7: Tournament
 */
export function getBackgroundIdForRound(round: number): number {
  if (round >= 50) return 6;
  if (round >= 40) return 4;
  if (round >= 30) return 3;
  if (round >= 20) return 2;
  if (round >= 10) return 1;
  return 0;
}

/** Get the factory for a given background ID. */
export function getBackgroundConfigFactory(id: number): BackgroundConfigFactory {
  return BACKGROUND_FACTORIES[id] ?? BACKGROUND_FACTORIES[0];
}

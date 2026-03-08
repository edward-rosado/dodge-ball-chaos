import { drawKamisLookout } from "./kamis-lookout";
import { drawNamek } from "./namek";
import { drawTimeChamber } from "./time-chamber";
import { drawGravityRoom } from "./gravity-room";
import { drawTournament } from "./tournament";
import { drawFriezaShip } from "./frieza-ship";

export type BackgroundDrawFn = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
) => void;

/** All backgrounds indexed by ID for stable round-based lookup. */
const BACKGROUNDS: BackgroundDrawFn[] = [
  drawKamisLookout, // 0
  drawNamek,        // 1
  drawTimeChamber,  // 2
  drawGravityRoom,  // 3
  drawTournament,   // 4
  drawFriezaShip,   // 5
];

/** Pick a random element from an array. */
function pickRandomIndex(ids: number[]): number {
  return ids[Math.floor(Math.random() * ids.length)];
}

/**
 * Select a background ID for the given round. Called once per round in initRound.
 * Returns a stable numeric ID so it can be stored in GameState.
 */
export function getBackgroundIdForRound(round: number): number {
  if (round === 50) return 5; // Frieza's Ship
  if (round <= 9) return pickRandomIndex([0, 1]); // Kami's Lookout, Namek
  if (round <= 19) return pickRandomIndex([1, 3, 4]); // Namek, Gravity Room, Tournament
  if (round <= 29) return pickRandomIndex([0, 2]); // Kami's Lookout, Time Chamber
  if (round <= 39) return pickRandomIndex([3, 4]); // Gravity Room, Tournament
  // L40-49: any except Frieza's Ship
  return pickRandomIndex([0, 1, 2, 3, 4]);
}

/** Get the draw function for a given background ID. */
export function getBackgroundDrawFn(id: number): BackgroundDrawFn {
  return BACKGROUNDS[id] ?? BACKGROUNDS[0];
}

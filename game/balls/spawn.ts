import { BallType } from "./types";

/** Get available ball types for pipe spawns — dodgeballs are NEVER spawned from pipes,
 *  they only come from the player's throw. */
export function getAvailableTypes(round: number): BallType[] {
  // L1-5: mild variants only
  if (round <= 5) return [BallType.Zigzag, BallType.Ghost];

  // L6-10: zigzag focus
  if (round <= 10) return [BallType.Zigzag, BallType.Zigzag, BallType.Ghost];

  // L11-20: add tracking and ghost
  if (round <= 20) return [BallType.Zigzag, BallType.Tracker, BallType.Ghost];

  // L21-30: add ricochet and speed demon
  if (round <= 30) return [BallType.Zigzag, BallType.Tracker, BallType.Ghost, BallType.Ricochet, BallType.SpeedDemon];

  // L31-40: add splitter and mirage
  if (round <= 40) return [BallType.Zigzag, BallType.Tracker, BallType.Ghost, BallType.Ricochet, BallType.SpeedDemon, BallType.Splitter, BallType.Mirage];

  // L41+: everything including giant, bomber, gravity well
  return [
    BallType.Zigzag, BallType.Tracker, BallType.Ghost,
    BallType.Ricochet, BallType.SpeedDemon, BallType.Splitter, BallType.Mirage,
    BallType.Giant, BallType.Bomber, BallType.GravityWell,
  ];
}

/** Get number of dodgeballs for a given round (milestone scaling). */
export function getDodgeballCount(round: number): number {
  if (round >= 40) return 5;
  if (round >= 30) return 4;
  if (round >= 20) return 3;
  if (round >= 10) return 2;
  return 1;
}

/** Get throw angles for N dodgeballs (spread pattern). */
export function getThrowAngles(count: number): number[] {
  const UP = -Math.PI / 2;
  switch (count) {
    case 1: return [UP];
    case 2: return [UP - Math.PI / 6, UP + Math.PI / 6];
    case 3: return [UP - Math.PI / 6, UP, UP + Math.PI / 6];
    case 4: return [UP - 5 * Math.PI / 18, UP - Math.PI / 9, UP + Math.PI / 9, UP + 5 * Math.PI / 18];
    case 5: return [UP - 2 * Math.PI / 9, UP - Math.PI / 9, UP, UP + Math.PI / 9, UP + 2 * Math.PI / 9];
    default: return [UP];
  }
}

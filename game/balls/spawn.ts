import { BallType } from "./types";

/** All non-Dodgeball ball types that pipes can spawn. */
const ALL_PIPE_TYPES: BallType[] = [
  BallType.Zigzag,
  BallType.Tracker,
  BallType.Ghost,
  BallType.Ricochet,
  BallType.SpeedDemon,
  BallType.Splitter,
  BallType.Mirage,
  BallType.Giant,
  BallType.Bomber,
  BallType.GravityWell,
];

/** Get available ball types for pipe spawns — dodgeballs are NEVER spawned from pipes,
 *  they only come from the player's throw.
 *
 * Design: Every ball type is guaranteed to appear at least once during levels 1-50.
 * A "guaranteed rotation" ensures each type appears in its own dedicated level band,
 * with all 10 types available from level 41 onwards.
 */
export function getAvailableTypes(round: number): BallType[] {
  // L1-5: mild variants only — Zigzag (wavy) and Ghost (phasing)
  if (round <= 5) return [BallType.Zigzag, BallType.Ghost];

  // L6-10: introduce Tracker (curves toward player)
  if (round <= 10) return [BallType.Zigzag, BallType.Tracker, BallType.Ghost];

  // L11-15: introduce Ricochet (wild bounce angles)
  if (round <= 15) return [BallType.Zigzag, BallType.Tracker, BallType.Ghost, BallType.Ricochet];

  // L16-20: introduce SpeedDemon (accelerates on bounces)
  if (round <= 20) return [BallType.Zigzag, BallType.Tracker, BallType.Ghost, BallType.Ricochet, BallType.SpeedDemon];

  // L21-25: introduce Splitter (splits into 3)
  if (round <= 25) return [BallType.Zigzag, BallType.Tracker, BallType.Ghost, BallType.Ricochet, BallType.SpeedDemon, BallType.Splitter];

  // L26-30: introduce Mirage (spawns fake balls)
  if (round <= 30) return [BallType.Zigzag, BallType.Tracker, BallType.Ghost, BallType.Ricochet, BallType.SpeedDemon, BallType.Splitter, BallType.Mirage];

  // L31-35: introduce Giant (3x radius, slower)
  if (round <= 35) return [BallType.Zigzag, BallType.Tracker, BallType.Ghost, BallType.Ricochet, BallType.SpeedDemon, BallType.Splitter, BallType.Mirage, BallType.Giant];

  // L36-40: introduce Bomber (explodes on 3rd bounce)
  if (round <= 40) return [BallType.Zigzag, BallType.Tracker, BallType.Ghost, BallType.Ricochet, BallType.SpeedDemon, BallType.Splitter, BallType.Mirage, BallType.Giant, BallType.Bomber];

  // L41-49: all 10 types available (including GravityWell)
  if (round <= 49) return ALL_PIPE_TYPES;

  // L50 (final boss): all 10 types, guaranteed — each type appears at least once in the pool
  // This ensures the player sees every ball type during the final boss fight
  return ALL_PIPE_TYPES;
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

/** Get the guaranteed launch queue for level 50 (boss fight).
 *  Ensures all 10 pipe-ball types appear at least once in the queue,
 *  with extras to fill the remaining slots.
 */
export function getLevel50LaunchQueue(maxBalls: number): BallType[] {
  const queue: BallType[] = [...ALL_PIPE_TYPES]; // One of each type (10)
  // Fill remaining slots with random picks from all types
  while (queue.length < maxBalls) {
    queue.push(ALL_PIPE_TYPES[Math.floor(Math.random() * ALL_PIPE_TYPES.length)]);
  }
  return queue;
}

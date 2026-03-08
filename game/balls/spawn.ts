import { BallType } from "./types";

/** Get available ball types for a given round. */
export function getAvailableTypes(round: number): BallType[] {
  const types: BallType[] = [BallType.Tracker, BallType.Zigzag, BallType.Giant];

  if (round >= 4) {
    types.push(BallType.Splitter, BallType.Ghost, BallType.Ricochet);
  }
  if (round >= 7) {
    types.push(BallType.SpeedDemon, BallType.Mirage);
  }
  if (round >= 10) {
    types.push(BallType.Bomber, BallType.GravityWell);
  }

  return types;
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

import { Ball, Pipe } from "../types";
import { BallType } from "./types";
import { BALL_R } from "../constants";

/** Inward offset so balls spawn inside the arena, not on the boundary. */
const PIPE_SPAWN_OFFSET = 22;

/** Create a special ball fired from a pipe. */
export function createBall(type: BallType, pipe: Pipe, speed: number): Ball {
  // pipe.angle already points inward — use directly with slight spread
  const spread = (Math.random() - 0.5) * 0.4;
  const angle = pipe.angle + spread;

  let spd = speed;
  let radius = BALL_R;

  if (type === BallType.Giant) {
    radius = BALL_R * 3;
    spd *= 0.6;
  }

  // Offset spawn position inward along pipe angle so ball starts inside arena
  const spawnX = pipe.x + Math.cos(pipe.angle) * PIPE_SPAWN_OFFSET;
  const spawnY = pipe.y + Math.sin(pipe.angle) * PIPE_SPAWN_OFFSET;

  return {
    x: spawnX,
    y: spawnY,
    vx: Math.cos(angle) * spd,
    vy: Math.sin(angle) * spd,
    bounceCount: 0,
    type,
    age: 0,
    phaseTimer: 0,
    isReal: true,
    radius,
    dead: false,
    pipeImmunity: 0,
  };
}

/** Create a dodgeball at a position with a given angle and speed. */
export function createDodgeball(
  x: number,
  y: number,
  angle: number,
  speed: number
): Ball {
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    bounceCount: 0,
    type: BallType.Dodgeball,
    age: 0,
    phaseTimer: 0,
    isReal: true,
    radius: BALL_R,
    dead: false,
    pipeImmunity: 0,
  };
}

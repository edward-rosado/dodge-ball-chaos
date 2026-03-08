import { Ball, Pipe } from "../types";
import { BallType } from "./types";
import { BALL_R } from "../constants";

/** Create a special ball fired from a pipe. */
export function createBall(type: BallType, pipe: Pipe, speed: number): Ball {
  const inwardAngle = pipe.angle + Math.PI;
  const spread = (Math.random() - 0.5) * 0.4;
  const angle = inwardAngle + spread;

  let spd = speed;
  let radius = BALL_R;

  if (type === BallType.Giant) {
    radius = BALL_R * 3;
    spd *= 0.6;
  }

  return {
    x: pipe.x,
    y: pipe.y,
    vx: Math.cos(angle) * spd,
    vy: Math.sin(angle) * spd,
    bounceCount: 0,
    type,
    age: 0,
    phaseTimer: 0,
    isReal: true,
    radius,
    dead: false,
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
  };
}

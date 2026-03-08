import { BallType } from "./balls/types";

// ─── Core Types ───

export interface Point {
  x: number;
  y: number;
}

export interface Ball extends Point {
  vx: number;
  vy: number;
  bounceCount: number;
  type: BallType;
  age: number;
  phaseTimer: number;
  isReal: boolean;
  radius: number;
  dead: boolean;
}

export interface Pipe extends Point {
  angle: number;
}

export interface PowerUp extends Point {
  type: "slow" | "shield";
  collected: boolean;
}

// ─── Game States ───

export const ST = {
  TITLE: 0,
  READY: 1,
  THROW: 2,
  DODGE: 3,
  HIT: 4,
  CLEAR: 5,
  OVER: 6,
} as const;

export type GameStateType = (typeof ST)[keyof typeof ST];

// ─── Game State ───

export interface GameState {
  state: GameStateType;
  // Player
  px: number;
  py: number;
  pvx: number;
  pvy: number;
  // Balls
  thrown: Ball | null;
  balls: Ball[];
  // Progression
  round: number;
  lives: number;
  score: number;
  timer: number;
  // Arena
  pipes: Pipe[];
  activePipe: number;
  // Power-ups
  powerUp: PowerUp | null;
  slow: boolean;
  slowTimer: number;
  shield: boolean;
  shieldTimer: number;
  // Effects
  flash: number;
  msgTimer: number;
  msg: string;
  // Meta
  highScore: number;
  t: number;
  // Input
  swS: Point | null;
  swE: Point | null;
  // Ball launching
  launched: number;
  launchDelay: number;
  launchQueue: number;
  // Keyboard input
  keys: Record<string, boolean>;
}

/** Callback that sets player velocity on the game state each frame. */
export type MoveProvider = (g: GameState) => void;

import { BallType } from "./balls/types";
import { PowerUpType } from "./powerups/types";

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
  /** Seconds of immunity from pipe suck-in after emerging */
  pipeImmunity: number;
  /** Saved velocity for Solar Flare freeze */
  savedVx?: number;
  /** Saved velocity for Solar Flare freeze */
  savedVy?: number;
}

export interface Pipe extends Point {
  angle: number;
}

export interface PowerUp extends Point {
  type: PowerUpType;
  collected: boolean;
  /** Game time when spawned (for lifetime expiry) */
  spawnTime: number;
}

export interface PipeQueueEntry {
  ball: Ball;
  pipeIndex: number;    // Destination pipe
  delay: number;        // Seconds remaining before emergence
  totalDelay: number;   // Original delay (for animation progress)
}

/** Visual animation for a ball being sucked into a pipe (Mario warp pipe effect). */
export interface PipeSuckAnim {
  x: number;            // Pipe center x
  y: number;            // Pipe center y
  timer: number;        // Remaining animation time
  duration: number;     // Total duration
  radius: number;       // Ball radius at start
  color: string;        // Ball color
}

/** Visual animation for a ball emerging from a pipe. */
export interface PipeEmergeAnim {
  x: number;
  y: number;
  timer: number;
  duration: number;
  radius: number;
  color: string;
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
  VICTORY: 7,
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
  thrown: Ball[];
  balls: Ball[];
  // Progression
  round: number;
  lives: number;
  score: number;
  timer: number;
  // Arena
  pipes: Pipe[];
  activePipe: number;
  // Power-ups (expanded)
  powerUps: PowerUp[];
  powerUpSpawnTimer: number;
  // Legacy fields kept for backward compatibility
  slow: boolean;
  slowTimer: number;
  shield: boolean;
  shieldTimer: number;
  // Kaioken
  kaioken: boolean;
  kaiokenTimer: number;
  // Solar Flare
  solarFlare: boolean;
  solarFlareTimer: number;
  // Afterimage
  afterimageDecoy: Point | null;
  afterimageTimer: number;
  afterimageUses: number;
  // Shrink
  shrink: boolean;
  shrinkTimer: number;
  // Spirit Bomb
  spiritBombCharging: boolean;
  spiritBombTimer: number;
  spiritBombX: number;
  spiritBombY: number;
  // Instant Transmission
  instantTransmissionUses: number;
  itFlashTimer: number;
  itDepartX: number;
  itDepartY: number;
  // Effects
  flash: number;
  /** Death explosion animation timer (counts down from ~1s). */
  deathAnimTimer: number;
  /** Position where death occurred. */
  deathX: number;
  deathY: number;
  msgTimer: number;
  msg: string;
  // Meta
  highScore: number;
  t: number;
  // Background
  backgroundId: number;
  // Last collected power-up type (for SFX trigger, cleared after playing)
  lastPowerUp: string;
  // Input
  swS: Point | null;
  swE: Point | null;
  // Ball launching
  launched: number;
  launchDelay: number;
  launchQueue: number;
  // Pipe queue (balls held inside pipes before re-emerging)
  pipeQueue: PipeQueueEntry[];
  chargingPipes: number[];
  // Pipe suck-in visual animations
  pipeSuckAnims: PipeSuckAnim[];
  // Pipe emergence visual animations
  pipeEmergeAnims: PipeEmergeAnim[];
  // Keyboard input
  keys: Record<string, boolean>;
}

/** Callback that sets player velocity on the game state each frame. */
export type MoveProvider = (g: GameState) => void;

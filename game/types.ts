import { BallType } from "./balls/types";
import { PowerUpType } from "./powerups/types";

export { BallType, PowerUpType };

/** Function that updates player movement for a frame. */
export interface MoveProvider {
  (g: GameState): void;
}

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
  /** Marked true for Splitter children to prevent re-splitting */
  isChild?: boolean;
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

// ─── Sub-State Interfaces ───

/** Player position and velocity. */
export interface PlayerState {
  px: number;
  py: number;
  pvx: number;
  pvy: number;
}

/** All power-up / transformation flags and timers. */
export interface EffectsState {
  // Timed effects
  slow: boolean;
  slowTimer: number;
  kaioken: boolean;
  kaiokenTimer: number;
  solarFlare: boolean;
  solarFlareTimer: number;
  shrink: boolean;
  shrinkTimer: number;
  // Permanent / single-hit effects
  shield: boolean;
  shieldTimer: number;
  // Spirit Bomb
  spiritBombReady: boolean;
  spiritBombCharging: boolean;
  spiritBombTimer: number;
  spiritBombX: number;
  spiritBombY: number;
  // Instant Transmission
  instantTransmissionUses: number;
  itFlashTimer: number;
  itDepartX: number;
  itDepartY: number;
  // Afterimage
  afterimageDecoy: Point | null;
  afterimageTimer: number;
  afterimageUses: number;
  // Activation flash — brief visual feedback when a power-up is activated (not just collected)
  activationFlash: number;
  // Activation message text
  activationMsg: string;
  // Skip-ahead index — when >0, next activation skips this many items in queue
  skipAhead: number;
}

/** Pipe queue and associated animations. */
export interface PipeSystemState {
  pipeQueue: PipeQueueEntry[];
  chargingPipes: number[];
  pipeSuckAnims: PipeSuckAnim[];
  pipeEmergeAnims: PipeEmergeAnim[];
}

/** Input state: swipe tracking and keyboard state. */
export interface InputState {
  swS: Point | null;
  swE: Point | null;
  keys: Record<string, boolean>;
}

/** Game metadata: rendering helpers, messages, high score. */
export interface MetaState {
  flash: number;
  /** Death explosion animation timer (counts down from ~1s). */
  deathAnimTimer: number;
  /** Position where death occurred. */
  deathX: number;
  deathY: number;
  msgTimer: number;
  msg: string;
  highScore: number;
  t: number;
  backgroundId: number;
  /** Last collected power-up type (for SFX trigger, cleared after playing). */
  lastPowerUp: string;
  /** Whether the help/controls overlay is visible (toggled with H key). */
  helpVisible: boolean;
  /** Active destruction/explosion effects (Destructo Disc, etc.). */
  explosions: { x: number; y: number; color: string; timer: number }[];
}

/** Ball launch progress for the current round. */
export interface LaunchState {
  launched: number;
  launchDelay: number;
  launchQueue: number;
}

// ─── Game State ───

export interface GameState {
  // Core
  state: GameStateType;
  // Sub-states (extracted for readability)
  player: PlayerState;
  effects: EffectsState;
  pipeSystem: PipeSystemState;
  input: InputState;
  meta: MetaState;
  launch: LaunchState;
  // Collections
  thrown: Ball[];
  balls: Ball[];
  pipes: Pipe[];
  powerUps: PowerUp[];
  // Progression
  round: number;
  lives: number;
  score: number;
  timer: number;
  // System
  activePipe: number;
  powerUpSpawnTimer: number;
  /** Queue of usable power-ups in pickup order ("it" | "afterimage"). Spacebar uses first. */
  activePowerUpQueue: string[];
}

/** Callback that sets player velocity on the game state each frame. */
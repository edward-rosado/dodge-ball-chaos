// ─── Canvas ───
export const CW = 400;
export const CH = 680;

// ─── Arena (rounded rectangle, full-screen) ───
export const PIPE_COUNT = 16;
export const PIPE_HALF = 7; // Half of 14px pipe size
export const ARENA_CORNER_R = 24; // Corner rounding radius
export const ARENA_LEFT = PIPE_HALF;
export const ARENA_RIGHT = CW - PIPE_HALF;
export const ARENA_TOP = 66; // Below HUD (timer bar ends at y≈60)
export const ARENA_BOTTOM = CH - PIPE_HALF;
export const ARENA_CX = CW / 2;
export const ARENA_CY = (ARENA_TOP + ARENA_BOTTOM) / 2;
// Legacy — kept for compatibility, equals half the arena width
export const ARENA_RADIUS = (ARENA_RIGHT - ARENA_LEFT) / 2;

// ─── Gameplay ───
export const BALL_R = 7;
export const BASE_ROUND_TIME = 12;
export const PLAYER_SPEED = 4.2;
export const BASE_BALL_SPEED = 2.0;
export const HIT_DIST = 18;
export const PLAYER_HITBOX = 12;
export const THROW_SPEED = 7;
export const SWIPE_MIN = 12;
export const PIPE_RADIUS = 14; // Collision radius for pipe suck-in detection
export const BOUNCE_SPEED_BOOST = 1.003; // +0.3% speed per wall/pipe bounce

// ─── Per-band difficulty scaling ───
export interface BandDifficulty {
  readonly speedPerRound: number;  // Ball speed increase per round within this band
  readonly maxBalls: number;       // Max pipe balls per round
  readonly launchDelayMin: number; // Minimum launch delay between balls
  readonly roundTimerMin: number;  // Minimum round timer duration
  readonly timerDecay: number;     // Timer decrease per round
}

/** Difficulty parameters indexed by band. Looked up via getDifficulty(round). */
const BANDS: { maxRound: number; diff: BandDifficulty }[] = [
  { maxRound: 10,  diff: { speedPerRound: 0.03,  maxBalls: 2,  launchDelayMin: 0.8,  roundTimerMin: 9,  timerDecay: 0.04 } },
  { maxRound: 20,  diff: { speedPerRound: 0.035, maxBalls: 3,  launchDelayMin: 0.7,  roundTimerMin: 8,  timerDecay: 0.05 } },
  { maxRound: 30,  diff: { speedPerRound: 0.04,  maxBalls: 3,  launchDelayMin: 0.65, roundTimerMin: 7,  timerDecay: 0.05 } },
  { maxRound: 40,  diff: { speedPerRound: 0.04,  maxBalls: 4,  launchDelayMin: 0.6,  roundTimerMin: 6,  timerDecay: 0.04 } },
  { maxRound: 49,  diff: { speedPerRound: 0.035, maxBalls: 4,  launchDelayMin: 0.55, roundTimerMin: 6,  timerDecay: 0.03 } },
  { maxRound: 999, diff: { speedPerRound: 0.03,  maxBalls: 5,  launchDelayMin: 0.5,  roundTimerMin: 5,  timerDecay: 0.03 } },
];

/** Get difficulty parameters for a given round number. */
export function getDifficulty(round: number): BandDifficulty {
  for (const b of BANDS) {
    if (round <= b.maxRound) return b.diff;
  }
  return BANDS[BANDS.length - 1].diff;
}

// ─── Colors ───
export const C = {
  bg: "#08080f",
  gridL: "#1a1a35",
  player: "#ff6b1a",
  hair: "#111",
  skin: "#ffb07c",
  belt: "#3a86ff",
  ball: "#e63946",
  ballHi: "#ff8a94",
  pipe: "#2ec4b6",
  pipeGlow: "#0ff",
  hud: "#d8d8ff",
  hudDim: "#555580",
  life: "#e63946",
  lifeDead: "#222238",
  powerSlow: "#3a86ff",
  powerShield: "#ffd60a",
  title: "#ff6b1a",
  round: "#2ec4b6",
  gameOver: "#e63946",
  swipe: "rgba(255,107,26,0.35)",
  white: "#fff",
  arenaEdge: "rgba(46,196,182,0.12)",
} as const;

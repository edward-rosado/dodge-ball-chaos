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
export const BASE_ROUND_TIME = 10;
export const PLAYER_SPEED = 3.8;
export const BASE_BALL_SPEED = 3.2;
export const HIT_DIST = 18;
export const PLAYER_HITBOX = 14;
export const THROW_SPEED = 7;
export const SWIPE_MIN = 12;
export const PIPE_RADIUS = 14; // Collision radius for pipe suck-in detection
export const BOUNCE_SPEED_BOOST = 1.06; // +6% speed per wall/pipe bounce

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

import { GameState, Ball, Pipe, PowerUp, PipeQueueEntry, GameStateType, ST } from "./types";
import { CW, CH, PIPE_COUNT, BASE_ROUND_TIME, ARENA_CX, ARENA_CY } from "./constants";
import { createPipes } from "./arena";
import { randomSpawnTimer } from "./powerups/factory";
import { getBackgroundIdForRound } from "./renderer/backgrounds";
import { getLevelConfig } from "./progression";

// ─── Save Format Version ───
const SAVE_VERSION = 1;
const SAVE_KEY = "dodge-ball-chaos-save";

// ─── Serializable Save Data ───

/** Minimal metadata for save listing without full state. */
export interface SaveInfo {
  round: number;
  lives: number;
  score: number;
  state: GameStateType;
  timestamp: number;
}

/** Full serializable save data (strips transient data). */
export interface SaveData {
  version: number;
  timestamp: number;
  state: GameStateType;
  round: number;
  lives: number;
  score: number;
  timer: number;
  player: { px: number; py: number; pvx: number; pvy: number };
  effects: {
    slow: boolean; slowTimer: number;
    kaioken: boolean; kaiokenTimer: number;
    solarFlare: boolean; solarFlareTimer: number;
    shrink: boolean; shrinkTimer: number;
    shield: boolean; shieldTimer: number;
    spiritBombReady: boolean; spiritBombCharging: boolean;
    spiritBombTimer: number; spiritBombX: number; spiritBombY: number;
    instantTransmissionUses: number;
    itFlashTimer: number; itDepartX: number; itDepartY: number;
    afterimageDecoy: { x: number; y: number } | null;
    afterimageTimer: number; afterimageUses: number;
  };
  meta: {
    highScore: number;
    t: number;
    backgroundId: number;
  };
  launch: { launched: number; launchDelay: number; launchQueue: number };
  balls: Ball[];
  thrown: Ball[];
  pipes: Pipe[];
  powerUps: PowerUp[];
  activePipe: number;
  powerUpSpawnTimer: number;
  activePowerUpQueue: string[];
  pipeQueue: PipeQueueEntry[];
  chargingPipes: number[];
}

// ─── Serialization ───

/** Convert a GameState to serializable save data (strips transient data). */
export function serialize(g: GameState): SaveData {
  return {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    state: g.state,
    round: g.round,
    lives: g.lives,
    score: g.score,
    timer: g.timer,
    player: { px: g.player.px, py: g.player.py, pvx: g.player.pvx, pvy: g.player.pvy },
    effects: {
      slow: g.effects.slow, slowTimer: g.effects.slowTimer,
      kaioken: g.effects.kaioken, kaiokenTimer: g.effects.kaiokenTimer,
      solarFlare: g.effects.solarFlare, solarFlareTimer: g.effects.solarFlareTimer,
      shrink: g.effects.shrink, shrinkTimer: g.effects.shrinkTimer,
      shield: g.effects.shield, shieldTimer: g.effects.shieldTimer,
      spiritBombReady: g.effects.spiritBombReady, spiritBombCharging: g.effects.spiritBombCharging,
      spiritBombTimer: g.effects.spiritBombTimer,
      spiritBombX: g.effects.spiritBombX, spiritBombY: g.effects.spiritBombY,
      instantTransmissionUses: g.effects.instantTransmissionUses,
      itFlashTimer: g.effects.itFlashTimer,
      itDepartX: g.effects.itDepartX, itDepartY: g.effects.itDepartY,
      afterimageDecoy: g.effects.afterimageDecoy
        ? { x: g.effects.afterimageDecoy.x, y: g.effects.afterimageDecoy.y }
        : null,
      afterimageTimer: g.effects.afterimageTimer,
      afterimageUses: g.effects.afterimageUses,
    },
    meta: {
      highScore: g.meta.highScore,
      t: g.meta.t,
      backgroundId: g.meta.backgroundId,
    },
    launch: { launched: g.launch.launched, launchDelay: g.launch.launchDelay, launchQueue: g.launch.launchQueue },
    balls: g.balls,
    thrown: g.thrown,
    pipes: g.pipes,
    powerUps: g.powerUps,
    activePipe: g.activePipe,
    powerUpSpawnTimer: g.powerUpSpawnTimer,
    activePowerUpQueue: g.activePowerUpQueue,
    pipeQueue: g.pipeSystem.pipeQueue,
    chargingPipes: g.pipeSystem.chargingPipes,
  };
}

/** Restore a SaveData back to a full GameState. */
export function deserialize(data: SaveData): GameState {
  // Recreate the default game state structure
  const g = makeGame();

  // Overwrite with save data
  g.state = data.state;
  g.round = data.round;
  g.lives = data.lives;
  g.score = data.score;
  g.timer = data.timer;
  g.player.px = data.player.px;
  g.player.py = data.player.py;
  g.player.pvx = data.player.pvx;
  g.player.pvy = data.player.pvy;
  g.effects = {
    slow: data.effects.slow, slowTimer: data.effects.slowTimer,
    kaioken: data.effects.kaioken, kaiokenTimer: data.effects.kaiokenTimer,
    solarFlare: data.effects.solarFlare, solarFlareTimer: data.effects.solarFlareTimer,
    shrink: data.effects.shrink, shrinkTimer: data.effects.shrinkTimer,
    shield: data.effects.shield, shieldTimer: data.effects.shieldTimer,
    spiritBombReady: data.effects.spiritBombReady,
    spiritBombCharging: data.effects.spiritBombCharging,
    spiritBombTimer: data.effects.spiritBombTimer,
    spiritBombX: data.effects.spiritBombX, spiritBombY: data.effects.spiritBombY,
    instantTransmissionUses: data.effects.instantTransmissionUses,
    itFlashTimer: data.effects.itFlashTimer,
    itDepartX: data.effects.itDepartX, itDepartY: data.effects.itDepartY,
    afterimageDecoy: data.effects.afterimageDecoy
      ? { x: data.effects.afterimageDecoy.x, y: data.effects.afterimageDecoy.y }
      : null,
    afterimageTimer: data.effects.afterimageTimer,
    afterimageUses: data.effects.afterimageUses,
  };
  g.meta = {
    flash: 0, deathAnimTimer: 0, deathX: 0, deathY: 0,
    msgTimer: 0, msg: "",
    highScore: data.meta.highScore,
    t: data.meta.t,
    backgroundId: data.meta.backgroundId,
    lastPowerUp: "",
  };
  g.launch = {
    launched: data.launch.launched,
    launchDelay: data.launch.launchDelay,
    launchQueue: data.launch.launchQueue,
  };
  g.balls = data.balls;
  g.thrown = data.thrown;
  g.pipes = data.pipes;
  g.powerUps = data.powerUps;
  g.activePipe = data.activePipe;
  g.powerUpSpawnTimer = data.powerUpSpawnTimer;
  g.activePowerUpQueue = data.activePowerUpQueue;
  g.pipeSystem = {
    pipeQueue: data.pipeQueue,
    chargingPipes: data.chargingPipes,
    pipeSuckAnims: [],
    pipeEmergeAnims: [],
  };
  g.input = { swS: null, swE: null, keys: {} };

  return g;
}

// ─── Save Info ───

/** Extract metadata from save data for listing without full state. */
export function saveInfo(data: SaveData): SaveInfo {
  return {
    round: data.round,
    lives: data.lives,
    score: data.score,
    state: data.state,
    timestamp: data.timestamp,
  };
}

// ─── Persistence ───

/** Check if a save exists in localStorage. */
export function hasSave(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}

/** Get save metadata without full state. */
export function getSaveInfo(): SaveInfo | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    return saveInfo(data);
  } catch {
    return null;
  }
}

/** Save current game state to localStorage. */
export function saveGame(g: GameState): void {
  try {
    const data = serialize(g);
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("[SaveManager] Failed to save:", e);
  }
}

/** Load saved game state, or null if no save exists. */
export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== SAVE_VERSION) {
      console.warn(`[SaveManager] Save version ${data.version} does not match current ${SAVE_VERSION}`);
      return null;
    }
    return deserialize(data);
  } catch (e) {
    console.warn("[SaveManager] Failed to load save:", e);
    return null;
  }
}

/** Delete the saved game. */
export function deleteSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    console.warn("[SaveManager] Failed to delete save:", e);
  }
}

// ─── Auto-Save Triggers ───

/**
 * Determine if a state transition warrants an auto-save.
 * Returns true for significant progress moments.
 */
export function shouldAutoSave(prevState: GameStateType, newState: GameStateType): boolean {
  // Save on: game over, victory, clear (round complete), or when losing a life
  return (
    newState === ST.OVER ||
    newState === ST.VICTORY ||
    newState === ST.CLEAR ||
    (prevState === ST.DODGE && newState === ST.HIT)
  );
}

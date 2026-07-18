import { GameState, Ball, Pipe, PowerUp, PipeQueueEntry, GameStateType, ST } from "./types";
import { CW, CH, PIPE_COUNT, BASE_ROUND_TIME, ARENA_CX, ARENA_CY } from "./constants";
import { makeGame } from "./state";
import { createPipes } from "./arena";
import { randomSpawnTimer } from "./powerups/factory";
import { getBackgroundIdForRound } from "./renderer/backgrounds";
import { getLevelConfig } from "./progression";

// ─── Save Format Version ───
const SAVE_VERSION = 2;
/** Max number of save slots available. */
export const MAX_SAVE_SLOTS = 5;
/** Slot key prefix — each slot stored as "dodge-ball-chaos-save-{index}". */
function slotKey(index: number): string {
  return `dodge-ball-chaos-save-${index}`;
}

// ─── Serializable Save Data ───

/** Rich metadata shown to the player for each save slot. */
export interface SaveInfo {
  /** Round reached (always a multiple of 10 at milestone saves). */
  round: number;
  /** Lives remaining when saved. */
  lives: number;
  /** Score accumulated up to this point. */
  score: number;
  /** Overall best high score ever achieved (persists across sessions). */
  highScore: number;
  /** Timestamp when the save was created. */
  timestamp: number;
  /** Human-readable label like "Round 10 – Cleared!" or "Round 20 – Game Over". */
  label: string;
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
    activationFlash: number; activationMsg: string; skipAhead: number;
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
      activationFlash: g.effects.activationFlash,
      activationMsg: g.effects.activationMsg,
      skipAhead: g.effects.skipAhead,
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
    activationFlash: data.effects.activationFlash ?? 0,
    activationMsg: data.effects.activationMsg ?? "",
    skipAhead: data.effects.skipAhead ?? 0,
  };
  g.meta = {
    flash: 0, deathAnimTimer: 0, deathX: 0, deathY: 0,
    msgTimer: 0, msg: "",
    highScore: data.meta.highScore,
    t: data.meta.t,
    backgroundId: data.meta.backgroundId,
    lastPowerUp: "",
    helpVisible: false,
    explosions: [],
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
/** Build a human-readable label for a save based on round and state. */
function makeSaveLabel(round: number, state: GameStateType): string {
  switch (state) {
    case ST.OVER:
      return `Round ${round} – Game Over`;
    case ST.VICTORY:
      return `Round ${round} – YOU WIN!`;
    case ST.CLEAR:
      return `Round ${round} – Cleared!`;
    default:
      return `Round ${round}`;
  }
}

export function saveInfo(data: SaveData): SaveInfo {
  return {
    round: data.round,
    lives: data.lives,
    score: data.score,
    highScore: data.meta?.highScore ?? 0,
    timestamp: data.timestamp,
    label: makeSaveLabel(data.round, data.state),
  };
}

// ─── Persistence ───

/** Check if a save exists in localStorage. */
/** Check if a specific slot has data. */
export function hasSlot(index: number): boolean {
  try {
    return localStorage.getItem(slotKey(index)) !== null;
  } catch {
    return false;
  }
}

/** Get metadata for a specific slot without loading full state. */
export function getSaveInfoForSlot(index: number): SaveInfo | null {
  try {
    const raw = localStorage.getItem(slotKey(index));
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== SAVE_VERSION) {
      console.warn(`[SaveManager] Slot ${index} version mismatch`);
      return null;
    }
    return saveInfo(data);
  } catch {
    return null;
  }
}

/** Get metadata for ALL available slots. */
export function getAllSaveInfos(): (SaveInfo | null)[] {
  const infos: (SaveInfo | null)[] = [];
  for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
    infos.push(getSaveInfoForSlot(i));
  }
  return infos;
}

/** Save current game state to a specific slot. */
export function saveGameToSlot(g: GameState, index: number): boolean {
  if (index < 0 || index >= MAX_SAVE_SLOTS) return false;
  try {
    const data = serialize(g);
    localStorage.setItem(slotKey(index), JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn(`[SaveManager] Failed to save slot ${index}:`, e);
    return false;
  }
}

/** Load saved game state from a specific slot, or null if unavailable. */
export function loadGameFromSlot(index: number): GameState | null {
  try {
    const raw = localStorage.getItem(slotKey(index));
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== SAVE_VERSION) {
      console.warn(`[SaveManager] Slot ${index} version mismatch`);
      return null;
    }
    return deserialize(data);
  } catch (e) {
    console.warn(`[SaveManager] Failed to load slot ${index}:`, e);
    return null;
  }
}

/** Delete a specific save slot. */
export function deleteSlot(index: number): void {
  try {
    localStorage.removeItem(slotKey(index));
  } catch (e) {
    console.warn(`[SaveManager] Failed to delete slot ${index}:`, e);
  }
}

/** Delete ALL save slots. */
export function deleteAllSaves(): void {
  for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
    try {
      localStorage.removeItem(slotKey(i));
    } catch {
      // ignore
    }
  }
}



// ─── Auto-Save Triggers ───

/**
 * Determine if a state transition warrants an auto-save.
 * Returns true for significant progress moments.
 */
/** Check if the given round is a milestone (every 10 levels). */
export function isMilestoneRound(round: number): boolean {
  return round > 0 && round % 10 === 0;
}

/** Determine if a state transition warrants an auto-save.
 * Only saves at milestone clears and victory — NOT on game over, hit, or normal transitions. */
export function shouldAutoSave(prevState: GameStateType, newState: GameStateType): boolean {
  return newState === ST.VICTORY;
}

/** Check if the current round just completed is a milestone that should auto-save. */
export function shouldAutoSaveAtRound(round: number, newState: GameStateType): boolean {
  return (newState === ST.CLEAR && isMilestoneRound(round)) || newState === ST.VICTORY;
}

/** Get the slot index for a given milestone round.
 * Round 10 → slot 0, Round 20 → slot 1, etc. */
export function milestoneSlotIndex(round: number): number {
  return Math.max(0, Math.min(MAX_SAVE_SLOTS - 1, (round / 10) - 1));
}

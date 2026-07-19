import { GameState, ST, PlayerState, EffectsState, PipeSystemState, InputState, MetaState, LaunchState } from "./types";
import { ARENA_CX, ARENA_CY, BASE_ROUND_TIME, getDifficulty } from "./constants";
import { createPipes } from "./arena";
import { randomSpawnTimer } from "./powerups/factory";
import { getBackgroundIdForRound } from "./renderer/backgrounds";
import { getLevelConfig } from "./progression";

/** Create default sub-state objects. */
function makePlayerState(): PlayerState {
  return { px: ARENA_CX, py: ARENA_CY, pvx: 0, pvy: 0 };
}

function makeEffectsState(): EffectsState {
  return {
    slow: false, slowTimer: 0,
    shield: false, shieldTimer: 0,
    kaioken: false, kaiokenTimer: 0,
    solarFlare: false, solarFlareTimer: 0,
    shrink: false, shrinkTimer: 0,
    spiritBombReady: false, spiritBombCharging: false,
    spiritBombTimer: 0, spiritBombX: 0, spiritBombY: 0,
    instantTransmissionUses: 0, itFlashTimer: 0, itDepartX: 0, itDepartY: 0,
    afterimageDecoy: null, afterimageTimer: 0, afterimageUses: 0,
    activationFlash: 0,
    activationMsg: "",
    skipAhead: 0,
    invincible: false,
    invincibilityTimer: 0,
  };
}

function makePipeSystemState(): PipeSystemState {
  return { pipeQueue: [], chargingPipes: [], pipeSuckAnims: [], pipeEmergeAnims: [] };
}

function makeInputState(): InputState {
  return { swS: null, swE: null, keys: {} };
}

function makeMetaState(): MetaState {
  return { flash: 0, deathAnimTimer: 0, deathX: 0, deathY: 0, msgTimer: 0, msg: "", highScore: 0, t: 0, backgroundId: 0, lastPowerUp: "", helpVisible: false, explosions: [] };
}

function makeLaunchState(): LaunchState {
  return { launched: 0, launchDelay: 0, launchQueue: 0 };
}

export function makeGame(): GameState {
  return {
    state: ST.TITLE,
    player: makePlayerState(),
    effects: makeEffectsState(),
    pipeSystem: makePipeSystemState(),
    input: makeInputState(),
    meta: makeMetaState(),
    launch: makeLaunchState(),
    thrown: [],
    balls: [],
    round: 1,
    lives: 3,
    score: 0,
    timer: BASE_ROUND_TIME,
    pipes: createPipes(),
    activePipe: -1,
    powerUps: [],
    powerUpSpawnTimer: randomSpawnTimer(),
    activePowerUpQueue: [],
  };
}

export function initRound(g: GameState): void {
  const ps = g.player;
  ps.px = ARENA_CX;
  ps.py = ARENA_CY;
  ps.pvx = 0;
  ps.pvy = 0;
  g.thrown = [];
  g.balls = [];
  const diff = getDifficulty(g.round);
  g.timer = Math.max(diff.roundTimerMin, BASE_ROUND_TIME - (g.round - 1) * diff.timerDecay);
  g.activePipe = -1;
  g.state = ST.READY;
  // Keep non-expired, uncollected power-ups (they persist across rounds with a 15s lifetime)
  g.powerUps = g.powerUps.filter(pu => !pu.collected && (g.meta.t - pu.spawnTime) < 15);
  const levelCfg = getLevelConfig(g.round);
  // Scale spawn timer inversely with powerUpChance (higher chance = shorter timer)
  g.powerUpSpawnTimer = randomSpawnTimer() * (1 - levelCfg.powerUpChance * 0.5);
  // Reset timed power-up effects but keep permanent ones (IT uses, lives from Senzu)
  const fx = g.effects;
  fx.slow = false; fx.slowTimer = 0;
  // Shield persists across rounds (it's single-hit, not timed)
  // Kaioken, Solar Flare, Afterimage, Shrink, Spirit Bomb reset
  fx.kaioken = false; fx.kaiokenTimer = 0;
  fx.solarFlare = false; fx.solarFlareTimer = 0;
  fx.afterimageDecoy = null; fx.afterimageTimer = 0;
  fx.shrink = false; fx.shrinkTimer = 0;
  fx.invincible = false; fx.invincibilityTimer = 0;
  fx.spiritBombCharging = false; fx.spiritBombTimer = 0;
  fx.spiritBombX = 0; fx.spiritBombY = 0;
  // Reset input
  g.input.swS = null; g.input.swE = null;
  // Reset launch
  g.launch.launchQueue = Math.min(diff.maxBalls, Math.max(0, g.round - 1));
  g.launch.launchDelay = 0;
  g.launch.launched = 0;
  // Reset pipe system
  g.pipeSystem.pipeQueue = [];
  g.pipeSystem.chargingPipes = [];
  g.pipeSystem.pipeSuckAnims = [];
  g.pipeSystem.pipeEmergeAnims = [];
  g.meta.backgroundId = getBackgroundIdForRound(g.round);
  g.meta.msg = "DODGE!";
  g.meta.msgTimer = 1.5;
}

/**
 * Restore game state after a HIT (player lost a life but round continues).
 * Timer persists — only resets on new round via initRound().
 * Power-ups on screen persist — only timed effects reset.
 */
export function restoreAfterHit(g: GameState): void {
  const ps = g.player;
  ps.px = ARENA_CX;
  ps.py = ARENA_CY;
  ps.pvx = 0;
  ps.pvy = 0;
  g.thrown = [];
  g.balls = [];
  g.activePipe = -1;
  g.state = ST.READY;
  // DO NOT reset g.timer — keep remaining time
  // DO NOT reset g.powerUps — keep them on screen
  // Reset timed power-up effects
  const fx = g.effects;
  fx.slow = false; fx.slowTimer = 0;
  fx.kaioken = false; fx.kaiokenTimer = 0;
  fx.solarFlare = false; fx.solarFlareTimer = 0;
  fx.afterimageDecoy = null; fx.afterimageTimer = 0;
  fx.shrink = false; fx.shrinkTimer = 0;
  fx.invincible = false; fx.invincibilityTimer = 0;
  fx.spiritBombCharging = false; fx.spiritBombTimer = 0;
  // Reset input
  g.input.swS = null; g.input.swE = null;
  // Recalculate launch queue for remaining portion of round
  const diff = getDifficulty(g.round);
  g.launch.launchQueue = Math.min(diff.maxBalls, Math.max(0, g.round - 1));
  g.launch.launchDelay = 0;
  g.launch.launched = 0;
  // Reset pipe system
  g.pipeSystem.pipeQueue = [];
  g.pipeSystem.chargingPipes = [];
  g.pipeSystem.pipeSuckAnims = [];
  g.pipeSystem.pipeEmergeAnims = [];
  g.meta.msg = "DODGE!";
  g.meta.msgTimer = 1.5;
}

export function startGame(g: GameState): void {
  g.round = 1;
  g.lives = 3;
  g.score = 0;
  g.effects.shield = false;
  g.effects.shieldTimer = 0;
  g.effects.instantTransmissionUses = 0;
  g.effects.afterimageUses = 0;
  g.effects.spiritBombReady = false;
  g.activePowerUpQueue = [];
  initRound(g);
}
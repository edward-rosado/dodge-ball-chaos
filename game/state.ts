import { GameState, ST } from "./types";
import { ARENA_CX, ARENA_CY, BASE_ROUND_TIME, getDifficulty } from "./constants";
import { createPipes } from "./arena";
import { randomSpawnTimer } from "./powerups/factory";
import { getBackgroundIdForRound } from "./renderer/backgrounds";
import { getLevelConfig } from "./progression";

export function makeGame(): GameState {
  return {
    state: ST.TITLE,
    px: ARENA_CX,
    py: ARENA_CY,
    pvx: 0,
    pvy: 0,
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
    slow: false,
    slowTimer: 0,
    shield: false,
    shieldTimer: 0,
    kaioken: false,
    kaiokenTimer: 0,
    solarFlare: false,
    solarFlareTimer: 0,
    afterimageDecoy: null,
    afterimageTimer: 0,
    afterimageUses: 0,
    shrink: false,
    shrinkTimer: 0,
    spiritBombCharging: false,
    spiritBombTimer: 0,
    spiritBombX: 0,
    spiritBombY: 0,
    instantTransmissionUses: 0,
    itFlashTimer: 0,
    itDepartX: 0,
    itDepartY: 0,
    flash: 0,
    deathAnimTimer: 0,
    deathX: 0,
    deathY: 0,
    msgTimer: 0,
    msg: "",
    backgroundId: 0,
    lastPowerUp: "",
    highScore: 0,
    t: 0,
    swS: null,
    swE: null,
    launched: 0,
    launchDelay: 0,
    launchQueue: 0,
    pipeQueue: [],
    chargingPipes: [],
    pipeSuckAnims: [],
    pipeEmergeAnims: [],
    keys: {},
  };
}

export function initRound(g: GameState): void {
  g.px = ARENA_CX;
  g.py = ARENA_CY;
  g.pvx = 0;
  g.pvy = 0;
  g.thrown = [];
  g.balls = [];
  const diff = getDifficulty(g.round);
  g.timer = Math.max(diff.roundTimerMin, BASE_ROUND_TIME - (g.round - 1) * diff.timerDecay);
  g.activePipe = -1;
  g.state = ST.READY;
  // Keep non-expired, uncollected power-ups (they persist across rounds with a 15s lifetime)
  g.powerUps = g.powerUps.filter(pu => !pu.collected && (g.t - pu.spawnTime) < 15);
  const levelCfg = getLevelConfig(g.round);
  // Scale spawn timer inversely with powerUpChance (higher chance = shorter timer)
  g.powerUpSpawnTimer = randomSpawnTimer() * (1 - levelCfg.powerUpChance * 0.5);
  // Reset timed power-up effects but keep permanent ones (IT uses, lives from Senzu)
  g.slow = false;
  g.slowTimer = 0;
  // Shield persists across rounds (it's single-hit, not timed)
  // Kaioken, Solar Flare, Afterimage, Shrink, Spirit Bomb reset
  g.kaioken = false;
  g.kaiokenTimer = 0;
  g.solarFlare = false;
  g.solarFlareTimer = 0;
  g.afterimageDecoy = null;
  g.afterimageTimer = 0;
  g.shrink = false;
  g.shrinkTimer = 0;
  g.spiritBombCharging = false;
  g.spiritBombTimer = 0;
  g.spiritBombX = 0;
  g.spiritBombY = 0;
  g.swS = null;
  g.swE = null;
  g.launchQueue = Math.min(diff.maxBalls, Math.max(0, g.round - 1));
  g.launchDelay = 0;
  g.launched = 0;
  g.pipeQueue = [];
  g.chargingPipes = [];
  g.pipeSuckAnims = [];
  g.pipeEmergeAnims = [];
  g.backgroundId = getBackgroundIdForRound(g.round);
  g.msg = "DODGE!";
  g.msgTimer = 1.5;
}

/**
 * Restore game state after a HIT (player lost a life but round continues).
 * Timer persists — only resets on new round via initRound().
 * Power-ups on screen persist — only timed effects reset.
 */
export function restoreAfterHit(g: GameState): void {
  g.px = ARENA_CX;
  g.py = ARENA_CY;
  g.pvx = 0;
  g.pvy = 0;
  g.thrown = [];
  g.balls = [];
  g.activePipe = -1;
  g.state = ST.READY;
  // DO NOT reset g.timer — keep remaining time
  // DO NOT reset g.powerUps — keep them on screen
  // Reset timed power-up effects
  g.slow = false;
  g.slowTimer = 0;
  g.kaioken = false;
  g.kaiokenTimer = 0;
  g.solarFlare = false;
  g.solarFlareTimer = 0;
  g.afterimageDecoy = null;
  g.afterimageTimer = 0;
  g.shrink = false;
  g.shrinkTimer = 0;
  g.spiritBombCharging = false;
  g.spiritBombTimer = 0;
  g.swS = null;
  g.swE = null;
  // Recalculate launch queue for remaining portion of round
  const diff = getDifficulty(g.round);
  g.launchQueue = Math.min(diff.maxBalls, Math.max(0, g.round - 1));
  g.launchDelay = 0;
  g.launched = 0;
  g.pipeQueue = [];
  g.chargingPipes = [];
  g.pipeSuckAnims = [];
  g.pipeEmergeAnims = [];
  g.msg = "DODGE!";
  g.msgTimer = 1.5;
}

export function startGame(g: GameState): void {
  g.round = 1;
  g.lives = 3;
  g.score = 0;
  g.shield = false;
  g.shieldTimer = 0;
  g.instantTransmissionUses = 0;
  g.afterimageUses = 0;
  initRound(g);
}

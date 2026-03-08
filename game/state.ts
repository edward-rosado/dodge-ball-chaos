import { GameState, ST } from "./types";
import { CW, CH, ARENA_CX, ARENA_CY, BASE_ROUND_TIME, getDifficulty } from "./constants";
import { createPipes } from "./arena";

export function makeGame(): GameState {
  return {
    state: ST.TITLE,
    px: ARENA_CX,
    py: ARENA_CY,
    pvx: 0,
    pvy: 0,
    thrown: null,
    balls: [],
    round: 1,
    lives: 3,
    score: 0,
    timer: BASE_ROUND_TIME,
    pipes: createPipes(),
    activePipe: -1,
    powerUp: null,
    slow: false,
    slowTimer: 0,
    shield: false,
    shieldTimer: 0,
    flash: 0,
    msgTimer: 0,
    msg: "",
    highScore: 0,
    t: 0,
    swS: null,
    swE: null,
    launched: 0,
    launchDelay: 0,
    launchQueue: 0,
    keys: {},
  };
}

export function initRound(g: GameState): void {
  g.px = ARENA_CX;
  g.py = ARENA_CY;
  g.pvx = 0;
  g.pvy = 0;
  g.thrown = null;
  g.balls = [];
  const diff = getDifficulty(g.round);
  g.timer = Math.max(diff.roundTimerMin, BASE_ROUND_TIME - (g.round - 1) * diff.timerDecay);
  g.activePipe = -1;
  g.state = ST.READY;
  g.powerUp = null;
  g.slow = false;
  g.slowTimer = 0;
  g.shield = false;
  g.shieldTimer = 0;
  g.swS = null;
  g.swE = null;
  g.launchQueue = Math.min(diff.maxBalls, Math.max(0, g.round - 1));
  g.launchDelay = 0;
  g.launched = 0;
  g.msg = "ROUND " + g.round;
  g.msgTimer = 1.5;

  // Power-up spawn — frequency scales with round (harder rounds get more help)
  const puChance = Math.min(0.8, 0.3 + g.round * 0.015);
  if (g.round > 1 && Math.random() < puChance) {
    g.powerUp = {
      x: 60 + Math.random() * (CW - 120),
      y: 120 + Math.random() * (CH - 240),
      type: Math.random() < 0.5 ? "slow" : "shield",
      collected: false,
    };
  }
}

export function startGame(g: GameState): void {
  g.round = 1;
  g.lives = 5;
  g.score = 0;
  initRound(g);
}

import { GameState, ST } from "../types";
import { THROW_SPEED, BALL_R } from "../constants";
import { BallType } from "../balls/types";
import { bounceOffWall, checkPipeSuckIn } from "../physics";
import { makeGame, startGame, initRound } from "../state";
import { update } from "../update";
import { botMove } from "./bot";
import { BRACKETS, Bracket } from "./brackets";

const DT = 1 / 60;

/** Throw the dodgeball and fast-forward until it bounces into DODGE state. */
function throwAndTransition(g: GameState): void {
  g.thrown = { x: g.px, y: g.py, vx: 0, vy: -THROW_SPEED, bounceCount: 0, type: BallType.Dodgeball, age: 0, phaseTimer: 0, isReal: true, radius: BALL_R, dead: false };
  g.state = ST.THROW;
  for (let i = 0; i < 120; i++) {
    if (!g.thrown) break;
    g.thrown.x += g.thrown.vx;
    g.thrown.y += g.thrown.vy;
    const suck = checkPipeSuckIn(g.thrown, g.pipes);
    const bounced = bounceOffWall(g.thrown);
    if (bounced || suck >= 0) {
      g.balls.push(g.thrown);
      g.thrown = null;
      g.state = ST.DODGE;
      g.launchDelay = 0.6;
      break;
    }
  }
}

/** Run a full headless game simulation. Returns the round reached. */
export function simulateGame(maxRounds: number): { roundReached: number; survived: boolean } {
  const g = makeGame();
  startGame(g);
  throwAndTransition(g);

  const maxFrames = maxRounds * 15 * 60;
  for (let frame = 0; frame < maxFrames; frame++) {
    if (g.state === ST.OVER) break;

    if (g.state === ST.DODGE || g.state === ST.THROW) {
      update(g, DT, botMove);
    } else if (g.state === ST.HIT || g.state === ST.CLEAR) {
      initRound(g);
      if (g.round > maxRounds) {
        return { roundReached: g.round - 1, survived: true };
      }
      throwAndTransition(g);
    }
  }

  return { roundReached: g.round, survived: g.state !== ST.OVER };
}

/** Run N simulations, return survival rate as a fraction 0-1. */
export function survivalRate(maxRounds: number, runs: number): number {
  let survivals = 0;
  for (let i = 0; i < runs; i++) {
    const result = simulateGame(maxRounds);
    if (result.survived) survivals++;
  }
  return survivals / runs;
}

/** Result for a single bracket run. */
export interface BracketResult {
  bracket: Bracket;
  rate: number;
  tooHard: boolean;
  tooEasy: boolean;
  passed: boolean;
}

/** Run all brackets with N runs each. Returns results array. */
export function runAllBrackets(runsPerBracket: number): BracketResult[] {
  return BRACKETS.map((bracket) => {
    const rate = survivalRate(bracket.maxRound, runsPerBracket);
    const tooHard = rate < bracket.minSurvival;
    const tooEasy = rate > bracket.maxSurvival;
    return { bracket, rate, tooHard, tooEasy, passed: !tooHard && !tooEasy };
  });
}

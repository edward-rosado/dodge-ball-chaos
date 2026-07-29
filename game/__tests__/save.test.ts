import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { GameState, ST, Ball, Pipe, PowerUp, PipeQueueEntry, BallType, PowerUpType } from "../types";
import { serialize, deserialize, saveInfo, hasSlot, getSaveInfoForSlot, getAllSaveInfos, saveGameToSlot, loadGameFromSlot, deleteSlot, shouldAutoSave, isMilestoneRound, milestoneSlotIndex, MAX_SAVE_SLOTS } from "../save";
import type { SaveData } from "../save";
import { makeGame, initRound, startGame } from "../state";
import { CW, CH, PIPE_COUNT, BASE_ROUND_TIME, ARENA_CX, ARENA_CY } from "../constants";
import { createPipes } from "../arena";
import { randomSpawnTimer } from "../powerups/factory";

// ─── Helpers ───

function makeTestBall(type: BallType = BallType.Dodgeball): Ball {
  return {
    x: 200, y: 300, vx: 2, vy: -1,
    bounceCount: 0, type, age: 0, phaseTimer: 0,
    isReal: true, radius: 7, dead: false, pipeImmunity: 0,
  };
}

function makeTestPipe(): Pipe {
  return { x: 100, y: 60, angle: Math.PI / 2 };
}

function makeTestPowerUp(type: PowerUpType = PowerUpType.Kaioken): PowerUp {
  return {
    x: 150, y: 200, type,
    collected: false,
    spawnTime: 100,
  };
}

function makeFilledGame(): GameState {
  const g = makeGame();
  startGame(g);
  g.state = ST.DODGE;
  g.player.px = 180;
  g.player.py = 350;
  g.player.pvx = 1.5;
  g.player.pvy = -0.5;
  g.effects.kaioken = true;
  g.effects.kaiokenTimer = 3;
  g.effects.shield = true;
  g.effects.slow = true;
  g.effects.slowTimer = 2;
  g.effects.shrink = true;
  g.effects.shrinkTimer = 4;
  g.effects.spiritBombReady = true;
  g.effects.spiritBombCharging = true;
  g.effects.spiritBombTimer = 2;
  g.effects.spiritBombX = 180;
  g.effects.spiritBombY = 350;
  g.effects.instantTransmissionUses = 2;
  g.effects.itFlashTimer = 0.3;
  g.effects.itDepartX = 100;
  g.effects.itDepartY = 200;
  g.effects.afterimageUses = 1;
  g.effects.afterimageDecoy = { x: 200, y: 400 };
  g.effects.afterimageTimer = 2;
  g.meta.highScore = 5000;
  g.meta.t = 120;
  g.meta.backgroundId = 3;
  g.balls = [makeTestBall(BallType.Tracker)];
  g.thrown = [makeTestBall(BallType.Dodgeball)];
  g.pipes = createPipes();
  g.powerUps = [makeTestPowerUp(PowerUpType.Kaioken)];
  g.pipeSystem.pipeQueue = [{
    ball: makeTestBall(BallType.Zigzag),
    pipeIndex: 5,
    delay: 1.5,
    totalDelay: 2,
  }];
  g.pipeSystem.chargingPipes = [3, 7];
  g.score = 1200;
  g.lives = 2;
  g.round = 15;
  g.timer = 8;
  g.activePipe = 12;
  g.powerUpSpawnTimer = 2.5;
  g.activePowerUpQueue = ["it", "afterimage"];
  g.launch.launched = 3;
  g.launch.launchDelay = 0.5;
  g.launch.launchQueue = 4;
  return g;
}

// ─── Serialization ───

describe("serialize", () => {
  it("produces valid save data from a filled game state", () => {
    const g = makeFilledGame();
    const data = serialize(g);

    expect(data.version).toBe(1);
    expect(typeof data.timestamp).toBe("number");
    expect(data.state).toBe(ST.DODGE);
    expect(data.round).toBe(15);
    expect(data.lives).toBe(2);
    expect(data.score).toBe(1200);
    expect(data.timer).toBe(8);
    expect(data.player.px).toBe(180);
    expect(data.player.py).toBe(350);
  });

  it("serializes all effects", () => {
    const g = makeFilledGame();
    const data = serialize(g);

    expect(data.effects.kaioken).toBe(true);
    expect(data.effects.kaiokenTimer).toBe(3);
    expect(data.effects.shield).toBe(true);
    expect(data.effects.shrink).toBe(true);
    expect(data.effects.slow).toBe(true);
    expect(data.effects.spiritBombReady).toBe(true);
    expect(data.effects.spiritBombCharging).toBe(true);
    expect(data.effects.spiritBombTimer).toBe(2);
    expect(data.effects.spiritBombX).toBe(180);
    expect(data.effects.spiritBombY).toBe(350);
    expect(data.effects.instantTransmissionUses).toBe(2);
    expect(data.effects.itFlashTimer).toBe(0.3);
    expect(data.effects.itDepartX).toBe(100);
    expect(data.effects.itDepartY).toBe(200);
    expect(data.effects.afterimageDecoy).toEqual({ x: 200, y: 400 });
    expect(data.effects.afterimageUses).toBe(1);
  });

  it("serializes meta (highScore, t, backgroundId) but strips transient fields", () => {
    const g = makeFilledGame();
    g.meta.flash = 0.5;
    g.meta.deathAnimTimer = 0.8;
    g.meta.deathX = 200;
    g.meta.deathY = 300;
    g.meta.msg = "HIT!";
    g.meta.msgTimer = 1.0;
    g.meta.lastPowerUp = "kaioken";

    const data = serialize(g);

    expect(data.meta.highScore).toBe(5000);
    expect(data.meta.t).toBe(120);
    expect(data.meta.backgroundId).toBe(3);
  });

  it("serializes balls, thrown, pipes, power-ups", () => {
    const g = makeFilledGame();
    const data = serialize(g);

    expect(data.balls).toHaveLength(1);
    expect(data.balls[0].type).toBe(BallType.Tracker);
    expect(data.balls[0].x).toBe(200);
    expect(data.thrown).toHaveLength(1);
    expect(data.pipes).toHaveLength(PIPE_COUNT);
    expect(data.powerUps).toHaveLength(1);
  });

  it("serializes pipe queue and charging pipes", () => {
    const g = makeFilledGame();
    const data = serialize(g);

    expect(data.pipeQueue).toHaveLength(1);
    expect(data.pipeQueue[0].pipeIndex).toBe(5);
    expect(data.chargingPipes).toEqual([3, 7]);
  });

  it("serializes launch state", () => {
    const g = makeFilledGame();
    const data = serialize(g);

    expect(data.launch.launched).toBe(3);
    expect(data.launch.launchDelay).toBe(0.5);
    expect(data.launch.launchQueue).toBe(4);
  });

  it("serializes activePowerUpQueue", () => {
    const g = makeFilledGame();
    const data = serialize(g);

    expect(data.activePowerUpQueue).toEqual(["it", "afterimage"]);
  });

  it("does NOT serialize transient input state", () => {
    const g = makeFilledGame();
    g.input.swS = { x: 50, y: 100 };
    g.input.swE = { x: 150, y: 200 };
    g.input.keys = { w: true, a: true };

    const data = serialize(g);

    // SaveData has no input field — it's stripped
    expect("input" in data).toBe(false);
  });

  it("does NOT serialize pipe animation arrays", () => {
    const g = makeFilledGame();
    g.pipeSystem.pipeSuckAnims = [{ x: 100, y: 60, timer: 0.3, duration: 0.5, radius: 7, color: "#ff0000" }];
    g.pipeSystem.pipeEmergeAnims = [{ x: 200, y: 60, timer: 0.2, duration: 0.4, radius: 7, color: "#00ff00" }];

    const data = serialize(g);

    expect("pipeSuckAnims" in data).toBe(false);
    expect("pipeEmergeAnims" in data).toBe(false);
  });

  it("does NOT serialize meta transient fields", () => {
    const g = makeFilledGame();
    g.meta.flash = 0.5;
    g.meta.deathAnimTimer = 0.8;
    g.meta.deathX = 200;
    g.meta.deathY = 300;
    g.meta.msg = "HIT!";
    g.meta.msgTimer = 1.0;
    g.meta.lastPowerUp = "kaioken";

    const data = serialize(g);

    expect("flash" in data.meta).toBe(false);
    expect("deathAnimTimer" in data.meta).toBe(false);
    expect("deathX" in data.meta).toBe(false);
    expect("deathY" in data.meta).toBe(false);
    expect("msgTimer" in data.meta).toBe(false);
    expect("msg" in data.meta).toBe(false);
    expect("lastPowerUp" in data.meta).toBe(false);
  });
});

// ─── Deserialization ───

describe("deserialize", () => {
  it("restores a full GameState from save data", () => {
    const g = makeFilledGame();
    const data = serialize(g);
    const restored = deserialize(data);

    expect(restored.state).toBe(ST.DODGE);
    expect(restored.round).toBe(15);
    expect(restored.lives).toBe(2);
    expect(restored.score).toBe(1200);
    expect(restored.timer).toBe(8);
    expect(restored.player.px).toBe(180);
    expect(restored.player.py).toBe(350);
  });

  it("restores all effects", () => {
    const g = makeFilledGame();
    const data = serialize(g);
    const restored = deserialize(data);

    expect(restored.effects.kaioken).toBe(true);
    expect(restored.effects.kaiokenTimer).toBe(3);
    expect(restored.effects.shield).toBe(true);
    expect(restored.effects.shrink).toBe(true);
    expect(restored.effects.slow).toBe(true);
    expect(restored.effects.slowTimer).toBe(2);
    expect(restored.effects.spiritBombReady).toBe(true);
    expect(restored.effects.spiritBombCharging).toBe(true);
    expect(restored.effects.spiritBombTimer).toBe(2);
    expect(restored.effects.spiritBombX).toBe(180);
    expect(restored.effects.spiritBombY).toBe(350);
    expect(restored.effects.instantTransmissionUses).toBe(2);
    expect(restored.effects.itFlashTimer).toBe(0.3);
    expect(restored.effects.itDepartX).toBe(100);
    expect(restored.effects.itDepartY).toBe(200);
    expect(restored.effects.afterimageDecoy).toEqual({ x: 200, y: 400 });
    expect(restored.effects.afterimageUses).toBe(1);
    expect(restored.effects.afterimageTimer).toBe(2);
  });

  it("restores meta (highScore, t, backgroundId)", () => {
    const g = makeFilledGame();
    const data = serialize(g);
    const restored = deserialize(data);

    expect(restored.meta.highScore).toBe(5000);
    expect(restored.meta.t).toBe(120);
    expect(restored.meta.backgroundId).toBe(3);
  });

  it("resets transient meta fields on deserialize", () => {
    const g = makeFilledGame();
    g.meta.flash = 0.5;
    g.meta.deathAnimTimer = 0.8;
    g.meta.deathX = 200;
    g.meta.deathY = 300;
    g.meta.msg = "HIT!";
    g.meta.msgTimer = 1.0;
    g.meta.lastPowerUp = "kaioken";

    const data = serialize(g);
    const restored = deserialize(data);

    expect(restored.meta.flash).toBe(0);
    expect(restored.meta.deathAnimTimer).toBe(0);
    expect(restored.meta.deathX).toBe(0);
    expect(restored.meta.deathY).toBe(0);
    expect(restored.meta.msg).toBe("");
    expect(restored.meta.msgTimer).toBe(0);
    expect(restored.meta.lastPowerUp).toBe("");
  });

  it("restores balls, thrown, pipes, power-ups", () => {
    const g = makeFilledGame();
    const data = serialize(g);
    const restored = deserialize(data);

    expect(restored.balls).toHaveLength(1);
    expect(restored.balls[0].type).toBe(BallType.Tracker);
    expect(restored.thrown).toHaveLength(1);
    expect(restored.pipes).toHaveLength(PIPE_COUNT);
    expect(restored.powerUps).toHaveLength(1);
  });

  it("restores pipe queue and charging pipes", () => {
    const g = makeFilledGame();
    const data = serialize(g);
    const restored = deserialize(data);

    expect(restored.pipeSystem.pipeQueue).toHaveLength(1);
    expect(restored.pipeSystem.pipeQueue[0].pipeIndex).toBe(5);
    expect(restored.pipeSystem.chargingPipes).toEqual([3, 7]);
  });

  it("resets transient pipe animations on deserialize", () => {
    const g = makeFilledGame();
    g.pipeSystem.pipeSuckAnims = [{ x: 100, y: 60, timer: 0.3, duration: 0.5, radius: 7, color: "#ff0000" }];
    g.pipeSystem.pipeEmergeAnims = [{ x: 200, y: 60, timer: 0.2, duration: 0.4, radius: 7, color: "#00ff00" }];

    const data = serialize(g);
    const restored = deserialize(data);

    expect(restored.pipeSystem.pipeSuckAnims).toHaveLength(0);
    expect(restored.pipeSystem.pipeEmergeAnims).toHaveLength(0);
  });

  it("resets transient input state on deserialize", () => {
    const g = makeFilledGame();
    g.input.swS = { x: 50, y: 100 };
    g.input.swE = { x: 150, y: 200 };
    g.input.keys = { w: true };

    const data = serialize(g);
    const restored = deserialize(data);

    expect(restored.input.swS).toBeNull();
    expect(restored.input.swE).toBeNull();
    expect(restored.input.keys).toEqual({});
  });

  it("restores launch state", () => {
    const g = makeFilledGame();
    const data = serialize(g);
    const restored = deserialize(data);

    expect(restored.launch.launched).toBe(3);
    expect(restored.launch.launchDelay).toBe(0.5);
    expect(restored.launch.launchQueue).toBe(4);
  });

  it("restores activePowerUpQueue", () => {
    const g = makeFilledGame();
    const data = serialize(g);
    const restored = deserialize(data);

    expect(restored.activePowerUpQueue).toEqual(["it", "afterimage"]);
  });

  it("restores all numeric fields", () => {
    const g = makeFilledGame();
    const data = serialize(g);
    const restored = deserialize(data);

    expect(restored.activePipe).toBe(12);
    expect(restored.powerUpSpawnTimer).toBe(2.5);
  });
});

// ─── Round-Trip ───

describe("serialize → deserialize round-trip", () => {
  it("preserves all meaningful game state", () => {
    const g = makeFilledGame();
    const data = serialize(g);
    const restored = deserialize(data);

    expect(restored.state).toBe(g.state);
    expect(restored.round).toBe(g.round);
    expect(restored.lives).toBe(g.lives);
    expect(restored.score).toBe(g.score);
    expect(restored.timer).toBe(g.timer);
    expect(restored.player.px).toBe(g.player.px);
    expect(restored.player.py).toBe(g.player.py);
    expect(restored.player.pvx).toBe(g.player.pvx);
    expect(restored.player.pvy).toBe(g.player.pvy);
    expect(restored.effects.kaioken).toBe(g.effects.kaioken);
    expect(restored.effects.kaiokenTimer).toBe(g.effects.kaiokenTimer);
    expect(restored.effects.shield).toBe(g.effects.shield);
    expect(restored.effects.shrink).toBe(g.effects.shrink);
    expect(restored.effects.slow).toBe(g.effects.slow);
    expect(restored.effects.slowTimer).toBe(g.effects.slowTimer);
    expect(restored.effects.spiritBombReady).toBe(g.effects.spiritBombReady);
    expect(restored.effects.spiritBombCharging).toBe(g.effects.spiritBombCharging);
    expect(restored.effects.spiritBombTimer).toBe(g.effects.spiritBombTimer);
    expect(restored.effects.spiritBombX).toBe(g.effects.spiritBombX);
    expect(restored.effects.spiritBombY).toBe(g.effects.spiritBombY);
    expect(restored.effects.instantTransmissionUses).toBe(g.effects.instantTransmissionUses);
    expect(restored.effects.itFlashTimer).toBe(g.effects.itFlashTimer);
    expect(restored.effects.itDepartX).toBe(g.effects.itDepartX);
    expect(restored.effects.itDepartY).toBe(g.effects.itDepartY);
    expect(restored.effects.afterimageDecoy).toEqual(g.effects.afterimageDecoy);
    expect(restored.effects.afterimageUses).toBe(g.effects.afterimageUses);
    expect(restored.effects.afterimageTimer).toBe(g.effects.afterimageTimer);
    expect(restored.meta.highScore).toBe(g.meta.highScore);
    expect(restored.meta.t).toBe(g.meta.t);
    expect(restored.meta.backgroundId).toBe(g.meta.backgroundId);
    expect(restored.balls).toHaveLength(g.balls.length);
    expect(restored.thrown).toHaveLength(g.thrown.length);
    expect(restored.pipes).toHaveLength(g.pipes.length);
    expect(restored.powerUps).toHaveLength(g.powerUps.length);
    expect(restored.activePipe).toBe(g.activePipe);
    expect(restored.powerUpSpawnTimer).toBe(g.powerUpSpawnTimer);
    expect(restored.activePowerUpQueue).toEqual(g.activePowerUpQueue);
    expect(restored.pipeSystem.pipeQueue).toHaveLength(g.pipeSystem.pipeQueue.length);
    expect(restored.pipeSystem.chargingPipes).toEqual(g.pipeSystem.chargingPipes);
    expect(restored.launch.launched).toBe(g.launch.launched);
    expect(restored.launch.launchDelay).toBe(g.launch.launchDelay);
    expect(restored.launch.launchQueue).toBe(g.launch.launchQueue);
  });

  it("does NOT preserve transient state", () => {
    const g = makeFilledGame();
    g.meta.flash = 0.5;
    g.meta.deathAnimTimer = 0.8;
    g.meta.deathX = 200;
    g.meta.deathY = 300;
    g.meta.msg = "HIT!";
    g.meta.msgTimer = 1.0;
    g.meta.lastPowerUp = "kaioken";
    g.input.swS = { x: 50, y: 100 };
    g.input.swE = { x: 150, y: 200 };
    g.input.keys = { w: true };
    g.pipeSystem.pipeSuckAnims = [{ x: 100, y: 60, timer: 0.3, duration: 0.5, radius: 7, color: "#ff0000" }];
    g.pipeSystem.pipeEmergeAnims = [{ x: 200, y: 60, timer: 0.2, duration: 0.4, radius: 7, color: "#00ff00" }];

    const data = serialize(g);
    const restored = deserialize(data);

    expect(restored.meta.flash).toBe(0);
    expect(restored.meta.deathAnimTimer).toBe(0);
    expect(restored.meta.msg).toBe("");
    expect(restored.meta.msgTimer).toBe(0);
    expect(restored.meta.lastPowerUp).toBe("");
    expect(restored.input.swS).toBeNull();
    expect(restored.input.swE).toBeNull();
    expect(restored.input.keys).toEqual({});
    expect(restored.pipeSystem.pipeSuckAnims).toHaveLength(0);
    expect(restored.pipeSystem.pipeEmergeAnims).toHaveLength(0);
  });
});

// ─── SaveInfo ───

describe("saveInfo", () => {
  it("extracts metadata from save data", () => {
    const g = makeFilledGame();
    const data = serialize(g);
    const info = saveInfo(data);

    expect(info.round).toBe(15);
    expect(info.lives).toBe(2);
    expect(info.score).toBe(1200);
    expect(info.label).toContain("Dodge");
    expect(typeof info.timestamp).toBe("number");
  });
});

// ─── Persistence (localStorage) ───

describe("saveGame / loadGame (localStorage)", () => {
  const originalHasItem = localStorage.getItem.bind(localStorage);
  const originalSetItem = localStorage.setItem.bind(localStorage);
  const originalRemoveItem = localStorage.removeItem.bind(localStorage);

  beforeEach(() => {
    // Reset localStorage before each test
    try {
      localStorage.removeItem("dodge-ball-chaos-save-0");
    } catch {}
  });

  afterAll(() => {
    // Restore localStorage
    localStorage.getItem = originalHasItem;
    localStorage.setItem = originalSetItem;
    localStorage.removeItem = originalRemoveItem;
  });

  it("saves and loads a game to slot 0", () => {
    const g = makeFilledGame();
    saveGameToSlot(g, 0);

    const loaded = loadGameFromSlot(0);
    expect(loaded).not.toBeNull();
    expect(loaded!.round).toBe(15);
    expect(loaded!.lives).toBe(2);
    expect(loaded!.score).toBe(1200);
    expect(loaded!.player.px).toBe(180);
    expect(loaded!.effects.kaioken).toBe(true);
  });

  it("returns null when slot is empty", () => {
    const result = loadGameFromSlot(0);
    expect(result).toBeNull();
  });

  it("hasSlot returns correct value", () => {
    expect(hasSlot(0)).toBe(false);

    const g = makeFilledGame();
    saveGameToSlot(g, 0);
    expect(hasSlot(0)).toBe(true);

    deleteSlot(0);
    expect(hasSlot(0)).toBe(false);
  });

  it("getSaveInfoForSlot returns metadata", () => {
    const g = makeFilledGame();
    saveGameToSlot(g, 0);

    const info = getSaveInfoForSlot(0);
    expect(info).not.toBeNull();
    expect(info!.round).toBe(15);
    expect(info!.score).toBe(1200);
    expect(info!.lives).toBe(2);
  });

  it("getSaveInfoForSlot returns null when slot empty", () => {
    const info = getSaveInfoForSlot(0);
    expect(info).toBeNull();
  });

  it("overwriting a slot replaces it", () => {
    const g1 = makeFilledGame();
    g1.score = 100;
    saveGameToSlot(g1, 0);

    const g2 = makeFilledGame();
    g2.score = 999;
    saveGameToSlot(g2, 0);

    const loaded = loadGameFromSlot(0);
    expect(loaded!.score).toBe(999);
  });

  it("deleteSlot removes the slot", () => {
    const g = makeFilledGame();
    saveGameToSlot(g, 0);
    deleteSlot(0);

    expect(hasSlot(0)).toBe(false);
    expect(loadGameFromSlot(0)).toBeNull();
    expect(getSaveInfoForSlot(0)).toBeNull();
  });

  it("serializes and deserializes to/from JSON correctly", () => {
    const g = makeFilledGame();
    const data = serialize(g);
    const json = JSON.stringify(data);
    const parsed = JSON.parse(json) as SaveData;
    const restored = deserialize(parsed);

    expect(restored.score).toBe(g.score);
    expect(restored.effects.kaioken).toBe(g.effects.kaioken);
  });
});

// ─── shouldAutoSave ───

describe("shouldAutoSave", () => {
  it("returns true for game over", () => {
    expect(shouldAutoSave(ST.DODGE, ST.OVER)).toBe(true);
  });

  it("returns true for victory", () => {
    expect(shouldAutoSave(ST.DODGE, ST.VICTORY)).toBe(true);
  });

  it("returns true for clear (round complete)", () => {
    expect(shouldAutoSave(ST.DODGE, ST.CLEAR)).toBe(true);
  });

  it("returns true for hit (losing a life)", () => {
    expect(shouldAutoSave(ST.DODGE, ST.HIT)).toBe(true);
  });

  it("returns false for other transitions", () => {
    expect(shouldAutoSave(ST.TITLE, ST.READY)).toBe(false);
    expect(shouldAutoSave(ST.READY, ST.THROW)).toBe(false);
    expect(shouldAutoSave(ST.THROW, ST.DODGE)).toBe(false);
    expect(shouldAutoSave(ST.DODGE, ST.DODGE)).toBe(false);
    expect(shouldAutoSave(ST.OVER, ST.TITLE)).toBe(false);
    expect(shouldAutoSave(ST.CLEAR, ST.READY)).toBe(false);
  });
});

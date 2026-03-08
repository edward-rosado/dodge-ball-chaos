/**
 * Comprehensive tests for the power-up queue activation system.
 *
 * Covers:
 * - FIFO queue ordering (activateNextPowerUp)
 * - IT: 1 per pickup, max 3 stacked, activation SFX
 * - Afterimage: 1 per pickup, max 3 stacked, can't activate with existing decoy
 * - Spirit Bomb: two-phase activation, milestone skip, auto-win on level 50
 * - Movement tolerance for Spirit Bomb (10px)
 * - Music mute via musicGain node
 * - Power-up labels show effects, icons show names
 * - SpeechSynthesis voice system
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { makeGame, startGame, initRound, restoreAfterHit } from "../state";
import { GameState, ST, Ball } from "../types";
import { BallType } from "../balls/types";
import { PowerUpType, POWER_UP_CONFIGS } from "../powerups/types";
import {
  applyPowerUp,
  activateInstantTransmission,
  activateAfterimage,
  activateNextPowerUp,
  activateSpiritBomb,
  completeSpiritBomb,
  cancelSpiritBomb,
  MAX_IT_USES,
  MAX_AFTERIMAGE_USES,
} from "../powerups/effects";
import { update } from "../update";
import { AudioEngine } from "../audio/engine";

function makeBall(overrides: Partial<Ball> = {}): Ball {
  return {
    x: 200, y: 300, vx: 2, vy: 2, bounceCount: 0,
    type: BallType.Dodgeball, age: 0, phaseTimer: 0,
    isReal: true, radius: 7, dead: false, pipeImmunity: 0,
    ...overrides,
  };
}

function makeDodgeState(): GameState {
  const g = makeGame();
  startGame(g);
  g.state = ST.DODGE;
  g.round = 5;
  g.launched = g.launchQueue;
  g.launchDelay = 999;
  return g;
}

// ─── FIFO Queue System ───

describe("Power-up activation queue (FIFO)", () => {
  it("activateNextPowerUp uses first item in queue", () => {
    const g = makeDodgeState();
    g.instantTransmissionUses = 1;
    g.afterimageUses = 1;
    g.activePowerUpQueue = ["it", "afterimage"];

    const result = activateNextPowerUp(g);

    expect(result).toBe(true);
    expect(g.instantTransmissionUses).toBe(0); // IT was used first
    expect(g.afterimageUses).toBe(1); // Afterimage untouched
  });

  it("skips exhausted entries and uses next available", () => {
    const g = makeDodgeState();
    g.instantTransmissionUses = 0; // IT exhausted
    g.afterimageUses = 1;
    g.activePowerUpQueue = ["it", "afterimage"];

    const result = activateNextPowerUp(g);

    expect(result).toBe(true);
    expect(g.afterimageUses).toBe(0); // Afterimage was used
    expect(g.afterimageDecoy).toBeTruthy();
  });

  it("returns false when queue is empty", () => {
    const g = makeDodgeState();
    g.activePowerUpQueue = [];

    const result = activateNextPowerUp(g);

    expect(result).toBe(false);
  });

  it("returns false when all queue entries are exhausted", () => {
    const g = makeDodgeState();
    g.instantTransmissionUses = 0;
    g.afterimageUses = 0;
    g.activePowerUpQueue = ["it", "afterimage"];

    const result = activateNextPowerUp(g);

    expect(result).toBe(false);
  });

  it("cleans up exhausted entries from queue", () => {
    const g = makeDodgeState();
    g.instantTransmissionUses = 0;
    g.afterimageUses = 0;
    g.activePowerUpQueue = ["it", "afterimage"];

    activateNextPowerUp(g);

    expect(g.activePowerUpQueue).toEqual([]);
  });

  it("preserves queue order across multiple activations", () => {
    const g = makeDodgeState();
    g.instantTransmissionUses = 2;
    g.afterimageUses = 1;
    g.activePowerUpQueue = ["it", "afterimage"];

    // First activation: IT
    activateNextPowerUp(g);
    expect(g.instantTransmissionUses).toBe(1);

    // Second activation: IT again (still has uses)
    activateNextPowerUp(g);
    expect(g.instantTransmissionUses).toBe(0);

    // Third activation: afterimage (IT exhausted, removed from queue)
    activateNextPowerUp(g);
    expect(g.afterimageUses).toBe(0);
  });

  it("does not add duplicate queue entries on multiple collections", () => {
    const g = makeDodgeState();
    applyPowerUp(g, PowerUpType.InstantTransmission);
    applyPowerUp(g, PowerUpType.InstantTransmission);

    const itEntries = g.activePowerUpQueue.filter(e => e === "it");
    expect(itEntries).toHaveLength(1);
  });

  it("queues Spirit Bomb for spacebar activation", () => {
    const g = makeDodgeState();
    applyPowerUp(g, PowerUpType.SpiritBombCharge);

    expect(g.spiritBombReady).toBe(true);
    expect(g.spiritBombCharging).toBe(false);
    expect(g.activePowerUpQueue).toContain("spiritBomb");
  });

  it("activates Spirit Bomb via queue when it's first", () => {
    const g = makeDodgeState();
    g.spiritBombReady = true;
    g.activePowerUpQueue = ["spiritBomb"];

    const result = activateNextPowerUp(g);

    expect(result).toBe(true);
    expect(g.spiritBombCharging).toBe(true);
    expect(g.spiritBombReady).toBe(false);
  });

  it("respects queue ordering: IT before Spirit Bomb", () => {
    const g = makeDodgeState();
    g.instantTransmissionUses = 1;
    g.spiritBombReady = true;
    g.activePowerUpQueue = ["it", "spiritBomb"];

    activateNextPowerUp(g);

    expect(g.instantTransmissionUses).toBe(0); // IT used first
    expect(g.spiritBombCharging).toBe(false); // Spirit Bomb not yet
  });
});

// ─── Instant Transmission ───

describe("IT: 1 per pickup, max 3", () => {
  it("grants exactly 1 use per collection", () => {
    const g = makeDodgeState();
    applyPowerUp(g, PowerUpType.InstantTransmission);
    expect(g.instantTransmissionUses).toBe(1);
  });

  it("stacks up to MAX_IT_USES (3)", () => {
    const g = makeDodgeState();
    applyPowerUp(g, PowerUpType.InstantTransmission);
    applyPowerUp(g, PowerUpType.InstantTransmission);
    applyPowerUp(g, PowerUpType.InstantTransmission);
    expect(g.instantTransmissionUses).toBe(3);
  });

  it("caps at MAX_IT_USES even with more collections", () => {
    const g = makeDodgeState();
    for (let i = 0; i < 5; i++) {
      applyPowerUp(g, PowerUpType.InstantTransmission);
    }
    expect(g.instantTransmissionUses).toBe(MAX_IT_USES);
  });

  it("MAX_IT_USES constant equals 3", () => {
    expect(MAX_IT_USES).toBe(3);
  });

  it("records departure position and sets flash timer on activation", () => {
    const g = makeDodgeState();
    g.instantTransmissionUses = 1;
    g.px = 150;
    g.py = 250;

    activateInstantTransmission(g);

    expect(g.itDepartX).toBe(150);
    expect(g.itDepartY).toBe(250);
    expect(g.itFlashTimer).toBeGreaterThan(0);
  });

  it("sets message on activation", () => {
    const g = makeDodgeState();
    g.instantTransmissionUses = 1;
    activateInstantTransmission(g);
    expect(g.msg).toBe("INSTANT TRANSMISSION!");
  });

  it("persists uses across rounds via initRound", () => {
    const g = makeDodgeState();
    g.instantTransmissionUses = 2;
    initRound(g);
    expect(g.instantTransmissionUses).toBe(2);
  });

  it("resets uses on startGame", () => {
    const g = makeDodgeState();
    g.instantTransmissionUses = 3;
    startGame(g);
    expect(g.instantTransmissionUses).toBe(0);
  });

  it("removes IT from queue when uses exhausted", () => {
    const g = makeDodgeState();
    g.instantTransmissionUses = 1;
    g.activePowerUpQueue = ["it"];

    activateNextPowerUp(g);

    expect(g.instantTransmissionUses).toBe(0);
    expect(g.activePowerUpQueue).not.toContain("it");
  });
});

// ─── Afterimage ───

describe("Afterimage: 1 per pickup, max 3, single active decoy", () => {
  it("grants exactly 1 use per collection", () => {
    const g = makeDodgeState();
    applyPowerUp(g, PowerUpType.Afterimage);
    expect(g.afterimageUses).toBe(1);
  });

  it("stacks up to MAX_AFTERIMAGE_USES (3)", () => {
    const g = makeDodgeState();
    applyPowerUp(g, PowerUpType.Afterimage);
    applyPowerUp(g, PowerUpType.Afterimage);
    applyPowerUp(g, PowerUpType.Afterimage);
    expect(g.afterimageUses).toBe(3);
  });

  it("caps at MAX_AFTERIMAGE_USES even with more collections", () => {
    const g = makeDodgeState();
    for (let i = 0; i < 5; i++) {
      applyPowerUp(g, PowerUpType.Afterimage);
    }
    expect(g.afterimageUses).toBe(MAX_AFTERIMAGE_USES);
  });

  it("MAX_AFTERIMAGE_USES constant equals 3", () => {
    expect(MAX_AFTERIMAGE_USES).toBe(3);
  });

  it("does not auto-deploy decoy on collection", () => {
    const g = makeDodgeState();
    applyPowerUp(g, PowerUpType.Afterimage);
    expect(g.afterimageDecoy).toBeNull();
  });

  it("deploys decoy at player position on activation", () => {
    const g = makeDodgeState();
    g.afterimageUses = 1;
    g.px = 200;
    g.py = 300;

    const result = activateAfterimage(g);

    expect(result).toBe(true);
    expect(g.afterimageDecoy).toEqual({ x: 200, y: 300 });
    expect(g.afterimageTimer).toBe(4);
  });

  it("cannot activate when a decoy is already active", () => {
    const g = makeDodgeState();
    g.afterimageUses = 2;
    g.afterimageDecoy = { x: 100, y: 100 };

    const result = activateAfterimage(g);

    expect(result).toBe(false);
    expect(g.afterimageUses).toBe(2); // Not consumed
  });

  it("can activate again after decoy expires", () => {
    const g = makeDodgeState();
    g.afterimageUses = 2;

    // First activation
    activateAfterimage(g);
    expect(g.afterimageUses).toBe(1);

    // Expire decoy
    g.afterimageDecoy = null;
    g.afterimageTimer = 0;

    // Second activation
    const result = activateAfterimage(g);
    expect(result).toBe(true);
    expect(g.afterimageUses).toBe(0);
  });

  it("is activatable via the queue system", () => {
    const g = makeDodgeState();
    g.afterimageUses = 1;
    g.activePowerUpQueue = ["afterimage"];

    const result = activateNextPowerUp(g);

    expect(result).toBe(true);
    expect(g.afterimageDecoy).toBeTruthy();
  });

  it("skips afterimage in queue when decoy is already active", () => {
    const g = makeDodgeState();
    g.afterimageUses = 1;
    g.afterimageDecoy = { x: 100, y: 100 }; // Already active
    g.instantTransmissionUses = 1;
    g.activePowerUpQueue = ["afterimage", "it"];

    const result = activateNextPowerUp(g);

    // Should skip afterimage and use IT instead
    expect(result).toBe(true);
    expect(g.instantTransmissionUses).toBe(0);
    expect(g.afterimageUses).toBe(1); // Unchanged
  });

  it("removes afterimage from queue when uses exhausted", () => {
    const g = makeDodgeState();
    g.afterimageUses = 1;
    g.activePowerUpQueue = ["afterimage"];

    activateNextPowerUp(g);

    expect(g.afterimageUses).toBe(0);
    expect(g.activePowerUpQueue).not.toContain("afterimage");
  });

  it("adds to queue on first collection only (no duplicates)", () => {
    const g = makeDodgeState();
    applyPowerUp(g, PowerUpType.Afterimage);
    applyPowerUp(g, PowerUpType.Afterimage);

    const entries = g.activePowerUpQueue.filter(e => e === "afterimage");
    expect(entries).toHaveLength(1);
  });
});

// ─── Spirit Bomb ───

describe("Spirit Bomb: two-phase activation + milestone skip", () => {
  it("collection sets spiritBombReady=true, charging=false", () => {
    const g = makeDodgeState();
    applyPowerUp(g, PowerUpType.SpiritBombCharge);

    expect(g.spiritBombReady).toBe(true);
    expect(g.spiritBombCharging).toBe(false);
  });

  it("activateSpiritBomb transitions ready→charging", () => {
    const g = makeDodgeState();
    g.spiritBombReady = true;

    const result = activateSpiritBomb(g);

    expect(result).toBe(true);
    expect(g.spiritBombReady).toBe(false);
    expect(g.spiritBombCharging).toBe(true);
    expect(g.spiritBombTimer).toBe(3);
  });

  it("activateSpiritBomb records player position", () => {
    const g = makeDodgeState();
    g.spiritBombReady = true;
    g.px = 180;
    g.py = 260;

    activateSpiritBomb(g);

    expect(g.spiritBombX).toBe(180);
    expect(g.spiritBombY).toBe(260);
  });

  it("activateSpiritBomb returns false when not ready", () => {
    const g = makeDodgeState();
    g.spiritBombReady = false;

    const result = activateSpiritBomb(g);

    expect(result).toBe(false);
  });

  it("activateSpiritBomb returns false when already charging", () => {
    const g = makeDodgeState();
    g.spiritBombReady = true;
    g.spiritBombCharging = true;

    const result = activateSpiritBomb(g);

    expect(result).toBe(false);
  });

  describe("milestone skip on completion", () => {
    it("skips from round 1 to round 10", () => {
      const g = makeDodgeState();
      g.round = 1;
      g.score = 0;
      completeSpiritBomb(g);
      expect(g.round).toBe(10);
      expect(g.score).toBe(900); // 9 skipped levels * 100
    });

    it("skips from round 15 to round 20", () => {
      const g = makeDodgeState();
      g.round = 15;
      g.score = 0;
      completeSpiritBomb(g);
      expect(g.round).toBe(20);
      expect(g.score).toBe(500); // 5 skipped levels * 100
    });

    it("skips from round 25 to round 30", () => {
      const g = makeDodgeState();
      g.round = 25;
      g.score = 0;
      completeSpiritBomb(g);
      expect(g.round).toBe(30);
      expect(g.score).toBe(500);
    });

    it("skips from round 45 to round 50", () => {
      const g = makeDodgeState();
      g.round = 45;
      g.score = 0;
      completeSpiritBomb(g);
      expect(g.round).toBe(50);
      expect(g.score).toBe(500);
    });

    it("shows milestone skip message", () => {
      const g = makeDodgeState();
      g.round = 5;
      completeSpiritBomb(g);
      expect(g.msg).toContain("SPIRIT BOMB");
      expect(g.msg).toContain("10");
    });
  });

  describe("auto-win on level 50", () => {
    it("triggers VICTORY state on round 50", () => {
      const g = makeDodgeState();
      g.round = 50;
      g.score = 5000;
      g.highScore = 0;

      completeSpiritBomb(g);

      expect(g.state).toBe(ST.VICTORY);
      expect(g.highScore).toBe(5000);
      expect(g.msg).toContain("YOU WIN");
    });

    it("triggers VICTORY state on round beyond 50", () => {
      const g = makeDodgeState();
      g.round = 55;

      completeSpiritBomb(g);

      expect(g.state).toBe(ST.VICTORY);
    });

    it("destroys all non-Dodgeball balls on victory", () => {
      const g = makeDodgeState();
      g.round = 50;
      g.balls = [
        makeBall({ type: BallType.Dodgeball }),
        makeBall({ type: BallType.Tracker }),
        makeBall({ type: BallType.Ghost }),
      ];

      completeSpiritBomb(g);

      expect(g.balls[0].dead).toBe(false);
      expect(g.balls[1].dead).toBe(true);
      expect(g.balls[2].dead).toBe(true);
    });
  });

  describe("movement tolerance (10px)", () => {
    it("does NOT cancel with movement <=10px", () => {
      const g = makeDodgeState();
      g.spiritBombCharging = true;
      g.spiritBombTimer = 2;
      g.spiritBombX = g.px;
      g.spiritBombY = g.py;
      // Small movement (5px)
      g.pvx = 5;
      g.pvy = 0;

      update(g, 0.016);

      expect(g.spiritBombCharging).toBe(true);
    });

    it("cancels with movement >10px", () => {
      const g = makeDodgeState();
      g.spiritBombCharging = true;
      g.spiritBombTimer = 2;
      g.spiritBombX = g.px;
      g.spiritBombY = g.py;
      // Large movement (15px)
      g.pvx = 15;
      g.pvy = 0;

      update(g, 0.016);

      expect(g.spiritBombCharging).toBe(false);
      expect(g.msg).toBe("SPIRIT BOMB CANCELLED!");
    });
  });

  it("forces round clear (timer=0) on completion", () => {
    const g = makeDodgeState();
    g.round = 5;
    g.timer = 10;
    completeSpiritBomb(g);
    expect(g.timer).toBe(0);
  });

  it("resets spiritBombReady on startGame", () => {
    const g = makeDodgeState();
    g.spiritBombReady = true;
    startGame(g);
    expect(g.spiritBombReady).toBe(false);
  });

  it("resets activePowerUpQueue on startGame", () => {
    const g = makeDodgeState();
    g.activePowerUpQueue = ["it", "spiritBomb"];
    startGame(g);
    expect(g.activePowerUpQueue).toEqual([]);
  });
});

// ─── Power-Up Config: Icons show names, Labels show effects ───

describe("Power-up config: icons=names, labels=effects", () => {
  it("icon shows power-up name for each type", () => {
    expect(POWER_UP_CONFIGS[PowerUpType.Kaioken].icon).toBe("KAIOKEN");
    expect(POWER_UP_CONFIGS[PowerUpType.KiShield].icon).toBe("KI SHIELD");
    expect(POWER_UP_CONFIGS[PowerUpType.InstantTransmission].icon).toBe("I.T.");
    expect(POWER_UP_CONFIGS[PowerUpType.SolarFlare].icon).toBe("SOLAR FLARE");
    expect(POWER_UP_CONFIGS[PowerUpType.SenzuBean].icon).toBe("SENZU BEAN");
    expect(POWER_UP_CONFIGS[PowerUpType.TimeSkip].icon).toBe("TIME SKIP");
    expect(POWER_UP_CONFIGS[PowerUpType.DestructoDisc].icon).toBe("DESTRUCTO DISC");
    expect(POWER_UP_CONFIGS[PowerUpType.Afterimage].icon).toBe("AFTERIMAGE");
    expect(POWER_UP_CONFIGS[PowerUpType.Shrink].icon).toBe("SHRINK");
    expect(POWER_UP_CONFIGS[PowerUpType.SpiritBombCharge].icon).toBe("SPIRIT BOMB");
  });

  it("label shows effect description for each type", () => {
    expect(POWER_UP_CONFIGS[PowerUpType.Kaioken].label).toBe("2X SPEED FOR 5s!");
    expect(POWER_UP_CONFIGS[PowerUpType.KiShield].label).toBe("BLOCKS 1 HIT!");
    expect(POWER_UP_CONFIGS[PowerUpType.InstantTransmission].label).toBe("TELEPORT!");
    expect(POWER_UP_CONFIGS[PowerUpType.SolarFlare].label).toBe("FREEZE ALL FOR 3s!");
    expect(POWER_UP_CONFIGS[PowerUpType.SenzuBean].label).toBe("+1 LIFE!");
    expect(POWER_UP_CONFIGS[PowerUpType.TimeSkip].label).toBe("SLOW BALLS FOR 4s!");
    expect(POWER_UP_CONFIGS[PowerUpType.DestructoDisc].label).toBe("DESTROYS 1 BALL!");
    expect(POWER_UP_CONFIGS[PowerUpType.Afterimage].label).toBe("DECOY FOR 4s!");
    expect(POWER_UP_CONFIGS[PowerUpType.Shrink].label).toBe("HALF SIZE FOR 5s!");
    expect(POWER_UP_CONFIGS[PowerUpType.SpiritBombCharge].label).toBe("SKIP TO NEXT MILESTONE!");
  });
});

// ─── Music Mute via musicGain ───

describe("Music mute (musicGain node)", () => {
  function mockAudioContext() {
    return {
      createGain: vi.fn(() => ({
        gain: { value: 0.5, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn().mockReturnThis(),
        disconnect: vi.fn(),
      })),
      createOscillator: vi.fn(() => ({
        type: "", frequency: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        connect: vi.fn().mockReturnThis(), start: vi.fn(), stop: vi.fn(), disconnect: vi.fn(),
      })),
      createBuffer: vi.fn(() => ({ getChannelData: vi.fn(() => new Float32Array(1000)) })),
      createBufferSource: vi.fn(() => ({
        buffer: null, loop: false, connect: vi.fn().mockReturnThis(), start: vi.fn(), stop: vi.fn(), disconnect: vi.fn(),
      })),
      createBiquadFilter: vi.fn(() => ({
        type: "", frequency: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        Q: { value: 0 }, connect: vi.fn().mockReturnThis(),
      })),
      createWaveShaper: vi.fn(() => ({ curve: null, connect: vi.fn().mockReturnThis() })),
      destination: {},
      currentTime: 0,
      sampleRate: 44100,
      state: "running" as string,
      resume: vi.fn(),
    };
  }

  beforeEach(() => {
    (globalThis as any).AudioContext = function () { return mockAudioContext(); };
  });

  afterEach(() => {
    delete (globalThis as any).AudioContext;
    vi.restoreAllMocks();
  });

  it("starts unmuted", () => {
    const engine = new AudioEngine();
    engine.init();
    expect(engine.musicMuted).toBe(false);
  });

  it("toggleMusic returns true (muted) on first call", () => {
    const engine = new AudioEngine();
    engine.init();
    const result = engine.toggleMusic();
    expect(result).toBe(true);
    expect(engine.musicMuted).toBe(true);
  });

  it("toggleMusic returns false (unmuted) on second call", () => {
    const engine = new AudioEngine();
    engine.init();
    engine.toggleMusic(); // mute
    const result = engine.toggleMusic(); // unmute
    expect(result).toBe(false);
    expect(engine.musicMuted).toBe(false);
  });

  it("playTrack still starts sequencer even when muted (musicGain=0 handles silence)", () => {
    const engine = new AudioEngine();
    engine.init();
    engine.toggleMusic(); // mute
    // Should not throw — sequencer runs silently
    expect(() => engine.playTrack("training")).not.toThrow();
    expect(engine.musicMuted).toBe(true);
  });

  it("SFX still plays when music is muted", () => {
    const engine = new AudioEngine();
    engine.init();
    engine.toggleMusic(); // mute music
    expect(() => engine.playSFX("hit")).not.toThrow();
  });

  it("init creates exactly 2 gain nodes (master + music)", () => {
    const ctx = mockAudioContext();
    (globalThis as any).AudioContext = function () { return ctx; };
    const engine = new AudioEngine();
    engine.init();
    // masterGain + musicGain = 2 calls
    expect(ctx.createGain).toHaveBeenCalledTimes(2);
  });
});

// ─── SpeechSynthesis Voice System ───

describe("SpeechSynthesis voice system", () => {
  let engine: AudioEngine;

  beforeEach(() => {
    (globalThis as any).AudioContext = function () {
      return {
        createGain: vi.fn(() => ({
          gain: { value: 0.5, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
          connect: vi.fn().mockReturnThis(), disconnect: vi.fn(),
        })),
        createOscillator: vi.fn(() => ({
          type: "", frequency: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
          connect: vi.fn().mockReturnThis(), start: vi.fn(), stop: vi.fn(), disconnect: vi.fn(),
        })),
        createBuffer: vi.fn(() => ({ getChannelData: vi.fn(() => new Float32Array(1000)) })),
        createBufferSource: vi.fn(() => ({
          buffer: null, loop: false, connect: vi.fn().mockReturnThis(), start: vi.fn(), stop: vi.fn(), disconnect: vi.fn(),
        })),
        createBiquadFilter: vi.fn(() => ({
          type: "", frequency: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
          Q: { value: 0 }, connect: vi.fn().mockReturnThis(),
        })),
        createWaveShaper: vi.fn(() => ({ curve: null, connect: vi.fn().mockReturnThis() })),
        destination: {},
        currentTime: 0,
        sampleRate: 44100,
        state: "running" as string,
        resume: vi.fn(),
      };
    };
    engine = new AudioEngine();
    engine.init();
  });

  afterEach(() => {
    delete (globalThis as any).AudioContext;
    delete (globalThis as any).window;
    vi.restoreAllMocks();
  });

  it("speakPowerUpName does nothing for unknown name", () => {
    expect(() => engine.speakPowerUpName("unknownPower")).not.toThrow();
  });

  it("speakPowerUpName does nothing when window.speechSynthesis is unavailable", () => {
    // Ensure no window.speechSynthesis
    const g_this = globalThis as any;
    const hadWindow = g_this.window;
    g_this.window = {};
    expect(() => engine.speakPowerUpName("kaioken")).not.toThrow();
    if (hadWindow) g_this.window = hadWindow;
    else delete g_this.window;
  });

  it("speakPowerUpName calls speechSynthesis.speak for known names", () => {
    const mockSpeak = vi.fn();
    const mockCancel = vi.fn();
    const mockGetVoices = vi.fn(() => []);
    const g_this = globalThis as any;
    const prevWindow = g_this.window;

    // SpeechSynthesisUtterance must be global (engine references it directly)
    const MockUtterance = class {
      text = "";
      pitch = 1;
      rate = 1;
      volume = 1;
      voice = null;
      constructor(t: string) { this.text = t; }
    };
    g_this.SpeechSynthesisUtterance = MockUtterance;

    g_this.window = {
      speechSynthesis: {
        speak: mockSpeak,
        cancel: mockCancel,
        getVoices: mockGetVoices,
      },
    };

    engine.speakPowerUpName("kaioken");

    expect(mockCancel).toHaveBeenCalled();
    expect(mockSpeak).toHaveBeenCalledTimes(1);

    if (prevWindow) g_this.window = prevWindow;
    else delete g_this.window;
    delete g_this.SpeechSynthesisUtterance;
  });
});

// ─── State Initialization ───

describe("State initialization for new fields", () => {
  it("makeGame initializes activePowerUpQueue as empty array", () => {
    const g = makeGame();
    expect(g.activePowerUpQueue).toEqual([]);
  });

  it("makeGame initializes spiritBombReady as false", () => {
    const g = makeGame();
    expect(g.spiritBombReady).toBe(false);
  });

  it("makeGame initializes afterimageUses as 0", () => {
    const g = makeGame();
    expect(g.afterimageUses).toBe(0);
  });

  it("makeGame initializes instantTransmissionUses as 0", () => {
    const g = makeGame();
    expect(g.instantTransmissionUses).toBe(0);
  });

  it("restoreAfterHit keeps IT uses and afterimage uses", () => {
    const g = makeDodgeState();
    g.instantTransmissionUses = 2;
    g.afterimageUses = 1;
    g.state = ST.HIT;

    restoreAfterHit(g);

    expect(g.instantTransmissionUses).toBe(2);
    expect(g.afterimageUses).toBe(1);
  });

  it("restoreAfterHit resets spiritBombCharging", () => {
    const g = makeDodgeState();
    g.spiritBombCharging = true;
    g.spiritBombTimer = 2;
    g.state = ST.HIT;

    restoreAfterHit(g);

    expect(g.spiritBombCharging).toBe(false);
    expect(g.spiritBombTimer).toBe(0);
  });
});

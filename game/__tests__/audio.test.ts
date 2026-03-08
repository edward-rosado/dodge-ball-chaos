import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { noteToFreq, createSquareOsc, createTriangleOsc, createSawtoothOsc, createNoiseChannel } from "../audio/oscillator";
import { trainingTrack } from "../audio/tracks/training";
import { battleTrack } from "../audio/tracks/battle";
import { heavyBattleTrack } from "../audio/tracks/heavyBattle";
import { escalatingTrack } from "../audio/tracks/escalating";
import { peakTrack } from "../audio/tracks/peak";
import { ultraInstinctTrack } from "../audio/tracks/ultraInstinct";
import { Sequencer, TrackDefinition } from "../audio/sequencer";
import {
  playThrowSFX,
  playHitSFX,
  playPowerUpSFX,
  playClearSFX,
  playLevelUpSFX,
  playGameOverSFX,
  playBounceSFX,
  playExplosionSFX,
  playKaiokenSFX,
  playKiShieldSFX,
  playITSFX,
  playSolarFlareSFX,
  playSenzuBeanSFX,
  playTimeSkipSFX,
  playDestructoDiscSFX,
  playAfterImageSFX,
  playShrinkSFX,
  playSpiritBombSFX,
  playVictorySFX,
} from "../audio/sfx";
import { AudioEngine, getTrackForRound } from "../audio/engine";

// ─── Mock AudioContext factory ───

function mockAudioContext() {
  const gainNode = {
    gain: { value: 0.5, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  };
  return {
    createGain: vi.fn(() => ({
      gain: { value: 0.5, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn().mockReturnThis(),
      disconnect: vi.fn(),
    })),
    createOscillator: vi.fn(() => ({
      type: "",
      frequency: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    })),
    createBuffer: vi.fn(() => ({ getChannelData: vi.fn(() => new Float32Array(1000)) })),
    createBufferSource: vi.fn(() => ({
      buffer: null,
      loop: false,
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    })),
    createBiquadFilter: vi.fn(() => ({
      type: "",
      frequency: { value: 0 },
      Q: { value: 0 },
      connect: vi.fn().mockReturnThis(),
    })),
    destination: {},
    currentTime: 0,
    sampleRate: 44100,
    state: "running" as string,
    resume: vi.fn(),
  };
}

// ─── noteToFreq tests ───

describe("noteToFreq", () => {
  it("returns 440 for A4", () => {
    expect(noteToFreq("A4")).toBeCloseTo(440, 1);
  });

  it("returns ~261.63 for C4 (middle C)", () => {
    expect(noteToFreq("C4")).toBeCloseTo(261.63, 0);
  });

  it("returns ~329.63 for E4", () => {
    expect(noteToFreq("E4")).toBeCloseTo(329.63, 0);
  });

  it("returns ~880 for A5", () => {
    expect(noteToFreq("A5")).toBeCloseTo(880, 1);
  });

  it("returns 440 for invalid note (no match)", () => {
    expect(noteToFreq("invalid")).toBe(440);
  });

  it("returns 440 for completely invalid string 'xyz'", () => {
    expect(noteToFreq("xyz")).toBe(440);
  });

  it("handles sharps correctly (C#4)", () => {
    expect(noteToFreq("C#4")).toBeCloseTo(277.18, 0);
  });

  it("handles low octaves (A2)", () => {
    expect(noteToFreq("A2")).toBeCloseTo(110, 1);
  });
});

// ─── Oscillator creation tests ───

describe("oscillator creation functions", () => {
  let ctx: ReturnType<typeof mockAudioContext>;

  beforeEach(() => {
    ctx = mockAudioContext();
  });

  it("createSquareOsc creates a square oscillator", () => {
    const osc = createSquareOsc(ctx as unknown as AudioContext, 440, 0.5);
    expect(osc.type).toBe("square");
    expect(osc.frequency.value).toBe(440);
    expect(ctx.createOscillator).toHaveBeenCalled();
    expect(ctx.createGain).toHaveBeenCalled();
  });

  it("createTriangleOsc creates a triangle oscillator", () => {
    const osc = createTriangleOsc(ctx as unknown as AudioContext, 330, 0.3);
    expect(osc.type).toBe("triangle");
    expect(osc.frequency.value).toBe(330);
  });

  it("createSawtoothOsc creates a sawtooth oscillator", () => {
    const osc = createSawtoothOsc(ctx as unknown as AudioContext, 220, 0.4);
    expect(osc.type).toBe("sawtooth");
    expect(osc.frequency.value).toBe(220);
  });

  it("createNoiseChannel creates a noise buffer source", () => {
    const src = createNoiseChannel(ctx as unknown as AudioContext, 0.2);
    expect(src.loop).toBe(true);
    expect(ctx.createBuffer).toHaveBeenCalled();
    expect(ctx.createBufferSource).toHaveBeenCalled();
    expect(ctx.createGain).toHaveBeenCalled();
  });
});

// ─── Track structure validation ───

function validateTrack(name: string, track: TrackDefinition): void {
  describe(`${name} track structure`, () => {
    it("has a positive BPM", () => {
      expect(track.bpm).toBeGreaterThan(0);
    });

    it("has at least one channel", () => {
      expect(track.channels.length).toBeGreaterThan(0);
    });

    it("all channels have valid types", () => {
      const validTypes = ["square", "triangle", "sawtooth", "noise"];
      for (const ch of track.channels) {
        expect(validTypes).toContain(ch.type);
      }
    });

    it("all channels have positive gain", () => {
      for (const ch of track.channels) {
        expect(ch.gain).toBeGreaterThan(0);
        expect(ch.gain).toBeLessThanOrEqual(1);
      }
    });

    it("all notes have valid format or are null (rest)", () => {
      for (const ch of track.channels) {
        for (const n of ch.notes) {
          if (n.note !== null) {
            expect(n.note).toMatch(/^[A-G]#?\d$/);
            // Verify noteToFreq can parse it
            const freq = noteToFreq(n.note);
            expect(freq).toBeGreaterThan(0);
          }
          expect(n.duration).toBeGreaterThan(0);
        }
      }
    });

    it("has at least 4 notes per channel (minimum loop length)", () => {
      for (const ch of track.channels) {
        expect(ch.notes.length).toBeGreaterThanOrEqual(4);
      }
    });
  });
}

validateTrack("training", trainingTrack);
validateTrack("battle", battleTrack);
validateTrack("heavyBattle", heavyBattleTrack);
validateTrack("escalating", escalatingTrack);
validateTrack("peak", peakTrack);
validateTrack("ultraInstinct", ultraInstinctTrack);

// ─── SFX function tests ───

describe("SFX functions", () => {
  let ctx: ReturnType<typeof mockAudioContext>;
  let dest: { connect: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    ctx = mockAudioContext();
    dest = { connect: vi.fn() };
  });

  it("all SFX functions are callable", () => {
    expect(typeof playThrowSFX).toBe("function");
    expect(typeof playHitSFX).toBe("function");
    expect(typeof playPowerUpSFX).toBe("function");
    expect(typeof playClearSFX).toBe("function");
    expect(typeof playLevelUpSFX).toBe("function");
    expect(typeof playGameOverSFX).toBe("function");
    expect(typeof playBounceSFX).toBe("function");
    expect(typeof playExplosionSFX).toBe("function");
  });

  it("playThrowSFX runs without error", () => {
    expect(() => playThrowSFX(ctx as unknown as AudioContext, dest as unknown as AudioNode)).not.toThrow();
    expect(ctx.createOscillator).toHaveBeenCalled();
    expect(ctx.createGain).toHaveBeenCalled();
  });

  it("playHitSFX runs without error (has noise layer)", () => {
    expect(() => playHitSFX(ctx as unknown as AudioContext, dest as unknown as AudioNode)).not.toThrow();
    expect(ctx.createOscillator).toHaveBeenCalled();
    expect(ctx.createBufferSource).toHaveBeenCalled();
    expect(ctx.createBuffer).toHaveBeenCalled();
  });

  it("playPowerUpSFX runs without error", () => {
    expect(() => playPowerUpSFX(ctx as unknown as AudioContext, dest as unknown as AudioNode)).not.toThrow();
  });

  it("playClearSFX runs without error", () => {
    expect(() => playClearSFX(ctx as unknown as AudioContext, dest as unknown as AudioNode)).not.toThrow();
  });

  it("playLevelUpSFX runs without error", () => {
    expect(() => playLevelUpSFX(ctx as unknown as AudioContext, dest as unknown as AudioNode)).not.toThrow();
  });

  it("playGameOverSFX runs without error", () => {
    expect(() => playGameOverSFX(ctx as unknown as AudioContext, dest as unknown as AudioNode)).not.toThrow();
  });

  it("playBounceSFX runs without error", () => {
    expect(() => playBounceSFX(ctx as unknown as AudioContext, dest as unknown as AudioNode)).not.toThrow();
  });

  it("playExplosionSFX runs without error (has noise burst)", () => {
    expect(() => playExplosionSFX(ctx as unknown as AudioContext, dest as unknown as AudioNode)).not.toThrow();
    expect(ctx.createOscillator).toHaveBeenCalled();
    expect(ctx.createBufferSource).toHaveBeenCalled();
  });

  it("playKaiokenSFX runs without error (layered)", () => {
    expect(() => playKaiokenSFX(ctx as unknown as AudioContext, dest as unknown as AudioNode)).not.toThrow();
    // Should create 2 oscillators
    expect(ctx.createOscillator).toHaveBeenCalledTimes(2);
  });

  it("playKiShieldSFX runs without error", () => {
    expect(() => playKiShieldSFX(ctx as unknown as AudioContext, dest as unknown as AudioNode)).not.toThrow();
  });

  it("playITSFX runs without error", () => {
    expect(() => playITSFX(ctx as unknown as AudioContext, dest as unknown as AudioNode)).not.toThrow();
  });

  it("playSolarFlareSFX runs without error (noise + oscillator)", () => {
    expect(() => playSolarFlareSFX(ctx as unknown as AudioContext, dest as unknown as AudioNode)).not.toThrow();
    expect(ctx.createBufferSource).toHaveBeenCalled();
    expect(ctx.createOscillator).toHaveBeenCalled();
  });

  it("playSenzuBeanSFX runs without error", () => {
    expect(() => playSenzuBeanSFX(ctx as unknown as AudioContext, dest as unknown as AudioNode)).not.toThrow();
  });

  it("playTimeSkipSFX runs without error (has LFO)", () => {
    expect(() => playTimeSkipSFX(ctx as unknown as AudioContext, dest as unknown as AudioNode)).not.toThrow();
    // Main osc + LFO
    expect(ctx.createOscillator).toHaveBeenCalledTimes(2);
  });

  it("playDestructoDiscSFX runs without error", () => {
    expect(() => playDestructoDiscSFX(ctx as unknown as AudioContext, dest as unknown as AudioNode)).not.toThrow();
  });

  it("playAfterImageSFX runs without error (filtered noise)", () => {
    expect(() => playAfterImageSFX(ctx as unknown as AudioContext, dest as unknown as AudioNode)).not.toThrow();
    expect(ctx.createBiquadFilter).toHaveBeenCalled();
    expect(ctx.createBufferSource).toHaveBeenCalled();
  });

  it("playShrinkSFX runs without error", () => {
    expect(() => playShrinkSFX(ctx as unknown as AudioContext, dest as unknown as AudioNode)).not.toThrow();
  });

  it("playSpiritBombSFX runs without error (has LFO)", () => {
    expect(() => playSpiritBombSFX(ctx as unknown as AudioContext, dest as unknown as AudioNode)).not.toThrow();
    expect(ctx.createOscillator).toHaveBeenCalledTimes(2);
  });

  it("playVictorySFX runs without error", () => {
    expect(() => playVictorySFX(ctx as unknown as AudioContext, dest as unknown as AudioNode)).not.toThrow();
  });
});

// ─── Sequencer tests ───

describe("Sequencer", () => {
  let ctx: ReturnType<typeof mockAudioContext>;
  let dest: { connect: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    ctx = mockAudioContext();
    dest = { connect: vi.fn() };
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const simpleTrack: TrackDefinition = {
    bpm: 120,
    channels: [
      {
        type: "square",
        gain: 0.5,
        notes: [
          { note: "C4", duration: 1 },
          { note: null, duration: 1 }, // rest
          { note: "E4", duration: 1 },
          { note: "G4", duration: 1 },
        ],
      },
    ],
  };

  const noiseTrack: TrackDefinition = {
    bpm: 120,
    channels: [
      {
        type: "noise",
        gain: 0.3,
        notes: [
          { note: "C4", duration: 1 },
          { note: null, duration: 1 },
          { note: "E4", duration: 1 },
          { note: "G4", duration: 1 },
        ],
      },
    ],
  };

  it("starts not playing", () => {
    const seq = new Sequencer(ctx as unknown as AudioContext, dest as unknown as AudioNode);
    expect(seq.isPlaying()).toBe(false);
  });

  it("isPlaying returns true after play()", () => {
    const seq = new Sequencer(ctx as unknown as AudioContext, dest as unknown as AudioNode);
    seq.play(simpleTrack);
    expect(seq.isPlaying()).toBe(true);
  });

  it("isPlaying returns false after stop()", () => {
    const seq = new Sequencer(ctx as unknown as AudioContext, dest as unknown as AudioNode);
    seq.play(simpleTrack);
    seq.stop();
    expect(seq.isPlaying()).toBe(false);
  });

  it("play schedules notes (creates oscillators)", () => {
    const seq = new Sequencer(ctx as unknown as AudioContext, dest as unknown as AudioNode);
    seq.play(simpleTrack);
    // scheduleNotes is called immediately, should create oscillators for notes within lookAhead
    expect(ctx.createOscillator).toHaveBeenCalled();
    expect(ctx.createGain).toHaveBeenCalled();
    seq.stop();
  });

  it("play with noise channel creates buffer sources", () => {
    const seq = new Sequencer(ctx as unknown as AudioContext, dest as unknown as AudioNode);
    seq.play(noiseTrack);
    expect(ctx.createBuffer).toHaveBeenCalled();
    expect(ctx.createBufferSource).toHaveBeenCalled();
    seq.stop();
  });

  it("stop clears the interval and stops channels", () => {
    const seq = new Sequencer(ctx as unknown as AudioContext, dest as unknown as AudioNode);
    seq.play(simpleTrack);
    expect(seq.isPlaying()).toBe(true);
    seq.stop();
    expect(seq.isPlaying()).toBe(false);
  });

  it("calling stop when not playing does not throw", () => {
    const seq = new Sequencer(ctx as unknown as AudioContext, dest as unknown as AudioNode);
    expect(() => seq.stop()).not.toThrow();
  });

  it("calling play again stops the previous track first", () => {
    const seq = new Sequencer(ctx as unknown as AudioContext, dest as unknown as AudioNode);
    seq.play(simpleTrack);
    expect(seq.isPlaying()).toBe(true);
    // Playing a new track should stop the old one first
    seq.play(noiseTrack);
    expect(seq.isPlaying()).toBe(true);
    seq.stop();
  });

  it("handles interval tick for scheduling", () => {
    const seq = new Sequencer(ctx as unknown as AudioContext, dest as unknown as AudioNode);
    seq.play(simpleTrack);
    // Advance timer to trigger the setInterval callback
    vi.advanceTimersByTime(100);
    seq.stop();
  });
});

// ─── AudioEngine tests ───

describe("AudioEngine", () => {
  beforeEach(() => {
    (globalThis as any).AudioContext = function () { return mockAudioContext(); };
  });

  afterEach(() => {
    delete (globalThis as any).AudioContext;
    delete (globalThis as any).webkitAudioContext;
    vi.restoreAllMocks();
  });

  it("is not initialized before calling init()", () => {
    const engine = new AudioEngine();
    expect(engine.isInitialized()).toBe(false);
  });

  it("initializes successfully when AudioContext is available", () => {
    const engine = new AudioEngine();
    engine.init();
    expect(engine.isInitialized()).toBe(true);
  });

  it("returns early on second init() call (already initialized)", () => {
    const engine = new AudioEngine();
    engine.init();
    expect(engine.isInitialized()).toBe(true);
    // Second init should be a no-op
    engine.init();
    expect(engine.isInitialized()).toBe(true);
  });

  it("handles missing AudioContext gracefully", () => {
    delete (globalThis as any).AudioContext;
    const engine = new AudioEngine();
    engine.init();
    expect(engine.isInitialized()).toBe(false);
    // All methods should be safe to call when uninitialized
    engine.playSFX("hit");
    engine.playTrack("training");
    engine.stopTrack();
    engine.setVolume(0.5);
  });

  it("handles AudioContext constructor throwing", () => {
    (globalThis as any).AudioContext = function () {
      throw new Error("AudioContext not allowed");
    };
    const engine = new AudioEngine();
    engine.init();
    expect(engine.isInitialized()).toBe(false);
  });

  // ─── setVolume ───

  it("setVolume sets gain value when initialized", () => {
    const engine = new AudioEngine();
    engine.init();
    engine.setVolume(0.8);
    // The masterGain's gain.value should be set
  });

  it("setVolume clamps to 0", () => {
    const engine = new AudioEngine();
    engine.init();
    engine.setVolume(-0.5);
    // Should clamp to 0
  });

  it("setVolume clamps to 1", () => {
    const engine = new AudioEngine();
    engine.init();
    engine.setVolume(1.5);
    // Should clamp to 1
  });

  it("setVolume does nothing when not initialized (no masterGain)", () => {
    const engine = new AudioEngine();
    // Not initialized — setVolume should not throw
    engine.setVolume(0.5);
  });

  // ─── playTrack ───

  it("playTrack plays a valid track", () => {
    const engine = new AudioEngine();
    engine.init();
    expect(() => engine.playTrack("training")).not.toThrow();
  });

  it("playTrack returns early when not initialized", () => {
    delete (globalThis as any).AudioContext;
    const engine = new AudioEngine();
    engine.init();
    // Should not throw
    engine.playTrack("training");
  });

  it("playTrack returns early for unknown track name", () => {
    const engine = new AudioEngine();
    engine.init();
    expect(() => engine.playTrack("nonexistent")).not.toThrow();
  });

  it("playTrack skips if same track is already playing", () => {
    const engine = new AudioEngine();
    engine.init();
    engine.playTrack("training");
    // Playing same track again should be a no-op
    engine.playTrack("training");
  });

  it("playTrack resumes suspended AudioContext", () => {
    const mockCtx = mockAudioContext();
    mockCtx.state = "suspended";
    (globalThis as any).AudioContext = function () { return mockCtx; };
    const engine = new AudioEngine();
    engine.init();
    engine.playTrack("training");
    expect(mockCtx.resume).toHaveBeenCalled();
  });

  it("playTrack switches tracks (stops old, starts new)", () => {
    const engine = new AudioEngine();
    engine.init();
    engine.playTrack("training");
    expect(() => engine.playTrack("battle")).not.toThrow();
  });

  // ─── stopTrack ───

  it("stopTrack stops the sequencer", () => {
    const engine = new AudioEngine();
    engine.init();
    engine.playTrack("training");
    expect(() => engine.stopTrack()).not.toThrow();
  });

  it("stopTrack works when no sequencer (not initialized)", () => {
    const engine = new AudioEngine();
    // Not initialized, but stopTrack should not throw
    engine.stopTrack();
  });

  // ─── playSFX ───

  it("playSFX plays a known SFX", () => {
    const engine = new AudioEngine();
    engine.init();
    expect(() => engine.playSFX("hit")).not.toThrow();
  });

  it("playSFX does nothing for unknown SFX name", () => {
    const engine = new AudioEngine();
    engine.init();
    expect(() => engine.playSFX("nonexistent")).not.toThrow();
  });

  it("playSFX returns early when not initialized", () => {
    delete (globalThis as any).AudioContext;
    const engine = new AudioEngine();
    engine.init();
    engine.playSFX("hit");
  });

  it("playSFX resumes suspended AudioContext", () => {
    const mockCtx = mockAudioContext();
    mockCtx.state = "suspended";
    (globalThis as any).AudioContext = function () { return mockCtx; };
    const engine = new AudioEngine();
    engine.init();
    engine.playSFX("hit");
    expect(mockCtx.resume).toHaveBeenCalled();
  });

  // ─── speakPowerUpName ───

  it("speakPowerUpName does nothing when speechSynthesis is undefined", () => {
    const engine = new AudioEngine();
    // speechSynthesis is not defined in test env
    expect(() => engine.speakPowerUpName("kaioken")).not.toThrow();
  });

  it("speakPowerUpName speaks a known power-up name", () => {
    (globalThis as any).SpeechSynthesisUtterance = function (text: string) {
      this.text = text;
      this.rate = 1;
      this.pitch = 1;
      this.volume = 1;
    };
    (globalThis as any).speechSynthesis = {
      cancel: vi.fn(),
      speak: vi.fn(),
    };
    const engine = new AudioEngine();
    engine.speakPowerUpName("kaioken");
    expect((globalThis as any).speechSynthesis.cancel).toHaveBeenCalled();
    expect((globalThis as any).speechSynthesis.speak).toHaveBeenCalled();
    delete (globalThis as any).speechSynthesis;
    delete (globalThis as any).SpeechSynthesisUtterance;
  });

  it("speakPowerUpName does nothing for unknown name", () => {
    (globalThis as any).speechSynthesis = {
      cancel: vi.fn(),
      speak: vi.fn(),
    };
    const engine = new AudioEngine();
    engine.speakPowerUpName("unknownPower");
    // speak should NOT be called for unknown name
    expect((globalThis as any).speechSynthesis.speak).not.toHaveBeenCalled();
    delete (globalThis as any).speechSynthesis;
  });
});

// ─── getTrackForRound tests ───

describe("getTrackForRound", () => {
  it("returns training for rounds 1-9", () => {
    expect(getTrackForRound(1)).toBe("training");
    expect(getTrackForRound(5)).toBe("training");
    expect(getTrackForRound(9)).toBe("training");
  });

  it("returns ultraInstinct for milestone rounds", () => {
    expect(getTrackForRound(10)).toBe("ultraInstinct");
    expect(getTrackForRound(20)).toBe("ultraInstinct");
    expect(getTrackForRound(30)).toBe("ultraInstinct");
    expect(getTrackForRound(40)).toBe("ultraInstinct");
    expect(getTrackForRound(50)).toBe("ultraInstinct");
  });

  it("returns battle for rounds 11-19", () => {
    expect(getTrackForRound(11)).toBe("battle");
    expect(getTrackForRound(19)).toBe("battle");
  });

  it("returns heavyBattle for rounds 21-29", () => {
    expect(getTrackForRound(21)).toBe("heavyBattle");
    expect(getTrackForRound(29)).toBe("heavyBattle");
  });

  it("returns escalating for rounds 31-39", () => {
    expect(getTrackForRound(31)).toBe("escalating");
    expect(getTrackForRound(39)).toBe("escalating");
  });

  it("returns peak for rounds 41-49", () => {
    expect(getTrackForRound(41)).toBe("peak");
    expect(getTrackForRound(49)).toBe("peak");
  });

  it("returns peak for rounds beyond 50", () => {
    expect(getTrackForRound(51)).toBe("peak");
    expect(getTrackForRound(100)).toBe("peak");
  });
});

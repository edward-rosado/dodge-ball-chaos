import { describe, it, expect, vi } from "vitest";
import { noteToFreq } from "../audio/oscillator";
import { trainingTrack } from "../audio/tracks/training";
import { battleTrack } from "../audio/tracks/battle";
import { heavyBattleTrack } from "../audio/tracks/heavyBattle";
import { escalatingTrack } from "../audio/tracks/escalating";
import { peakTrack } from "../audio/tracks/peak";
import { ultraInstinctTrack } from "../audio/tracks/ultraInstinct";
import { TrackDefinition } from "../audio/sequencer";
import {
  playThrowSFX,
  playHitSFX,
  playPowerUpSFX,
  playClearSFX,
  playLevelUpSFX,
  playGameOverSFX,
  playBounceSFX,
  playExplosionSFX,
} from "../audio/sfx";
import { AudioEngine, getTrackForRound } from "../audio/engine";

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

  it("returns 440 for invalid note", () => {
    expect(noteToFreq("invalid")).toBe(440);
  });

  it("handles sharps correctly (C#4)", () => {
    expect(noteToFreq("C#4")).toBeCloseTo(277.18, 0);
  });

  it("handles low octaves (A2)", () => {
    expect(noteToFreq("A2")).toBeCloseTo(110, 1);
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

// ─── SFX existence tests ───

describe("SFX functions", () => {
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
});

// ─── AudioEngine tests ───

describe("AudioEngine", () => {
  it("is not initialized before calling init()", () => {
    const engine = new AudioEngine();
    expect(engine.isInitialized()).toBe(false);
  });

  it("handles missing AudioContext gracefully", () => {
    // In test env, AudioContext is not defined
    const engine = new AudioEngine();
    // Should not throw
    engine.init();
    // playSFX and playTrack should no-op without errors
    engine.playSFX("hit");
    engine.playTrack("training");
    engine.stopTrack();
    engine.setVolume(0.5);
  });

  it("gracefully handles init in non-browser environment", () => {
    // In Node/test environment, AudioContext is not available
    // Engine should remain uninitialized without throwing
    const engine = new AudioEngine();
    engine.init();
    expect(engine.isInitialized()).toBe(false);
    // All methods should be safe to call when uninitialized
    engine.playTrack("training");
    engine.playSFX("hit");
    engine.stopTrack();
    engine.setVolume(0.5);
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

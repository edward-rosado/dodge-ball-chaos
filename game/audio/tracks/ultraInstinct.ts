import { TrackDefinition } from "../sequencer";

/**
 * Ultra Instinct track (Milestone levels: 10, 20, 30, 40, 50).
 * Inspired by DBS "Ultimate Battle / Ka Ka Kachi Daze" — the iconic UI activation theme.
 * Key: B minor. Tempo: ~155 BPM.
 * Features: ethereal high pads, signature ascending chromatic melody,
 * heavy octave bass, and aggressive driving percussion.
 */
export const ultraInstinctTrack: TrackDefinition = {
  bpm: 155,
  channels: [
    // ── Ethereal choir pad — high sustained triangle chords for transcendence ──
    {
      type: "triangle",
      gain: 0.08,
      notes: [
        { note: "F#5", duration: 4 },
        { note: "B4", duration: 2 },
        { note: "D5", duration: 2 },
        { note: "E5", duration: 4 },
        { note: "F#5", duration: 2 },
        { note: "G5", duration: 2 },
        { note: "F#5", duration: 4 },
        { note: "D5", duration: 2 },
        { note: "E5", duration: 2 },
        { note: "B4", duration: 4 },
        { note: "F#5", duration: 2 },
        { note: "E5", duration: 2 },
      ],
    },
    // ── Signature ascending melody — the iconic UI motif ──
    // Punchy square wave melody that builds and releases
    {
      type: "square",
      gain: 0.06,
      notes: [
        // Intro: ethereal start — silence letting pads breathe
        { note: null, duration: 2 },
        // Phrase 1: the iconic ascending run
        { note: "B4", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "D5", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "E5", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "F#5", duration: 0.75 },
        { note: "G5", duration: 0.5 },
        { note: "F#5", duration: 0.5 },
        { note: "E5", duration: 0.5 },
        { note: "D5", duration: 0.75 },
        { note: null, duration: 0.5 },
        // Phrase 2: climb higher — building intensity
        { note: "E5", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "F#5", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "G5", duration: 0.5 },
        { note: "A5", duration: 0.5 },
        { note: "B5", duration: 1 },
        { note: "A5", duration: 0.5 },
        { note: "G5", duration: 0.5 },
        { note: "F#5", duration: 0.75 },
        { note: null, duration: 0.5 },
        // Phrase 3: dramatic peak — the transcendent moment
        { note: "B4", duration: 0.25 },
        { note: "D5", duration: 0.25 },
        { note: "F#5", duration: 0.25 },
        { note: "A5", duration: 0.25 },
        { note: "B5", duration: 2 },
        { note: "A5", duration: 0.5 },
        { note: "F#5", duration: 0.5 },
        { note: "E5", duration: 0.5 },
        { note: "D5", duration: 0.5 },
        { note: "B4", duration: 1 },
        { note: null, duration: 1 },
        // Phrase 4: descending resolve with octave jump
        { note: "F#5", duration: 0.5 },
        { note: "E5", duration: 0.5 },
        { note: "D5", duration: 0.5 },
        { note: "B4", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "F#4", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "B4", duration: 0.5 },
        { note: "D5", duration: 0.5 },
        { note: "F#5", duration: 1.5 },
        { note: null, duration: 1.5 },
      ],
    },
    // ── Counter melody — sawtooth with reverb feel, lower octave harmonics ──
    {
      type: "sawtooth",
      gain: 0.025,
      notes: [
        { note: null, duration: 8 },
        { note: "B3", duration: 1 },
        { note: null, duration: 0.5 },
        { note: "D4", duration: 1 },
        { note: null, duration: 0.5 },
        { note: "F#4", duration: 1 },
        { note: "E4", duration: 1 },
        { note: null, duration: 2 },
        { note: "D4", duration: 1 },
        { note: null, duration: 0.5 },
        { note: "E4", duration: 1 },
        { note: null, duration: 0.5 },
        { note: "F#4", duration: 1 },
        { note: "G4", duration: 0.5 },
        { note: "A4", duration: 0.5 },
        { note: "B4", duration: 2 },
        { note: null, duration: 2 },
        { note: "G4", duration: 1 },
        { note: "F#4", duration: 1 },
        { note: "E4", duration: 1 },
        { note: "D4", duration: 1 },
        { note: "B3", duration: 2 },
        { note: null, duration: 2 },
      ],
    },
    // ── Heavy octave bass — pounding and relentless ──
    {
      type: "triangle",
      gain: 0.18,
      notes: [
        // Pattern: octave hits with syncopation
        { note: "B1", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "B2", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "B1", duration: 0.5 },
        { note: "B1", duration: 0.25 },
        { note: null, duration: 0.25 },
        { note: "D2", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "E2", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "F#2", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "F#1", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "G2", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "F#2", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "E2", duration: 0.5 },
        { note: "D2", duration: 0.5 },
        { note: "B1", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "B2", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "A2", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "G2", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "F#2", duration: 0.5 },
        { note: "E2", duration: 0.5 },
        { note: "B1", duration: 1 },
      ],
    },
    // ── Aggressive drums — hard kick/snare with ghost notes ──
    {
      type: "noise",
      gain: 0.05,
      notes: [
        // Measure 1 — hard-hitting 4-on-floor with syncopated snare
        { note: "C1", duration: 0.25 },   // kick
        { note: null, duration: 0.25 },
        { note: "C1", duration: 0.125 },   // ghost kick
        { note: null, duration: 0.125 },
        { note: "C2", duration: 0.25 },   // snare
        { note: null, duration: 0.125 },
        { note: "C1", duration: 0.125 },   // ghost
        { note: "C1", duration: 0.25 },   // kick
        { note: "C1", duration: 0.125 },
        { note: null, duration: 0.125 },
        { note: "C2", duration: 0.25 },   // snare
        { note: "C1", duration: 0.125 },
        { note: "C1", duration: 0.125 },
        // Measure 2 — fill with double snare
        { note: "C1", duration: 0.25 },   // kick
        { note: null, duration: 0.125 },
        { note: "C1", duration: 0.125 },
        { note: "C2", duration: 0.25 },   // snare
        { note: null, duration: 0.25 },
        { note: "C1", duration: 0.25 },   // kick
        { note: null, duration: 0.125 },
        { note: "C1", duration: 0.125 },
        { note: "C2", duration: 0.25 },   // snare
        { note: "C2", duration: 0.125 },  // double snare
        { note: null, duration: 0.125 },
      ],
    },
    // ── Fast hi-hat pattern — 16th note urgency ──
    {
      type: "noise",
      gain: 0.018,
      notes: [
        { note: "C4", duration: 0.25 },
        { note: "C4", duration: 0.125 },
        { note: null, duration: 0.125 },
        { note: "C4", duration: 0.25 },
        { note: "C4", duration: 0.125 },
        { note: "C4", duration: 0.125 },
        { note: "C4", duration: 0.25 },
        { note: "C4", duration: 0.125 },
        { note: null, duration: 0.125 },
        { note: "C4", duration: 0.25 },
        { note: "C4", duration: 0.125 },
        { note: "C4", duration: 0.125 },
      ],
    },
    // ── Ethereal high shimmer — glass-like texture for transcendence ──
    {
      type: "sine",
      gain: 0.03,
      notes: [
        { note: "B6", duration: 2 },
        { note: null, duration: 2 },
        { note: "F#6", duration: 2 },
        { note: null, duration: 2 },
        { note: "G6", duration: 1 },
        { note: "A6", duration: 1 },
        { note: "B6", duration: 2 },
        { note: null, duration: 2 },
        { note: "D7", duration: 1 },
        { note: null, duration: 1 },
        { note: "B6", duration: 2 },
        { note: null, duration: 2 },
        { note: "F#6", duration: 2 },
        { note: null, duration: 1 },
        { note: "E6", duration: 1 },
      ],
    },
  ],
};

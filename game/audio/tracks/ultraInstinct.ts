import { TrackDefinition } from "../sequencer";

/**
 * Ultra Instinct track (Milestone levels: 10, 20, 30, 40, 50).
 * Inspired by DBS Ultra Instinct activation — ethereal pads over a driving
 * rhythm with an ascending melodic motif that builds intensity.
 * Key: E minor. Tempo: ~140 BPM. Should feel transcendent yet urgent.
 */
export const ultraInstinctTrack: TrackDefinition = {
  bpm: 140,
  channels: [
    // ── Ethereal choir pad — sustained, wide triangle chords ──
    {
      type: "triangle",
      gain: 0.09,
      notes: [
        { note: "B4", duration: 4 },
        { note: "E5", duration: 4 },
        { note: "G4", duration: 4 },
        { note: "A4", duration: 2 },
        { note: "B4", duration: 2 },
        { note: "E5", duration: 4 },
        { note: "D5", duration: 4 },
        { note: "B4", duration: 4 },
        { note: "G4", duration: 4 },
      ],
    },
    // ── Iconic ascending staccato melody — square wave ──
    // The signature UI motif: short punchy ascending notes building tension
    {
      type: "square",
      gain: 0.07,
      notes: [
        // Phrase 1: ascending motif (iconic)
        { note: "E5", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "G5", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "A5", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "B5", duration: 0.75 },
        { note: null, duration: 0.5 },
        { note: "E6", duration: 1 },
        { note: "D6", duration: 0.5 },
        { note: "B5", duration: 0.5 },
        { note: "A5", duration: 1 },
        { note: null, duration: 0.5 },
        // Phrase 2: call-and-response — descend then climb higher
        { note: "B5", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "A5", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "G5", duration: 0.5 },
        { note: "E5", duration: 0.5 },
        { note: null, duration: 0.5 },
        { note: "G5", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "A5", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "B5", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "D6", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "E6", duration: 1.5 },
        { note: null, duration: 0.5 },
        // Phrase 3: dramatic peak — sustained high note with build
        { note: "E5", duration: 0.5 },
        { note: "G5", duration: 0.5 },
        { note: "B5", duration: 0.5 },
        { note: "D6", duration: 0.5 },
        { note: "E6", duration: 2 },
        { note: "D6", duration: 1 },
        { note: "B5", duration: 0.5 },
        { note: "A5", duration: 0.5 },
        { note: "G5", duration: 1 },
        { note: "E5", duration: 1 },
        { note: null, duration: 1 },
      ],
    },
    // ── Counter melody — sawtooth, lower register, adds grit ──
    {
      type: "sawtooth",
      gain: 0.03,
      notes: [
        { note: null, duration: 4 },
        { note: "E4", duration: 1 },
        { note: null, duration: 0.5 },
        { note: "G4", duration: 1 },
        { note: null, duration: 0.5 },
        { note: "B4", duration: 1 },
        { note: "A4", duration: 1 },
        { note: null, duration: 4 },
        { note: "G4", duration: 1 },
        { note: null, duration: 0.5 },
        { note: "A4", duration: 1 },
        { note: null, duration: 0.5 },
        { note: "B4", duration: 1 },
        { note: "D5", duration: 1 },
        { note: null, duration: 2 },
      ],
    },
    // ── Pulsing bass — heavy and driving ──
    {
      type: "triangle",
      gain: 0.16,
      notes: [
        { note: "E2", duration: 1 },
        { note: null, duration: 0.5 },
        { note: "E2", duration: 0.5 },
        { note: "E2", duration: 1 },
        { note: null, duration: 0.5 },
        { note: "G2", duration: 0.5 },
        { note: "A2", duration: 1 },
        { note: null, duration: 0.5 },
        { note: "A2", duration: 0.5 },
        { note: "B2", duration: 1 },
        { note: null, duration: 0.5 },
        { note: "B2", duration: 0.5 },
        { note: "E2", duration: 1 },
        { note: null, duration: 0.5 },
        { note: "E2", duration: 0.5 },
        { note: "D3", duration: 1 },
        { note: null, duration: 0.5 },
        { note: "D3", duration: 0.5 },
        { note: "C3", duration: 1 },
        { note: null, duration: 0.5 },
        { note: "B2", duration: 0.5 },
        { note: "A2", duration: 1 },
        { note: "E2", duration: 1 },
      ],
    },
    // ── Driving percussion — urgent 4-on-the-floor with syncopation ──
    {
      type: "noise",
      gain: 0.04,
      notes: [
        // Kick-snare pattern
        { note: "C1", duration: 0.5 },   // kick
        { note: null, duration: 0.25 },
        { note: "C1", duration: 0.25 },   // ghost kick
        { note: "C2", duration: 0.5 },   // snare
        { note: null, duration: 0.25 },
        { note: "C1", duration: 0.25 },   // kick
        { note: "C1", duration: 0.5 },   // kick
        { note: "C1", duration: 0.25 },   // ghost
        { note: null, duration: 0.25 },
        { note: "C2", duration: 0.5 },   // snare
        { note: "C1", duration: 0.25 },   // ghost
        { note: "C1", duration: 0.25 },   // ghost
      ],
    },
    // ── Hi-hat shimmer — adds urgency ──
    {
      type: "noise",
      gain: 0.015,
      notes: [
        { note: "C4", duration: 0.25 },
        { note: null, duration: 0.25 },
        { note: "C4", duration: 0.25 },
        { note: null, duration: 0.25 },
        { note: "C4", duration: 0.25 },
        { note: "C4", duration: 0.125 },
        { note: null, duration: 0.125 },
        { note: "C4", duration: 0.25 },
        { note: null, duration: 0.25 },
        { note: "C4", duration: 0.25 },
        { note: null, duration: 0.25 },
        { note: "C4", duration: 0.25 },
        { note: "C4", duration: 0.125 },
        { note: "C4", duration: 0.125 },
        { note: null, duration: 0.25 },
      ],
    },
  ],
};

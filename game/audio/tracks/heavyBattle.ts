import { TrackDefinition } from "../sequencer";

/**
 * Heavy Battle track (Levels 21-29): Darker, heavier.
 * Key: D minor | Tempo: ~130 BPM
 * Low bass, power chord feel, aggressive rhythm.
 */
export const heavyBattleTrack: TrackDefinition = {
  bpm: 130,
  channels: [
    // Lead — sawtooth for gritty feel
    {
      type: "sawtooth",
      gain: 0.05,
      notes: [
        { note: "D5", duration: 0.5 },
        { note: "F5", duration: 0.25 },
        { note: "A5", duration: 0.25 },
        { note: "D5", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "C5", duration: 0.25 },
        { note: "D5", duration: 0.5 },
        { note: "A4", duration: 0.5 },
        { note: "A#4", duration: 0.25 },
        { note: "A4", duration: 0.25 },
        { note: "G4", duration: 0.5 },
        { note: "A4", duration: 0.5 },
        { note: "D5", duration: 0.5 },
        { note: "C5", duration: 0.25 },
        { note: "A#4", duration: 0.25 },
        { note: "A4", duration: 0.5 },
        { note: null, duration: 0.25 },
        { note: "G4", duration: 0.25 },
        { note: "A4", duration: 0.5 },
        { note: "D5", duration: 1 },
      ],
    },
    // Power bass — triangle, low and heavy
    {
      type: "triangle",
      gain: 0.16,
      notes: [
        { note: "D2", duration: 0.5 },
        { note: "D2", duration: 0.25 },
        { note: null, duration: 0.25 },
        { note: "D2", duration: 0.5 },
        { note: "F2", duration: 0.5 },
        { note: "A#2", duration: 0.5 },
        { note: "A2", duration: 0.25 },
        { note: null, duration: 0.25 },
        { note: "G2", duration: 0.5 },
        { note: "A2", duration: 0.5 },
        { note: "D2", duration: 0.5 },
        { note: "D2", duration: 0.25 },
        { note: null, duration: 0.25 },
        { note: "C3", duration: 0.5 },
        { note: "A2", duration: 0.5 },
      ],
    },
    // Aggressive percussion
    {
      type: "noise",
      gain: 0.05,
      notes: [
        { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.125 },
        { note: null, duration: 0.125 },
        { note: "C1", duration: 0.25 },
        { note: null, duration: 0.25 },
        { note: "C1", duration: 0.125 },
        { note: "C1", duration: 0.125 },
        { note: "C1", duration: 0.25 },
        { note: null, duration: 0.25 },
        { note: "C1", duration: 0.125 },
        { note: null, duration: 0.125 },
      ],
    },
  ],
};

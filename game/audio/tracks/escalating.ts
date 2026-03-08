import { TrackDefinition } from "../sequencer";

/**
 * Escalating track (Levels 31-39): Building tension.
 * Key: E minor | Tempo: ~150 BPM
 * Rising patterns, urgency.
 */
export const escalatingTrack: TrackDefinition = {
  bpm: 150,
  channels: [
    // Lead — square wave, rising patterns
    {
      type: "square",
      gain: 0.07,
      notes: [
        { note: "E4", duration: 0.25 },
        { note: "G4", duration: 0.25 },
        { note: "B4", duration: 0.25 },
        { note: "E5", duration: 0.25 },
        { note: "F#5", duration: 0.25 },
        { note: "G5", duration: 0.25 },
        { note: "B5", duration: 0.5 },
        { note: "A5", duration: 0.25 },
        { note: "G5", duration: 0.25 },
        { note: "F#5", duration: 0.25 },
        { note: "E5", duration: 0.25 },
        { note: "D5", duration: 0.25 },
        { note: "E5", duration: 0.25 },
        { note: "G5", duration: 0.5 },
        { note: "E5", duration: 0.5 },
        { note: "E4", duration: 0.25 },
        { note: "B4", duration: 0.25 },
        { note: "D5", duration: 0.25 },
        { note: "E5", duration: 0.25 },
        { note: "G5", duration: 0.25 },
        { note: "A5", duration: 0.25 },
        { note: "B5", duration: 0.5 },
        { note: "E5", duration: 1 },
      ],
    },
    // Bass — triangle, driving
    {
      type: "triangle",
      gain: 0.14,
      notes: [
        { note: "E2", duration: 0.5 },
        { note: "E2", duration: 0.25 },
        { note: null, duration: 0.25 },
        { note: "B2", duration: 0.5 },
        { note: "E2", duration: 0.5 },
        { note: "G2", duration: 0.5 },
        { note: "A2", duration: 0.25 },
        { note: null, duration: 0.25 },
        { note: "B2", duration: 0.5 },
        { note: "E2", duration: 0.5 },
        { note: "D3", duration: 0.5 },
        { note: "C3", duration: 0.25 },
        { note: null, duration: 0.25 },
        { note: "B2", duration: 0.5 },
        { note: "E2", duration: 0.5 },
      ],
    },
    // Fast percussion
    {
      type: "noise",
      gain: 0.04,
      notes: [
        { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.125 },
        { note: null, duration: 0.125 },
        { note: "C1", duration: 0.125 },
        { note: "C1", duration: 0.125 },
        { note: null, duration: 0.25 },
        { note: "C1", duration: 0.25 },
        { note: null, duration: 0.25 },
        { note: "C1", duration: 0.125 },
        { note: "C1", duration: 0.125 },
      ],
    },
  ],
};

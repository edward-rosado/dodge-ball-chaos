import { TrackDefinition } from "../sequencer";

/**
 * Peak track (Levels 41-49): Relentless, maximum intensity.
 * Key: B minor | Tempo: ~160 BPM
 * Complex rhythms, maximum intensity.
 */
export const peakTrack: TrackDefinition = {
  bpm: 160,
  channels: [
    // Lead — square wave, relentless
    {
      type: "square",
      gain: 0.07,
      notes: [
        { note: "B4", duration: 0.25 },
        { note: "D5", duration: 0.25 },
        { note: "F#5", duration: 0.25 },
        { note: "B5", duration: 0.25 },
        { note: "A5", duration: 0.125 },
        { note: "G5", duration: 0.125 },
        { note: "F#5", duration: 0.25 },
        { note: "E5", duration: 0.25 },
        { note: "F#5", duration: 0.25 },
        { note: "D5", duration: 0.25 },
        { note: "B4", duration: 0.25 },
        { note: "D5", duration: 0.125 },
        { note: "E5", duration: 0.125 },
        { note: "F#5", duration: 0.25 },
        { note: "A5", duration: 0.25 },
        { note: "G5", duration: 0.25 },
        { note: "F#5", duration: 0.125 },
        { note: "E5", duration: 0.125 },
        { note: "D5", duration: 0.25 },
        { note: "B4", duration: 0.5 },
      ],
    },
    // Counter melody — sawtooth
    {
      type: "sawtooth",
      gain: 0.04,
      notes: [
        { note: "B3", duration: 0.5 },
        { note: "D4", duration: 0.5 },
        { note: "F#4", duration: 0.25 },
        { note: "E4", duration: 0.25 },
        { note: "D4", duration: 0.5 },
        { note: "B3", duration: 0.25 },
        { note: "A3", duration: 0.25 },
        { note: "G3", duration: 0.5 },
        { note: "A3", duration: 0.5 },
        { note: "B3", duration: 0.5 },
        { note: "D4", duration: 0.5 },
        { note: "E4", duration: 0.25 },
        { note: "F#4", duration: 0.25 },
      ],
    },
    // Bass — triangle, aggressive
    {
      type: "triangle",
      gain: 0.16,
      notes: [
        { note: "B1", duration: 0.25 },
        { note: "B1", duration: 0.125 },
        { note: null, duration: 0.125 },
        { note: "B1", duration: 0.25 },
        { note: "D2", duration: 0.25 },
        { note: "E2", duration: 0.25 },
        { note: "F#2", duration: 0.125 },
        { note: null, duration: 0.125 },
        { note: "E2", duration: 0.25 },
        { note: "D2", duration: 0.25 },
        { note: "B1", duration: 0.25 },
        { note: "A1", duration: 0.125 },
        { note: null, duration: 0.125 },
        { note: "B1", duration: 0.25 },
        { note: "D2", duration: 0.5 },
      ],
    },
    // Relentless percussion
    {
      type: "noise",
      gain: 0.05,
      notes: [
        { note: "C1", duration: 0.125 },
        { note: "C1", duration: 0.125 },
        { note: null, duration: 0.125 },
        { note: "C1", duration: 0.125 },
        { note: "C1", duration: 0.125 },
        { note: "C1", duration: 0.125 },
        { note: null, duration: 0.125 },
        { note: "C1", duration: 0.125 },
      ],
    },
  ],
};

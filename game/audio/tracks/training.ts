import { TrackDefinition } from "../sequencer";

/**
 * Training track (Levels 1-9): Chill, relaxed chiptune.
 * Key: C major | Tempo: ~100 BPM
 * Melody on square wave, bass on triangle, light percussion on noise.
 */
export const trainingTrack: TrackDefinition = {
  bpm: 100,
  channels: [
    // Melody — square wave
    {
      type: "square",
      gain: 0.08,
      notes: [
        { note: "C5", duration: 1 },
        { note: "E5", duration: 0.5 },
        { note: "G5", duration: 0.5 },
        { note: "A5", duration: 1 },
        { note: "G5", duration: 1 },
        { note: "E5", duration: 0.5 },
        { note: "D5", duration: 0.5 },
        { note: "C5", duration: 1 },
        { note: null, duration: 0.5 },
        { note: "D5", duration: 0.5 },
        { note: "E5", duration: 1 },
        { note: "G5", duration: 0.5 },
        { note: "E5", duration: 0.5 },
        { note: "D5", duration: 1 },
        { note: "C5", duration: 1 },
        { note: null, duration: 0.5 },
        { note: "G4", duration: 0.5 },
        { note: "A4", duration: 1 },
        { note: "C5", duration: 1 },
        { note: "D5", duration: 0.5 },
        { note: "E5", duration: 0.5 },
        { note: "C5", duration: 2 },
      ],
    },
    // Bass — triangle wave
    {
      type: "triangle",
      gain: 0.12,
      notes: [
        { note: "C3", duration: 2 },
        { note: "F3", duration: 2 },
        { note: "G3", duration: 2 },
        { note: "C3", duration: 2 },
        { note: "A2", duration: 2 },
        { note: "F3", duration: 2 },
        { note: "G3", duration: 2 },
        { note: "C3", duration: 2 },
      ],
    },
    // Percussion — noise (kick-like on beat, hat off-beat)
    {
      type: "noise",
      gain: 0.03,
      notes: [
        { note: "C1", duration: 0.5 },
        { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 },
        { note: null, duration: 0.75 },
        { note: "C1", duration: 0.5 },
        { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 },
        { note: null, duration: 0.75 },
      ],
    },
  ],
};

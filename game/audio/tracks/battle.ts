import { TrackDefinition } from "../sequencer";

/**
 * Battle track (Levels 11-19): Intense, driving battle music.
 * Key: A minor | Tempo: ~140 BPM
 * Fast arpeggios, driving bass, snare-like noise hits.
 */
export const battleTrack: TrackDefinition = {
  bpm: 140,
  channels: [
    // Lead — square wave arpeggios
    {
      type: "square",
      gain: 0.07,
      notes: [
        { note: "A4", duration: 0.25 },
        { note: "C5", duration: 0.25 },
        { note: "E5", duration: 0.25 },
        { note: "A5", duration: 0.25 },
        { note: "G5", duration: 0.5 },
        { note: "E5", duration: 0.5 },
        { note: "A4", duration: 0.25 },
        { note: "C5", duration: 0.25 },
        { note: "D5", duration: 0.25 },
        { note: "E5", duration: 0.25 },
        { note: "D5", duration: 0.5 },
        { note: "C5", duration: 0.5 },
        { note: "A4", duration: 0.25 },
        { note: "B4", duration: 0.25 },
        { note: "C5", duration: 0.25 },
        { note: "E5", duration: 0.25 },
        { note: "D5", duration: 0.5 },
        { note: "C5", duration: 0.25 },
        { note: "B4", duration: 0.25 },
        { note: "A4", duration: 1 },
      ],
    },
    // Bass — triangle driving
    {
      type: "triangle",
      gain: 0.14,
      notes: [
        { note: "A2", duration: 0.5 },
        { note: "A2", duration: 0.25 },
        { note: null, duration: 0.25 },
        { note: "A2", duration: 0.5 },
        { note: "C3", duration: 0.5 },
        { note: "D3", duration: 0.5 },
        { note: "D3", duration: 0.25 },
        { note: null, duration: 0.25 },
        { note: "E3", duration: 0.5 },
        { note: "A2", duration: 0.5 },
        { note: "G2", duration: 0.5 },
        { note: "G2", duration: 0.25 },
        { note: null, duration: 0.25 },
        { note: "A2", duration: 0.5 },
        { note: "E3", duration: 0.5 },
      ],
    },
    // Percussion — noise snare pattern
    {
      type: "noise",
      gain: 0.04,
      notes: [
        { note: "C1", duration: 0.25 },
        { note: null, duration: 0.25 },
        { note: "C1", duration: 0.25 },
        { note: null, duration: 0.25 },
        { note: "C1", duration: 0.125 },
        { note: "C1", duration: 0.125 },
        { note: null, duration: 0.25 },
        { note: "C1", duration: 0.25 },
        { note: null, duration: 0.25 },
      ],
    },
  ],
};

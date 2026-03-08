import { TrackDefinition } from "../sequencer";

/**
 * Ultra Instinct track (Milestone levels: 10, 20, 30, 40, 50).
 * Ethereal pads + driving beat. Mix of triangle pads (ethereal) + driving square melody.
 * Tempo: ~120 BPM. Should feel epic and transcendent.
 */
export const ultraInstinctTrack: TrackDefinition = {
  bpm: 120,
  channels: [
    // Ethereal pad — triangle, long sustained notes
    {
      type: "triangle",
      gain: 0.1,
      notes: [
        { note: "E4", duration: 4 },
        { note: "G4", duration: 4 },
        { note: "B4", duration: 4 },
        { note: "D5", duration: 2 },
        { note: "C5", duration: 2 },
        { note: "E4", duration: 4 },
        { note: "A4", duration: 4 },
        { note: "B4", duration: 4 },
        { note: "G4", duration: 4 },
      ],
    },
    // Epic melody — square, transcendent
    {
      type: "square",
      gain: 0.06,
      notes: [
        { note: null, duration: 2 },
        { note: "E5", duration: 1 },
        { note: "G5", duration: 0.5 },
        { note: "B5", duration: 0.5 },
        { note: "A5", duration: 1 },
        { note: "G5", duration: 1 },
        { note: "E5", duration: 0.5 },
        { note: "D5", duration: 0.5 },
        { note: "E5", duration: 2 },
        { note: null, duration: 1 },
        { note: "B5", duration: 0.5 },
        { note: "A5", duration: 0.5 },
        { note: "G5", duration: 1 },
        { note: "E5", duration: 1 },
        { note: "D5", duration: 0.5 },
        { note: "E5", duration: 0.5 },
        { note: "G5", duration: 1 },
        { note: "A5", duration: 1 },
        { note: "B5", duration: 2 },
        { note: null, duration: 2 },
        { note: "E5", duration: 0.5 },
        { note: "G5", duration: 0.5 },
        { note: "A5", duration: 1 },
        { note: "B5", duration: 1 },
        { note: "E6", duration: 2 },
        { note: "D6", duration: 1 },
        { note: "B5", duration: 1 },
        { note: "G5", duration: 2 },
        { note: "E5", duration: 2 },
      ],
    },
    // Deep bass — triangle
    {
      type: "triangle",
      gain: 0.14,
      notes: [
        { note: "E2", duration: 2 },
        { note: "G2", duration: 2 },
        { note: "A2", duration: 2 },
        { note: "B2", duration: 2 },
        { note: "E2", duration: 2 },
        { note: "D3", duration: 2 },
        { note: "C3", duration: 2 },
        { note: "B2", duration: 2 },
      ],
    },
    // Driving beat — noise
    {
      type: "noise",
      gain: 0.03,
      notes: [
        { note: "C1", duration: 0.5 },
        { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 },
        { note: null, duration: 0.25 },
        { note: "C1", duration: 0.5 },
        { note: "C1", duration: 0.5 },
        { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 },
        { note: null, duration: 0.5 },
      ],
    },
  ],
};

import { TrackDefinition } from "../sequencer";

/**
 * Training track (Levels 1-9): Bouncy MM2–style intro.
 * Key: C major | Tempo: 130 BPM | Loop: ~48 beats (~22 s)
 * Cheerful square-wave melody, walking bass, punchy kick + light percussion.
 */
export const trainingTrack: TrackDefinition = {
  bpm: 130,
  channels: [
    // ═══ LEAD — happy square wave melody (48 beats) ═══
    {
      type: "square",
      gain: 0.09,
      notes: [
        // Bars 1-2: ascending C major pattern
        { note: "C5", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "E5", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "G5", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "C6", duration: 2.0 },
        // Bars 3-4: descending bounce back
        { note: "B5", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "A5", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "G5", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "E5", duration: 2.0 },
        // Bars 5-6: playful run upward
        { note: "F5", duration: 0.5 }, { note: "G5", duration: 0.5 },
        { note: "A5", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "B5", duration: 0.5 }, { note: "C6", duration: 0.5 },
        { note: "D6", duration: 1.0 }, { note: null, duration: 0.5 },
        // Bars 7-8: resolution with tag
        { note: "E6", duration: 2.0 }, { note: null, duration: 0.5 },
        { note: "C6", duration: 0.5 }, { note: "A5", duration: 0.5 },
        { note: "G5", duration: 0.5 }, { note: "E5", duration: 0.5 },
        { note: "C5", duration: 2.0 },

        // Bars 9-10: call and response
        { note: null, duration: 1.0 }, { note: "G5", duration: 0.5 },
        { note: null, duration: 0.5 }, { note: "E5", duration: 0.5 },
        { note: null, duration: 0.5 }, { note: "C5", duration: 1.0 },
        { note: "E5", duration: 1.0 },

        // Bars 11-12: playful octave jumps
        { note: "C6", duration: 0.5 }, { note: "B5", duration: 0.5 },
        { note: "A5", duration: 0.5 }, { note: "G5", duration: 0.5 },
        { note: "F5", duration: 0.5 }, { note: "E5", duration: 0.5 },
        { note: "D5", duration: 1.0 }, { note: null, duration: 1.0 },

        // Bars 13-14: build up
        { note: "F5", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "A5", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "C6", duration: 2.0 },

        // Bars 15-16: final flourish back to top
        { note: "D6", duration: 0.5 }, { note: "C6", duration: 0.5 },
        { note: "B5", duration: 0.5 }, { note: "A5", duration: 0.5 },
        { note: "G5", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "E5", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C5", duration: 2.0 },

        // Bars 17-24: wind down (8 beats each group)
        { note: null, duration: 2.0 }, { note: null, duration: 2.0 },
        { note: "G4", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C5", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: null, duration: 2.0 }, { note: null, duration: 2.0 },
      ],
    },

    // ═══ BASS — walking C major pattern (48 beats) ═══
    {
      type: "triangle",
      gain: 0.15,
      notes: [
        // Bars 1-2: C root
        { note: "C3", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "E3", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "G3", duration: 1.0 }, { note: null, duration: 0.5 },
        // Bars 3-4: F → G
        { note: "F2", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "A2", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "G2", duration: 1.0 }, { note: null, duration: 0.5 },
        // Bars 5-6: C root
        { note: "C3", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "E3", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "G3", duration: 1.0 }, { note: null, duration: 0.5 },
        // Bars 7-8: C → G
        { note: "C3", duration: 2.0 }, { note: null, duration: 0.5 },
        { note: "G2", duration: 1.0 },
        // Bars 9-12 (second half of loop):
        { note: "F2", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "A2", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "G2", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "C3", duration: 2.0 },
        // Bars 13-14: playful run down
        { note: "E3", duration: 0.5 }, { note: "D3", duration: 0.5 },
        { note: "C3", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "G2", duration: 1.0 }, { note: null, duration: 0.5 },
        // Bars 15-16: resolve
        { note: "C3", duration: 2.0 }, { note: null, duration: 0.5 },
        // Bars 17-24: rest/pedal
        { note: null, duration: 2.0 }, { note: null, duration: 2.0 },
        { note: "C2", duration: 2.0 }, { note: null, duration: 2.0 },
      ],
    },

    // ═══ KICK DRUM — bouncy pop beat (48 beats) ═══
    {
      type: "kick",
      gain: 0.12,
      notes: [
        // Bars 1-4: steady quarter-note kick with snare ghost on 2&4
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        // Bars 5-8: add eighth-note doubles on off-beats
        { note: "C1", duration: 1.0 }, { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        // Bars 9-12: steady
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        // Bars 13-16: double-time kick (eighth notes)
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        // Bars 17-24: back to steady with fill
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 0.5 }, { note: "C1", duration: 0.5 },
      ],
    },

    // ═══ PERCUSSION — hi-hat + snare pattern (48 beats) ═══
    {
      type: "noise",
      gain: 0.05,
      notes: [
        // Steady eighth-note hi-hat with snare on 2 & 4 each bar
        // Bar 1-4 (steady):
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        // Repeat bars 2-4 same pattern (36 entries):
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        // Bar 5: slightly busier fill ending
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        // Bars 6-8: same steady pattern
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        // Bars 9-16 (second half): same pattern repeated
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
      ],
    },

    // ═══ PAD — warm C major chords (48 beats) ═══
    {
      type: "triangle",
      gain: 0.03,
      notes: [
        { note: "C4", duration: 4.0 }, { note: null, duration: 4.0 },
        { note: "F3", duration: 4.0 }, { note: null, duration: 4.0 },
        { note: "G3", duration: 4.0 }, { note: null, duration: 4.0 },
        { note: "C4", duration: 4.0 }, { note: null, duration: 4.0 },
        // Second half
        { note: "F3", duration: 4.0 }, { note: null, duration: 4.0 },
        { note: "G3", duration: 4.0 }, { note: null, duration: 4.0 },
        { note: "C4", duration: 4.0 }, { note: null, duration: 4.0 },
      ],
    },
  ],
};

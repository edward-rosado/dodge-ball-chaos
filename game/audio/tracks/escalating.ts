import { TrackDefinition } from "../sequencer";

/**
 * Escalating track (Levels 31-39): Mega Man 2–style urgency.
 * Key: E minor | Tempo: 160 BPM | Loop: ~48 beats (~18 s)
 * Rising arpeggios, driving bass, relentless kick rhythm.
 */
export const escalatingTrack: TrackDefinition = {
  bpm: 160,
  channels: [
    // ═══ LEAD — fast ascending/descending runs (48 beats) ═══
    {
      type: "square",
      gain: 0.09,
      notes: [
        // Bars 1-2: rising E minor run
        { note: "E4", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "G4", duration: 0.5 }, { note: "B4", duration: 0.5 },
        { note: "E5", duration: 1.0 }, { note: null, duration: 0.5 },
        // Bars 3-4: descending with stops
        { note: "D5", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "B4", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "G4", duration: 1.0 }, { note: "A4", duration: 0.5 },
        // Bars 5-6: rapid ascent
        { note: "B4", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "E5", duration: 0.5 }, { note: "D5", duration: 0.5 },
        { note: "B4", duration: 1.0 }, { note: null, duration: 0.5 },
        // Bars 7-8: high energy octave jumps + resolution
        { note: "E5", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "G5", duration: 0.5 }, { note: "F#5", duration: 0.5 },
        { note: "E5", duration: 1.0 }, { note: null, duration: 0.5 },
        // Bars 9-10: descending run back to root
        { note: "D5", duration: 0.5 }, { note: "B4", duration: 0.5 },
        { note: "G4", duration: 0.5 }, { note: null, duration: 0.5 },
        // Bars 11-12: build with syncopation
        { note: "A4", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "B4", duration: 0.5 }, { note: "C#5", duration: 0.5 },
        { note: "E5", duration: 2.0 },
        // Bars 13-16 (second half): repeat with variation
        { note: null, duration: 0.5 },
        { note: "F#5", duration: 0.5 }, { note: "E5", duration: 0.5 },
        { note: "D5", duration: 0.5 }, { note: "B4", duration: 0.5 },
        { note: "G4", duration: 1.0 }, { note: null, duration: 0.5 },
        // Bars 17-20: rapid run up and hold
        { note: "E5", duration: 0.5 }, { note: "F#5", duration: 0.5 },
        { note: "G5", duration: 0.5 }, { note: "A5", duration: 0.5 },
        { note: "B5", duration: 2.0 },
        // Bars 21-24 (fill / resolve)
        { note: "A5", duration: 0.5 }, { note: "G5", duration: 0.5 },
        { note: "F#5", duration: 0.5 }, { note: "E5", duration: 0.5 },
        { note: null, duration: 1.0 },

        // Rest bars to fill loop (48 total beats needed)
        { note: null, duration: 2.0 }, { note: null, duration: 2.0 },
      ],
    },

    // ═══ BASS — E minor walking pattern (48 beats) ═══
    {
      type: "triangle",
      gain: 0.16,
      notes: [
        // Bars 1-2: E root
        { note: "E2", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "G2", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "B2", duration: 1.0 }, { note: null, duration: 0.5 },
        // Bars 3-4: A → B
        { note: "A2", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "C#3", duration: 0.5 }, { note: null, duration: 0.5 },
        // Bars 5-6: E → B
        { note: "E2", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "B1", duration: 0.5 }, { note: null, duration: 0.5 },
        // Bars 7-8: resolve D → E
        { note: "D2", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "E2", duration: 2.0 },
        // Bars 9-16 (second half):
        { note: "E2", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "G2", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "B2", duration: 1.0 }, { note: null, duration: 0.5 },
        // Bars 17-24 (fill):
        { note: "A2", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "B1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "E2", duration: 2.0 },

        // Rest bars to fill loop
        { note: null, duration: 2.0 }, { note: null, duration: 2.0 },
      ],
    },

    // ═══ KICK — relentless driving beat (48 beats) ═══
    {
      type: "kick",
      gain: 0.14,
      notes: [
        // Bars 1-4: four-on-the-floor
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        // Bars 5-8: double-time eighth notes
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        // Bars 9-12: steady back to quarter
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        // Bars 13-16: double-time again
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        // Bars 17-24: steady with fill
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 0.5 }, { note: "C1", duration: 0.5 },
      ],
    },

    // ═══ PERCUSSION — hi-hat + snare pattern (48 beats) ═══
    {
      type: "noise",
      gain: 0.06,
      notes: [
        // Bar pattern: hh-eighth + snare on 2&4
        // Bars 1-4:
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        // Bars 2-4 (same ×3):
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        // Bars 5-8 (double-time hi-hat):
        { note: "C1", duration: 0.25 }, { note: null, duration: 0.25 },
        { note: "C1", duration: 0.25 }, { note: null, duration: 0.25 },
        // Bars 9-12 (steady):
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        // Bars 13-16 (double-time):
        { note: "C1", duration: 0.25 }, { note: null, duration: 0.25 },
        { note: "C1", duration: 0.25 }, { note: null, duration: 0.25 },
        // Bars 17-24 (steady):
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
      ],
    },

    // ═══ PAD — E minor chords (48 beats) ═══
    {
      type: "triangle",
      gain: 0.03,
      notes: [
        { note: "E3", duration: 4.0 }, { note: null, duration: 4.0 },
        { note: "C#3", duration: 4.0 }, { note: null, duration: 4.0 },
        { note: "B2", duration: 4.0 }, { note: null, duration: 4.0 },
        { note: "A2", duration: 4.0 }, { note: null, duration: 4.0 },
        // Second half
        { note: "E3", duration: 4.0 }, { note: null, duration: 4.0 },
        { note: "C#3", duration: 4.0 }, { note: null, duration: 4.0 },
      ],
    },
  ],
};

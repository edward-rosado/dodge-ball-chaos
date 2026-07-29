import { TrackDefinition } from "../sequencer";

/**
 * Peak track (Levels 41-49): Mega Man 2 final boss energy.
 * Key: B minor | Tempo: 170 BPM | Loop: ~48 beats (~16.9 s)
 * Relentless square-wave arpeggios, walking bass with octave jumps,
 * driving percussion — maximum intensity.
 */
export const peakTrack: TrackDefinition = {
  bpm: 170,
  channels: [
    // ═══ LEAD — rapid MM2 boss runs (48 beats) ═══
    {
      type: "square",
      gain: 0.09,
      notes: [
        // Bars 1-2: ascending B minor arpeggio run
        { note: "B4", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "D5", duration: 0.5 }, { note: "F#5", duration: 0.5 },
        { note: "B5", duration: 1.0 }, { note: null, duration: 0.5 },
        // Bars 3-4: descending with stop-start bounce
        { note: "A5", duration: 0.5 }, { note: "G5", duration: 0.5 },
        { note: "F#5", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "E5", duration: 1.0 }, { note: "D5", duration: 0.5 },
        // Bars 5-6: rapid octave jumps
        { note: "B4", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "B5", duration: 1.0 }, { note: null, duration: 0.5 },
        // Bars 7-8: heavy descending run + resolve
        { note: "A5", duration: 0.5 }, { note: "G5", duration: 0.5 },
        { note: "F#5", duration: 0.5 }, { note: "E5", duration: 0.5 },
        { note: "D5", duration: 1.0 }, { note: null, duration: 0.5 },

        // Bars 9-10: call-and-response with rest hits
        { note: null, duration: 0.5 }, { note: "F#5", duration: 0.5 },
        { note: null, duration: 0.5 }, { note: "D5", duration: 0.5 },
        // Bars 11-12: ascending climax build
        { note: "E5", duration: 0.5 }, { note: "F#5", duration: 0.5 },
        { note: "G5", duration: 0.5 }, { note: "A5", duration: 0.5 },
        // Bars 13-14: high-energy octave hold
        { note: "B5", duration: 2.0 }, { note: null, duration: 0.5 },
        // Bars 15-16 (second half): descending cadence
        { note: "A5", duration: 0.5 }, { note: "G5", duration: 0.5 },
        { note: "F#5", duration: 0.5 }, { note: null, duration: 0.5 },
        // Bars 17-24 (fill / rest)
        { note: "E5", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "D5", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "B4", duration: 2.0 },

        // Rest bars to fill loop
        { note: null, duration: 2.0 }, { note: null, duration: 2.0 },
      ],
    },

    // ═══ BASS — heavy octave pattern (48 beats) ═══
    {
      type: "triangle",
      gain: 0.17,
      notes: [
        // Bars 1-2: B root with octave
        { note: "B1", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "B2", duration: 0.5 }, { note: null, duration: 0.5 },
        // Bars 3-4: A → G
        { note: "A1", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "G1", duration: 0.5 }, { note: null, duration: 0.5 },
        // Bars 5-6: E → D
        { note: "E2", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "D2", duration: 0.5 }, { note: null, duration: 0.5 },
        // Bars 7-8: resolve B
        { note: "B1", duration: 2.0 }, { note: null, duration: 0.5 },
        // Bars 9-16 (second half):
        { note: "A1", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "B1", duration: 0.5 }, { note: null, duration: 0.5 },
        // Bars 17-24 (fill / rest):
        { note: "G1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "A1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "B1", duration: 2.0 },

        // Rest bars to fill loop
        { note: null, duration: 2.0 }, { note: null, duration: 2.0 },
      ],
    },

    // ═══ KICK — relentless driving pattern (48 beats) ═══
    {
      type: "kick",
      gain: 0.15,
      notes: [
        // Bars 1-4: four-on-the-floor hard rock beat
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        // Bars 5-8: double-time eighth notes (relentless!)
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        // Bars 9-12: back to quarter
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        // Bars 13-16: triple-time feel (triplet-ish)
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        // Bars 17-24: steady with fill
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 0.5 }, { note: "C1", duration: 0.5 },
      ],
    },

    // ═══ PERCUSSION — snare on 2&4 + hi-hat (48 beats) ═══
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
        // Bars 17-24 (steady):
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
      ],
    },

    // ═══ PAD — B minor dark chords (48 beats) ═══
    {
      type: "triangle",
      gain: 0.03,
      notes: [
        { note: "B2", duration: 4.0 }, { note: null, duration: 4.0 },
        { note: "G2", duration: 4.0 }, { note: null, duration: 4.0 },
        { note: "A2", duration: 4.0 }, { note: null, duration: 4.0 },
        { note: "F#2", duration: 4.0 }, { note: null, duration: 4.0 },
        // Second half
        { note: "B2", duration: 4.0 }, { note: null, duration: 4.0 },
        { note: "G2", duration: 4.0 }, { note: null, duration: 4.0 },
      ],
    },
  ],
};

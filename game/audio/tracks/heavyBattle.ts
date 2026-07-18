import { TrackDefinition } from "../sequencer";

/**
 * Heavy Battle track (Levels 21-29): Darker Mega Man 2 boss music.
 * Key: D minor | Tempo: 150 BPM | Loop: ~48 beats (~19 s)
 * Square-wave lead with aggressive rhythm, walking bass, heavy kick/snare.
 */
export const heavyBattleTrack: TrackDefinition = {
  bpm: 150,
  channels: [
    // ═══ LEAD — dark square wave (48 beats) ═══
    {
      type: "square",
      gain: 0.09,
      notes: [
        // Bars 1-2: D minor descending pattern
        { note: "D5", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "F5", duration: 0.5 }, { note: "A5", duration: 0.5 },
        { note: "G5", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "D5", duration: 1.0 },
        // Bars 3-4: ascending tension build
        { note: "A#4", duration: 0.5 }, { note: "A4", duration: 0.5 },
        { note: "G4", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "A#4", duration: 0.5 }, { note: "A4", duration: 0.5 },
        { note: "G4", duration: 2.0 },
        // Bars 5-6: heavy octave hits with runs
        { note: "D5", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "F5", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "A#4", duration: 0.5 }, { note: "G4", duration: 0.5 },
        { note: "D5", duration: 1.0 }, { note: null, duration: 0.5 },
        // Bars 7-8: resolution bounce
        { note: "C5", duration: 0.5 }, { note: "B4", duration: 0.5 },
        { note: "A#4", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "D5", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "F5", duration: 0.5 }, { note: "D5", duration: 2.0 },

        // Bars 9-10: repeat with variation
        { note: "A5", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "G5", duration: 0.5 }, { note: "F5", duration: 0.5 },
        { note: "D5", duration: 1.0 }, { note: null, duration: 0.5 },
        // Bars 11-12: rapid descent
        { note: "C6", duration: 0.5 }, { note: "B5", duration: 0.5 },
        { note: "A#5", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "G5", duration: 1.0 }, { note: null, duration: 0.5 },
        // Bars 13-14: build tension
        { note: "A#4", duration: 0.5 }, { note: "A4", duration: 0.5 },
        { note: "G4", duration: 0.5 }, { note: "F4", duration: 0.5 },
        { note: "G4", duration: 1.0 }, { note: null, duration: 0.5 },
        // Bars 15-16: heavy resolve back to top
        { note: "D5", duration: 2.0 }, { note: null, duration: 0.5 },
        { note: null, duration: 0.5 },

        // Bars 17-24 (fill / rest)
        { note: "A#4", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "D5", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "F5", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "A#4", duration: 2.0 }, { note: null, duration: 1.0 },
        // Rest bars to fill loop
        { note: null, duration: 2.0 }, { note: null, duration: 2.0 },
      ],
    },

    // ═══ BASS — dark D minor walking (48 beats) ═══
    {
      type: "triangle",
      gain: 0.16,
      notes: [
        // Bars 1-2: D root
        { note: "D2", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "F2", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "A2", duration: 1.0 }, { note: null, duration: 0.5 },
        // Bars 3-4: A# → G
        { note: "A#1", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "G1", duration: 0.5 }, { note: null, duration: 0.5 },
        // Bars 5-6: D → A#
        { note: "D2", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "F2", duration: 0.5 }, { note: null, duration: 0.5 },
        // Bars 7-8: resolve
        { note: "C2", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "B1", duration: 0.5 }, { note: null, duration: 0.5 },
        // Bars 9-16 (second half):
        { note: "D2", duration: 1.0 }, { note: null, duration: 0.5 },
        { note: "F2", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "A2", duration: 1.0 }, { note: null, duration: 0.5 },
        // Descending run bars 13-14
        { note: "G2", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "F2", duration: 0.5 }, { note: null, duration: 0.5 },
        // Resolve bars 15-16
        { note: "D2", duration: 2.0 }, { note: null, duration: 0.5 },
        // Bars 17-24 rest/pedal
        { note: null, duration: 2.0 }, { note: null, duration: 2.0 },
      ],
    },

    // ═══ KICK — aggressive rock beat (48 beats) ═══
    {
      type: "kick",
      gain: 0.14,
      notes: [
        // Bars 1-4: four-on-the-floor
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        // Bars 5-8: eighth-note doubles on off-beats
        { note: "C1", duration: 1.0 }, { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        // Bars 9-12: steady
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        // Bars 13-16: double-time
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
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
        // Repeat bars 2-4 (3× same pattern = 24 entries):
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        // Bar 5 (fill):
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        // Bars 6-8 (steady):
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        // Bars 9-16 (second half):
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
      ],
    },

    // ═══ PAD — dark D minor chords (48 beats) ═══
    {
      type: "triangle",
      gain: 0.03,
      notes: [
        { note: "D3", duration: 4.0 }, { note: null, duration: 4.0 },
        { note: "C3", duration: 4.0 }, { note: null, duration: 4.0 },
        { note: "A#2", duration: 4.0 }, { note: null, duration: 4.0 },
        { note: "G2", duration: 4.0 }, { note: null, duration: 4.0 },
        // Second half
        { note: "D3", duration: 4.0 }, { note: null, duration: 4.0 },
        { note: "C3", duration: 4.0 }, { note: null, duration: 4.0 },
      ],
    },
  ],
};

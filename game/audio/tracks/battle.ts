import { TrackDefinition } from "../sequencer";

/**
 * Battle track (Levels 11-19): Mega Man 2–style chiptune anthem.
 * Key: A minor | Tempo: 150 BPM | Loop: ~48 beats (~19 s)
 * Driving four-on-the-floor kick, fast square lead arps, walking triangle bass,
 * snare/hi-hat noise pattern, warm harmony pad.  Inspired by MM2 Bubble Man / Quick Man themes.
 */
export const battleTrack: TrackDefinition = {
  bpm: 150,
  channels: [
    // ═══ LEAD — square wave, fast MM2-style arpeggios + melody (48 beats) ═══
    {
      type: "square",
      gain: 0.09,
      notes: [
        // ── Phrase A (8 beats): ascending run in A minor ──
        { note: "A4", duration: 0.5 },
        { note: "C5", duration: 0.5 },
        { note: "E5", duration: 0.5 },
        { note: "A5", duration: 0.5 },
        { note: "G5", duration: 1.0 },
        { note: "E5", duration: 0.5 },
        { note: "C5", duration: 0.5 },
        { note: "A5", duration: 1.0 },
        { note: null, duration: 0.5 },
        { note: "B4", duration: 0.5 },

        // ── Phrase B (8 beats): descending bounce ──
        { note: "D5", duration: 0.5 },
        { note: "F#5", duration: 0.5 },
        { note: "A5", duration: 0.5 },
        { note: "G5", duration: 0.5 },
        { note: "F#5", duration: 1.0 },
        { note: "E5", duration: 0.5 },
        { note: "D5", duration: 0.5 },
        { note: "B4", duration: 1.0 },
        { note: null, duration: 0.5 },
        { note: "A4", duration: 0.5 },

        // ── Phrase C (8 beats): rapid octave run ──
        { note: "A5", duration: 0.5 },
        { note: "G5", duration: 0.25 },
        { note: "F#5", duration: 0.25 },
        { note: "E5", duration: 0.5 },
        { note: "D5", duration: 0.5 },
        { note: "E5", duration: 0.5 },
        { note: "F#5", duration: 0.5 },
        { note: "G5", duration: 0.5 },
        { note: "A5", duration: 1.0 },
        { note: null, duration: 0.5 },

        // ── Phrase D (8 beats): resolution + tag ──
        { note: "E5", duration: 0.5 },
        { note: "F#5", duration: 0.5 },
        { note: "G5", duration: 0.5 },
        { note: "A5", duration: 1.0 },
        { note: "G5", duration: 0.5 },
        { note: "F#5", duration: 0.5 },
        { note: "E5", duration: 1.0 },
        { note: null, duration: 0.5 },
        { note: "D5", duration: 0.5 },
        { note: "C5", duration: 1.0 },

        // ── Phrase E (8 beats): call-and-response ──
        { note: "A4", duration: 0.5 },
        { note: null, duration: 0.5 },
        { note: "E5", duration: 1.0 },
        { note: "D5", duration: 0.5 },
        { note: "C5", duration: 0.5 },
        { note: "A4", duration: 0.5 },
        { note: null, duration: 0.5 },
        { note: "C5", duration: 0.5 },
        { note: "E5", duration: 1.0 },
        { note: null, duration: 1.0 },

        // ── Phrase F (8 beats): final energy burst ──
        { note: "A5", duration: 0.5 },
        { note: "A5", duration: 0.25 },
        { note: "G5", duration: 0.25 },
        { note: "F#5", duration: 0.5 },
        { note: "E5", duration: 0.5 },
        { note: "D5", duration: 0.5 },
        { note: "E5", duration: 0.5 },
        { note: "F#5", duration: 0.5 },
        { note: "G5", duration: 1.0 },
        { note: "A5", duration: 2.0 },

        // ── Phrase G (8 beats): wind down back to top ──
        { note: null, duration: 1.0 },
        { note: "E5", duration: 0.5 },
        { note: "D5", duration: 0.5 },
        { note: "C5", duration: 0.5 },
        { note: "A4", duration: 0.5 },
        { note: null, duration: 0.5 },
        { note: "A4", duration: 2.0 },
        { note: null, duration: 1.5 },
      ],
    },

    // ═══ BASS — triangle walking pattern (48 beats) ═══
    {
      type: "triangle",
      gain: 0.16,
      notes: [
        // ── Bars 1-2 (A root) ──
        { note: "A2", duration: 1.0 },
        { note: null, duration: 0.5 },
        { note: "C3", duration: 0.5 },
        { note: null, duration: 0.5 },
        { note: "E3", duration: 1.0 },
        { note: null, duration: 0.5 },
        { note: "A2", duration: 1.0 },
        // ── Bars 3-4 (F#m → E) ──
        { note: "F#2", duration: 1.0 },
        { note: null, duration: 0.5 },
        { note: "A2", duration: 0.5 },
        { note: null, duration: 0.5 },
        { note: "E2", duration: 1.0 },
        { note: null, duration: 0.5 },
        { note: "G2", duration: 0.5 },
        // ── Bars 5-6 (D → E) ──
        { note: "D2", duration: 1.0 },
        { note: null, duration: 0.5 },
        { note: "F#2", duration: 0.5 },
        { note: null, duration: 0.5 },
        { note: "E2", duration: 1.0 },
        { note: null, duration: 0.5 },
        { note: "A2", duration: 0.5 },
        // ── Bars 7-8 (D → A resolution) ──
        { note: "D2", duration: 1.0 },
        { note: null, duration: 0.5 },
        { note: "F#2", duration: 0.5 },
        { note: null, duration: 0.5 },
        { note: "E2", duration: 1.0 },
        { note: null, duration: 0.5 },
        { note: "A2", duration: 1.0 },

        // ── Bars 9-10 (A root again — second half of loop) ──
        { note: "A2", duration: 1.0 },
        { note: null, duration: 0.5 },
        { note: "C3", duration: 0.5 },
        { note: null, duration: 0.5 },
        { note: "E3", duration: 1.0 },
        { note: null, duration: 0.5 },
        { note: "A2", duration: 1.0 },
        // ── Bars 11-12 (F#m → E) ──
        { note: "F#2", duration: 1.0 },
        { note: null, duration: 0.5 },
        { note: "A2", duration: 0.5 },
        { note: null, duration: 0.5 },
        { note: "E2", duration: 1.0 },
        { note: null, duration: 0.5 },
        { note: "G2", duration: 0.5 },
        // ── Bars 13-14 (D → E) ──
        { note: "D2", duration: 1.0 },
        { note: null, duration: 0.5 },
        { note: "F#2", duration: 0.5 },
        { note: null, duration: 0.5 },
        { note: "E2", duration: 1.0 },
        { note: null, duration: 0.5 },
        { note: "A2", duration: 0.5 },
        // ── Bars 15-16 (D → A) ──
        { note: "D2", duration: 1.0 },
        { note: null, duration: 0.5 },
        { note: "F#2", duration: 0.5 },
        { note: null, duration: 0.5 },
        { note: "E2", duration: 1.0 },
        { note: null, duration: 0.5 },
        { note: "A2", duration: 1.0 },

        // ── Bars 17-18 (fill: descending run) ──
        { note: "A3", duration: 0.5 },
        { note: "G2", duration: 0.5 },
        { note: "F#2", duration: 0.5 },
        { note: "E2", duration: 0.5 },
        { note: "D2", duration: 0.5 },
        { note: null, duration: 0.5 },
        { note: "A1", duration: 2.0 },

        // ── Bars 19-20 (rest / pedal) ──
        { note: null, duration: 2.0 },
        { note: "A1", duration: 2.0 },
        { note: null, duration: 2.0 },

        // ── Bars 21-24 (final cadence) ──
        { note: "E3", duration: 1.0 },
        { note: null, duration: 0.5 },
        { note: "D3", duration: 0.5 },
        { note: null, duration: 0.5 },
        { note: "C3", duration: 0.5 },
        { note: null, duration: 0.5 },
        { note: "A2", duration: 1.0 },
        { note: null, duration: 0.5 },
      ],
    },

    // ═══ KICK DRUM — punchy four-on-the-floor rock beat (48 beats) ═══
    {
      type: "kick",
      gain: 0.14,
      notes: [
        // 24 bars of quarter-note kick with occasional eighth-note doubles
        // Bars 1-4 (steady): on every beat
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        // Bars 5-8 (add eighth-note double on beats 2 & 4)
        { note: "C1", duration: 1.0 }, { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        // Bars 9-12 (steady)
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        // Bars 13-16 (double-time kick pattern — 8th notes)
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        // Bars 17-20 (back to steady)
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        // Bars 21-24 (steady with fill at end)
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 1.0 }, { note: null, duration: 1.0 },
        { note: "C1", duration: 0.5 }, { note: "C1", duration: 0.5 },
      ],
    },

    // ═══ PERCUSSION — snare on 2 & 4 + hi-hat eighth notes (48 beats) ═══
    {
      type: "noise",
      gain: 0.06,
      notes: [
        // Hi-hat pattern (eighth notes): steady throughout
        // Snare hits on beats 2 and 4 of each bar
        // Bar 1: HH on every eighth + snare on 2&4 = 8 sixteenth entries
        { note: "C1", duration: 0.5 },   // hh
        { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 },  // snare on 2
        { note: "C1", duration: 0.25 },  // snare hit 2b
        { note: "C1", duration: 0.5 },   // hh
        { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 },  // snare on 4
        { note: "C1", duration: 0.25 },  // snare hit 4b
        { note: "C1", duration: 0.5 },   // hh
        { note: null, duration: 0.5 },   // (rest on off-beat)
        // ... repeat this bar pattern for all 24 bars
        // Bars 2-4 (same pattern):
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        // Bar 5 (add extra fill at end):
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        // Bars 6-8 (same as 2-4):
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        // Bars 9-12 (same):
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        // Bars 13-16 (double-time hi-hat pattern):
        { note: "C1", duration: 0.25 }, { note: null, duration: 0.25 },
        { note: "C1", duration: 0.25 }, { note: null, duration: 0.25 },
        { note: "C1", duration: 0.25 }, { note: null, duration: 0.25 },
        { note: "C1", duration: 0.25 }, { note: null, duration: 0.25 },
        { note: "C1", duration: 0.25 }, { note: null, duration: 0.25 },
        { note: "C1", duration: 0.25 }, { note: null, duration: 0.25 },
        { note: "C1", duration: 0.25 }, { note: null, duration: 0.25 },
        { note: "C1", duration: 0.25 }, { note: null, duration: 0.25 },
        // Bars 17-24 (back to steady):
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.25 }, { note: "C1", duration: 0.25 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
        { note: "C1", duration: 0.5 }, { note: null, duration: 0.5 },
      ],
    },

    // ═══ HARMONY PAD — triangle chords for depth (48 beats) ═══
    {
      type: "triangle",
      gain: 0.03,
      notes: [
        // Slow-moving chord changes every 2 bars
        { note: "A3", duration: 4.0 },
        { note: null, duration: 4.0 },
        { note: "F#3", duration: 4.0 },
        { note: null, duration: 4.0 },
        { note: "E3", duration: 4.0 },
        { note: null, duration: 4.0 },
        { note: "D3", duration: 4.0 },
        { note: null, duration: 4.0 },
        // Second half of loop
        { note: "A3", duration: 4.0 },
        { note: null, duration: 4.0 },
        { note: "F#3", duration: 4.0 },
        { note: null, duration: 4.0 },
        { note: "E3", duration: 4.0 },
        { note: null, duration: 4.0 },
        { note: "D3", duration: 4.0 },
        { note: null, duration: 4.0 },
        // Transition bars
        { note: "E3", duration: 4.0 },
        { note: null, duration: 4.0 },
        { note: "A2", duration: 4.0 },
        { note: null, duration: 4.0 },
      ],
    },
  ],
};

import { noteToFreq } from "./oscillator";

// ─── Track Definition Types ───

export interface NoteEvent {
  /** Note name like "C4", "D#5", or null for a rest. */
  note: string | null;
  /** Duration in beats (1 = quarter note). */
  duration: number;
}

export interface ChannelDef {
  type: "square" | "triangle" | "sawtooth" | "noise";
  gain: number;
  notes: NoteEvent[];
}

export interface TrackDefinition {
  bpm: number;
  channels: ChannelDef[];
}

// ─── Sequencer ───

interface ActiveChannel {
  type: ChannelDef["type"];
  gain: number;
  notes: NoteEvent[];
  noteIndex: number;
  nextNoteTime: number;
  currentOsc: OscillatorNode | AudioBufferSourceNode | null;
  currentGain: GainNode | null;
}

export class Sequencer {
  private ctx: AudioContext;
  private dest: AudioNode;
  private channels: ActiveChannel[] = [];
  private playing = false;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private secondsPerBeat = 0.5;
  private startTime = 0;

  constructor(ctx: AudioContext, dest: AudioNode) {
    this.ctx = ctx;
    this.dest = dest;
  }

  play(track: TrackDefinition): void {
    this.stop();
    this.secondsPerBeat = 60 / track.bpm;
    this.startTime = this.ctx.currentTime;
    this.playing = true;

    this.channels = track.channels.map((ch) => ({
      type: ch.type,
      gain: ch.gain,
      notes: ch.notes,
      noteIndex: 0,
      nextNoteTime: this.ctx.currentTime,
      currentOsc: null,
      currentGain: null,
    }));

    // Schedule ahead using a timer
    this.timerId = setInterval(() => this.scheduleNotes(), 50);
    this.scheduleNotes();
  }

  stop(): void {
    this.playing = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    for (const ch of this.channels) {
      this.stopChannel(ch);
    }
    this.channels = [];
  }

  isPlaying(): boolean {
    return this.playing;
  }

  private stopChannel(ch: ActiveChannel): void {
    try {
      if (ch.currentOsc) {
        ch.currentOsc.stop();
        ch.currentOsc.disconnect();
      }
    } catch {
      // Already stopped
    }
    if (ch.currentGain) {
      ch.currentGain.disconnect();
    }
    ch.currentOsc = null;
    ch.currentGain = null;
  }

  private scheduleNotes(): void {
    if (!this.playing) return;
    const lookAhead = 0.2; // Schedule 200ms ahead

    for (const ch of this.channels) {
      while (ch.nextNoteTime < this.ctx.currentTime + lookAhead) {
        const noteEvent = ch.notes[ch.noteIndex];
        const duration = noteEvent.duration * this.secondsPerBeat;

        if (noteEvent.note !== null) {
          this.playNote(ch, noteEvent.note, ch.nextNoteTime, duration);
        }

        ch.nextNoteTime += duration;
        ch.noteIndex = (ch.noteIndex + 1) % ch.notes.length; // Loop
      }
    }
  }

  private playNote(
    ch: ActiveChannel,
    note: string,
    startTime: number,
    duration: number
  ): void {
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(ch.gain, startTime);
    // Quick fade-out to avoid clicks
    gainNode.gain.setValueAtTime(ch.gain, startTime + duration - 0.02);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
    gainNode.connect(this.dest);

    if (ch.type === "noise") {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(gainNode);
      src.start(startTime);
      src.stop(startTime + duration);
    } else {
      const freq = noteToFreq(note);
      const osc = this.ctx.createOscillator();
      osc.type = ch.type;
      osc.frequency.setValueAtTime(freq, startTime);
      osc.connect(gainNode);
      osc.start(startTime);
      osc.stop(startTime + duration);
    }
  }
}

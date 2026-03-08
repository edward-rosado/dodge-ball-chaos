// ─── Note-to-frequency lookup ───

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * Convert a note name like "C4", "D#5", "A3" to its frequency in Hz.
 * Uses equal temperament tuning with A4 = 440 Hz.
 */
export function noteToFreq(note: string): number {
  const match = note.match(/^([A-G]#?)(\d)$/);
  if (!match) return 440;
  const [, name, octStr] = match;
  const octave = parseInt(octStr, 10);
  const semitone = NOTE_NAMES.indexOf(name);
  if (semitone < 0) return 440;
  // A4 = 440 Hz is semitone 9 in octave 4
  const stepsFromA4 = (octave - 4) * 12 + (semitone - 9);
  return 440 * Math.pow(2, stepsFromA4 / 12);
}

/** Create a square-wave oscillator connected to the destination via a gain node. */
export function createSquareOsc(
  ctx: AudioContext,
  freq: number,
  gain: number
): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.value = gain;
  osc.connect(g).connect(ctx.destination);
  return osc;
}

/** Create a triangle-wave oscillator connected to the destination via a gain node. */
export function createTriangleOsc(
  ctx: AudioContext,
  freq: number,
  gain: number
): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.value = gain;
  osc.connect(g).connect(ctx.destination);
  return osc;
}

/** Create a sawtooth-wave oscillator connected to the destination via a gain node. */
export function createSawtoothOsc(
  ctx: AudioContext,
  freq: number,
  gain: number
): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.value = gain;
  osc.connect(g).connect(ctx.destination);
  return osc;
}

/** Create a white noise buffer source connected to the destination via a gain node. */
export function createNoiseChannel(
  ctx: AudioContext,
  gain: number
): AudioBufferSourceNode {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(g).connect(ctx.destination);
  return src;
}

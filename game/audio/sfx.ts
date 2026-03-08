/**
 * Synthesized sound effects for game events.
 * Each function creates a short one-shot sound using Web Audio API.
 */

/** Whoosh sound for ball throw. */
export function playThrowSFX(ctx: AudioContext, dest: AudioNode): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.connect(gain).connect(dest);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

/** Impact thud for getting hit. */
export function playHitSFX(ctx: AudioContext, dest: AudioNode): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
  osc.connect(gain).connect(dest);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.25);

  // Noise layer for impact
  const bufferSize = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.1, ctx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  noise.connect(noiseGain).connect(dest);
  noise.start(ctx.currentTime);
  noise.stop(ctx.currentTime + 0.1);
}

/** Ascending chime for power-up collection. */
export function playPowerUpSFX(ctx: AudioContext, dest: AudioNode): void {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.08;
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.12);
  });
}

/** Short victory fanfare for clearing a round. */
export function playClearSFX(ctx: AudioContext, dest: AudioNode): void {
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5 E5 G5 C6 E6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.1;
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.2);
  });
}

/** Rising tone for level-up. */
export function playLevelUpSFX(ctx: AudioContext, dest: AudioNode): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.setValueAtTime(0.1, ctx.currentTime + 0.25);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.connect(gain).connect(dest);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.4);
}

/** Descending sad tone for game over. */
export function playGameOverSFX(ctx: AudioContext, dest: AudioNode): void {
  const notes = [392, 349.23, 293.66, 220]; // G4, F4, D4, A3
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.25;
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

/** Quick ping for ball bounce. */
export function playBounceSFX(ctx: AudioContext, dest: AudioNode): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
  osc.connect(gain).connect(dest);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.06);
}

// ─── Power-Up Specific SFX ───

/** Kaioken: aggressive rising scream — layered sawtooth with vibrato. */
export function playKaiokenSFX(ctx: AudioContext, dest: AudioNode): void {
  const t = ctx.currentTime;
  // Main scream: rising sawtooth
  const osc1 = ctx.createOscillator();
  const g1 = ctx.createGain();
  osc1.type = "sawtooth";
  osc1.frequency.setValueAtTime(200, t);
  osc1.frequency.exponentialRampToValueAtTime(800, t + 0.4);
  osc1.frequency.exponentialRampToValueAtTime(600, t + 0.7);
  g1.gain.setValueAtTime(0.12, t);
  g1.gain.setValueAtTime(0.12, t + 0.5);
  g1.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
  osc1.connect(g1).connect(dest);
  osc1.start(t);
  osc1.stop(t + 0.7);
  // Harmonic layer
  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.type = "square";
  osc2.frequency.setValueAtTime(400, t);
  osc2.frequency.exponentialRampToValueAtTime(1200, t + 0.35);
  osc2.frequency.exponentialRampToValueAtTime(900, t + 0.6);
  g2.gain.setValueAtTime(0.05, t);
  g2.gain.setValueAtTime(0.05, t + 0.4);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  osc2.connect(g2).connect(dest);
  osc2.start(t);
  osc2.stop(t + 0.6);
}

/** Ki Shield: crystalline ding — high triangle note with shimmer. */
export function playKiShieldSFX(ctx: AudioContext, dest: AudioNode): void {
  const t = ctx.currentTime;
  [1046.5, 1318.5, 1568].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const st = t + i * 0.06;
    g.gain.setValueAtTime(0.1, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + 0.3);
    osc.connect(g).connect(dest);
    osc.start(st);
    osc.stop(st + 0.3);
  });
}

/** Instant Transmission: quick whoosh-zap teleport sound. */
export function playITSFX(ctx: AudioContext, dest: AudioNode): void {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(1200, t);
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);
  osc.frequency.setValueAtTime(400, t + 0.1);
  osc.frequency.exponentialRampToValueAtTime(1600, t + 0.2);
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  osc.connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + 0.25);
}

/** Solar Flare: bright flash sound — high white noise burst. */
export function playSolarFlareSFX(ctx: AudioContext, dest: AudioNode): void {
  const t = ctx.currentTime;
  const bufferSize = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.15, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  noise.connect(g).connect(dest);
  noise.start(t);
  noise.stop(t + 0.3);
  // High ring
  const osc = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 2000;
  g2.gain.setValueAtTime(0.06, t);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.connect(g2).connect(dest);
  osc.start(t);
  osc.stop(t + 0.2);
}

/** Senzu Bean: gentle healing chime — warm ascending notes. */
export function playSenzuBeanSFX(ctx: AudioContext, dest: AudioNode): void {
  const t = ctx.currentTime;
  [392, 523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const st = t + i * 0.1;
    g.gain.setValueAtTime(0.1, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + 0.25);
    osc.connect(g).connect(dest);
    osc.start(st);
    osc.stop(st + 0.25);
  });
}

/** Time Skip: time-warp wobble — descending with vibrato. */
export function playTimeSkipSFX(ctx: AudioContext, dest: AudioNode): void {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.4);
  // Vibrato via LFO
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 12;
  lfoGain.gain.value = 30;
  lfo.connect(lfoGain).connect(osc.frequency);
  lfo.start(t);
  lfo.stop(t + 0.4);
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  osc.connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + 0.4);
}

/** Destructo Disc: sharp slicing sound — quick high-to-low sweep. */
export function playDestructoDiscSFX(ctx: AudioContext, dest: AudioNode): void {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(2000, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
  g.gain.setValueAtTime(0.1, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + 0.2);
}

/** Afterimage: ghostly whoosh — filtered noise. */
export function playAfterImageSFX(ctx: AudioContext, dest: AudioNode): void {
  const t = ctx.currentTime;
  const bufferSize = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 800;
  filter.Q.value = 2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  noise.connect(filter).connect(g).connect(dest);
  noise.start(t);
  noise.stop(t + 0.3);
}

/** Shrink: squeaky shrink — rising then pinched off. */
export function playShrinkSFX(ctx: AudioContext, dest: AudioNode): void {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(400, t);
  osc.frequency.exponentialRampToValueAtTime(2000, t + 0.15);
  g.gain.setValueAtTime(0.06, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + 0.2);
}

/** Spirit Bomb: deep charging hum — low pulsing tone. */
export function playSpiritBombSFX(ctx: AudioContext, dest: AudioNode): void {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(80, t);
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.5);
  // Pulsing via LFO
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 6;
  lfoGain.gain.value = 0.04;
  lfo.connect(lfoGain).connect(g.gain);
  lfo.start(t);
  lfo.stop(t + 0.6);
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  osc.connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + 0.6);
}

/** Victory fanfare — triumphant ascending melody. */
export function playVictorySFX(ctx: AudioContext, dest: AudioNode): void {
  const t = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568]; // C5 to G6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const st = t + i * 0.12;
    g.gain.setValueAtTime(0.1, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + 0.3);
    osc.connect(g).connect(dest);
    osc.start(st);
    osc.stop(st + 0.3);
  });
}

/** Explosion sound for Bomber ball. */
export function playExplosionSFX(ctx: AudioContext, dest: AudioNode): void {
  // Low rumble
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(100, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.connect(gain).connect(dest);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.4);

  // Noise burst
  const bufferSize = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.15, ctx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  noise.connect(noiseGain).connect(dest);
  noise.start(ctx.currentTime);
  noise.stop(ctx.currentTime + 0.3);
}

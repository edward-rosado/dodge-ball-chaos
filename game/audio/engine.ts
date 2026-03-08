import { Sequencer, TrackDefinition } from "./sequencer";
import {
  playThrowSFX,
  playHitSFX,
  playPowerUpSFX,
  playClearSFX,
  playLevelUpSFX,
  playGameOverSFX,
  playBounceSFX,
  playExplosionSFX,
  playKaiokenSFX,
  playKiShieldSFX,
  playITSFX,
  playSolarFlareSFX,
  playSenzuBeanSFX,
  playTimeSkipSFX,
  playDestructoDiscSFX,
  playAfterImageSFX,
  playShrinkSFX,
  playSpiritBombSFX,
  playVictorySFX,
} from "./sfx";
import { trainingTrack } from "./tracks/training";
import { battleTrack } from "./tracks/battle";
import { heavyBattleTrack } from "./tracks/heavyBattle";
import { escalatingTrack } from "./tracks/escalating";
import { peakTrack } from "./tracks/peak";
import { ultraInstinctTrack } from "./tracks/ultraInstinct";

// ─── Track registry ───

const TRACKS: Record<string, TrackDefinition> = {
  training: trainingTrack,
  battle: battleTrack,
  heavyBattle: heavyBattleTrack,
  escalating: escalatingTrack,
  peak: peakTrack,
  ultraInstinct: ultraInstinctTrack,
};

// ─── SFX registry ───

type SFXFunction = (ctx: AudioContext, dest: AudioNode) => void;

const SFX_MAP: Record<string, SFXFunction> = {
  throw: playThrowSFX,
  hit: playHitSFX,
  powerUp: playPowerUpSFX,
  clear: playClearSFX,
  levelUp: playLevelUpSFX,
  gameOver: playGameOverSFX,
  bounce: playBounceSFX,
  explosion: playExplosionSFX,
  victory: playVictorySFX,
  // Per-power-up SFX
  kaioken: playKaiokenSFX,
  kiShield: playKiShieldSFX,
  instantTransmission: playITSFX,
  solarFlare: playSolarFlareSFX,
  senzuBean: playSenzuBeanSFX,
  timeSkip: playTimeSkipSFX,
  destructoDisc: playDestructoDiscSFX,
  afterimage: playAfterImageSFX,
  shrink: playShrinkSFX,
  spiritBombCharge: playSpiritBombSFX,
};

// ─── Audio Engine ───

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentTrack: string | null = null;
  private sequencer: Sequencer | null = null;

  /** Lazy-initialize AudioContext on first user interaction. */
  init(): void {
    if (this.ctx) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = typeof globalThis !== "undefined" ? globalThis : window;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioCtx = (g as any).AudioContext || (g as any).webkitAudioContext;
      if (!AudioCtx) return;
      const actx = new AudioCtx();
      this.ctx = actx;
      const gain = actx.createGain();
      gain.gain.value = 0.5;
      gain.connect(actx.destination);
      this.masterGain = gain;
      this.sequencer = new Sequencer(actx, gain);
    } catch {
      // AudioContext not available — silently degrade
      this.ctx = null;
    }
  }

  /** Set master volume (0 to 1). */
  setVolume(v: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, v));
    }
  }

  /** Start playing a named track. Crossfades from current if playing. */
  playTrack(name: string): void {
    if (!this.ctx || !this.sequencer || !this.masterGain) return;
    if (this.currentTrack === name && this.sequencer.isPlaying()) return;

    const track = TRACKS[name];
    if (!track) return;

    // Resume suspended AudioContext (browser autoplay policy)
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    this.sequencer.stop();
    this.sequencer.play(track);
    this.currentTrack = name;
  }

  /** Stop current music. */
  stopTrack(): void {
    if (this.sequencer) {
      this.sequencer.stop();
    }
    this.currentTrack = null;
  }

  /** Play a one-shot sound effect by name. */
  playSFX(name: string): void {
    if (!this.ctx || !this.masterGain) return;

    // Resume suspended AudioContext
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const sfxFn = SFX_MAP[name];
    if (sfxFn) {
      sfxFn(this.ctx, this.masterGain);
    }
  }

  /**
   * Announce a power-up with a synthesized anime-style shout.
   * Uses formant synthesis (vowel frequencies + distortion + pitch sweep)
   * to create Goku-like vocal exclamations instead of robotic TTS.
   */
  speakPowerUpName(name: string): void {
    if (!this.ctx || !this.masterGain) return;

    // Each power-up gets a unique "shout" character
    const SHOUT_CONFIG: Record<string, { pitch: number; vowel: "a" | "o" | "i" | "e"; duration: number }> = {
      kaioken:              { pitch: 180, vowel: "o", duration: 0.6 },
      kiShield:             { pitch: 200, vowel: "i", duration: 0.4 },
      instantTransmission:  { pitch: 160, vowel: "a", duration: 0.5 },
      solarFlare:           { pitch: 220, vowel: "a", duration: 0.5 },
      senzuBean:            { pitch: 190, vowel: "e", duration: 0.4 },
      timeSkip:             { pitch: 170, vowel: "i", duration: 0.4 },
      destructoDisc:        { pitch: 150, vowel: "o", duration: 0.6 },
      afterimage:           { pitch: 185, vowel: "a", duration: 0.4 },
      shrink:               { pitch: 210, vowel: "i", duration: 0.35 },
      spiritBombCharge:     { pitch: 140, vowel: "o", duration: 0.8 },
    };

    const cfg = SHOUT_CONFIG[name];
    if (!cfg) return;

    const actx = this.ctx;
    const t = actx.currentTime;

    // Formant frequencies for different vowels (simplified 2-formant model)
    const FORMANTS: Record<string, [number, number]> = {
      a: [800, 1200],   // "AH!" — open, powerful
      o: [500, 900],    // "OH!" — round, deep
      i: [300, 2300],   // "EE!" — sharp, piercing
      e: [600, 1800],   // "EH!" — mid, energetic
    };

    const [f1, f2] = FORMANTS[cfg.vowel];
    const dur = cfg.duration;

    // Base vocal tone — sawtooth for gritty vocal quality
    const voice = actx.createOscillator();
    voice.type = "sawtooth";
    voice.frequency.setValueAtTime(cfg.pitch, t);
    voice.frequency.linearRampToValueAtTime(cfg.pitch * 1.3, t + dur * 0.3);
    voice.frequency.linearRampToValueAtTime(cfg.pitch * 0.8, t + dur);

    // Formant filters to shape vowel sound
    const formant1 = actx.createBiquadFilter();
    formant1.type = "bandpass";
    formant1.frequency.value = f1;
    formant1.Q.value = 5;

    const formant2 = actx.createBiquadFilter();
    formant2.type = "bandpass";
    formant2.frequency.value = f2;
    formant2.Q.value = 5;

    // Waveshaper for screaming distortion
    const distortion = actx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      curve[i] = (Math.PI + 4) * x / (Math.PI + 4 * Math.abs(x));
    }
    distortion.curve = curve;

    // Envelope
    const env = actx.createGain();
    env.gain.setValueAtTime(0.001, t);
    env.gain.exponentialRampToValueAtTime(0.25, t + 0.05);
    env.gain.setValueAtTime(0.25, t + dur * 0.6);
    env.gain.exponentialRampToValueAtTime(0.001, t + dur);

    // Route: voice → distortion → formants (parallel) → envelope → output
    const merger = actx.createGain();
    merger.gain.value = 0.6;

    voice.connect(distortion);
    distortion.connect(formant1).connect(merger);
    distortion.connect(formant2).connect(merger);
    merger.connect(env).connect(this.masterGain!);

    voice.start(t);
    voice.stop(t + dur);

    // Breathy noise layer for scream texture
    const noiseLen = Math.ceil(actx.sampleRate * dur);
    const noiseBuf = actx.createBuffer(1, noiseLen, actx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1;
    const noiseSrc = actx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    const noiseFilter = actx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = (f1 + f2) / 2;
    noiseFilter.Q.value = 2;
    const noiseEnv = actx.createGain();
    noiseEnv.gain.setValueAtTime(0.001, t);
    noiseEnv.gain.exponentialRampToValueAtTime(0.08, t + 0.05);
    noiseEnv.gain.exponentialRampToValueAtTime(0.001, t + dur);
    noiseSrc.connect(noiseFilter).connect(noiseEnv).connect(this.masterGain!);
    noiseSrc.start(t);
    noiseSrc.stop(t + dur);
  }

  /** Whether the engine has been initialized. */
  isInitialized(): boolean {
    return this.ctx !== null;
  }
}

/** Singleton audio engine instance. */
export const audio = new AudioEngine();

/**
 * Get the track name for a given round number.
 * Milestone rounds (10, 20, 30, 40, 50) use the Ultra Instinct track.
 */
export function getTrackForRound(round: number): string {
  const milestones = new Set([10, 20, 30, 40, 50]);
  if (milestones.has(round)) return "ultraInstinct";
  if (round <= 9) return "training";
  if (round <= 19) return "battle";
  if (round <= 29) return "heavyBattle";
  if (round <= 39) return "escalating";
  if (round <= 49) return "peak";
  return "peak"; // Post-game
}

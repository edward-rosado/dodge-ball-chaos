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

// ─── Power-up spoken names (for SpeechSynthesis) ───

const SPOKEN_NAMES: Record<string, string> = {
  kaioken: "KAIO-KEN!",
  kiShield: "KI SHIELD!",
  instantTransmission: "INSTANT TRANSMISSION!",
  solarFlare: "SOLAR FLARE!",
  senzuBean: "SENZU BEAN!",
  timeSkip: "TIME SKIP!",
  destructoDisc: "DESTRUCTO DISC!",
  afterimage: "AFTER IMAGE!",
  shrink: "SHRINK!",
  spiritBombCharge: "SPIRIT BOMB!",
};

// ─── Audio Engine ───

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  /** Dedicated gain node for music — set to 0 when muted, 1 when unmuted. */
  private musicGain: GainNode | null = null;
  private currentTrack: string | null = null;
  private sequencer: Sequencer | null = null;
  private _musicMuted = false;

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
      // Music goes through its own gain node so we can mute independently of SFX
      const mGain = actx.createGain();
      mGain.gain.value = 1;
      mGain.connect(gain);
      this.musicGain = mGain;
      this.sequencer = new Sequencer(actx, mGain);
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

  /** Toggle music on/off. SFX and shouts are unaffected. */
  toggleMusic(): boolean {
    this._musicMuted = !this._musicMuted;
    // Simply toggle the music gain node — sequencer keeps running silently
    if (this.musicGain) {
      this.musicGain.gain.value = this._musicMuted ? 0 : 1;
    }
    return this._musicMuted;
  }

  /** Whether music is currently muted. */
  get musicMuted(): boolean {
    return this._musicMuted;
  }

  /** Start playing a named track. Crossfades from current if playing. */
  playTrack(name: string): void {
    if (!this.ctx || !this.sequencer || !this.masterGain) return;

    const track = TRACKS[name];
    if (!track) return;

    if (this.currentTrack === name && this.sequencer.isPlaying()) return;

    // Resume suspended AudioContext (browser autoplay policy)
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    this.sequencer.stop();
    this.currentTrack = name;
    // Always start sequencer — musicGain controls audibility
    this.sequencer.play(track);
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
   * Announce a power-up name using SpeechSynthesis with energetic delivery.
   * Uses high pitch and fast rate for an anime-style shout feel.
   */
  speakPowerUpName(name: string): void {
    const spokenName = SPOKEN_NAMES[name];
    if (!spokenName) return;

    // Use SpeechSynthesis if available
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(spokenName);
    utterance.pitch = 1.4;  // Higher pitch for energy
    utterance.rate = 1.3;   // Faster for urgency
    utterance.volume = 0.9;

    // Try to find a male English voice for a deeper, more dramatic sound
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.lang.startsWith("en") && v.name.toLowerCase().includes("male")
    ) || voices.find(v => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    window.speechSynthesis.cancel(); // Cancel any current speech
    window.speechSynthesis.speak(utterance);
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

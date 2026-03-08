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

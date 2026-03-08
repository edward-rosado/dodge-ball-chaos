// ─── Power-Up Type Enum ───

export enum PowerUpType {
  InstantTransmission = "instantTransmission",
  KiShield = "kiShield",
  Kaioken = "kaioken",
  SolarFlare = "solarFlare",
  SenzuBean = "senzuBean",
  TimeSkip = "timeSkip",
  DestructoDisc = "destructoDisc",
  Afterimage = "afterimage",
  Shrink = "shrink",
  SpiritBombCharge = "spiritBombCharge",
}

// ─── Power-Up Config ───

export interface PowerUpConfig {
  type: PowerUpType;
  /** Effect-only label shown on screen (name is spoken aloud via SpeechSynthesis) */
  label: string;
  icon: string;
  color: string;
  glowColor: string;
  /** Minimum round to appear */
  minRound: number;
  /** Relative spawn weight (higher = more common) */
  weight: number;
}

export const POWER_UP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  [PowerUpType.InstantTransmission]: {
    type: PowerUpType.InstantTransmission,
    label: "TELEPORT!",
    icon: "I.T.",
    color: "#00bfff",
    glowColor: "#00bfff",
    minRound: 1,
    weight: 8,
  },
  [PowerUpType.KiShield]: {
    type: PowerUpType.KiShield,
    label: "BLOCKS 1 HIT!",
    icon: "KI SHIELD",
    color: "#ffd60a",
    glowColor: "#ffd60a",
    minRound: 1,
    weight: 10,
  },
  [PowerUpType.Kaioken]: {
    type: PowerUpType.Kaioken,
    label: "2X SPEED FOR 5s!",
    icon: "KAIOKEN",
    color: "#ff2222",
    glowColor: "#ff4444",
    minRound: 1,
    weight: 8,
  },
  [PowerUpType.SolarFlare]: {
    type: PowerUpType.SolarFlare,
    label: "FREEZE ALL FOR 3s!",
    icon: "SOLAR FLARE",
    color: "#ffffaa",
    glowColor: "#ffff66",
    minRound: 2,
    weight: 6,
  },
  [PowerUpType.SenzuBean]: {
    type: PowerUpType.SenzuBean,
    label: "+1 LIFE!",
    icon: "SENZU BEAN",
    color: "#00cc44",
    glowColor: "#00ff55",
    minRound: 5,
    weight: 3,
  },
  [PowerUpType.TimeSkip]: {
    type: PowerUpType.TimeSkip,
    label: "SLOW BALLS FOR 4s!",
    icon: "TIME SKIP",
    color: "#3a86ff",
    glowColor: "#3a86ff",
    minRound: 1,
    weight: 8,
  },
  [PowerUpType.DestructoDisc]: {
    type: PowerUpType.DestructoDisc,
    label: "DESTROYS 1 BALL!",
    icon: "DESTRUCTO DISC",
    color: "#ff8c00",
    glowColor: "#ffaa33",
    minRound: 3,
    weight: 5,
  },
  [PowerUpType.Afterimage]: {
    type: PowerUpType.Afterimage,
    label: "DECOY FOR 4s!",
    icon: "AFTERIMAGE",
    color: "#bb88ff",
    glowColor: "#cc99ff",
    minRound: 2,
    weight: 6,
  },
  [PowerUpType.Shrink]: {
    type: PowerUpType.Shrink,
    label: "HALF SIZE FOR 5s!",
    icon: "SHRINK",
    color: "#88ddff",
    glowColor: "#aaeeff",
    minRound: 1,
    weight: 7,
  },
  [PowerUpType.SpiritBombCharge]: {
    type: PowerUpType.SpiritBombCharge,
    label: "SKIP TO NEXT MILESTONE!",
    icon: "SPIRIT BOMB",
    color: "#44ddff",
    glowColor: "#66eeff",
    minRound: 5,
    weight: 2,
  },
};

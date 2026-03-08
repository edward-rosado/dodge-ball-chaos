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
    label: "INSTANT TRANSMISSION!",
    icon: "IT",
    color: "#00bfff",
    glowColor: "#00bfff",
    minRound: 1,
    weight: 8,
  },
  [PowerUpType.KiShield]: {
    type: PowerUpType.KiShield,
    label: "KI SHIELD!",
    icon: "\u2605",
    color: "#ffd60a",
    glowColor: "#ffd60a",
    minRound: 1,
    weight: 10,
  },
  [PowerUpType.Kaioken]: {
    type: PowerUpType.Kaioken,
    label: "KAIOKEN!",
    icon: "KK",
    color: "#ff2222",
    glowColor: "#ff4444",
    minRound: 1,
    weight: 8,
  },
  [PowerUpType.SolarFlare]: {
    type: PowerUpType.SolarFlare,
    label: "SOLAR FLARE!",
    icon: "SF",
    color: "#ffffaa",
    glowColor: "#ffff66",
    minRound: 2,
    weight: 6,
  },
  [PowerUpType.SenzuBean]: {
    type: PowerUpType.SenzuBean,
    label: "SENZU BEAN! +1 LIFE",
    icon: "SB",
    color: "#00cc44",
    glowColor: "#00ff55",
    minRound: 5,
    weight: 3,
  },
  [PowerUpType.TimeSkip]: {
    type: PowerUpType.TimeSkip,
    label: "TIME SKIP!",
    icon: "TS",
    color: "#3a86ff",
    glowColor: "#3a86ff",
    minRound: 1,
    weight: 8,
  },
  [PowerUpType.DestructoDisc]: {
    type: PowerUpType.DestructoDisc,
    label: "DESTRUCTO DISC!",
    icon: "DD",
    color: "#ff8c00",
    glowColor: "#ffaa33",
    minRound: 3,
    weight: 5,
  },
  [PowerUpType.Afterimage]: {
    type: PowerUpType.Afterimage,
    label: "AFTERIMAGE!",
    icon: "AI",
    color: "#bb88ff",
    glowColor: "#cc99ff",
    minRound: 2,
    weight: 6,
  },
  [PowerUpType.Shrink]: {
    type: PowerUpType.Shrink,
    label: "SHRINK!",
    icon: "SH",
    color: "#88ddff",
    glowColor: "#aaeeff",
    minRound: 1,
    weight: 7,
  },
  [PowerUpType.SpiritBombCharge]: {
    type: PowerUpType.SpiritBombCharge,
    label: "SPIRIT BOMB! HOLD STILL!",
    icon: "SB",
    color: "#44ddff",
    glowColor: "#66eeff",
    minRound: 5,
    weight: 2,
  },
};

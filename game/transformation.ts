// ─── Saiyan Transformation System ───
// Goku transforms through SSJ forms as the player progresses through levels.

export enum SaiyanForm {
  Base = 0,           // Black hair — L1-9
  SSJ = 1,            // Golden hair — L10-19
  SSJ2 = 2,           // Golden + electric sparks — L20-29
  SSJ3 = 3,           // Longer golden spikes — L30-39
  SSJBlue = 4,        // Blue hair — L40-49
  UltraInstinct = 5,  // Silver hair — L50 (milestone only)
}

/** Get Goku's transformation form based on the current round. */
export function getFormForRound(round: number): SaiyanForm {
  if (round >= 50) return SaiyanForm.UltraInstinct;
  if (round >= 40) return SaiyanForm.SSJBlue;
  if (round >= 30) return SaiyanForm.SSJ3;
  if (round >= 20) return SaiyanForm.SSJ2;
  if (round >= 10) return SaiyanForm.SSJ;
  return SaiyanForm.Base;
}

/** Hair color palette per form. */
export interface HairPalette {
  main: string;
  highlight: string;
  shadow: string;
}

/** Eye color per form. */
export function getEyeColor(form: SaiyanForm): string {
  switch (form) {
    case SaiyanForm.Base: return "#222222";
    case SaiyanForm.SSJ: return "#2a8844";       // Teal-green SSJ eyes
    case SaiyanForm.SSJ2: return "#2a8844";
    case SaiyanForm.SSJ3: return "#2a8844";
    case SaiyanForm.SSJBlue: return "#3a86ff";    // Blue eyes
    case SaiyanForm.UltraInstinct: return "#c8c8e0"; // Silver
  }
}

export function getHairPalette(form: SaiyanForm): HairPalette {
  switch (form) {
    case SaiyanForm.Base:
      return { main: "#1a1a2e", highlight: "#333355", shadow: "#0a0a15" };
    case SaiyanForm.SSJ:
      return { main: "#f5c542", highlight: "#ffe066", shadow: "#c9982a" };
    case SaiyanForm.SSJ2:
      return { main: "#f5c542", highlight: "#fff088", shadow: "#c9982a" };
    case SaiyanForm.SSJ3:
      return { main: "#f5c542", highlight: "#ffe066", shadow: "#c9982a" };
    case SaiyanForm.SSJBlue:
      return { main: "#3a86ff", highlight: "#66b0ff", shadow: "#2060cc" };
    case SaiyanForm.UltraInstinct:
      return { main: "#c0c0d0", highlight: "#e0e0ee", shadow: "#8888a0" };
  }
}

/** Aura color per form (for glow effects). */
export function getAuraColor(form: SaiyanForm): string | null {
  switch (form) {
    case SaiyanForm.Base: return null;  // No aura at base
    case SaiyanForm.SSJ: return "rgb(245,197,66)";
    case SaiyanForm.SSJ2: return "rgb(245,210,80)";
    case SaiyanForm.SSJ3: return "rgb(255,220,100)";
    case SaiyanForm.SSJBlue: return "rgb(58,134,255)";
    case SaiyanForm.UltraInstinct: return null; // UI has its own special glow
  }
}

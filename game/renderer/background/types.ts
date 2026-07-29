import { C } from "../../constants";

/** Defines the visual theme of the background. */
export type Theme = "mega_man" | "dragon_ball" | "classic";

export interface BackgroundTheme {
  id: Theme;
  skyGradient: [number, string, number, string, number, string];
  floorBase: string;
  gridColor: string;
  scanlineAlpha: number;
  particleColor: string;
}

export const THEMES: Record<Theme, BackgroundTheme> = {
  mega_man: {
    id: "mega_man",
    skyGradient: [0, "#0a0a2a", 0.5, "#1a1a4a", 1, "#333399"],
    floorBase: "#111122",
    gridColor: "#333366",
    scanlineAlpha: 0.05,
    particleColor: "#00ffff",
  },
  dragon_ball: {
    id: "dragon_ball",
    skyGradient: [0, "#0a1040", 0.5, "#1a3070", 1, "#4080b8"],
    floorBase: "#c8bca8",
    gridColor: "rgba(140,130,115,0.2)",
    scanlineAlpha: 0,
    particleColor: "#ffffff",
  },
  classic: {
    id: "classic",
    skyGradient: [0, "#000000", 0.5, "#222222", 1, "#444444"],
    floorBase: "#333333",
    gridColor: "#444444",
    scanlineAlpha: 0.1,
    particleColor: "#ffffff",
  },
};

/** Defines a background layer. */
export interface LayerConfig {
  type: "sky" | "parallax" | "floor" | "decoration";
  color?: string;
  gradient?: [number, string, number, string, number, string];
  items?: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    color?: string;
    speed?: number;
    phase?: number;
    opacity?: number;
  }>;
}

/** Full configuration for a background. */
export interface BackgroundConfig {
  theme: Theme;
  layers: LayerConfig[];
  customDraw?: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;
}

/** A factory function that returns a BackgroundConfig for a specific level. 
 * This allows for dynamic calculations based on height. */
export type BackgroundConfigFactory = (h: number) => BackgroundConfig;

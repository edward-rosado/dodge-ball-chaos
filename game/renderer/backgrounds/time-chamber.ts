import { BackgroundConfigFactory } from "../background/types";

/**
 * Hyperbolic Time Chamber — Endless void with pillars.
 * Mega Man 2 Style.
 */
export const TIME_CHAMBER_CONFIG: BackgroundConfigFactory = (h: number) => ({
  theme: "mega_man",
  layers: [
    { type: "sky" },
    { type: "parallax", items: [
      { x: 0, y: h * 0.2, w: 40, h: h * 0.8, speed: 1, opacity: 0.3 },
      { x: 300, y: h * 0.2, w: 40, h: h * 0.8, speed: 1.5, opacity: 0.5 },
      { x: 600, y: h * 0.2, w: 40, h: h * 0.8, speed: 2, opacity: 0.7 },
    ]},
    { type: "floor" },
  ]
});

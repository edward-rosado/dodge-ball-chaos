import { BackgroundConfigFactory } from "../background/types";

/**
 * World Tournament Arena — Stadium.
 * Mega Man 2 Style.
 */
export const TOURNAMENT_CONFIG: BackgroundConfigFactory = (h: number) => ({
  theme: "mega_man",
  layers: [
    { type: "sky" },
    { type: "parallax", items: [
      { x: 0, y: h * 0.3, w: 200, h: 100, speed: 1, opacity: 0.4 },
      { x: 400, y: h * 0.3, w: 200, h: 100, speed: 1.2, opacity: 0.5 },
    ]},
    { type: "floor" },
  ]
});

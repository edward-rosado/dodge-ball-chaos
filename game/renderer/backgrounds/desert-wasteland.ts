import { BackgroundConfigFactory } from "../background/types";

/**
 * Desert Wasteland — King Piccolo's domain.
 * Mega Man 2 Style.
 */
export const DESERT_WASTELAND_CONFIG: BackgroundConfigFactory = (h: number) => ({
  theme: "mega_man",
  layers: [
    { type: "sky" },
    { type: "parallax", items: [
      { x: 0, y: h * 0.45, w: 500, h: 200, speed: 1, opacity: 0.2 },
      { x: 300, y: h * 0.48, w: 600, h: 250, speed: 1.5, opacity: 0.3 },
    ]},
    { type: "floor" },
    { type: "decoration", items: [
      { x: 100, y: h * 0.7, w: 40, h: 40, color: "#8a3030" },
      { x: 600, y: h * 0.75, w: 60, h: 60, color: "#8a3030" },
    ]}
  ]
});

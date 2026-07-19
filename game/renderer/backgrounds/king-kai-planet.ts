import { BackgroundConfigFactory } from "../background/types";

/**
 * King Kai's Planet — Red dusty surface, pink/purple sky.
 * Mega Man 2 Style.
 */
export const KING_KAI_PLANET_CONFIG: BackgroundConfigFactory = (h: number) => ({
  theme: "mega_man",
  layers: [
    { type: "sky" },
    { type: "parallax", items: [
      { x: 0, y: h * 0.1, w: 400, h: 400, speed: 0.5, opacity: 0.4 }, // The Gas Giant
      { x: 500, y: h * 0.2, w: 200, h: 100, speed: 1, opacity: 0.2 },
    ]},
    { type: "floor" },
    { type: "decoration", items: [
      { x: 200, y: h * 0.7, w: 50, h: 50, color: "#8a3030" },
      { x: 800, y: h * 0.75, w: 60, h: 60, color: "#8a3030" },
    ]}
  ]
});

import { BackgroundConfigFactory } from "../background/types";

/**
 * Kami's Lookout — Sacred floating platform high in the sky.
 * Mega Man 2 Style.
 */
export const KAMIS_LOOKOUT_CONFIG: BackgroundConfigFactory = (h: number) => ({
  theme: "mega_man",
  layers: [
    { type: "sky" },
    { type: "parallax", items: [
      { x: 0, y: h * 0.4, w: 100, h: 50, speed: 1.5, opacity: 0.2 },
      { x: 200, y: h * 0.45, w: 120, h: 60, speed: 2, opacity: 0.3 },
      { x: 400, y: h * 0.42, w: 110, h: 55, speed: 1.8, opacity: 0.25 },
    ]},
    { type: "floor" },
    { type: "decoration", items: [
      { x: 50, y: h * 0.7, w: 2, h: 2 },
      { x: 150, y: h * 0.75, w: 2, h: 2 },
      { x: 250, y: h * 0.72, w: 2, h: 2 },
    ]}
  ]
});

import { BackgroundConfigFactory } from "../background/types";

/**
 * Mega Man 2 Style — Cyber City.
 * Default Mega Man style.
 */
export const MEGA_MAN_STYLE_CONFIG: BackgroundConfigFactory = (h: number) => ({
  theme: "mega_man",
  layers: [
    { type: "sky" },
    { type: "parallax", items: [
      { x: 0, y: h * 0.3, w: 80, h: h * 0.7, speed: 1, opacity: 0.4 },
      { x: 300, y: h * 0.3, w: 80, h: h * 0.7, speed: 1.5, opacity: 0.6 },
    ]},
    { type: "floor" },
    { type: "decoration", items: [
      { x: 100, y: h * 0.75, w: 20, h: 20, color: "#00ffff" },
      { x: 400, y: h * 0.75, w: 20, h: 20, color: "#00ffff" },
    ]}
  ]
});

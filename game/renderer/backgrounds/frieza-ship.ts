import { BackgroundConfigFactory } from "../background/types";

/**
 * Frieza's Spaceship — Metallic corridor.
 * Mega Man 2 Style.
 */
export const FRIEZA_SHIP_CONFIG: BackgroundConfigFactory = (h: number) => {
  const w = 800; // Default canvas width
  return {
  theme: "mega_man",
  layers: [
    { type: "sky" },
    { type: "parallax", items: [
      { x: 0, y: 0, w, h: h, speed: 0.5, opacity: 0.1 }, // Metallic panels
      { x: 100, y: 100, w: 50, h: 50, speed: 2, opacity: 0.4 }, // Tech bits
    ]},
    { type: "floor" },
    { type: "decoration", items: [
      { x: 50, y: h * 0.8, w: 60, h: 10, color: "#00ffff" }, // Energy cores
      { x: 300, y: h * 0.8, w: 60, h: 10, color: "#00ffff" },
    ]}
  ]
  };
};

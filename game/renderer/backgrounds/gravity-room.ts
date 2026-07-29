import { BackgroundConfigFactory } from "../background/types";

/**
 * Gravity Room — Red-tinted metal interior.
 * Mega Man 2 Style.
 */
export const GRAVITY_ROOM_CONFIG: BackgroundConfigFactory = (h: number) => ({
  theme: "mega_man",
  layers: [
    { type: "sky" },
    { type: "parallax", items: [
      { x: 0, y: h * 0.2, w: 60, h: h * 0.8, speed: 0.8, opacity: 0.3 },
      { x: 400, y: h * 0.2, w: 60, h: h * 0.8, speed: 1.2, opacity: 0.5 },
    ]},
    { type: "floor" },
  ]
});

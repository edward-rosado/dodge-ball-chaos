import { GameState, ST, Point } from "./types";
import {
  CW,
  CH,
  PLAYER_SPEED,
  THROW_SPEED,
  SWIPE_MIN,
  BALL_R,
} from "./constants";
import { startGame } from "./state";
import { BallType } from "./balls/types";

/** Convert a DOM event to canvas-space coordinates. */
function toCanvas(
  e: MouseEvent | TouchEvent,
  cvs: HTMLCanvasElement
): Point {
  const r = cvs.getBoundingClientRect();
  const src = "touches" in e ? e.touches[0] : e;
  return {
    x: (src.clientX - r.left) * (CW / r.width),
    y: (src.clientY - r.top) * (CH / r.height),
  };
}

/** Attach all input listeners to the canvas. Returns a cleanup function. */
export function attachInput(
  cvs: HTMLCanvasElement,
  getState: () => GameState | null
): () => void {
  const onDown = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const g = getState();
    if (!g) return;
    const p = toCanvas(e, cvs);
    if (g.state === ST.TITLE || g.state === ST.OVER) {
      startGame(g);
      return;
    }
    if (g.state === ST.READY || g.state === ST.DODGE) {
      g.swS = p;
      g.swE = p;
    }
  };

  const onMove = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const g = getState();
    if (!g || !g.swS) return;
    const p = toCanvas(e, cvs);
    g.swE = p;
    if (g.state === ST.DODGE) {
      const dx = p.x - g.swS.x;
      const dy = p.y - g.swS.y;
      const m = Math.hypot(dx, dy);
      if (m > 2) {
        g.pvx = (dx / m) * PLAYER_SPEED;
        g.pvy = (dy / m) * PLAYER_SPEED;
      }
      g.swS = p;
    }
  };

  const onUp = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const g = getState();
    if (!g) return;
    if (g.state === ST.READY && g.swS && g.swE) {
      const dx = g.swE.x - g.swS.x;
      const dy = g.swE.y - g.swS.y;
      const m = Math.hypot(dx, dy);
      if (m > SWIPE_MIN) {
        g.thrown = {
          x: g.px,
          y: g.py,
          vx: (dx / m) * THROW_SPEED,
          vy: (dy / m) * THROW_SPEED,
          bounceCount: 0,
          type: BallType.Dodgeball,
          age: 0,
          phaseTimer: 0,
          isReal: true,
          radius: BALL_R,
          dead: false,
        };
        g.state = ST.THROW;
      }
    }
    if (g.state === ST.DODGE) {
      g.pvx = 0;
      g.pvy = 0;
    }
    g.swS = null;
    g.swE = null;
  };

  // ─── Keyboard ───
  const onKeyDown = (e: KeyboardEvent) => {
    const g = getState();
    if (!g) return;
    g.keys[e.key] = true;

    if (g.state === ST.TITLE || g.state === ST.OVER) {
      if (e.key === " " || e.key === "Enter") {
        startGame(g);
        return;
      }
    }
    if (g.state === ST.READY && (e.key === " " || e.key === "Enter")) {
      // Throw toward center-up by default, or toward mouse if available
      g.thrown = {
        x: g.px,
        y: g.py,
        vx: 0,
        vy: -THROW_SPEED,
        bounceCount: 0,
        type: BallType.Dodgeball,
        age: 0,
        phaseTimer: 0,
        isReal: true,
        radius: BALL_R,
        dead: false,
      };
      g.state = ST.THROW;
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    const g = getState();
    if (!g) return;
    g.keys[e.key] = false;
  };

  // Attach listeners
  cvs.addEventListener("touchstart", onDown, { passive: false });
  cvs.addEventListener("touchmove", onMove, { passive: false });
  cvs.addEventListener("touchend", onUp, { passive: false });
  cvs.addEventListener("mousedown", onDown);
  cvs.addEventListener("mousemove", onMove);
  cvs.addEventListener("mouseup", onUp);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return () => {
    cvs.removeEventListener("touchstart", onDown);
    cvs.removeEventListener("touchmove", onMove);
    cvs.removeEventListener("touchend", onUp);
    cvs.removeEventListener("mousedown", onDown);
    cvs.removeEventListener("mousemove", onMove);
    cvs.removeEventListener("mouseup", onUp);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  };
}

/** Apply keyboard-driven movement. Call each frame during DODGE state. */
export function applyKeyboardMovement(g: GameState): void {
  let dx = 0;
  let dy = 0;
  if (g.keys["w"] || g.keys["W"] || g.keys["ArrowUp"]) dy -= 1;
  if (g.keys["s"] || g.keys["S"] || g.keys["ArrowDown"]) dy += 1;
  if (g.keys["a"] || g.keys["A"] || g.keys["ArrowLeft"]) dx -= 1;
  if (g.keys["d"] || g.keys["D"] || g.keys["ArrowRight"]) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const m = Math.hypot(dx, dy);
    g.pvx = (dx / m) * PLAYER_SPEED;
    g.pvy = (dy / m) * PLAYER_SPEED;
  } else if (!g.swS) {
    // Only zero velocity if no touch/mouse drag active
    g.pvx = 0;
    g.pvy = 0;
  }
}

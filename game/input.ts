import { GameState, ST, Point } from "./types";
import {
  CW,
  CH,
  PLAYER_SPEED,
  THROW_SPEED,
  SWIPE_MIN,
} from "./constants";
import { startGame } from "./state";
import { createDodgeball } from "./balls/factory";
import { getDodgeballCount, getThrowAngles } from "./balls/spawn";
import { activateNextPowerUp } from "./powerups/effects";
import { MUSIC_BTN } from "./renderer/hud";
import { audio } from "./audio/engine";

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

/** Double-tap window in milliseconds. */
const DOUBLE_TAP_MS = 350;

/** Attach all input listeners to the canvas. Returns a cleanup function. */
export function attachInput(
  cvs: HTMLCanvasElement,
  getState: () => GameState | null
): () => void {
  let lastTapTime = 0;
  let touchActive = false;

  const onDown = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    // Prevent mouse events from double-firing after touch events on mobile
    const isTouch = "touches" in e;
    if (isTouch) {
      touchActive = true;
    } else if (touchActive) {
      return; // Skip synthetic mouse event
    }
    const g = getState();
    if (!g) return;
    const p = toCanvas(e, cvs);
    // Music toggle button hit test
    const mb = MUSIC_BTN;
    if (p.x >= mb.x - mb.w / 2 && p.x <= mb.x + mb.w / 2 &&
        p.y >= mb.y - mb.h / 2 && p.y <= mb.y + mb.h / 2) {
      audio.toggleMusic();
      return;
    }
    if (g.state === ST.TITLE || g.state === ST.OVER || g.state === ST.VICTORY) {
      startGame(g);
      return;
    }
    // Double-tap detection during DODGE — activate next power-up in queue
    if (g.state === ST.DODGE) {
      const now = Date.now();
      if (now - lastTapTime < DOUBLE_TAP_MS) {
        activateNextPowerUp(g);
        lastTapTime = 0; // Reset to prevent triple-tap
      } else {
        lastTapTime = now;
      }
    }
    if (g.state === ST.READY || g.state === ST.DODGE) {
      g.swS = p;
      g.swE = p;
    }
  };

  const onMove = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    if (!("touches" in e) && touchActive) return; // Skip synthetic mouse event
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
    const isTouch = "touches" in e;
    if (isTouch) {
      // Clear touchActive after a short delay to suppress the trailing mouse event
      setTimeout(() => { touchActive = false; }, 50);
    } else if (touchActive) {
      return; // Skip synthetic mouse event
    }
    const g = getState();
    if (!g) return;
    if (g.state === ST.READY && g.swS && g.swE) {
      const dx = g.swE.x - g.swS.x;
      const dy = g.swE.y - g.swS.y;
      const m = Math.hypot(dx, dy);
      if (m > SWIPE_MIN) {
        const baseAngle = Math.atan2(dy, dx);
        const count = getDodgeballCount(g.round);
        const offsets = getThrowAngles(count);
        const upAngle = -Math.PI / 2;
        g.thrown = offsets.map(a => {
          const offset = a - upAngle;
          return createDodgeball(g.px, g.py, baseAngle + offset, THROW_SPEED);
        });
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

    // Music toggle (M key — works in any state)
    if (e.key === "m" || e.key === "M") {
      audio.toggleMusic();
      return;
    }

    if (g.state === ST.TITLE || g.state === ST.OVER) {
      if (e.key === " " || e.key === "Enter") {
        startGame(g);
        return;
      }
    }
    // Spacebar during DODGE — activate next power-up from queue
    if (g.state === ST.DODGE && e.key === " ") {
      activateNextPowerUp(g);
      return;
    }
    if (g.state === ST.READY && (e.key === " " || e.key === "Enter")) {
      const count = getDodgeballCount(g.round);
      const angles = getThrowAngles(count);
      g.thrown = angles.map(a => createDodgeball(g.px, g.py, a, THROW_SPEED));
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

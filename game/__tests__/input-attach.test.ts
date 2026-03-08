import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { attachInput } from "../input";
import { makeGame, startGame } from "../state";
import { ST } from "../types";
import { CW, CH, SWIPE_MIN, PLAYER_SPEED } from "../constants";
import { audio } from "../audio/engine";
import { MUSIC_BTN } from "../renderer/hud";

// ─── Helpers ───

function mockCanvas() {
  const listeners: Record<string, Function> = {};
  return {
    addEventListener: vi.fn((type: string, handler: Function) => {
      listeners[type] = handler;
    }),
    removeEventListener: vi.fn(),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: CW, height: CH }),
    _listeners: listeners,
  } as unknown as HTMLCanvasElement & { _listeners: Record<string, Function> };
}

function makeMouseEvent(x: number, y: number): MouseEvent {
  return {
    preventDefault: vi.fn(),
    clientX: x,
    clientY: y,
  } as unknown as MouseEvent;
}

function makeTouchEvent(x: number, y: number): TouchEvent {
  return {
    preventDefault: vi.fn(),
    touches: [{ clientX: x, clientY: y }],
  } as unknown as TouchEvent;
}

let windowListeners: Record<string, Function>;

// Provide a minimal global `window` if not present (node environment)
const g_this = globalThis as any;
const hadWindow = "window" in g_this;
if (!hadWindow) {
  g_this.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

let origWindowAdd: Function;
let origWindowRemove: Function;

beforeEach(() => {
  windowListeners = {};
  origWindowAdd = g_this.window.addEventListener;
  origWindowRemove = g_this.window.removeEventListener;
  g_this.window.addEventListener = vi.fn((type: string, handler: any) => {
    windowListeners[type] = handler;
  });
  g_this.window.removeEventListener = vi.fn();
});

afterEach(() => {
  g_this.window.addEventListener = origWindowAdd;
  g_this.window.removeEventListener = origWindowRemove;
  vi.restoreAllMocks();
});

// ─── attachInput: listener registration ───

describe("attachInput registration", () => {
  it("attaches touch, mouse, and keyboard listeners", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    attachInput(cvs, () => g);

    expect(cvs.addEventListener).toHaveBeenCalledTimes(6);
    expect(g_this.window.addEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
    expect(g_this.window.addEventListener).toHaveBeenCalledWith("keyup", expect.any(Function));
  });

  it("returns a cleanup function that removes all listeners", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    const cleanup = attachInput(cvs, () => g);

    cleanup();

    expect(cvs.removeEventListener).toHaveBeenCalledTimes(6);
    expect(g_this.window.removeEventListener).toHaveBeenCalledTimes(2);
  });
});

// ─── onDown ───

describe("onDown handler", () => {
  it("starts game from TITLE state", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    expect(g.state).toBe(ST.TITLE);
    attachInput(cvs, () => g);

    cvs._listeners["mousedown"](makeMouseEvent(100, 100));

    expect(g.state).toBe(ST.READY);
  });

  it("starts game from OVER state", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    g.state = ST.OVER;
    attachInput(cvs, () => g);

    cvs._listeners["mousedown"](makeMouseEvent(100, 100));

    expect(g.state).toBe(ST.READY);
  });

  it("starts game from VICTORY state", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    g.state = ST.VICTORY;
    attachInput(cvs, () => g);

    cvs._listeners["mousedown"](makeMouseEvent(100, 100));

    expect(g.state).toBe(ST.READY);
  });

  it("sets swS/swE in READY state", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    expect(g.state).toBe(ST.READY);
    attachInput(cvs, () => g);

    cvs._listeners["mousedown"](makeMouseEvent(50, 80));

    expect(g.swS).toEqual({ x: 50, y: 80 });
    expect(g.swE).toEqual({ x: 50, y: 80 });
  });

  it("sets swS/swE in DODGE state", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    attachInput(cvs, () => g);

    cvs._listeners["mousedown"](makeMouseEvent(120, 200));

    expect(g.swS).toEqual({ x: 120, y: 200 });
    expect(g.swE).toEqual({ x: 120, y: 200 });
  });

  it("does nothing when getState returns null", () => {
    const cvs = mockCanvas();
    attachInput(cvs, () => null);

    // Should not throw
    cvs._listeners["mousedown"](makeMouseEvent(100, 100));
  });

  it("handles touch events (uses touches[0])", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    attachInput(cvs, () => g);

    cvs._listeners["touchstart"](makeTouchEvent(60, 90));

    expect(g.swS).toEqual({ x: 60, y: 90 });
  });
});

// ─── onMove ───

describe("onMove handler", () => {
  it("updates swE on move", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    g.swS = { x: 50, y: 50 };
    attachInput(cvs, () => g);

    cvs._listeners["mousemove"](makeMouseEvent(100, 150));

    expect(g.swE).toEqual({ x: 100, y: 150 });
  });

  it("does nothing if swS is null", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    g.swS = null;
    attachInput(cvs, () => g);

    cvs._listeners["mousemove"](makeMouseEvent(100, 150));

    expect(g.swE).toBeNull();
  });

  it("does nothing if getState returns null", () => {
    const cvs = mockCanvas();
    attachInput(cvs, () => null);
    cvs._listeners["mousemove"](makeMouseEvent(100, 150));
    // No throw expected
  });

  it("sets player velocity in DODGE state when drag > 2px", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.swS = { x: 100, y: 100 };
    attachInput(cvs, () => g);

    // Move 50px to the right (well above 2px threshold)
    cvs._listeners["mousemove"](makeMouseEvent(150, 100));

    expect(g.pvx).toBeCloseTo(PLAYER_SPEED, 2);
    expect(g.pvy).toBeCloseTo(0, 2);
    // swS should update to current position
    expect(g.swS).toEqual({ x: 150, y: 100 });
  });

  it("does not set velocity in DODGE state if drag <= 2px", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.swS = { x: 100, y: 100 };
    g.pvx = 0;
    g.pvy = 0;
    attachInput(cvs, () => g);

    // Move only 1px (below 2px threshold)
    cvs._listeners["mousemove"](makeMouseEvent(101, 100));

    expect(g.pvx).toBe(0);
    expect(g.pvy).toBe(0);
  });

  it("does not set velocity in READY state (only updates swE)", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    g.state = ST.READY;
    g.swS = { x: 100, y: 100 };
    g.pvx = 0;
    g.pvy = 0;
    attachInput(cvs, () => g);

    cvs._listeners["mousemove"](makeMouseEvent(200, 200));

    expect(g.pvx).toBe(0);
    expect(g.pvy).toBe(0);
    expect(g.swE).toEqual({ x: 200, y: 200 });
  });
});

// ─── onUp ───

describe("onUp handler", () => {
  it("transitions to THROW on swipe > SWIPE_MIN in READY state", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    g.state = ST.READY;
    g.swS = { x: 100, y: 300 };
    g.swE = { x: 100, y: 300 - SWIPE_MIN - 10 }; // Swipe up, distance > SWIPE_MIN
    attachInput(cvs, () => g);

    cvs._listeners["mouseup"](makeMouseEvent(100, 300 - SWIPE_MIN - 10));

    expect(g.state).toBe(ST.THROW);
    expect(g.thrown.length).toBeGreaterThan(0);
    expect(g.swS).toBeNull();
    expect(g.swE).toBeNull();
  });

  it("does NOT throw on swipe < SWIPE_MIN in READY state", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    g.state = ST.READY;
    g.swS = { x: 100, y: 300 };
    g.swE = { x: 100, y: 300 - (SWIPE_MIN / 2) }; // Too short
    attachInput(cvs, () => g);

    cvs._listeners["mouseup"](makeMouseEvent(100, 295));

    expect(g.state).toBe(ST.READY);
    expect(g.thrown.length).toBe(0);
  });

  it("zeros velocity on up in DODGE state", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.pvx = 5;
    g.pvy = 3;
    attachInput(cvs, () => g);

    cvs._listeners["mouseup"](makeMouseEvent(100, 100));

    expect(g.pvx).toBe(0);
    expect(g.pvy).toBe(0);
  });

  it("clears swS and swE on up", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.swS = { x: 50, y: 50 };
    g.swE = { x: 100, y: 100 };
    attachInput(cvs, () => g);

    cvs._listeners["mouseup"](makeMouseEvent(100, 100));

    expect(g.swS).toBeNull();
    expect(g.swE).toBeNull();
  });

  it("does nothing when getState returns null", () => {
    const cvs = mockCanvas();
    attachInput(cvs, () => null);
    cvs._listeners["mouseup"](makeMouseEvent(100, 100));
    // No throw expected
  });

  it("does NOT throw when swS is null in READY state", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    g.state = ST.READY;
    g.swS = null;
    g.swE = { x: 100, y: 100 };
    attachInput(cvs, () => g);

    cvs._listeners["mouseup"](makeMouseEvent(100, 100));

    expect(g.state).toBe(ST.READY);
  });
});

// ─── onKeyDown ───

describe("onKeyDown handler", () => {
  it("starts game on Space from TITLE state", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    expect(g.state).toBe(ST.TITLE);
    attachInput(cvs, () => g);

    windowListeners["keydown"]({ key: " " } as KeyboardEvent);

    expect(g.state).toBe(ST.READY);
  });

  it("starts game on Enter from TITLE state", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    attachInput(cvs, () => g);

    windowListeners["keydown"]({ key: "Enter" } as KeyboardEvent);

    expect(g.state).toBe(ST.READY);
  });

  it("starts game on Space from OVER state", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    g.state = ST.OVER;
    attachInput(cvs, () => g);

    windowListeners["keydown"]({ key: " " } as KeyboardEvent);

    expect(g.state).toBe(ST.READY);
  });

  it("starts game on Enter from OVER state", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    g.state = ST.OVER;
    attachInput(cvs, () => g);

    windowListeners["keydown"]({ key: "Enter" } as KeyboardEvent);

    expect(g.state).toBe(ST.READY);
  });

  it("activates IT on Space in DODGE state with uses > 0", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.instantTransmissionUses = 2;
    attachInput(cvs, () => g);

    windowListeners["keydown"]({ key: " " } as KeyboardEvent);

    // IT should have been activated (uses decremented)
    expect(g.instantTransmissionUses).toBe(1);
    expect(g.itFlashTimer).toBeGreaterThan(0);
  });

  it("does NOT activate IT on Space if uses = 0", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.instantTransmissionUses = 0;
    attachInput(cvs, () => g);

    windowListeners["keydown"]({ key: " " } as KeyboardEvent);

    expect(g.instantTransmissionUses).toBe(0);
  });

  it("throws on Space in READY state", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    g.state = ST.READY;
    attachInput(cvs, () => g);

    windowListeners["keydown"]({ key: " " } as KeyboardEvent);

    expect(g.state).toBe(ST.THROW);
    expect(g.thrown.length).toBeGreaterThan(0);
  });

  it("throws on Enter in READY state", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    g.state = ST.READY;
    attachInput(cvs, () => g);

    windowListeners["keydown"]({ key: "Enter" } as KeyboardEvent);

    expect(g.state).toBe(ST.THROW);
    expect(g.thrown.length).toBeGreaterThan(0);
  });

  it("sets key to true", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    attachInput(cvs, () => g);

    windowListeners["keydown"]({ key: "w" } as KeyboardEvent);

    expect(g.keys["w"]).toBe(true);
  });

  it("does nothing when getState returns null", () => {
    const cvs = mockCanvas();
    attachInput(cvs, () => null);
    windowListeners["keydown"]({ key: " " } as KeyboardEvent);
    // No throw expected
  });
});

// ─── onKeyUp ───

describe("onKeyUp handler", () => {
  it("sets key to false", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    g.keys["w"] = true;
    attachInput(cvs, () => g);

    windowListeners["keyup"]({ key: "w" } as KeyboardEvent);

    expect(g.keys["w"]).toBe(false);
  });

  it("does nothing when getState returns null", () => {
    const cvs = mockCanvas();
    attachInput(cvs, () => null);
    windowListeners["keyup"]({ key: "w" } as KeyboardEvent);
    // No throw expected
  });
});

// ─── Touch/mouse double-fire prevention ───

describe("touchActive flag prevents double-fire", () => {
  it("touchstart followed by mousedown only triggers onDown once", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    g.state = ST.DODGE;
    g.afterimageUses = 1;
    attachInput(cvs, () => g);

    // Simulate touch tap
    cvs._listeners["touchstart"](makeTouchEvent(CW / 2, CH / 2));
    // Synthetic mouse event that follows — should be skipped
    cvs._listeners["mousedown"](makeMouseEvent(CW / 2, CH / 2));

    // Only one tap should be registered (not double-tap activated)
    // afterimageUses should still be 1 (not consumed by false double-tap)
    expect(g.afterimageUses).toBe(1);
  });
});

// ─── Music toggle via M key ───

describe("Music toggle keyboard shortcut", () => {
  it("M key toggles music mute", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    attachInput(cvs, () => g);

    const wasMuted = audio.musicMuted;
    windowListeners["keydown"]({ key: "m" } as KeyboardEvent);
    expect(audio.musicMuted).toBe(!wasMuted);
    // Toggle back
    windowListeners["keydown"]({ key: "m" } as KeyboardEvent);
    expect(audio.musicMuted).toBe(wasMuted);
  });
});

// ─── Music button tap ───

describe("Music button tap", () => {
  it("tapping music button area toggles music without starting game", () => {
    const cvs = mockCanvas();
    const g = makeGame();
    startGame(g);
    g.state = ST.TITLE; // On title screen
    attachInput(cvs, () => g);

    const wasMuted = audio.musicMuted;

    // Tap exactly on the music button
    cvs._listeners["mousedown"](makeMouseEvent(MUSIC_BTN.x, MUSIC_BTN.y));

    // Music should toggle
    expect(audio.musicMuted).toBe(!wasMuted);
    // Game should NOT start (still on title)
    expect(g.state).toBe(ST.TITLE);
    // Reset
    audio.toggleMusic();
  });
});

import { describe, it, expect, vi } from "vitest";
import { getBackgroundIdForRound, getBackgroundDrawFn } from "../renderer/backgrounds";
import { drawGrid } from "../renderer/background";

// ─── getBackgroundIdForRound ───

describe("getBackgroundIdForRound", () => {
  it("should return 5 (Frieza's Ship) for round 50", () => {
    expect(getBackgroundIdForRound(50)).toBe(5);
  });

  it("should return 0 or 1 for rounds 1-9", () => {
    for (let i = 0; i < 30; i++) {
      const round = Math.floor(Math.random() * 9) + 1;
      const id = getBackgroundIdForRound(round);
      expect([0, 1]).toContain(id);
    }
  });

  it("should return 1, 3, or 4 for rounds 10-19", () => {
    for (let i = 0; i < 30; i++) {
      const round = Math.floor(Math.random() * 10) + 10;
      const id = getBackgroundIdForRound(round);
      expect([1, 3, 4]).toContain(id);
    }
  });

  it("should return 0 or 2 for rounds 20-29", () => {
    for (let i = 0; i < 30; i++) {
      const round = Math.floor(Math.random() * 10) + 20;
      const id = getBackgroundIdForRound(round);
      expect([0, 2]).toContain(id);
    }
  });

  it("should return 3 or 4 for rounds 30-39", () => {
    for (let i = 0; i < 30; i++) {
      const round = Math.floor(Math.random() * 10) + 30;
      const id = getBackgroundIdForRound(round);
      expect([3, 4]).toContain(id);
    }
  });

  it("should return 0-4 (excluding 5) for rounds 40-49", () => {
    for (let i = 0; i < 50; i++) {
      const round = Math.floor(Math.random() * 10) + 40;
      const id = getBackgroundIdForRound(round);
      expect([0, 1, 2, 3, 4]).toContain(id);
    }
  });
});

// ─── getBackgroundDrawFn ───

describe("getBackgroundDrawFn", () => {
  it("should return a function for valid IDs 0-5", () => {
    for (let id = 0; id <= 5; id++) {
      const fn = getBackgroundDrawFn(id);
      expect(typeof fn).toBe("function");
    }
  });

  it("should fallback to BACKGROUNDS[0] for invalid ID", () => {
    const fallback = getBackgroundDrawFn(0);
    expect(getBackgroundDrawFn(99)).toBe(fallback);
    expect(getBackgroundDrawFn(-1)).toBe(fallback);
  });
});

// ─── drawGrid (background.ts lines 11-12) ───

describe("drawGrid", () => {
  function mockCtx() {
    return {
      beginPath: vi.fn(),
      arc: vi.fn(),
      arcTo: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      clearRect: vi.fn(),
      clip: vi.fn(),
      ellipse: vi.fn(),
      quadraticCurveTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      measureText: vi.fn(() => ({ width: 50 })),
      drawImage: vi.fn(),
      setLineDash: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createPattern: vi.fn(),
      setTransform: vi.fn(),
      resetTransform: vi.fn(),
      strokeStyle: "",
      fillStyle: "",
      lineWidth: 0,
      shadowColor: "",
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      globalAlpha: 1,
      globalCompositeOperation: "source-over",
      font: "",
      textAlign: "",
      textBaseline: "",
      lineCap: "",
      lineJoin: "",
      lineDashOffset: 0,
    } as unknown as CanvasRenderingContext2D;
  }

  it("should call the background draw function without throwing", () => {
    const ctx = mockCtx();
    expect(() => drawGrid(ctx, 400, 680, 0, 0)).not.toThrow();
  });

  it("should work with all valid background IDs", () => {
    const ctx = mockCtx();
    for (let id = 0; id <= 5; id++) {
      expect(() => drawGrid(ctx, 400, 680, 1.0, id)).not.toThrow();
    }
  });

  it("should work with invalid background ID (uses fallback)", () => {
    const ctx = mockCtx();
    expect(() => drawGrid(ctx, 400, 680, 0, 999)).not.toThrow();
  });
});

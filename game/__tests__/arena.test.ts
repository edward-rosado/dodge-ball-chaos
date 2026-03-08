import { describe, it, expect, vi } from "vitest";
import { pipePos, createPipes, randomPipe } from "../arena";
import {
  PIPE_COUNT, ARENA_CX, ARENA_LEFT, ARENA_RIGHT, ARENA_TOP, ARENA_BOTTOM,
  CW, CH, C, PIPE_HALF,
} from "../constants";
import { drawArenaBoundary } from "../renderer/background";
import { drawPipe } from "../renderer/pipe";

// ─── Arena geometry (rounded rectangle) ───

describe("pipePos", () => {
  it("should place top-edge pipes along the top wall", () => {
    // First 9 pipes are on the top edge
    for (let i = 0; i < 9; i++) {
      const p = pipePos(i);
      expect(p.y).toBe(ARENA_TOP);
      expect(p.x).toBeGreaterThanOrEqual(ARENA_LEFT);
      expect(p.x).toBeLessThanOrEqual(ARENA_RIGHT);
      expect(p.angle).toBe(Math.PI / 2); // Points inward (down)
    }
  });

  it("should place right-edge pipes along the right wall", () => {
    // Pipes 9-23 are on the right edge
    for (let i = 9; i < 24; i++) {
      const p = pipePos(i);
      expect(p.x).toBe(ARENA_RIGHT);
      expect(p.y).toBeGreaterThanOrEqual(ARENA_TOP);
      expect(p.y).toBeLessThanOrEqual(ARENA_BOTTOM);
      expect(p.angle).toBe(Math.PI); // Points inward (left)
    }
  });

  it("should place bottom-edge pipes along the bottom wall", () => {
    // Pipes 24-32 are on the bottom edge
    for (let i = 24; i < 33; i++) {
      const p = pipePos(i);
      expect(p.y).toBe(ARENA_BOTTOM);
      expect(p.x).toBeGreaterThanOrEqual(ARENA_LEFT);
      expect(p.x).toBeLessThanOrEqual(ARENA_RIGHT);
      expect(p.angle).toBe(-Math.PI / 2); // Points inward (up)
    }
  });

  it("should place left-edge pipes along the left wall", () => {
    // Pipes 33-47 are on the left edge
    for (let i = 33; i < 48; i++) {
      const p = pipePos(i);
      expect(p.x).toBe(ARENA_LEFT);
      expect(p.y).toBeGreaterThanOrEqual(ARENA_TOP);
      expect(p.y).toBeLessThanOrEqual(ARENA_BOTTOM);
      expect(p.angle).toBe(0); // Points inward (right)
    }
  });

  it("should place all pipes on the arena boundary edges", () => {
    for (let i = 0; i < PIPE_COUNT; i++) {
      const p = pipePos(i);
      // Every pipe should be on one of the 4 walls
      const onLeft = p.x === ARENA_LEFT;
      const onRight = p.x === ARENA_RIGHT;
      const onTop = p.y === ARENA_TOP;
      const onBottom = p.y === ARENA_BOTTOM;
      expect(onLeft || onRight || onTop || onBottom).toBe(true);
    }
  });
});

describe("arena sizing", () => {
  it("should maximize playable space — pipes at the canvas edge", () => {
    const pipes = createPipes();

    for (const p of pipes) {
      expect(p.x - PIPE_HALF).toBeGreaterThanOrEqual(0);
      expect(p.x + PIPE_HALF).toBeLessThanOrEqual(CW);
      expect(p.y - PIPE_HALF).toBeGreaterThanOrEqual(0);
      expect(p.y + PIPE_HALF).toBeLessThanOrEqual(CH);
    }
  });

  it("should use the full canvas width (left/right walls at pipe edge)", () => {
    expect(ARENA_LEFT).toBe(PIPE_HALF);
    expect(ARENA_RIGHT).toBe(CW - PIPE_HALF);
  });

  it("should center the arena horizontally on the canvas", () => {
    expect(ARENA_CX).toBe(CW / 2);
  });

  it("should leave space for HUD at the top", () => {
    expect(ARENA_TOP).toBeGreaterThanOrEqual(60); // HUD ends ~60px
  });
});

describe("createPipes", () => {
  it("should create exactly PIPE_COUNT pipes", () => {
    const pipes = createPipes();
    expect(pipes).toHaveLength(PIPE_COUNT);
  });

  it("should distribute pipes across all 4 edges", () => {
    const pipes = createPipes();
    const edges = { top: 0, right: 0, bottom: 0, left: 0 };
    for (const p of pipes) {
      if (p.y === ARENA_TOP) edges.top++;
      else if (p.y === ARENA_BOTTOM) edges.bottom++;
      else if (p.x === ARENA_RIGHT) edges.right++;
      else if (p.x === ARENA_LEFT) edges.left++;
    }
    // 9 top, 15 right, 9 bottom, 15 left
    expect(edges.top).toBe(9);
    expect(edges.right).toBe(15);
    expect(edges.bottom).toBe(9);
    expect(edges.left).toBe(15);
  });

  it("should not place any two pipes at the same position", () => {
    const pipes = createPipes();
    for (let i = 0; i < pipes.length; i++) {
      for (let j = i + 1; j < pipes.length; j++) {
        const d = Math.hypot(pipes[i].x - pipes[j].x, pipes[i].y - pipes[j].y);
        expect(d).toBeGreaterThan(1);
      }
    }
  });
});

describe("randomPipe", () => {
  it("should return a valid pipe index", () => {
    for (let i = 0; i < 50; i++) {
      const idx = randomPipe();
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(PIPE_COUNT);
    }
  });

  it("should never return the excluded index", () => {
    for (let i = 0; i < 50; i++) {
      const idx = randomPipe(3);
      expect(idx).not.toBe(3);
    }
  });
});

// ─── Arena rendering ───

function mockCtx() {
  return {
    beginPath: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 0,
    shadowColor: "",
    shadowBlur: 0,
  } as unknown as CanvasRenderingContext2D;
}

describe("drawArenaBoundary", () => {
  it("should draw a rounded rectangle path", () => {
    const ctx = mockCtx();
    drawArenaBoundary(ctx);
    // Should use moveTo/lineTo/arcTo for rounded rect (not arc for circle)
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
    expect(ctx.arcTo).toHaveBeenCalled();
    expect(ctx.closePath).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("should use the arena edge color", () => {
    const ctx = mockCtx();
    drawArenaBoundary(ctx);
    expect(ctx.strokeStyle).toBe(C.arenaEdge);
  });

  it("should use line width 2", () => {
    const ctx = mockCtx();
    drawArenaBoundary(ctx);
    expect(ctx.lineWidth).toBe(2);
  });
});

describe("drawPipe", () => {
  it("should draw an inactive pipe (Mario tube)", () => {
    const ctx = mockCtx();
    const pipe = pipePos(0);
    drawPipe(ctx, pipe, false, 0);
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
    expect(ctx.translate).toHaveBeenCalledWith(pipe.x, pipe.y);
    expect(ctx.rotate).toHaveBeenCalled();
  });

  it("should apply glow effect for active pipe", () => {
    const ctx = mockCtx();
    const pipe = pipePos(0);
    drawPipe(ctx, pipe, true, 0);
    expect(ctx.shadowColor).toBe("#0ff");
    expect(ctx.shadowBlur).toBeGreaterThan(0);
  });

  it("should apply charging glow when charging", () => {
    const ctx = mockCtx();
    const pipe = pipePos(0);
    drawPipe(ctx, pipe, false, 0, true);
    expect(ctx.shadowColor).toBe("#ff4422");
    expect(ctx.shadowBlur).toBeGreaterThan(0);
  });
});

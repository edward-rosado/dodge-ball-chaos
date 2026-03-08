"use client";

import { useEffect, useRef, useCallback } from "react";

// ─── Constants ───
const CW = 400;
const CH = 680;
const BALL_R = 7;
const PIPE_COUNT = 8;
const BASE_ROUND_TIME = 10;
const PLAYER_SPEED = 3.8;
const BASE_BALL_SPEED = 2.8;
const HIT_DIST = 18;

// ─── Colors ───
const C = {
  bg: "#08080f",
  gridL: "#1a1a35",
  player: "#ff6b1a",
  hair: "#111",
  skin: "#ffb07c",
  belt: "#3a86ff",
  ball: "#e63946",
  ballHi: "#ff8a94",
  pipe: "#2ec4b6",
  pipeGlow: "#0ff",
  hud: "#d8d8ff",
  hudDim: "#555580",
  life: "#e63946",
  lifeDead: "#222238",
  powerSlow: "#3a86ff",
  powerShield: "#ffd60a",
  title: "#ff6b1a",
  round: "#2ec4b6",
  gameOver: "#e63946",
  swipe: "rgba(255,107,26,0.35)",
  white: "#fff",
};

interface Point { x: number; y: number; }
interface Ball extends Point { vx: number; vy: number; }
interface Pipe extends Point { angle: number; }
interface PowerUp extends Point { type: "slow" | "shield"; collected: boolean; }

interface GameState {
  state: number;
  px: number; py: number;
  pvx: number; pvy: number;
  thrown: Ball | null;
  balls: Ball[];
  round: number;
  lives: number;
  score: number;
  timer: number;
  pipes: Pipe[];
  activePipe: number;
  powerUp: PowerUp | null;
  slow: boolean; slowTimer: number;
  shield: boolean; shieldTimer: number;
  flash: number;
  msgTimer: number; msg: string;
  highScore: number;
  t: number;
  swS: Point | null; swE: Point | null;
  launched: number;
  launchDelay: number;
  launchQueue: number;
}

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const px = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => {
  ctx.fillStyle = c;
  ctx.fillRect(~~x, ~~y, ~~w, ~~h);
};

const ST = { TITLE: 0, READY: 1, THROW: 2, DODGE: 3, HIT: 4, CLEAR: 5, OVER: 6 };

function pipePos(i: number, w: number, h: number): Pipe {
  const a = (Math.PI * 2 * i) / PIPE_COUNT;
  return {
    x: w / 2 + Math.cos(a) * (w / 2 - 35),
    y: h / 2 + Math.sin(a) * (h / 2 - 35),
    angle: a,
  };
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.strokeStyle = C.gridL;
  ctx.lineWidth = 1;
  const sp = 30;
  const o = t % sp;
  for (let x = o; x < w; x += sp) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = o; y < h; y += sp) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
}

function drawGoku(ctx: CanvasRenderingContext2D, x: number, y: number, flash: boolean) {
  const u = 4;
  const bx = ~~(x - u * 3.5);
  const by = ~~(y - u * 4);
  if (flash) { ctx.shadowColor = "#fff"; ctx.shadowBlur = 16; }
  px(ctx, bx + u, by, u, u * 2.5, C.hair);
  px(ctx, bx + u * 2, by - u * 1.2, u, u * 3, C.hair);
  px(ctx, bx + u * 3, by - u * 1.8, u, u * 3.5, C.hair);
  px(ctx, bx + u * 4, by - u * 1.2, u, u * 3, C.hair);
  px(ctx, bx + u * 5, by, u, u * 2, C.hair);
  px(ctx, bx + u * 2, by + u * 1.8, u * 3, u * 1.8, flash ? C.white : C.skin);
  px(ctx, bx + u * 2.4, by + u * 2.5, u * 0.6, u * 0.6, C.hair);
  px(ctx, bx + u * 4, by + u * 2.5, u * 0.6, u * 0.6, C.hair);
  px(ctx, bx + u * 2, by + u * 3.6, u * 3, u * 2.5, flash ? C.white : C.player);
  px(ctx, bx + u * 2, by + u * 5, u * 3, u * 0.5, C.belt);
  px(ctx, bx + u * 2.2, by + u * 6, u, u * 1.5, flash ? C.white : C.player);
  px(ctx, bx + u * 3.8, by + u * 6, u, u * 1.5, flash ? C.white : C.player);
  ctx.shadowBlur = 0;
}

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, glow: boolean) {
  if (glow) { ctx.shadowColor = C.ball; ctx.shadowBlur = 12; }
  ctx.beginPath();
  ctx.arc(~~x, ~~y, BALL_R, 0, Math.PI * 2);
  ctx.fillStyle = C.ball;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(~~x - 2, ~~y - 2, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = C.ballHi;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawPipe(ctx: CanvasRenderingContext2D, p: Pipe, active: boolean, t: number) {
  const s = 14;
  ctx.save();
  if (active) { ctx.shadowColor = C.pipeGlow; ctx.shadowBlur = 10 + Math.sin(t * 6) * 5; }
  px(ctx, p.x - s / 2, p.y - s / 2, s, s, active ? C.pipeGlow : C.pipe);
  px(ctx, p.x - s / 4, p.y - s / 4, s / 2, s / 2, active ? C.white : "#1a6b64");
  ctx.restore();
}

function drawPowerUp(ctx: CanvasRenderingContext2D, pu: PowerUp | null, t: number) {
  if (!pu || pu.collected) return;
  const pulse = 1 + Math.sin(t * 5) * 0.15;
  const r = 10 * pulse;
  ctx.save();
  ctx.shadowColor = pu.type === "slow" ? C.powerSlow : C.powerShield;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(~~pu.x, ~~pu.y, r, 0, Math.PI * 2);
  ctx.fillStyle = pu.type === "slow" ? C.powerSlow : C.powerShield;
  ctx.fill();
  ctx.font = "bold 10px monospace";
  ctx.fillStyle = C.white;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(pu.type === "slow" ? "S" : "\u2605", pu.x, pu.y + 1);
  ctx.restore();
}

function drawHUD(ctx: CanvasRenderingContext2D, round: number, lives: number, timer: number, score: number) {
  ctx.font = "bold 13px 'Press Start 2P', monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = C.hud;
  ctx.fillText("RND " + round, 12, 24);
  ctx.textAlign = "right";
  ctx.fillText("" + score, CW - 12, 24);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < lives ? C.life : C.lifeDead;
    ctx.textAlign = "left";
    ctx.fillText("\u2665", 24 + i * 20, 46);
  }
  const maxW = CW - 24;
  const pct = clamp(timer / BASE_ROUND_TIME, 0, 1);
  px(ctx, 12, 56, maxW, 4, C.lifeDead);
  px(ctx, 12, 56, maxW * pct, 4, pct < 0.25 ? C.life : C.round);
}

function drawText(ctx: CanvasRenderingContext2D, text: string, y: number, color: string, size: number) {
  ctx.save();
  ctx.font = "bold " + size + "px 'Press Start 2P', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.fillStyle = color;
  ctx.fillText(text, CW / 2, y);
  ctx.shadowBlur = 0;
  ctx.restore();
}

export default function DodgeBallChaos() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gRef = useRef<GameState | null>(null);
  const rafRef = useRef<number>(0);

  const makeGame = useCallback((): GameState => ({
    state: ST.TITLE,
    px: CW / 2, py: CH / 2,
    pvx: 0, pvy: 0,
    thrown: null,
    balls: [],
    round: 1,
    lives: 3,
    score: 0,
    timer: BASE_ROUND_TIME,
    pipes: Array.from({ length: PIPE_COUNT }, (_, i) => pipePos(i, CW, CH)),
    activePipe: -1,
    powerUp: null,
    slow: false, slowTimer: 0,
    shield: false, shieldTimer: 0,
    flash: 0,
    msgTimer: 0, msg: "",
    highScore: 0,
    t: 0,
    swS: null, swE: null,
    launched: 0,
    launchDelay: 0,
    launchQueue: 0,
  }), []);

  const initRound = useCallback((g: GameState) => {
    g.px = CW / 2; g.py = CH / 2;
    g.pvx = 0; g.pvy = 0;
    g.thrown = null; g.balls = [];
    g.timer = Math.max(4, BASE_ROUND_TIME - (g.round - 1) * 0.4);
    g.activePipe = -1;
    g.state = ST.READY;
    g.powerUp = null;
    g.slow = false; g.slowTimer = 0;
    g.shield = false; g.shieldTimer = 0;
    g.swS = null; g.swE = null;
    g.launchQueue = g.round;
    g.launchDelay = 0; g.launched = 0;
    g.msg = "ROUND " + g.round;
    g.msgTimer = 1.5;
    if (g.round > 2 && Math.random() < 0.4) {
      g.powerUp = {
        x: 60 + Math.random() * (CW - 120),
        y: 120 + Math.random() * (CH - 240),
        type: Math.random() < 0.5 ? "slow" : "shield",
        collected: false,
      };
    }
  }, []);

  const startGame = useCallback(() => {
    const g = gRef.current;
    if (!g) return;
    g.round = 1; g.lives = 3; g.score = 0;
    initRound(g);
  }, [initRound]);

  useEffect(() => { gRef.current = makeGame(); }, [makeGame]);

  // Input
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const pos = (e: MouseEvent | TouchEvent): Point => {
      const r = cvs.getBoundingClientRect();
      const src = "touches" in e ? e.touches[0] : e;
      return { x: (src.clientX - r.left) * (CW / r.width), y: (src.clientY - r.top) * (CH / r.height) };
    };
    const onDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const g = gRef.current; if (!g) return;
      const p = pos(e);
      if (g.state === ST.TITLE || g.state === ST.OVER) { startGame(); return; }
      if (g.state === ST.READY || g.state === ST.DODGE) { g.swS = p; g.swE = p; }
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const g = gRef.current; if (!g || !g.swS) return;
      const p = pos(e); g.swE = p;
      if (g.state === ST.DODGE) {
        const dx = p.x - g.swS.x, dy = p.y - g.swS.y;
        const m = Math.hypot(dx, dy);
        if (m > 2) { g.pvx = (dx / m) * PLAYER_SPEED; g.pvy = (dy / m) * PLAYER_SPEED; }
        g.swS = p;
      }
    };
    const onUp = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const g = gRef.current; if (!g) return;
      if (g.state === ST.READY && g.swS && g.swE) {
        const dx = g.swE.x - g.swS.x, dy = g.swE.y - g.swS.y;
        const m = Math.hypot(dx, dy);
        if (m > 12) {
          g.thrown = { x: g.px, y: g.py, vx: (dx / m) * 7, vy: (dy / m) * 7 };
          g.state = ST.THROW;
        }
      }
      if (g.state === ST.DODGE) { g.pvx = 0; g.pvy = 0; }
      g.swS = null; g.swE = null;
    };
    cvs.addEventListener("touchstart", onDown, { passive: false });
    cvs.addEventListener("touchmove", onMove, { passive: false });
    cvs.addEventListener("touchend", onUp, { passive: false });
    cvs.addEventListener("mousedown", onDown);
    cvs.addEventListener("mousemove", onMove);
    cvs.addEventListener("mouseup", onUp);
    return () => {
      cvs.removeEventListener("touchstart", onDown);
      cvs.removeEventListener("touchmove", onMove);
      cvs.removeEventListener("touchend", onUp);
      cvs.removeEventListener("mousedown", onDown);
      cvs.removeEventListener("mousemove", onMove);
      cvs.removeEventListener("mouseup", onUp);
    };
  }, [startGame]);

  // Game loop
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    let prev = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      const g = gRef.current;
      if (!g) { rafRef.current = requestAnimationFrame(tick); return; }
      g.t += dt;

      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, CW, CH);
      drawGrid(ctx, CW, CH, g.t * 8);

      // ── TITLE ──
      if (g.state === ST.TITLE) {
        drawGoku(ctx, CW / 2, CH / 2 - 40, false);
        drawText(ctx, "DODGE BALL", CH / 2 + 30, C.title, 18);
        drawText(ctx, "CHAOS", CH / 2 + 56, C.title, 18);
        ctx.font = "9px monospace"; ctx.fillStyle = C.hudDim; ctx.textAlign = "center";
        const blink = Math.sin(g.t * 3) > 0;
        if (blink) ctx.fillText("TAP OR CLICK TO START", CW / 2, CH / 2 + 100);
        ctx.fillStyle = C.hudDim;
        ctx.fillText("SWIPE TO THROW & DODGE", CW / 2, CH / 2 + 118);
        rafRef.current = requestAnimationFrame(tick); return;
      }

      // ── GAME OVER ──
      if (g.state === ST.OVER) {
        drawText(ctx, "GAME OVER", CH / 2 - 30, C.gameOver, 18);
        drawText(ctx, "SCORE: " + g.score, CH / 2 + 10, C.hud, 12);
        drawText(ctx, "BEST: " + g.highScore, CH / 2 + 36, C.hudDim, 10);
        ctx.font = "9px monospace"; ctx.fillStyle = C.hudDim; ctx.textAlign = "center";
        const blink = Math.sin(g.t * 3) > 0;
        if (blink) ctx.fillText("TAP TO RETRY", CW / 2, CH / 2 + 80);
        rafRef.current = requestAnimationFrame(tick); return;
      }

      // Draw pipes
      g.pipes.forEach((p, i) => drawPipe(ctx, p, i === g.activePipe, g.t));
      drawPowerUp(ctx, g.powerUp, g.t);

      // Message
      if (g.msgTimer > 0) { g.msgTimer -= dt; drawText(ctx, g.msg, CH / 2, C.round, 14); }
      if (g.flash > 0) g.flash -= dt;
      if (g.slow) { g.slowTimer -= dt; if (g.slowTimer <= 0) g.slow = false; }
      if (g.shield) { g.shieldTimer -= dt; if (g.shieldTimer <= 0) g.shield = false; }

      const sm = g.slow ? 0.4 : 1;

      // ── READY ──
      if (g.state === ST.READY) {
        drawGoku(ctx, g.px, g.py, false);
        drawBall(ctx, g.px, g.py - 20, false);
        if (g.swS && g.swE) {
          ctx.beginPath(); ctx.moveTo(g.swS.x, g.swS.y); ctx.lineTo(g.swE.x, g.swE.y);
          ctx.strokeStyle = C.swipe; ctx.lineWidth = 3; ctx.stroke();
        }
        drawHUD(ctx, g.round, g.lives, g.timer, g.score);
        rafRef.current = requestAnimationFrame(tick); return;
      }

      // ── THROW ──
      if (g.state === ST.THROW) {
        if (g.thrown) {
          g.thrown.x += g.thrown.vx; g.thrown.y += g.thrown.vy;
          drawBall(ctx, g.thrown.x, g.thrown.y, true);
          if (g.thrown.x < -20 || g.thrown.x > CW + 20 || g.thrown.y < -20 || g.thrown.y > CH + 20) {
            g.thrown = null; g.state = ST.DODGE; g.launchDelay = 0.6;
          }
        }
        drawGoku(ctx, g.px, g.py, false);
        drawHUD(ctx, g.round, g.lives, g.timer, g.score);
        rafRef.current = requestAnimationFrame(tick); return;
      }

      // ── DODGE ──
      if (g.state === ST.DODGE) {
        g.px = clamp(g.px + g.pvx, 25, CW - 25);
        g.py = clamp(g.py + g.pvy, 70, CH - 25);

        g.launchDelay -= dt;
        if (g.launched < g.launchQueue && g.launchDelay <= 0) {
          const pi = Math.floor(Math.random() * PIPE_COUNT);
          const p = g.pipes[pi];
          const a = p.angle + Math.PI;
          const spd = BASE_BALL_SPEED + g.round * 0.25;
          const spread = (Math.random() - 0.5) * 0.4;
          g.balls.push({ x: p.x, y: p.y, vx: Math.cos(a + spread) * spd, vy: Math.sin(a + spread) * spd });
          g.activePipe = pi;
          g.launched++;
          g.launchDelay = Math.max(0.3, 1.2 - g.round * 0.08);
        }

        g.balls.forEach((b) => { b.x += b.vx * sm; b.y += b.vy * sm; });
        g.balls = g.balls.filter((b) => b.x > -30 && b.x < CW + 30 && b.y > -30 && b.y < CH + 30);

        if (!g.shield) {
          for (const b of g.balls) {
            if (dist({ x: g.px, y: g.py }, b) < HIT_DIST) {
              g.lives--; g.flash = 0.5;
              if (g.lives <= 0) { g.state = ST.OVER; g.highScore = Math.max(g.highScore, g.score); }
              else { g.state = ST.HIT; g.msgTimer = 1.2; g.msg = "HIT!"; }
              break;
            }
          }
        }

        if (g.powerUp && !g.powerUp.collected && dist({ x: g.px, y: g.py }, g.powerUp) < 20) {
          g.powerUp.collected = true;
          if (g.powerUp.type === "slow") { g.slow = true; g.slowTimer = 3; g.msg = "SLOW MOTION!"; g.msgTimer = 1; }
          else { g.shield = true; g.shieldTimer = 2.5; g.msg = "SHIELD!"; g.msgTimer = 1; }
        }

        g.timer -= dt;
        if (g.timer <= 0 && g.state === ST.DODGE) {
          g.score += g.round * 100; g.round++;
          g.state = ST.CLEAR; g.msgTimer = 1.5; g.msg = "CLEAR!";
        }

        g.balls.forEach((b) => drawBall(ctx, b.x, b.y, true));

        if (g.shield) {
          ctx.beginPath(); ctx.arc(g.px, g.py, 22, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,214,10," + (0.5 + Math.sin(g.t * 8) * 0.3) + ")";
          ctx.lineWidth = 2; ctx.stroke();
        }
        if (g.slow) {
          ctx.font = "8px monospace"; ctx.fillStyle = C.powerSlow; ctx.textAlign = "center";
          ctx.fillText("SLOW " + g.slowTimer.toFixed(1) + "s", CW / 2, 72);
        }
      }

      // ── HIT / CLEAR transitions ──
      if (g.state === ST.HIT && g.msgTimer <= 0) initRound(g);
      if (g.state === ST.CLEAR && g.msgTimer <= 0) initRound(g);

      // Draw player
      if (g.state !== ST.TITLE && g.state !== ST.OVER) {
        drawGoku(ctx, g.px, g.py, g.flash > 0);
      }

      drawHUD(ctx, g.round, g.lives, g.timer, g.score);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [initRound, startGame, makeGame]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100vh",
        background: "#04040a",
        overflow: "hidden",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        style={{
          width: "min(100vw, 400px)",
          height: "min(calc(100vw * 1.7), 680px)",
          imageRendering: "pixelated",
          border: "2px solid rgba(46,196,182,0.2)",
          borderRadius: 4,
          cursor: "pointer",
        }}
      />
    </div>
  );
}

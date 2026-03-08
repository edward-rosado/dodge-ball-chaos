"use client";

import { useEffect, useRef, useCallback } from "react";
import { GameState } from "../game/types";
import { CW, CH } from "../game/constants";
import { makeGame } from "../game/state";
import { attachInput } from "../game/input";
import { tick } from "../game/loop";
import { audio } from "../game/audio/engine";

export default function DodgeBallChaos() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gRef = useRef<GameState | null>(null);
  const rafRef = useRef<number>(0);
  const audioInitRef = useRef(false);

  /** Initialize audio on first user interaction (required by browser autoplay policy). */
  const initAudio = useCallback(() => {
    if (audioInitRef.current) return;
    audioInitRef.current = true;
    audio.init();
  }, []);

  // Initialize game state
  useEffect(() => {
    gRef.current = makeGame();
  }, []);

  // Input handling + audio init on first interaction
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;

    const onFirstInteraction = () => {
      initAudio();
    };

    // Listen for first user gesture to unlock audio
    cvs.addEventListener("mousedown", onFirstInteraction, { once: false });
    cvs.addEventListener("touchstart", onFirstInteraction, { once: false });
    window.addEventListener("keydown", onFirstInteraction, { once: false });

    const cleanupInput = attachInput(cvs, () => gRef.current);

    return () => {
      cvs.removeEventListener("mousedown", onFirstInteraction);
      cvs.removeEventListener("touchstart", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      if (cleanupInput) cleanupInput();
    };
  }, [initAudio]);

  // Game loop
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    let prev = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      const g = gRef.current;
      if (g) {
        tick(ctx, g, dt);
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

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

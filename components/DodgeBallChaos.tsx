"use client";

import { useEffect, useRef, useCallback, Component, ErrorInfo, ReactNode } from "react";
import { GameState } from "../game/types";
import { CW, CH } from "../game/constants";
import { makeGame } from "../game/state";
import { attachInput } from "../game/input";
import { tick } from "../game/loop";
import { audio } from "../game/audio/engine";

// ─── Error Boundary ───

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/** Catches canvas/render errors so the game doesn't crash silently. */
class GameErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log to console; don't rethrow so the rest of the page stays up
    console.error("[DodgeBallChaos] Game error:", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
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
            color: "#e63946",
            fontFamily: "monospace",
            textAlign: "center",
            padding: 20,
          }}
        >
          <div style={{ fontSize: 18 }}>GAME ERROR</div>
          <div style={{ fontSize: 10, color: "#555580", marginTop: 10, maxWidth: 400 }}>
            {this.state.error?.message ?? "An unexpected error occurred."}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: 20,
              padding: "8px 16px",
              background: "#2ec4b6",
              color: "#08080f",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: 12,
            }}
          >
            RETRY
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Game Component ───

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

/** Wraps the game in an error boundary to prevent silent crashes. */
export function DodgeBallChaosWithErrorBoundary() {
  return (
    <GameErrorBoundary>
      <DodgeBallChaos />
    </GameErrorBoundary>
  );
}
"use client";

import { useEffect, useRef, useCallback, useState, Component, ErrorInfo, ReactNode } from "react";
import { GameState } from "../game/types";
import { CW, CH } from "../game/constants";
import { makeGame } from "../game/state";
import { attachInput } from "../game/input";
import { tick } from "../game/loop";
import { audio } from "../game/audio/engine";
import { saveGame, loadGame, hasSave, getSaveInfo, deleteSave, SaveInfo, shouldAutoSave } from "../game/save";

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

// ─── Save/Load UI ───

/** Format a save info entry for display. */
function formatSaveInfo(info: SaveInfo): string {
  const stateLabel = info.state === 0 ? "Title" :
    info.state === 1 ? "Ready" :
    info.state === 2 ? "Throw" :
    info.state === 3 ? "Dodge" :
    info.state === 4 ? "Hit" :
    info.state === 5 ? "Clear" :
    info.state === 6 ? "Game Over" :
    info.state === 7 ? "Victory" : "Unknown";
  const date = new Date(info.timestamp).toLocaleString();
  return `Lv.${info.round} | ${info.lives}♥ | ${info.score}pts | ${stateLabel} | ${date}`;
}

// ─── Game Component ───

export default function DodgeBallChaos() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gRef = useRef<GameState | null>(null);
  const rafRef = useRef<number>(0);
  const audioInitRef = useRef(false);
  const prevRef = useRef<number>(0);

  // Save/load UI state
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [saveInfo, setSaveInfo] = useState<SaveInfo | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Check for existing save on mount
  useEffect(() => {
    const info = getSaveInfo();
    setSaveInfo(info);
  }, []);

  /** Show a brief toast notification. */
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

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
    prevRef.current = performance.now();

    let prevState: number | null = null;

    const loop = (now: number) => {
      const dt = Math.min((now - prevRef.current) / 1000, 0.05);
      prevRef.current = now;
      const g = gRef.current;
      if (g) {
        tick(ctx, g, dt);

        // Auto-save on significant state transitions
        if (prevState !== null && shouldAutoSave(prevState, g.state)) {
          saveGame(g);
          const info = getSaveInfo();
          setSaveInfo(info);
          showToast("Game saved!");
        }
        prevState = g.state;
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [showToast]);

  // ─── Save/Load Actions ───

  const handleSave = useCallback(() => {
    const g = gRef.current;
    if (!g) return;
    saveGame(g);
    const info = getSaveInfo();
    setSaveInfo(info);
    setShowSaveMenu(false);
    showToast("Game saved!");
  }, [showToast]);

  const handleLoad = useCallback(() => {
    const g = loadGame();
    if (!g) {
      showToast("No save found.");
      return;
    }
    // Replace current game state with loaded state
    gRef.current = g;
    setShowSaveMenu(false);
    showToast("Game loaded!");
  }, [showToast]);

  const handleDelete = useCallback(() => {
    deleteSave();
    setSaveInfo(null);
    setShowSaveMenu(false);
    showToast("Save deleted.");
  }, [showToast]);

  // ─── Render ───

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
        position: "relative",
      }}
    >
      {/* Save/Load Menu Overlay */}
      {showSaveMenu && (
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(4,4,10,0.95)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 18, color: "#2ec4b6", marginBottom: 20 }}>SAVE / LOAD</div>

          {saveInfo ? (
            <>
              <div style={{ fontSize: 10, color: "#d8d8ff", marginBottom: 15, textAlign: "center", maxWidth: 300 }}>
                {formatSaveInfo(saveInfo)}
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={handleLoad}
                  style={{
                    padding: "10px 20px",
                    background: "#2ec4b6",
                    color: "#08080f",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontFamily: "monospace",
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                >
                  LOAD GAME
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    padding: "10px 20px",
                    background: "#e63946",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontFamily: "monospace",
                    fontSize: 12,
                  }}
                >
                  DELETE
                </button>
              </div>
            </>
          ) : (
            <div style={{ fontSize: 10, color: "#555580", marginBottom: 15 }}>No saved game</div>
          )}

          <button
            onClick={handleSave}
            style={{
              padding: "10px 20px",
              background: "#ffd60a",
              color: "#08080f",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: "bold",
              marginBottom: 10,
            }}
          >
            SAVE NOW
          </button>

          <button
            onClick={() => setShowSaveMenu(false)}
            style={{
              padding: "8px 16px",
              background: "transparent",
              color: "#555580",
              border: "1px solid #555580",
              borderRadius: 4,
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: 10,
            }}
          >
            CANCEL
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(46,196,182,0.9)",
            color: "#08080f",
            padding: "6px 16px",
            borderRadius: 4,
            fontFamily: "monospace",
            fontSize: 10,
            fontWeight: "bold",
            zIndex: 200,
            pointerEvents: "none",
          }}
        >
          {toast}
        </div>
      )}

      {/* Save/Load Button */}
      <button
        onClick={() => setShowSaveMenu(true)}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          padding: "4px 10px",
          background: "rgba(46,196,182,0.15)",
          color: "#2ec4b6",
          border: "1px solid rgba(46,196,182,0.3)",
          borderRadius: 4,
          cursor: "pointer",
          fontFamily: "monospace",
          fontSize: 9,
          zIndex: 50,
        }}
        title="Open save/load menu"
      >
        💾 SAVE
      </button>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
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
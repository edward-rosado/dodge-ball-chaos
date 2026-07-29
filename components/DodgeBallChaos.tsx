"use client";

import { useEffect, useRef, useCallback, useState, Component, ErrorInfo, ReactNode } from "react";
import { GameState, GameStateType, ST } from "../game/types";
import { CW, CH } from "../game/constants";
import { makeGame } from "../game/state";
import { attachInput } from "../game/input";
import { tick } from "../game/loop";
import { audio } from "../game/audio/engine";
import { saveGameToSlot, loadGameFromSlot, getAllSaveInfos, deleteAllSaves, SaveInfo, shouldAutoSave, milestoneSlotIndex, isMilestoneRound, MAX_SAVE_SLOTS, hasSlot } from "../game/save";
import GameControls from "./GameControls";

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
  const date = new Date(info.timestamp).toLocaleString();
  return `Lv.${info.round} | ${info.lives}♥ | ${info.score}pts | ${info.label} | ${date}`;
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
  const [showHelp, setShowHelp] = useState(false);

  // Check for existing save on mount and update title screen
  useEffect(() => {
    const g = gRef.current;
    if (!g) return;
    const infos = getAllSaveInfos();
    const info = infos[0] ?? null;
    setSaveInfo(info);
    // Update title screen LOAD GAME button visibility
    g.meta._hasSave = hasSlot(0);
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

    let prevState: GameStateType | null = null;

    const loop = (now: number) => {
      const dt = Math.min((now - prevRef.current) / 1000, 0.05);
      prevRef.current = now;
      const g = gRef.current;
      if (g) {
        tick(ctx, g, dt);

        // Re-check save availability on title screen (after game over/victory)
        if (g.state === ST.TITLE) {
          g.meta._hasSave = hasSlot(0);
        }

        // Auto-save on significant state transitions
        if (prevState !== null && shouldAutoSave(prevState, g.state)) {
          // Auto-save only at milestones — find the slot for this round
          if (isMilestoneRound(g.round)) {
            const slot = milestoneSlotIndex(g.round);
            saveGameToSlot(g, slot);
            const infos = getAllSaveInfos();
            setSaveInfo(infos[slot]);
            showToast("Game saved!");
          }
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
      {/* Save/Load Menu Overlay — always accessible via SAVE button */}
      {/* eslint-disable-next-line react-hooks/refs */}
      {gRef.current && showSaveMenu && (
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
                  onClick={() => {
                    const loaded = loadGameFromSlot(0);
                    if (loaded && gRef.current) {
                      Object.assign(gRef.current, loaded);
                      setShowSaveMenu(false);
                      showToast("Game loaded!");
                    } else {
                      showToast("No save found.");
                    }
                  }}
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
                  onClick={() => {
                    deleteAllSaves();
                    setSaveInfo(null);
                    setShowSaveMenu(false);
                    showToast("Save deleted.");
                  }}
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
            onClick={() => {
              if (!gRef.current) return;
              if (!isMilestoneRound(gRef.current.round)) {
                showToast("Can only save at milestones: rounds 10, 20, 30, 40");
                return;
              }
              const slot = milestoneSlotIndex(gRef.current.round);
              saveGameToSlot(gRef.current, slot);
              const info = getAllSaveInfos()[slot];
              setSaveInfo(info);
              setShowSaveMenu(false);
              showToast("Game saved!");
            }}
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

      {/* Help Menu Overlay */}
      {(showHelp || (gRef.current && gRef.current.meta.helpVisible)) && (
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(4,4,10,0.9)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 110,
            padding: 40,
            color: "#d8d8ff",
            fontFamily: "monospace",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 20, color: "#2ec4b6", marginBottom: 20, fontWeight: "bold" }}>HELP MENU</div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 400, marginBottom: 30, textAlign: "left" }}>
            {/* CONTROLS SECTION */}
            <div style={{ background: "rgba(255,255,255,0.05)", padding: 15, borderRadius: 8, border: "1px solid rgba(46,196,182,0.3)" }}>
              <div style={{ color: "#2ec4b6", fontWeight: "bold", marginBottom: 10, fontSize: 14, textAlign: "center" }}>CONTROLS</div>
              <div style={{ fontSize: 11, lineHeight: 1.8, color: "#d8d8ff" }}>
                • Move: <span style={{ color: "#fff" }}>WASD / Swipe</span><br />
                • Throw: <span style={{ color: "#fff" }}>Space / Tap</span><br />
                • Activate: <span style={{ color: "#fff" }}>Double-Tap</span>
              </div>
            </div>

            {/* BALLS SECTION */}
            <div style={{ background: "rgba(255,255,255,0.05)", padding: 15, borderRadius: 8, border: "1px solid rgba(46,196,182,0.3)" }}>
              <div style={{ color: "#2ec4b6", fontWeight: "bold", marginBottom: 10, fontSize: 14, textAlign: "center" }}>BALL TYPES</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, fontSize: 10, color: "#d8d8ff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e63946" }} /> Dodgeball
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#9b59b6" }} /> Tracker
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2ecc71" }} /> Splitter
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ecf0f1" }} /> Ghost
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e67e22" }} /> Bomber
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f1c40f" }} /> Zigzag
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#8b0000" }} /> Giant
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3498db" }} /> Fast Ball
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2c0033" }} /> Gravity
                </div>
              </div>
            </div>

            {/* POWER UPS SECTION */}
            <div style={{ background: "rgba(255,255,255,0.05)", padding: 15, borderRadius: 8, border: "1px solid rgba(46,196,182,0.3)" }}>
              <div style={{ color: "#2ec4b6", fontWeight: "bold", marginBottom: 10, fontSize: 14, textAlign: "center" }}>POWER-UPS</div>
              <div style={{ fontSize: 11, lineHeight: 1.8, color: "#d8d8ff" }}>
                • <span style={{ color: "#3a8611" }}>Slow</span>: Ball speed 0.3x<br />
                • <span style={{ color: "#ffd60a" }}>Shield</span>: Absorbs 1 hit<br />
                • <span style={{ color: "#ffdd00" }}>Invincible</span>: Destroy balls<br />
                • <span style={{ color: "#ff6b1a" }}>Kaioken</span>: 2x Move speed<br />
                • <span style={{ color: "#ffffff" }}>Solar Flare</span>: Freeze balls
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setShowHelp(false);
              if (gRef.current) gRef.current.meta.helpVisible = false;
            }}
            style={{
              padding: "8px 24px",
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
            GOT IT!
          </button>
        </div>
      )}

      {/* Game Controls — single place for all on-screen buttons */}
      <GameControls
        gRef={gRef}
        setShowSaveMenu={setShowSaveMenu}
        setShowHelp={setShowHelp}
        setSaveInfo={setSaveInfo}
        showToast={showToast}
      />

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
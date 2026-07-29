"use client";

import { SaveInfo, saveGameToSlot, loadGameFromSlot, getAllSaveInfos, deleteAllSaves, isMilestoneRound, milestoneSlotIndex } from "../game/save";
import { ST } from "../game/types";

// ─── Save/Load UI ───

/** Format a save info entry for display. */
function formatSaveInfo(info: SaveInfo): string {
  const date = new Date(info.timestamp).toLocaleString();
  return `Lv.${info.round} | ${info.lives}♥ | ${info.score}pts | ${info.label} | ${date}`;
}

interface GameControlsProps {
  gRef: React.MutableRefObject<any>;
  setShowSaveMenu: (v: boolean) => void;
  setShowHelp: (v: boolean) => void;
  setSaveInfo: (info: SaveInfo | null) => void;
  showToast: (msg: string) => void;
}

/** A single component that renders all in-game buttons (save, help) and handles their actions. */
export default function GameControls({ gRef, setShowSaveMenu, setShowHelp, setSaveInfo, showToast }: GameControlsProps) {
  const g = gRef.current;
  if (!g || g.state === ST.TITLE || g.state === ST.OVER || g.state === ST.VICTORY) return null;

  return (
    <div style={{ position: "absolute", top: 8, right: 8, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", zIndex: 50 }}>
      {/* Save button */}
      <button
        onClick={() => setShowSaveMenu(true)}
        style={{
          padding: "6px 12px",
          background: "rgba(46,196,182,0.3)",
          color: "#2ec4b6",
          border: "1px solid rgba(46,196,182,0.5)",
          borderRadius: 4,
          cursor: "pointer",
          fontFamily: "monospace",
          fontSize: 10,
          fontWeight: "bold",
        }}
        title="Open save/load menu"
      >
        💾 SAVE
      </button>

      {/* Help button */}
      <button
        onClick={() => setShowHelp(true)}
        style={{
          width: 32,
          height: 32,
          background: "#08080f",
          color: "#2ec4b6",
          border: "2px solid #2ec4b6",
          borderRadius: "50%",
          cursor: "pointer",
          fontFamily: "monospace",
          fontSize: 16,
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 8px rgba(46,196,182,0.5)",
        }}
        title="Help"
      >
        ?
      </button>

      {/* Save/Load Menu Overlay */}
      {gRef.current && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(4,4,10,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ fontSize: 18, color: "#2ec4b6", marginBottom: 20 }}>SAVE / LOAD</div>
          {(() => {
            const infos = getAllSaveInfos();
            const info = infos[0];
            return (
              <>
                {info ? (
                  <>
                    <div style={{ fontSize: 10, color: "#d8d8ff", marginBottom: 15, textAlign: "center", maxWidth: 300 }}>
                      {formatSaveInfo(info)}
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <button
                        onClick={() => {
                          const loaded = loadGameFromSlot(0);
                          if (loaded) {
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
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
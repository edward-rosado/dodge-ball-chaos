/**
 * Headless playthrough of DodgeBallChaos using Puppeteer + tsx.
 * Uses WASD movement and SPACE to throw/advance through all 50 levels.
 */

import { execSync, spawn } from "child_process";
import puppeteer from "puppeteer";

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
async function fetchOk(url: string): Promise<boolean> {
  try { const r = await fetch(url); return r.ok; } catch { return false; }
}

interface PlayResult {
  totalDeaths: number;
  levelsCleared: number;
  finalScore: number;
  timeMs: number;
  errorMessage?: string;
}

async function main(): Promise<PlayResult> {
  const start = Date.now();
  
  // ── Start Next.js dev server ──
  console.log("Starting Next.js dev server on port 3456...");
  const server = spawn("npx", ["next", "dev", "-p", "3456", "--turbopack"], {
    cwd: process.cwd(),
    stdio: "pipe",
  });
  
  let ready = false;
  for (let i = 0; i < 80 && !ready; i++) {
    if (await fetchOk("http://localhost:3456")) ready = true;
    else await sleep(1500);
  }
  
  if (!ready) {
    server.kill();
    return { totalDeaths: -1, levelsCleared: 0, finalScore: 0, timeMs: Date.now() - start, errorMessage: "Server failed to start" };
  }
  console.log("Server ready!");

  const browser = await puppeteer.launch({ 
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 400, height: 680 });
    
    console.log("Navigating to game...");
    await page.goto("http://localhost:3456", { waitUntil: "domcontentloaded", timeout: 20000 });
    await sleep(2000); // let React hydrate

    const KEY = (code: string) => page.keyboard.down(code);
    const UNKEY = (code: string) => page.keyboard.up(code);
    
    function getBodyText(): Promise<string> {
      return page.evaluate(() => document.body.innerText || "");
    }

    // ── Helper: press space to advance states (title → ready, clear → next round, game over → retry) ──
    async function pressSpace(): Promise<void> {
      KEY("Space"); await sleep(50); UNKEY("Space");
    }

    let deaths = 0;
    let levelsCleared = 0;
    
    // ── PHASE 1: Start from title screen ──
    console.log("[Title] Pressing space to start...");
    await pressSpace();
    await sleep(2000);

    // ── PHASE 2: Play rounds 1-50 ──
    for (let round = 1; round <= 50; round++) {
      console.log(`\n--- Round ${round}/50 ---`);
      
      let roundStartTime = Date.now();
      const ROUND_TIMEOUT = 45000; // max 45s per round
      
      while (Date.now() - roundStartTime < ROUND_TIMEOUT) {
        await sleep(200); // check every 200ms
        
        const body = await getBodyText();
        
        // Check for GAME OVER
        if (body.toLowerCase().includes("game over")) {
          deaths++;
          console.log(`  💀 Game Over (death #${deaths}) at round ${round}`);
          
          // Press space to retry — this goes back to title, then we need another tap
          await pressSpace();
          await sleep(1500);
          
          // If we're at title again, press space to start a new game
          const afterRetry = await getBodyText();
          if (afterRetry.toLowerCase().includes("tap") || afterRetry.toLowerCase().includes("click") || 
              afterRetry.toLowerCase().includes("dodge ball")) {
            console.log(`  [Title] Pressing space to restart...`);
            await pressSpace();
            await sleep(2000);
          } else if (afterRetry.includes("READY") || afterRetry.includes("DODGE") || 
                     afterRetry.includes("swipe")) {
            console.log(`  Already in game state after retry`);
          }
          
          // Reset round timer for the new attempt at this round
          roundStartTime = Date.now();
          continue;
        }
        
        // Check for CLEAR
        if (body.toLowerCase().includes("clear")) {
          console.log(`  ✅ Round ${round} CLEARED!`);
          levelsCleared = round;
          
          await sleep(1500);
          
          // Press space to advance past clear screen
          await pressSpace();
          await sleep(2000);
          break; // Go to next round
        }
        
        // Check for VICTORY (round 50 cleared)
        if (body.toLowerCase().includes("you win") || body.toLowerCase().includes("victory")) {
          console.log(`\n🏆 VICTORY! Beat all 50 levels!`);
          
          await browser.close();
          server.kill();
          return { totalDeaths: deaths, levelsCleared: 50, finalScore: 0, timeMs: Date.now() - start };
        }

        // ── In DODGE state: play with WASD movement toward center ──
        if (body.toLowerCase().includes("dodge")) {
          // Simple AI: move randomly but generally toward center
          const rand = Math.random();
          
          // 70% chance to move, 30% idle
          if (rand < 0.15) KEY("KeyW");        // up
          else if (rand < 0.30) KEY("KeyS");   // down
          else if (rand < 0.45) KEY("KeyA");   // left
          else if (rand < 0.60) KEY("KeyD");   // right
          
          await sleep(80); // hold key briefly
          UNKEY("KeyW"); UNKEY("KeyS"); UNKEY("KeyA"); UNKEY("KeyD");
        }

        // ── In READY state: swipe to throw (press space acts as "ready to go") ──
        if (body.toLowerCase().includes("swipe") || body.toLowerCase().includes("throw")) {
          // Space should advance us past the ready screen into THROW/DODGE
          await pressSpace();
          await sleep(1500);
        }
      }

      // If we timed out without clearing or dying, force-advance
      if (Date.now() - roundStartTime >= ROUND_TIMEOUT) {
        console.log(`  ⏰ Round ${round} timed out — advancing...`);
        levelsCleared = Math.max(levelsCleared, round - 1);
        await pressSpace();
        await sleep(2000);
      }
    }

    // ── Done! ──
    await browser.close();
    
  } catch (err: any) {
    console.error("Playthrough error:", err.message);
    return { totalDeaths: deaths, levelsCleared, finalScore: 0, timeMs: Date.now() - start, errorMessage: err.message };
  } finally {
    try { server.kill(); } catch {}
    try { browser.close(); } catch {}
  }

  return { totalDeaths: deaths, levelsCleared, finalScore: 0, timeMs: Date.now() - start };
}

main().then(r => {
  console.log("\n========== PLAYTHROUGH RESULTS ==========");
  console.log(`Levels cleared: ${r.levelsCleared}/50`);
  console.log(`Deaths: ${r.totalDeaths}`);
  console.log(`Time: ${(r.timeMs / 1000).toFixed(1)}s`);
  if (r.errorMessage) console.log(`Error: ${r.errorMessage}`);
  console.log("=========================================");
  process.exit(r.levelsCleared >= 50 ? 0 : 1);
}).catch(e => { console.error("Fatal:", e); process.exit(2); });

/**
 * Smart headless playthrough. Uses React DevTools-like approach to read game state,
 * then plays with WASD + space for all 50 levels.
 */

import { spawn } from "child_process";
import puppeteer, { Page, Browser } from "puppeteer";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const CW = 400, CH = 680;

async function main() {
  const startTime = Date.now();
  
  try { require("child_process").execSync("lsof -ti:3456 | xargs kill -9", { stdio:"ignore" }); } catch {}
  await sleep(1000);

  console.log("[1] Starting server...");
  const server = spawn("npx", ["next", "dev", "-p", "3456", "--turbopack"], {
    cwd: "/Users/misteredr/DodgeBallChaos/dodge-ball-chaos", stdio: "ignore"
  });

  let ready = false;
  while (!ready) {
    try { if ((await fetch("http://localhost:3456")).ok) { ready = true; break; } } catch {}
    await sleep(1000);
  }
  console.log("[2] Server up!");

  const browser: Browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox","--disable-setuid-sandbox"] });
  
  try {
    const page: Page = await browser.newPage();
    await page.setViewport({ width: CW, height: CH });
    
    // Inject __name shim + game state accessor BEFORE page loads
    await page.evaluateOnNewDocument(() => {
      (globalThis as any).__name = ((fn:any,name:string) => { Object.defineProperty(fn,"name",{value:name,configurable:true}); return fn; }) as any;
      
      // Hook into React's component rendering to capture game state
      const origRAF = window.requestAnimationFrame;
      let lastState: string | null = null;
      
      (window as any).__getLastGameState = () => lastState;
    });

    console.log("[3] Loading game...");
    await page.goto("http://localhost:3456", { waitUntil: "domcontentloaded", timeout: 15000 });
    await sleep(4000); // Wait for React hydration + audio init

    function pressSpace() { return page.keyboard.down("Space").then(() => sleep(50)).then(() => page.keyboard.up("Space")); }
    
    async function getStateFromPage(): Promise<string> {
      return await page.evaluate((CW, CH) => {
        // Try to read game state via React internals — look for the gRef in component closure
        const canvas = document.querySelector("canvas") as HTMLCanvasElement;
        if (!canvas) return "no_canvas";
        
        try {
          const ctx = canvas.getContext("2d");
          if (!ctx) return "no_ctx";
          
          // Sample pixels at known text positions to detect state
          // Title: "DODGE BALL" / "CHA" in #ff6b1a at (CW/2, CH/2+30/+56)
          const titleY = Math.round(CH * 0.48);
          let orangePixels = 0;
          for (let x = CW/2 - 90; x < CW/2 + 90; x += 3) {
            try {
              const d = ctx.getImageData(x, titleY, 1, 1).data;
              if (d[0] > 200 && d[1] < 150 && d[2] < 80) orangePixels++;
            } catch {}
          }
          
          // Game Over: "GAME OVER" in #e63946 at CH/2-30  
          const goY = Math.round(CH * 0.42);
          let redPixels = 0;
          for (let x = CW/2 - 100; x < CW/2 + 100; x += 3) {
            try {
              const d = ctx.getImageData(x, goY, 1, 1).data;
              if (d[0] > 200 && d[1] < 80 && d[2] < 90) redPixels++;
            } catch {}
          }

          // Clear: "CLEAR!" in #ffd60a at CH/2  
          const clearY = Math.round(CH * 0.5);
          let yellowPixels = 0;
          for (let x = CW/2 - 70; x < CW/2 + 70; x += 3) {
            try {
              const d = ctx.getImageData(x, clearY, 1, 1).data;
              if (d[0] > 230 && d[1] > 180 && d[2] < 50) yellowPixels++;
            } catch {}
          }

          // Victory: "YOU WIN!" in #ffd60a at CH/2+10  
          const winY = Math.round(CH * 0.47);
          let winYellow = 0;
          for (let x = CW/2 - 80; x < CW/2 + 80; x += 3) {
            try {
              const d = ctx.getImageData(x, winY, 1, 1).data;
              if (d[0] > 230 && d[1] > 180 && d[2] < 50) winYellow++;
            } catch {}
          }

          // Dodge: dark background + colorful balls  
          let ballColor = 0;
          for (let i = 0; i < 30; i++) {
            const rx = Math.floor(Math.random() * CW);
            const ry = CH * 0.25 + Math.floor(Math.random() * CH * 0.6);
            try {
              const d = ctx.getImageData(rx, ry, 1, 1).data;
              if (d[0] > 80 && d[1] > 40 && d[2] > 40) ballColor++;
            } catch {}
          }

          // Score text in HUD at top-right: "SCORE:" text color is #ff6b1a
          const hudY = Math.round(CH * 0.04);
          let scoreOrange = 0;
          for (let x = CW - 200; x < CW - 50; x += 3) {
            try {
              const d = ctx.getImageData(x, hudY, 1, 1).data;
              if (d[0] > 200 && d[1] < 150 && d[2] < 80) scoreOrange++;
            } catch {}
          }

          // Scoring: title has orange text at CH/2+30/+56, clear has yellow at CH/2
          if (winYellow > 5) return "victory";
          if (redPixels > 5) return "game_over";
          if (yellowPixels > 5 && orangePixels < 3) return "clear";
          if (orangePixels > 8) return "title"; // Only title has lots of orange text
          
          // If we see score HUD text, we're in a game state (dodge/ready/throw)
          if (scoreOrange > 2 || ballColor > 5) return "in_game";
          
          return "unknown";
        } catch { return "error"; }
      }, CW, CH);
    }

    // ── PHASE 1: Start from title with SPACE key ──  
    console.log("[4] Initial state detection...");
    let state = await getStateFromPage();
    console.log(`   State: ${state}`);
    
    // Press Space to start (input.ts handles Space for TITLE → start)
    if (state === "title") {
      console.log("   Pressing SPACE to start game...");
      await pressSpace();
      await sleep(3000);
      
      state = await getStateFromPage();
      console.log(`   State after space: ${state}`);
      
      if (state === "title") {
        // Try clicking canvas too  
        console.log("   Trying click on canvas center...");
        const rect = await page.evaluate(() => {
          const c = document.querySelector("canvas");
          return c ? c.getBoundingClientRect() : null;
        });
        if (rect) {
          await page.mouse.click(rect.x + rect.width/2, rect.y + rect.height/2);
          await sleep(3000);
          state = await getStateFromPage();
          console.log(`   State after click: ${state}`);
        }
      }

      if (state === "title") {
        // Force-click the entire page area as a fallback
        console.log("   Trying full-page click...");
        await page.mouse.click(CW/2, CH/2 + 100);  // Below canvas to avoid focus issues
        await sleep(3000);
        state = await getStateFromPage();
        console.log(`   State after fallback: ${state}`);
      }

      if (state === "title") {
        console.error("   [FAIL] Could not start game from title screen. Game may need user interaction first.");
        // Try once more with multiple rapid clicks
        for (let i = 0; i < 5; i++) {
          await pressSpace();
          await sleep(200);
        }
        await sleep(3000);
        state = await getStateFromPage();
        console.log(`   State after rapid input: ${state}`);
      }
    }

    // ── PHASE 2: Play through rounds ──
    let deaths = 0;
    let levelsCleared = 0;
    const MAX_TIME = 300000; // 5 minutes
    
    while (Date.now() - startTime < MAX_TIME) {
      await sleep(1000); // Check every second
      
      state = await getStateFromPage();

      switch (state) {
        case "game_over": {
          deaths++;
          console.log(`  💀 Death #${deaths} at cleared=${levelsCleared}`);
          
          // Press space to retry (input.ts handles Space for OVER → startGame)
          await pressSpace();
          await sleep(3000);
          
          const s = await getStateFromPage();
          if (s === "title") {
            console.log("   [Title] Pressing space to restart...");
            await pressSpace();
            await sleep(3000);
          } else if (s === "in_game" || s === "dodge" || s === "ready") {
            // Already in game, continue  
          }
          break;
        }

        case "clear": {
          levelsCleared++;
          console.log(`  ✅ Cleared! Total: ${levelsCleared}`);
          
          await pressSpace();
          await sleep(3000);
          break;
        }

        case "victory": {
          console.log(`\n🏆 VICTORY! All levels cleared in ${(Date.now()-startTime)/1000}s`);
          await page.screenshot({ path: "/tmp/game-victory.png" });
          await browser.close(); server.kill();
          printResults(deaths, 50, Date.now() - startTime);
          return;
        }

        case "in_game": {
          // Simple dodge AI using WASD
          const r = Math.random();
          let key = "";
          if (r < 0.12) key = "KeyW";
          else if (r < 0.24) key = "KeyS";
          else if (r < 0.36) key = "KeyA";
          else if (r < 0.48) key = "KeyD";

          if (key) {
            await page.keyboard.down(key);
            setTimeout(() => page.keyboard.up(key), 70);
          }
          
          // Occasionally activate power-ups with space  
          if (Math.random() < 0.01) {
            await page.keyboard.down("Space");
            setTimeout(() => page.keyboard.up("Space"), 40);
          }
          break;
        }

        case "title":
          console.log("   [Title] Pressing space...");
          await pressSpace();
          await sleep(3000);
          break;

        default:
          if (state === "unknown" || state === "ready") {
            // Try advancing with space in case we're stuck on READY screen
            console.log(`   Unknown state '${state}', pressing space to advance...`);
            await pressSpace();
            await sleep(2000);
          }
          break;
      }

      const elapsed = Date.now() - startTime;
      if (elapsed % 30000 < 1100) {
        console.log(`  [${Math.floor(elapsed/1000)}s] cleared=${levelsCleared} deaths=${deaths}`);
      }
    }

    printResults(deaths, levelsCleared, Date.now() - startTime);

  } catch (err: any) {
    console.error("Error:", err.message || err);
  } finally {
    try { browser.close(); } catch {}
    server.kill();
  }
}

function printResults(d: number, c: number, ms: number) {
  console.log("\n========== PLAYTHROUGH RESULTS ==========");
  console.log(`Levels cleared: ${c}/50`);
  console.log(`Deaths: ${d}`);
  console.log(`Time elapsed: ${(ms/1000).toFixed(1)}s`);
  if (c >= 50) console.log("🏆 FULL RUN COMPLETE!");
  console.log("=========================================");
}

main().catch(e => { console.error("Fatal:", e.message || e); process.exit(2); });

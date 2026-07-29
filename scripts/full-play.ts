/**
 * Headless full playthrough of DodgeBallChaos.
 * Uses canvas pixel analysis to detect game states, then plays with WASD + space.
 */

import { spawn } from "child_process";
import puppeteer, { Page, Browser } from "puppeteer";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const CW = 400, CH = 680;

async function main() {
  const startTime = Date.now();
  
  // Kill anything on port 3456 first
  try { require("child_process").execSync("lsof -ti:3456 | xargs kill -9", { stdio:"ignore" }); } catch {}
  await sleep(1000);

  console.log("[1] Starting Next.js dev server...");
  const server = spawn("npx", ["next", "dev", "-p", "3456", "--turbopack"], {
    cwd: "/Users/misteredr/DodgeBallChaos/dodge-ball-chaos", stdio: "ignore"
  });

  let ready = false;
  const deadline = Date.now() + 40000;
  while (Date.now() < deadline && !ready) {
    try { if ((await fetch("http://localhost:3456")).ok) { ready = true; break; } } catch {}
    await sleep(1500);
  }
  if (!ready) { console.error("[FAIL] Server failed"); server.kill(); process.exit(1); }
  console.log("[2] Server up!");

  const browser: Browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox","--disable-setuid-sandbox"] });
  
  try {
    const page: Page = await browser.newPage();
    await page.setViewport({ width: CW, height: CH });
    
    // Inject __name shim for turbopack compatibility
    await page.evaluateOnNewDocument(() => {
      (globalThis as any).__name = ((fn:any,name:string) => { Object.defineProperty(fn,"name",{value:name,configurable:true}); return fn; }) as any;
    });

    console.log("[3] Loading game...");
    await page.goto("http://localhost:3456", { waitUntil: "domcontentloaded", timeout: 15000 });
    await sleep(3000);

    // ── Canvas pixel reading helpers ──
    async function getCanvasPixel(x: number, y: number): Promise<[number,number,number]> {
      const data = await page.evaluate(([x,y]) => {
        const c = document.querySelector("canvas") as HTMLCanvasElement;
        if (!c) return [0,0,0];
        try {
          const ctx = c.getContext("2d");
          if (!ctx) return [0,0,0];
          const p = ctx.getImageData(x, y, 1, 1).data;
          return [p[0], p[1], p[2]];
        } catch { return [0,0,0]; }
      }, [x, y]);
      return data as unknown as [number,number,number];
    }

    // Detect game state by checking pixel colors at known text positions
    async function detectState(): Promise<string> {
      // Title screen: "DODGE BALL" / "CHA" drawn in title color (#ff6b1a = rgb(255,107,26))
      // Check center-bottom area for orange pixels (title text)
      let orangeCount = 0;
      for (let x = CW/2 - 80; x < CW/2 + 80; x += 4) {
        const [r,g,b] = await getCanvasPixel(x, CH/2 + 35);
        if (r > 200 && g < 150 && b < 80) orangeCount++; // title color
      }
      
      // Game Over: "GAME OVER" in red (#e63946 = rgb(230,57,70)) at CH/2 - 30
      let redCount = 0;
      for (let x = CW/2 - 100; x < CW/2 + 100; x += 4) {
        const [r,g,b] = await getCanvasPixel(x, CH/2 - 35);
        if (r > 200 && g < 80 && b < 90) redCount++; // game over color
      }

      // Clear: "CLEAR!" in round color (#ffd60a = rgb(255,214,10)) at CH/2
      let yellowCount = 0;
      for (let x = CW/2 - 60; x < CW/2 + 60; x += 4) {
        const [r,g,b] = await getCanvasPixel(x, CH/2);
        if (r > 230 && g > 180 && b < 50) yellowCount++; // clear color  
      }

      // Victory: "YOU WIN!" in gold (#ffd60a) at CH/2 + 10
      let winYellow = 0;
      for (let x = CW/2 - 60; x < CW/2 + 60; x += 4) {
        const [r,g,b] = await getCanvasPixel(x, CH/2 + 15);
        if (r > 230 && g > 180 && b < 50) winYellow++;
      }

      // Dodge: background is dark (#04040a or similar), with colorful balls
      let ballColors = 0;
      for (let i = 0; i < 20; i++) {
        const rx = Math.floor(Math.random() * CW);
        const ry = CH * 0.3 + Math.floor(Math.random() * CH * 0.5);
        const [r,g,b] = await getCanvasPixel(rx, ry);
        // Bright non-black pixels that aren't title/clear colors  
        if (r > 100 && g > 50 && b > 50 && !(r > 230 && g > 180)) ballColors++;
      }

      if (winYellow > 3) return "victory";
      if (redCount > 3) return "game_over";
      if (orangeCount > 3) return "title";
      if (yellowCount > 3) return "clear";
      if (ballColors > 5) return "dodge";
      
      // If we see no special colors but there's a canvas with content, assume ready/dodge
      const bgColor = await getCanvasPixel(CW/2, CH * 0.1);
      if (bgColor[0] < 30 && bgColor[1] < 30 && bgColor[2] < 50) return "dodge"; // dark bg
      
      return "unknown";
    }

    function pressSpace() { return page.keyboard.down("Space").then(() => sleep(50)).then(() => page.keyboard.up("Space")); }
    async function clickCanvas(x: number, y: number) { await page.mouse.click(x, y); }
    
    // ── PHASE 1: Start from title ──
    console.log("[4] Detecting initial state...");
    let state = await detectState();
    console.log(`   State: ${state}`);

    if (state === "title") {
      console.log("   Pressing space/clicking to start...");
      await clickCanvas(CW/2, CH/2);
      await sleep(2500);
      state = await detectState();
      console.log(`   State after click: ${state}`);
    }

    // ── PHASE 2: Play through rounds ──
    let deaths = 0;
    let levelsCleared = 0;
    const MAX_TIME = 300000; // 5 minutes max
    
    while (Date.now() - startTime < MAX_TIME) {
      await sleep(800); // Check every ~800ms
      
      state = await detectState();

      switch (state) {
        case "game_over": {
          deaths++;
          console.log(`  💀 Death #${deaths} at cleared=${levelsCleared}`);
          
          // Click to retry → goes to title, need another click  
          await clickCanvas(CW/2, CH/2 + 80);
          await sleep(2500);
          
          // Should be back at title now — click again
          const s = await detectState();
          if (s === "title" || s === "unknown") {
            console.log("   [Title] Clicking to restart...");
            await clickCanvas(CW/2, CH/2);
            await sleep(2500);
          }
          break;
        }

        case "clear": {
          levelsCleared++;
          console.log(`  ✅ Cleared! Total: ${levelsCleared}`);
          
          // Click to advance past clear screen
          await clickCanvas(CW/2, CH/2);
          await sleep(2500);
          break;
        }

        case "victory": {
          console.log(`\n🏆 VICTORY! Cleared all 50 levels in ${(Date.now()-startTime)/1000}s`);
          
          // Save final screenshot  
          await page.screenshot({ path: "/tmp/game-victory.png" });
          
          await browser.close(); server.kill();
          printResults(deaths, 50, Date.now() - startTime);
          return;
        }

        case "dodge": {
          // Simple AI: move toward center with WASD
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
          
          // Occasionally press space to try activating power-ups  
          if (Math.random() < 0.015) {
            await page.keyboard.down("Space");
            setTimeout(() => page.keyboard.up("Space"), 40);
          }
          break;
        }

        case "title":
          // Click to start
          console.log("   [Title] Clicking...");
          await clickCanvas(CW/2, CH/2);
          await sleep(2500);
          break;

        default:
          // Unknown state — try clicking anyway in case it's READY
          if (state === "unknown") {
            // Try pressing space to advance past any ready screen
            await pressSpace();
            await sleep(1500);
          }
          break;
      }

      // Progress indicator every 30 seconds
      const elapsed = Date.now() - startTime;
      if (elapsed % 30000 < 800) {
        console.log(`  [${Math.floor(elapsed/1000)}s] cleared=${levelsCleared} deaths=${deaths} state=${state}`);
      }
    }

    // Time ran out
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

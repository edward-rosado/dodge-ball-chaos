/**
 * Headless playthrough with correct pixel color detection for game states.
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
    
    await page.evaluateOnNewDocument(() => {
      (globalThis as any).__name = ((fn:any,name:string) => { Object.defineProperty(fn,"name",{value:name,configurable:true}); return fn; }) as any;
    });

    console.log("[3] Loading game...");
    await page.goto("http://localhost:3456", { waitUntil: "domcontentloaded", timeout: 15000 });
    await sleep(4000);

    // Color constants from C object in constants.ts
    const TITLE_COLOR = [255, 107, 26];     // #ff6b1a (orange) - title text
    const OVER_COLOR = [230, 57, 70];        // #e63946 (red) - game over
    const CLEAR_COLOR = [46, 196, 182];      // #2ec4b6 (cyan/teal) - round clear message  
    const VICTORY_COLOR = [255, 214, 10];    // #ffd60a (gold) - victory text
    const HUD_COLOR = [216, 216, 255];       // #d8d8ff (lavender) - score/hud text

    async function detectState(): Promise<string> {
      return await page.evaluate(([CW, CH, TC, OC, CC, VC, HC]) => {
        const c = document.querySelector("canvas") as HTMLCanvasElement;
        if (!c) return "no_canvas";
        try {
          const ctx = c.getContext("2d");
          if (!ctx) return "no_ctx";

          function countAtY(y: number, xMin: number, xMax: number, targetColor: number[], threshold: number): number {
            let count = 0;
            for (let x = xMin; x < xMax; x += 2) {
              try {
                const d = ctx.getImageData(x, y, 1, 1).data;
                if (Math.abs(d[0]-targetColor[0]) <= threshold && 
                    Math.abs(d[1]-targetColor[1]) <= threshold && 
                    Math.abs(d[2]-targetColor[2]) <= threshold) count++;
              } catch {}
            }
            return count;
          }

          // Title: orange text at CH/2+30 and CH/2+56  
          const titleY1 = Math.round(CH * 0.49);
          const titleY2 = Math.round(CH * 0.52);
          let titleOrange = countAtY(titleY1, CW/2-100, CW/2+100, TC, 30) + 
                            countAtY(titleY2, CW/2-80, CW/2+80, TC, 30);

          // Game Over: red text at CH/2-30
          let overRed = countAtY(Math.round(CH*0.42), CW/2-120, CW/2+120, OC, 30);

          // Clear: cyan text at CH/2  
          let clearCyan = countAtY(Math.round(CH*0.5), CW/2-80, CW/2+80, CC, 30);

          // Victory: gold text at CH/2+10
          let victoryGold = countAtY(Math.round(CH*0.47), CW/2-80, CW/2+80, VC, 30);

          // HUD score text (lavender) at top-right area — indicates in-game state
          let hudText = 0;
          for (let y = CH * 0.02; y < CH * 0.08; y += 2) {
            for (let x = CW - 200; x < CW - 30; x += 4) {
              try {
                const d = ctx.getImageData(x, y, 1, 1).data;
                if (d[0] > 180 && d[1] > 180 && d[2] > 220) hudText++;
              } catch {}
            }
          }

          // Ball colors scattered in arena — indicates active gameplay
          let ballColors = 0;
          for (let i = 0; i < 40; i++) {
            const rx = Math.floor(Math.random() * CW);
            const ry = CH * 0.25 + Math.floor(Math.random() * CH * 0.65);
            try {
              const d = ctx.getImageData(rx, ry, 1, 1).data;
              if (d[0] > 60 && d[1] > 30 && d[2] > 30) ballColors++;
            } catch {}
          }

          if (victoryGold > 5) return "victory";
          if (overRed > 5) return "game_over";
          if (clearCyan > 5) return "clear";
          if (titleOrange > 10) return "title";
          if (hudText > 3 || ballColors > 8) return "in_game";
          
          return "unknown";
        } catch { return "error"; }
      }, [CW, CH, TITLE_COLOR, OVER_COLOR, CLEAR_COLOR, VICTORY_COLOR, HUD_COLOR]);
    }

    function pressSpace() { return page.keyboard.down("Space").then(() => sleep(60)).then(() => page.keyboard.up("Space")); }
    
    // ── PHASE 1: Start from title ──
    console.log("[4] Detecting initial state...");
    let state = await detectState();
    console.log(`   State: ${state}`);
    
    if (state === "title") {
      console.log("   Pressing SPACE to start...");
      await pressSpace();
      await sleep(3000);
      state = await detectState();
      console.log(`   After space: ${state}`);
      
      if (state !== "in_game" && state !== "title") {
        // Try again with click fallback  
        const rect = await page.evaluate(() => {
          const c = document.querySelector("canvas");
          return c ? c.getBoundingClientRect() : null;
        });
        if (rect) {
          await page.mouse.click(rect.x + CW/2, rect.y + CH/2);
          await sleep(3000);
          state = await detectState();
          console.log(`   After click: ${state}`);
        }
      }

      if (state === "title") {
        // Rapid key presses as last resort  
        for (let i = 0; i < 8; i++) { await pressSpace(); await sleep(150); }
        await sleep(3000);
        state = await detectState();
        console.log(`   After rapid input: ${state}`);
      }
    }

    // ── PHASE 2: Play rounds ──
    let deaths = 0;
    let levelsCleared = 0;
    const MAX_TIME = 360000; // 6 minutes
    
    while (Date.now() - startTime < MAX_TIME) {
      await sleep(800);
      
      state = await detectState();

      switch (state) {
        case "game_over": {
          deaths++;
          console.log(`  💀 Death #${deaths} at cleared=${levelsCleared}`);
          
          // Press space to retry → goes to title, then need another press  
          await pressSpace();
          await sleep(3000);
          
          const s = await detectState();
          if (s === "title") {
            console.log("   [Title] Restarting...");
            await pressSpace();
            await sleep(3000);
          } else if (s !== "in_game" && s !== "ready" && s !== "dodge") {
            // Still not in game, try more inputs
            for (let i = 0; i < 5; i++) { await pressSpace(); await sleep(200); }
            await sleep(3000);
          }
          break;
        }

        case "clear": {
          levelsCleared++;
          console.log(`  ✅ Cleared! Total: ${levelsCleared}`);
          
          // Press space to advance past clear screen → goes to next round READY  
          await pressSpace();
          await sleep(3000);
          break;
        }

        case "victory": {
          console.log(`\n🏆 VICTORY! All 50 levels cleared in ${(Date.now()-startTime)/1000}s`);
          await page.screenshot({ path: "/tmp/game-victory.png" });
          await browser.close(); server.kill();
          printResults(deaths, 50, Date.now() - startTime);
          return;
        }

        case "in_game": {
          // Simple dodge AI — random WASD movement toward center  
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
          
          // Occasionally try space for power-up activation  
          if (Math.random() < 0.015) {
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

        default: {
          // Unknown/ready — try to advance with space  
          if (state === "unknown") {
            await pressSpace();
            await sleep(2000);
          }
          break;
        }
      }

      const elapsed = Date.now() - startTime;
      if (elapsed % 30000 < 900) {
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

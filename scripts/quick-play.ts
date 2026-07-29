/**
 * Quick headless playthrough of DodgeBallChaos.
 * Uses mouse clicks to start game, then WASD + space for gameplay.
 */

import { spawn } from "child_process";
import puppeteer from "puppeteer";

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const startTime = Date.now();
  
  // Start Next.js dev server in background (kill any existing on port 3456 first)
  try { process.execSync("lsof -ti:3456 | xargs kill -9", { stdio: "ignore" }); } catch {}
  
  const server = spawn("npx", ["next", "dev", "-p", "3456", "--turbopack"], {
    cwd: process.cwd(), stdio: "pipe"
  });
  
  let ready = false;
  for (let i = 0; i < 80 && !ready; i++) {
    try { if ((await fetch("http://localhost:3456")).ok) ready = true; } catch {}
    if (!ready) await sleep(1500);
  }
  if (!ready) { console.error("Server failed to start"); server.kill(); process.exit(2); }
  
  const browser = await puppeteer.launch({ 
    headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] 
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 400, height: 680 });
    
    console.log("Loading game...");
    await page.goto("http://localhost:3456", { waitUntil: "domcontentloaded", timeout: 20000 });
    await sleep(3000); // let React fully hydrate
    
    const getBody = () => page.evaluate(() => document.body.innerText || "");
    
    function clickCanvas(x: number, y: number) {
      return page.mouse.click(x, y);
    }

    // ── Click on canvas to start game from title screen ──
    console.log("[Title] Clicking canvas to start...");
    await clickCanvas(200, 340); // center of canvas
    await sleep(2500);
    
    const afterStart = await getBody();
    console.log(`After first click: "${afterStart.substring(0, 100)}"`);

    let deaths = 0;
    let levelsCleared = 0;
    let prevBody = "";
    let roundTimer = Date.now();
    
    // Play for up to 3 minutes
    const MAX_TIME = 180000;
    
    while (Date.now() - startTime < MAX_TIME) {
      await sleep(400);
      
      const body = await getBody();
      const now = Date.now();
      
      // Detect state transitions
      if (prevBody !== body) {
        prevBody = body;

        // Game Over
        if (body.toLowerCase().includes("game over")) {
          deaths++;
          console.log(`  💀 Death #${deaths} at cleared=${levelsCleared}`);
          
          // Click canvas to retry
          await clickCanvas(200, 340);
          await sleep(2500);
        }

        // Clear screen — count as round complete  
        if (body.toLowerCase().includes("clear")) {
          levelsCleared++;
          console.log(`  ✅ Cleared! Total: ${levelsCleared}`);
          
          // Click to advance past clear screen
          await clickCanvas(200, 340);
          await sleep(2500);
        }

        // Victory
        if (body.toLowerCase().includes("you win") || body.toLowerCase().includes("victory")) {
          console.log(`\n🏆 VICTORY! All levels cleared!`);
          printResults(deaths, 50, now - startTime);
          await browser.close(); server.kill(); return;
        }

        // Dodge phase — apply WASD movement  
        if (body.toLowerCase().includes("dodge")) {
          const r = Math.random();
          let key = "";
          if (r < 0.15) key = "KeyW";
          else if (r < 0.30) key = "KeyS"; 
          else if (r < 0.45) key = "KeyA";
          else if (r < 0.60) key = "KeyD";

          if (key) {
            await page.keyboard.down(key);
            setTimeout(() => page.keyboard.up(key), 80);
          }
          
          // Also press space periodically to simulate throw activation
          if (Math.random() < 0.02) {
            await page.keyboard.down("Space");
            setTimeout(() => page.keyboard.up("Space"), 50);
          }
        }

        console.log(`  [${new Date().toISOString().slice(14,19)}] body="${body.substring(0,80).replace(/\n/g,' ')}"`);
      }
    }

    // Time's up — report results
    printResults(deaths, levelsCleared, Date.now() - startTime);

  } catch (err: any) {
    console.error("Error:", err.message);
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

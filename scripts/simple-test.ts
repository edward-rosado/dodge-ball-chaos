import { spawn } from "child_process";
import puppeteer from "puppeteer";

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log("Starting server...");
  const server = spawn("npx", ["next", "dev", "-p", "3456", "--turbopack"], {
    cwd: "/Users/misteredr/DodgeBallChaos/dodge-ball-chaos", stdio: "ignore"
  });

  let ready = false;
  for (let i = 0; i < 60 && !ready; i++) {
    try { if ((await fetch("http://localhost:3456")).ok) ready = true; } catch {}
    if (!ready) await sleep(2000);
  }

  if (!ready) { console.error("Server failed!"); server.kill(); process.exit(1); }
  console.log("Server up!");

  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 680 });

  console.log("Navigating...");
  await page.goto("http://localhost:3456", { waitUntil: "domcontentloaded" });
  await sleep(3000);

  const body = await page.evaluate(() => document.body.innerText || "");
  console.log("\n=== PAGE CONTENT ===");
  console.log(body.substring(0, 1000));
  console.log("=== END ===\n");

  // Try clicking center of canvas  
  console.log("Clicking canvas...");
  await page.mouse.click(200, 340);
  await sleep(2000);

  const bodyAfter = await page.evaluate(() => document.body.innerText || "");
  console.log("\n=== AFTER CLICK ===");
  console.log(bodyAfter.substring(0, 1000));
  console.log("=== END ===\n");

  // Try pressing space  
  console.log("Pressing Space...");
  await page.keyboard.down("Space"); await sleep(50); await page.keyboard.up("Space");
  await sleep(2000);

  const bodyAfterSpace = await page.evaluate(() => document.body.innerText || "");
  console.log("\n=== AFTER SPACE ===");
  console.log(bodyAfterSpace.substring(0, 1000));
  console.log("=== END ===\n");

  // Try WASD movement 
  console.log("Moving with WASD...");
  await page.keyboard.down("KeyA"); await sleep(500); await page.keyboard.up("KeyA");
  await sleep(2000);

  const bodyAfterWASD = await page.evaluate(() => document.body.innerText || "");
  console.log("\n=== AFTER WASD ===");
  console.log(bodyAfterWASD.substring(0, 1000));
  console.log("=== END ===\n");

  await browser.close();
  server.kill();
  console.log("Done!");
}

main().catch(e => { console.error("Fatal:", e.message || e); process.exit(2); });

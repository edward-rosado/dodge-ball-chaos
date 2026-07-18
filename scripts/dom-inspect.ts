import { spawn } from "child_process";
import puppeteer from "puppeteer";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  // Kill anything on port 3456 first  
  try { require("child_process").execSync("lsof -ti:3456 | xargs kill -9", { stdio:"ignore" }); } catch {}
  await sleep(1000);

  console.log("[1] Starting Next.js dev server...");
  const server = spawn("npx", ["next", "dev", "-p", "3456", "--turbopack"], {
    cwd: "/Users/misteredr/DodgeBallChaos/dodge-ball-chaos", stdio: "ignore"
  });

  // Wait for server with a short timeout (30s max)  
  let ready = false;
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline && !ready) {
    try { if ((await fetch("http://localhost:3456")).ok) { ready = true; break; } } catch {}
    await sleep(1000);
  }

  if (!ready) { console.error("[FAIL] Server did not start in time"); server.kill(); process.exit(1); }
  console.log("[2] Server is up!");

  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 680 });

  // Inject __name shim before page loads  
  await page.evaluateOnNewDocument(() => {
    (globalThis as any).__name = ((fn:any,name:string) => { Object.defineProperty(fn,"name",{value:name,configurable:true}); return fn; }) as any;
  });

  console.log("[3] Navigating to game...");
  await page.goto("http://localhost:3456", { waitUntil: "domcontentloaded", timeout: 15000 });
  await sleep(4000); // Wait for React hydration

  // Get DOM tree  
  const domInfo = await page.evaluate(() => {
    const out: string[] = [];
    function walk(node: Node, depth: number) {
      if (node.nodeType === 1) {
        const el = node as Element;
        const tag = el.tagName.toLowerCase();
        out.push("  ".repeat(depth) + "<" + tag + ">");
        
        // For canvas: get size
        if (tag === "canvas") {
          const rect = el.getBoundingClientRect();
          out.push("  ".repeat(depth+1) + "[canvas " + Math.round(rect.width) + "x" + Math.round(rect.height) + "]");
          try { const c = (el as HTMLCanvasElement).getContext("2d"); if(c) out.push("  ".repeat(depth+1)+"[has 2d context]"); } catch(e:any){}
        }
        
        // Text content for non-script/style elements
        if (tag !== "script" && tag !== "style") {
          const t = el.textContent?.trim();
          if (t && t.length < 300 && !t.startsWith("undefined")) {
            out.push("  ".repeat(depth+1) + '"' + t.substring(0,250).replace(/\n/g," ") + '"');
          }
        }
        
        if (depth < 6) for (const child of el.children) walk(child, depth + 1);
      } else if (node.nodeType === 3) {
        const t = node.textContent?.trim();
        if (t && t.length > 0 && t.length < 200) out.push("  ".repeat(7) + '"' + t.substring(0,150).replace(/\n/g," ") + '"');
      }
    }
    walk(document.body, 0);
    return out.join("\n");
  });

  console.log("\n=== DOM TREE (body depth <=6) ===\n" + domInfo.substring(0, 3000));
  
  // Also get body innerHTML
  const html = await page.evaluate(() => document.body.innerHTML);
  console.log("\n=== BODY HTML (first 1500 chars) ===\n" + html.substring(0, 1500));

  // Screenshot
  await page.screenshot({ path: "/tmp/game-title.png" });
  console.log("\nScreenshot saved to /tmp/game-title.png");

  await browser.close();
  server.kill();
  console.log("Done!");
}

main().catch(e => { console.error("Fatal:", e.message || e); process.exit(2); });

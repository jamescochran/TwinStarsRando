import { test, expect } from "@playwright/test";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

// Rulebook images: complete files, small enough for phones, and still there offline after a release.
const ROOT = path.resolve(__dirname, "../..");
const RULES_CACHE = "twin-stars-rules-v1";
const ALL_PACKS = { enabledPacks: ["series1", "series2", "captaincrag"] };
// The four books shipped as 1600px AVIF/WebP (plus the full-size PNG fallback).
const OPTIMIZED = {
  "twinstars1":        { label: "Series 1",  height: 1120 },
  "twinstars1-syzygy": { label: "SYZYGY I",  height: 1120 },
  "twinstars2":        { label: "Series 2",  height: 1120 },
  "twinstars2-syzygy": { label: "SYZYGY II", height: 1171 },
};
// Our copy of the Captain Crag sheet is cut off at 1,920,000 bytes (no IEND). Until the owner
// replaces it with the publisher's file, the viewer must say so instead of showing part of it.
const KNOWN_TRUNCATED = "twinstars-crag.png";

function seed(values) {
  return async (page) => {
    await page.addInitScript((v) => {
      if (localStorage.getItem("__seeded")) return;
      localStorage.setItem("__seeded", "1");
      localStorage.setItem("hasSeenTip", "1");
      localStorage.setItem("seenPrimarySecondaryNotice", "1");
      for (const [k, val] of Object.entries(v)) localStorage.setItem(k, typeof val === "string" ? val : JSON.stringify(val));
    }, values);
  };
}

// Same structural check the service worker uses: the bytes hold a whole PNG / WebP / AVIF.
function imageIsComplete(buf) {
  const n = buf.length, ascii = (o, l) => buf.subarray(o, o + l).toString("latin1");
  if (ascii(1, 3) === "PNG") {
    let o = 8;
    while (o + 12 <= n) {
      const len = buf.readUInt32BE(o), type = ascii(o + 4, 4);
      o += 12 + len;
      if (type === "IEND") return o <= n;
    }
    return false;
  }
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return buf.readUInt32LE(4) + 8 <= n;
  if (ascii(4, 4) === "ftyp") {
    let o = 0;
    while (o + 8 <= n) {
      let size = buf.readUInt32BE(o);
      if (size === 1) size = Number(buf.readBigUInt64BE(o + 8));
      else if (size === 0) size = n - o;
      if (size < 8) return false;
      o += size;
    }
    return o === n;
  }
  return false;
}

// A tiny static server for the worktree that the test can stop (to go offline — Playwright's
// setOffline does not reach service-worker fetches) and whose service-worker.js can be changed
// (to simulate a release).
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png",
  ".avif": "image/avif", ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".md": "text/plain" };
async function startServer() {
  const state = { release: "" };
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    let body = fs.readFileSync(file);
    if (p === "/service-worker.js" && state.release) {
      body = body.toString().replace(/const CACHE = "([^"]+)"/, `const CACHE = "$1-${state.release}"`);
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(body);
  });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  return {
    url: `http://localhost:${server.address().port}/`,
    release(name) { state.release = name; },
    stop() { server.closeAllConnections(); return new Promise(r => server.close(r)); },
  };
}

async function waitForWorker(page) {
  await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 15000 });
}
async function rulesCacheKeys(page) {
  return page.evaluate(async (name) => (await caches.has(name)) ? (await (await caches.open(name)).keys()).map(r => r.url) : [], RULES_CACHE);
}
async function expectRulebookShown(page) {
  await expect(page.locator("#rulesStatus")).toHaveText("", { timeout: 15000 });
  await expect(page.locator("#rulesImage")).toBeVisible();
  const img = await page.locator("#rulesImage").evaluate(async (el) => {
    let decoded = true;
    try { await el.decode(); } catch (e) { decoded = false; }
    return { w: el.naturalWidth, h: el.naturalHeight, src: el.currentSrc, decoded, hidden: getComputedStyle(el).visibility };
  });
  expect(img.decoded).toBe(true);
  expect(img.hidden).toBe("visible");
  return img;
}

test("every rulebook file on the site is a complete image", async ({ request }) => {
  const files = fs.readdirSync(path.join(ROOT, "rules")).filter(f => /\.(png|avif|webp)$/.test(f));
  expect(files.length).toBe(13);                       // 5 PNGs + 4 AVIF + 4 WebP
  for (const f of files) {
    const res = await request.get(`/rules/${f}`);
    expect(res.ok(), f).toBe(true);
    expect(imageIsComplete(await res.body()), `${f} is ${f === KNOWN_TRUNCATED ? "expected to be truncated (update this test once it is replaced)" : "complete"}`)
      .toBe(f !== KNOWN_TRUNCATED);
  }
});

test("rulebook images stay within the phone download budget", async ({ request }) => {
  const total = async (ext) => {
    let sum = 0;
    for (const b of Object.keys(OPTIMIZED)) sum += (await (await request.get(`/rules/${b}.${ext}`)).body()).length;
    return sum;
  };
  expect(await total("avif")).toBeLessThan(1.5e6);
  expect(await total("webp")).toBeLessThan(2.0e6);
});

test("each rulebook fully decodes in the viewer; the truncated Crag sheet says so", async ({ page }) => {
  await seed(ALL_PACKS)(page);
  await page.goto("/");
  await waitForWorker(page);
  await page.locator("#rulesBtn").click();
  for (const [base, { label, height }] of Object.entries(OPTIMIZED)) {
    await page.locator("#rulesTabs").getByRole("button", { name: label, exact: true }).click();
    const img = await expectRulebookShown(page);
    expect(img.src).toMatch(new RegExp(`/rules/${base}\\.(avif|webp)$`));
    expect([img.w, img.h]).toEqual([1600, height]);
  }
  await page.locator("#rulesTabs").getByRole("button", { name: "Cpt. Crag", exact: true }).click();
  await expect(page.locator("#rulesStatus")).toContainText("Cpt. Crag rulebook image in this app is incomplete", { timeout: 15000 });
  await expect(page.locator("#rulesStatus a")).toHaveAttribute("href", /boardgamegeek\.com\/filepage\/217405/);
  await expect(page.locator("#rulesImage")).toBeHidden();
  // Switching back recovers the image.
  await page.locator("#rulesTabs").getByRole("button", { name: "Series 1", exact: true }).click();
  await expectRulebookShown(page);
});

test("only the format the browser shows is stored, in the persistent rulebook cache", async ({ page }) => {
  await seed({})(page);
  await page.goto("/");
  await waitForWorker(page);
  await page.locator("#rulesBtn").click();
  const img = await expectRulebookShown(page);
  await expect.poll(() => rulesCacheKeys(page)).toEqual([img.src]);
});

test.describe("offline rulebooks", () => {
  let server;
  test.beforeEach(async () => { server = await startServer(); });
  test.afterEach(async () => { await server.stop(); });

  test("a rulebook opened once still shows offline after an app release", async ({ page }) => {
    await seed({})(page);
    await page.goto(server.url);
    await waitForWorker(page);
    await page.locator("#rulesBtn").click();
    await expectRulebookShown(page);
    await page.locator("#rulesClose").click();

    // Release: a new service-worker.js with a new versioned cache name.
    server.release("next");
    await page.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
    await expect.poll(() => page.evaluate(() => caches.keys()).catch(() => []), { timeout: 15000 })
      .toContainEqual(expect.stringMatching(/-next$/));
    await expect.poll(() => page.evaluate(async () => (await caches.keys()).filter(k => !/^twin-stars-(fonts|rules)-/.test(k)).length).catch(() => 0), { timeout: 15000 })
      .toBe(1);                                         // the previous release's cache is gone

    await server.stop();
    await page.reload();
    await page.locator("#rulesBtn").click();
    const img = await expectRulebookShown(page);
    expect(img.w).toBe(1600);
  });

  test("Save all stores every complete rulebook, reports progress and works offline", async ({ page }) => {
    await seed(ALL_PACKS)(page);
    await page.goto(server.url);
    await waitForWorker(page);
    await page.locator("#rulesBtn").click();
    const status = page.locator("#rulesOfflineStatus");
    const firstShown = await expectRulebookShown(page);
    await expect(status).toHaveText("Saved for offline: Series 1 (1 of 5).");

    await page.getByRole("button", { name: "Save all for offline" }).click();
    await expect(status).toHaveText(
      "Saved 4 of 5 rulebooks for offline use. Cpt. Crag: the image in this app is incomplete, so it can't be saved.",
      { timeout: 20000 });
    const ext = firstShown.src.split(".").pop();
    const keys = await rulesCacheKeys(page);
    expect(keys.map(k => k.split("/rules/")[1]).sort()).toEqual(Object.keys(OPTIMIZED).map(b => `${b}.${ext}`).sort());

    await page.locator("#rulesClose").click();
    await page.locator("#rulesBtn").click();
    await expect(status).toHaveText("Saved for offline: Series 1, SYZYGY I, Series 2, SYZYGY II (4 of 5).");
    await page.locator("#rulesClose").click();

    await server.stop();
    await page.reload();
    await page.locator("#rulesBtn").click();
    await page.locator("#rulesTabs").getByRole("button", { name: "SYZYGY II", exact: true }).click();   // never opened before
    await expectRulebookShown(page);
  });
});

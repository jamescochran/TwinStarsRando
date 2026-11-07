import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Platform: self-hosted fonts, manifest/icons, sharing metadata, install UX, update toast, hash routes.

function seed(values = {}) {
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

const siteRoot = (testInfo) => path.resolve(testInfo.project.testDir, "../..");

// A private static server (python, like the suite's) that a test can stop to go offline,
// optionally serving a throwaway copy of the site that the test may modify.
async function startServer(dir) {
  const proc = spawn("python3", ["-u", "-m", "http.server", "0", "--bind", "127.0.0.1", "--directory", dir], { stdio: ["ignore", "pipe", "pipe"] });
  const port = await new Promise((resolve, reject) => {
    let out = "";
    const t = setTimeout(() => reject(new Error("server did not start: " + out)), 10000);
    proc.stdout.on("data", (d) => {
      out += d;
      const m = out.match(/port (\d+)/);
      if (m) { clearTimeout(t); resolve(Number(m[1])); }
    });
    proc.on("exit", (c) => reject(new Error("server exited " + c + ": " + out)));
  });
  proc.removeAllListeners("exit");
  const exited = new Promise((r) => proc.once("exit", r));
  return { url: `http://127.0.0.1:${port}/`, stop: () => { if (proc.exitCode === null && proc.signalCode === null) proc.kill(); return exited; } };
}

function copySite(testInfo) {
  const src = siteRoot(testInfo);
  const dst = fs.mkdtempSync(path.join(os.tmpdir(), "ts-site-"));
  fs.cpSync(src, dst, { recursive: true, filter: (p) => !/[\\/](tests|\.git|\.github)([\\/]|$)/.test(p.slice(src.length)) });
  return dst;
}

async function waitForControl(page) {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });
}

const fontsLoaded = (page) => page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([document.fonts.load("900 20px Orbitron"), document.fonts.load("400 16px 'Exo 2'")]).catch(() => {});
  const faces = [...document.fonts].map((f) => ({ family: f.family.replace(/["']/g, ""), status: f.status, range: f.unicodeRange }));
  const latin = (fam) => faces.filter((f) => f.family === fam && /U\+0-FF|U\+0000-00FF/i.test(f.range));
  return { orbitron: latin("Orbitron").map((f) => f.status), exo: latin("Exo 2").map((f) => f.status) };
});

test.describe("self-hosted fonts", () => {
  test("no requests go to Google Fonts and both families load from this site", async ({ page }) => {
    const external = [];
    page.on("request", (r) => { if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) external.push(r.url()); });
    await seed()(page);
    await page.goto("/");
    const st = await fontsLoaded(page);
    expect(st.orbitron).toEqual(["loaded"]);
    expect(st.exo).toEqual(["loaded"]);
    expect(external).toEqual([]);
    const html = await (await page.request.get("/index.html")).text();
    expect(html).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
    const csp = html.match(/Content-Security-Policy" content="([^"]+)"/)[1];
    expect(csp).toContain("font-src 'self'");
    expect(csp).not.toMatch(/googleapis|gstatic/);
    for (const f of ["fonts/orbitron-latin.woff2", "fonts/exo2-latin.woff2", "fonts/exo2-latin-ext.woff2", "fonts/OFL.txt"]) {
      expect((await page.request.get(f)).ok(), f).toBe(true);
    }
  });

  test("fonts render offline on the very first visit (precached by the service worker)", async ({ browser }, testInfo) => {
    const srv = await startServer(siteRoot(testInfo));
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await seed()(page);
      await page.goto(srv.url);
      await waitForControl(page);
      await srv.stop();
      await page.reload();
      await expect(page.locator("#generateBtn")).toBeVisible();
      const st = await fontsLoaded(page);
      expect(st.orbitron).toEqual(["loaded"]);
      expect(st.exo).toEqual(["loaded"]);
    } finally {
      await ctx.close();
      await srv.stop().catch(() => {});
    }
  });

  test("app.js is deferred", async ({ page }) => {
    await page.goto("/");
    expect(await page.locator('script[src="app.js"]').getAttribute("defer")).not.toBeNull();
  });
});

test.describe("manifest and icons", () => {
  test("manifest has install metadata, and every icon and screenshot resolves at its declared size", async ({ page }) => {
    await page.goto("/");
    const m = await (await page.request.get("manifest.json")).json();
    expect(m.id).toBeTruthy();
    expect(m.lang).toBe("en");
    expect(m.categories).toEqual(expect.arrayContaining(["games", "entertainment"]));
    expect(m.display_override).toEqual(["standalone", "minimal-ui"]);
    expect(m.launch_handler).toBeTruthy();
    expect(m.shortcuts.map((s) => s.url)).toEqual(["./#randomizer", "./#log", "./#syzygy"]);

    const any = m.icons.filter((i) => i.purpose === "any");
    const maskable = m.icons.filter((i) => i.purpose === "maskable");
    expect(any.map((i) => i.sizes)).toEqual(expect.arrayContaining(["144x144", "192x192", "384x384", "512x512"]));
    expect(maskable.map((i) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    // Maskable icons are their own padded files, not the `any` artwork reused.
    for (const mk of maskable) expect(any.map((i) => i.src)).not.toContain(mk.src);

    expect(m.screenshots.filter((s) => s.form_factor === "narrow").length).toBeGreaterThanOrEqual(1);
    expect(m.screenshots.filter((s) => s.form_factor === "wide").length).toBeGreaterThanOrEqual(1);

    const images = [...m.icons, ...m.screenshots, { src: "apple-touch-icon.png", sizes: "180x180" }];
    const dims = await page.evaluate((list) => Promise.all(list.map((i) => new Promise((res) => {
      const img = new Image();
      img.onload = () => res(`${img.naturalWidth}x${img.naturalHeight}`);
      img.onerror = () => res("error");
      img.src = i.src;
    }))), images);
    expect(dims).toEqual(images.map((i) => i.sizes));
  });

  test("head links a 180px apple-touch-icon", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", "apple-touch-icon.png");
  });
});

test.describe("sharing metadata", () => {
  test("large og image with alt text, and WebApplication JSON-LD without CSP violations", async ({ page }) => {
    await page.addInitScript(() => {
      window.__csp = [];
      document.addEventListener("securitypolicyviolation", (e) => window.__csp.push(e.violatedDirective + " " + e.blockedURI));
    });
    await page.goto("/");
    const meta = (sel) => page.locator(sel).getAttribute("content");
    expect(await meta('meta[name="twitter:card"]')).toBe("summary_large_image");
    expect(await meta('meta[property="og:site_name"]')).toBeTruthy();
    expect(await meta('meta[property="og:image:alt"]')).toBeTruthy();
    expect(await meta('meta[property="og:image:width"]')).toBe("1200");
    expect(await meta('meta[property="og:image:height"]')).toBe("630");
    const ogUrl = await meta('meta[property="og:image"]');
    const file = new URL(ogUrl).pathname.split("/").pop();
    const resp = await page.request.get(file);
    expect(resp.ok()).toBe(true);
    expect((await resp.body()).length).toBeLessThan(300 * 1024);
    const dim = await page.evaluate((src) => new Promise((res) => { const i = new Image(); i.onload = () => res([i.naturalWidth, i.naturalHeight]); i.onerror = () => res(null); i.src = src; }), file);
    expect(dim).toEqual([1200, 630]);

    const ld = JSON.parse(await page.locator('script[type="application/ld+json"]:not(#faqJsonLd)').textContent());
    expect(ld["@type"]).toBe("WebApplication");
    expect(ld.applicationCategory).toBe("GameApplication");
    expect(ld.operatingSystem).toBe("Web");
    expect(ld.offers.price).toBe("0");
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__csp)).toEqual([]);
  });
});

test.describe("hash routes (manifest shortcuts)", () => {
  test("#log, #syzygy and #randomizer open their tab and clear the fragment", async ({ page }) => {
    await seed()(page);
    await page.goto("/#log");
    await expect(page.locator("#historyTab")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#historyPage")).toBeVisible();
    expect(await page.evaluate(() => location.hash)).toBe("");

    await page.goto("/#syzygy");
    await expect(page.locator("#syzygyCampaignTab")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#syzygyCampaignPage")).toBeVisible();

    // Same document, new fragment (launch_handler navigate-existing): hashchange routes too.
    await page.evaluate(() => { location.hash = "#randomizer"; });
    await expect(page.locator("#randomizerTab")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#randomizerPage")).toBeVisible();
  });
});

test.describe("install UX", () => {
  const fakePrompt = () => {
    const e = new Event("beforeinstallprompt", { cancelable: true });
    e.prompt = () => { window.__prompted = (window.__prompted || 0) + 1; return Promise.resolve(); };
    e.userChoice = Promise.resolve({ outcome: "accepted" });
    window.dispatchEvent(e);
  };

  test("Install button appears only after the browser offers installation and prompts once", async ({ page }) => {
    await seed()(page);
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/");
    const btn = page.locator("#installBtn");
    await expect(btn).toBeHidden();
    await page.evaluate(fakePrompt);
    await expect(btn).toBeVisible();
    // The header row still fits a 360px phone with the extra button.
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    await btn.click();
    expect(await page.evaluate(() => window.__prompted)).toBe(1);
    await expect(btn).toBeHidden();
  });

  test("Install button stays hidden when already running as an installed app", async ({ page }) => {
    await page.addInitScript(() => {
      const mm = window.matchMedia.bind(window);
      window.matchMedia = (q) => (/display-mode:\s*standalone/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : mm(q));
    });
    await seed()(page);
    await page.goto("/");
    await page.evaluate(fakePrompt);
    await page.waitForTimeout(200);
    await expect(page.locator("#installBtn")).toBeHidden();
  });

  test("no iOS hint on non-iOS browsers", async ({ page }) => {
    await seed()(page);
    await page.goto("/");
    await expect(page.locator("#iosInstallHint")).toBeHidden();
  });

  test.describe("on iPhone Safari", () => {
    test.use({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" });

    test("shows the Add to Home Screen hint once, after onboarding, until dismissed", async ({ page }) => {
      await page.goto("/");
      // First run: the onboarding tip is up, so the install hint waits.
      await expect(page.locator("#onboardingTip")).toBeVisible();
      await expect(page.locator("#iosInstallHint")).toBeHidden();
      await page.click("#tipDismiss");
      await page.reload();
      const hint = page.locator("#iosInstallHint");
      await expect(hint).toBeVisible();
      await expect(hint).toContainText("Add to Home Screen");
      await page.click("#iosInstallHintDismiss");
      await expect(hint).toBeHidden();
      await page.reload();
      await expect(page.locator("#generateBtn")).toBeVisible();
      await expect(hint).toBeHidden();
    });
  });
});

test.describe("service worker update", () => {
  test("mid-game update shows a Reload button that reloads only when tapped", async ({ browser }, testInfo) => {
    test.setTimeout(60000);
    const dir = copySite(testInfo);
    const srv = await startServer(dir);
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await seed()(page);
      await page.goto(srv.url);
      await waitForControl(page);
      await page.reload(); // now controlled from the start, like a returning visitor
      await waitForControl(page);
      await page.click("#generateBtn"); // a mission is loaded: the app must not reload by itself
      await page.evaluate(() => { window.__sameDocument = true; });

      const swPath = path.join(dir, "service-worker.js");
      fs.writeFileSync(swPath, fs.readFileSync(swPath, "utf8").replace(/const CACHE = "([^"]+)"/, 'const CACHE = "$1-test-update"'));
      await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.update()));

      const reloadBtn = page.locator("#toastRegion .toast-action", { hasText: "Reload" });
      await expect(reloadBtn).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(500);
      expect(await page.evaluate(() => window.__sameDocument)).toBe(true);

      await Promise.all([page.waitForEvent("load"), reloadBtn.click()]);
      expect(await page.evaluate(() => window.__sameDocument)).toBeUndefined();
    } finally {
      await ctx.close();
      await srv.stop().catch(() => {});
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

test.describe("ambient radio", () => {
  // SomaFM's stream servers answer 403 to requests referred by this site, which silenced the
  // radio. The page sends no Referer to other origins, and the service worker leaves the
  // stream to the browser. (The live stream itself is not fetched in tests.)
  test("the page sets a same-origin referrer policy", async ({ page }) => {
    await seed()(page);
    await page.goto("/");
    await expect(page.locator('meta[name="referrer"]')).toHaveAttribute("content", "same-origin");
  });

  test("the stream request carries no Referer, also from a page the service worker controls", async ({ page, browserName }) => {
    // Linux WebKit loads media through GStreamer, outside the network layer Playwright can see.
    test.skip(browserName === "webkit", "media requests are not observable in Playwright WebKit on Linux");
    const seen = [];
    await page.route(/somafm\.com/, async r => {
      seen.push({ url: r.request().url(), referer: (await r.request().allHeaders())["referer"] || null });
      await r.abort();
    });
    await seed()(page);
    await page.goto("/");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); // controlled by the service worker from the start, like a returning visitor
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.locator("#radioBtn").click();
    await expect.poll(() => seen.length, { timeout: 10000 }).toBeGreaterThan(0);
    expect(seen[0].url).toMatch(/missioncontrol/);
    expect(seen.every(s => s.referer === null), JSON.stringify(seen)).toBe(true);
  });

  test("the service worker passes other origins straight through", async () => {
    const sw = fs.readFileSync(path.resolve(__dirname, "../../service-worker.js"), "utf8");
    expect(sw).toMatch(/new URL\(url\)\.origin !== self\.location\.origin\) return;/);
  });
});

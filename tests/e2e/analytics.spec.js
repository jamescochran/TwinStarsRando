import { test, expect } from "@playwright/test";

// Privacy-safe analytics (T0.9): events fire at each trigger with only allowed fields,
// never record contents or notes; errors are reported rate-limited; Privacy dialog.
//
// The real Umami script is blocked (its SRI hash means a routed stub would be refused by
// the browser anyway) and window.umami is stubbed before app.js runs.

const NOTES = "SECRET-NOTE-TEXT my friend Alice";

const ALLOWED = {
  randomize: ["locked"],
  lock_toggle: ["slot", "locked"],
  manual_pick: [],
  save_record: ["result", "difficulty"],
  dice_roll: ["dice"],
  skill_check: [],
  faq_open: ["anchor"],
  rules_open: ["tab"],
  sz_start: ["mode"],
  sz_complete: ["mode", "rank"],
  export: ["records"],
  import: ["mode", "imported", "duplicates", "skipped"],
  unplayed_play: [],
  radio_play: [],
  theme_toggle: ["theme"],
  undo: [],
  js_error: ["message", "file", "line"],
  collection_change: ["items"],
  shelf_open: [],
  board_open: ["auto", "setup"],
  board_setup_saved: ["tracks", "edit"],
  board_record: ["result"],
  teach_start: ["source"],
  teach_complete: ["step"],
  setup_open: [],
  rail_toggle: ["on"],
  daily_play: [],
  daily_share: [],
  lab_open: [],
  gauntlet_start: ["scenarios"],
  gauntlet_complete: ["wins", "total"],
  gauntlet_share: [],
};

const rec = (i, extra = {}) => ({
  characters: ["Bood", "Stag Solar"], scenario: "Escape The Brig!", result: "Win",
  difficulty: "Easy", playtime: 60, timestamp: `1/${i + 1}/2026, 1:00:00 PM`, ...extra,
});

async function setup(page, storage = {}) {
  await page.route("https://umami.1jc.in/**", r => r.abort());
  await page.route(/somafm\.com/, r => r.abort());
  await page.addInitScript((v) => {
    window.__events = [];
    window.umami = { track: (name, data) => { window.__events.push([name, data]); } };
    if (localStorage.getItem("__seeded")) return;
    localStorage.setItem("__seeded", "1");
    localStorage.setItem("hasSeenTip", "1");
    localStorage.setItem("seenPrimarySecondaryNotice", "1");
    for (const [k, val] of Object.entries(v)) localStorage.setItem(k, typeof val === "string" ? val : JSON.stringify(val));
  }, storage);
  await page.goto("/");
}

const events = (page) => page.evaluate(() => window.__events);
async function lastEvent(page, name) {
  await expect.poll(async () => (await events(page)).some(e => e[0] === name), { message: `event ${name}` }).toBe(true);
  return (await events(page)).filter(e => e[0] === name).pop()[1];
}

function assertClean(all) {
  for (const [name, data] of all) {
    expect(Object.keys(ALLOWED), `unexpected event ${name}`).toContain(name);
    for (const [k, v] of Object.entries(data || {})) {
      expect(ALLOWED[name], `${name}.${k} not allowed`).toContain(k);
      expect(["string", "number", "boolean"]).toContain(typeof v);
    }
    const json = JSON.stringify(data);
    expect(json).not.toContain("SECRET");
    expect(json).not.toContain("Alice");
    // No character or scenario names in any event.
    for (const n of ["Bood", "Stag Solar", "Fanoobia", "Escape The Brig"]) expect(json).not.toContain(n);
  }
}

test("randomizer, locks, manual pick, save, dice, skill check, FAQ, theme and undo fire clean events", async ({ page }) => {
  await setup(page);

  await page.locator("#lockScenario").click();
  expect(await lastEvent(page, "lock_toggle")).toEqual({ slot: "scenario", locked: true });
  await page.locator("#lockScenario").click();

  await page.locator("#generateBtn").click();
  expect(await lastEvent(page, "randomize")).toEqual({ locked: 0 });

  await page.locator("#recordNotes").fill(NOTES);
  await page.locator("#result").selectOption("Loss");
  await page.locator("#difficulty").selectOption("Hard");
  await page.locator("#saveRecordBtn").click();
  expect(await lastEvent(page, "save_record")).toEqual({ result: "Loss", difficulty: "Hard" });

  // Manual pick (record already saved, so no unsaved-game prompt).
  await page.locator("#manualChar1").selectOption({ index: 0 });
  await page.locator("#manualChar2").selectOption({ index: 1 });
  await page.locator("#loadManualCombo").click();
  await lastEvent(page, "manual_pick");

  await page.locator("#diceRollerBtn").click();
  await page.locator("#rollBtn").click();
  expect(await lastEvent(page, "dice_roll")).toEqual({ dice: 2 });
  await page.locator("#skillCheckBtn").click();
  await lastEvent(page, "skill_check");
  await page.locator("#skillDoneBtn").click();
  await page.locator("#diceModalClose").click();

  const faq = page.locator("#combinationDisplay .btn-faq-inline").first();
  const anchor = await faq.getAttribute("data-faq-anchor");
  await faq.click();
  expect(await lastEvent(page, "faq_open")).toEqual({ anchor });
  await page.locator("#faqClose").click();

  await page.locator("#themeBtn").click();
  expect((await lastEvent(page, "theme_toggle")).theme).toMatch(/^(light|dark)$/);

  // Undo a deletion from the Mission Log.
  await page.getByRole("tab", { name: "Mission Log" }).click();
  await page.locator("#historyTableContainer button[aria-label^='Delete']").first().click();
  await page.locator("#deleteRecordConfirm").click();
  await page.locator("#toastRegion .toast-action").click();
  expect(await lastEvent(page, "undo")).toEqual({});

  assertClean(await events(page));
});

test("export, import (merge and replace) and unplayed Play fire clean events with counts", async ({ page }) => {
  await setup(page, { gameRecords: [rec(0, { notes: NOTES }), rec(1)] });
  await page.getByRole("tab", { name: "Mission Log" }).click();

  const download = page.waitForEvent("download");
  await page.locator("#exportBtn").click();
  await download;
  expect(await lastEvent(page, "export")).toEqual({ records: 2 });

  const file = (recs) => ({ name: "b.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(recs)) });
  await page.locator("#importFile").setInputFiles(file([rec(1), rec(5, { notes: NOTES }), { junk: true }]));
  await page.locator("#importMerge").click();
  expect(await lastEvent(page, "import")).toEqual({ mode: "merge", imported: 1, duplicates: 1, skipped: 1 });

  await page.locator("#importFile").setInputFiles(file([rec(7, { notes: NOTES })]));
  await page.locator("#importReplace").click();
  expect(await lastEvent(page, "import")).toEqual({ mode: "replace", imported: 1, skipped: 0 });

  await page.locator(".btn-load-unplayed").first().click();
  await lastEvent(page, "unplayed_play");

  assertClean(await events(page));
});

test("rules, radio and SYZYGY start/complete fire clean events", async ({ page }) => {
  await setup(page);

  await page.locator("#rulesBtn").click();
  expect(await lastEvent(page, "rules_open")).toEqual({ tab: "twinstars1" });
  await page.locator("#rulesTabs button").nth(1).click();
  expect(await lastEvent(page, "rules_open")).toEqual({ tab: "twinstars1-syzygy" });
  await page.locator("#rulesClose").click();

  await page.locator("#radioBtn").click();
  await lastEvent(page, "radio_play");

  await page.getByRole("tab", { name: /SYZYGY/ }).click();
  await page.locator("#szSel1").click();
  for (const c of ["Bood", "Stag Solar", "Fanoobia"]) await page.locator(`.syzygy-char-btn[data-char="${c}"]`).click();
  await page.locator("#szStartBtn").click();
  expect(await lastEvent(page, "sz_start")).toEqual({ mode: "syzygy1" });

  // Two defeats end the campaign (SYZYGY v2: choose who plays, then confirm each defeat).
  for (let i = 0; i < 2; i++) {
    await page.locator('[data-player="0"]').click(); await page.locator('[data-player="1"]').click();
    await page.locator("#szLossBtn").click();
    await page.locator("#szLossConfirm").click();
  }
  const done = await lastEvent(page, "sz_complete");
  expect(done).toEqual({ mode: "syzygy1", rank: "GROSKSH'D" });

  assertClean(await events(page));
});

test("track() is a silent no-op without Umami", async ({ page }) => {
  await page.route("https://umami.1jc.in/**", r => r.abort());
  const errors = [];
  page.on("pageerror", e => errors.push(e));
  await page.addInitScript(() => localStorage.setItem("hasSeenTip", "1"));
  await page.goto("/");
  await page.locator("#generateBtn").click();
  await page.locator("#themeBtn").click();
  expect(await page.evaluate(() => typeof window.umami)).toBe("undefined");
  expect(errors).toEqual([]);
});

test("uncaught errors and rejections are reported truncated, PII-free and at most 3 times", async ({ page }) => {
  await setup(page);
  await page.evaluate(() => {
    const long = "x".repeat(300);
    setTimeout(() => { throw new Error(`boom https://example.com/secret?q=1 ${long}`); }, 0);
    Promise.reject(new Error("rejected"));
    for (let i = 0; i < 5; i++) setTimeout(() => { throw new Error(`again ${i}`); }, 10);
  });
  await expect.poll(async () => (await events(page)).filter(e => e[0] === "js_error").length).toBe(3);
  await page.waitForTimeout(200);
  const errs = (await events(page)).filter(e => e[0] === "js_error").map(e => e[1]);
  expect(errs).toHaveLength(3);
  for (const e of errs) {
    expect(e.message.length).toBeLessThanOrEqual(120);
    expect(e.message).not.toContain("example.com");
    expect(e.file).not.toContain("/");
    expect(typeof e.line).toBe("number");
  }
  expect(errs.some(e => e.message.includes("[url]"))).toBe(true);
  expect(errs.some(e => e.message.includes("rejected"))).toBe(true);
  assertClean(await events(page));
});

test("Umami tag is scoped to the production domain, strips query/hash and honours DNT", async ({ page }) => {
  await page.route("https://umami.1jc.in/**", r => r.abort());
  await page.goto("/");
  const tag = page.locator('script[src="https://umami.1jc.in/script.js"]');
  await expect(tag).toHaveAttribute("data-domains", "jamescochran.github.io");
  await expect(tag).toHaveAttribute("data-exclude-search", "true");
  await expect(tag).toHaveAttribute("data-exclude-hash", "true");
  await expect(tag).toHaveAttribute("data-do-not-track", "true");
  await expect(tag).toHaveAttribute("integrity", /^sha384-/);
});

test("Privacy dialog opens from the footer, traps and returns focus, and states the facts", async ({ page }) => {
  await page.route("https://umami.1jc.in/**", r => r.abort());
  await page.addInitScript(() => localStorage.setItem("hasSeenTip", "1"));
  await page.goto("/");
  const btn = page.locator("#privacyBtn");
  await btn.focus();
  await btn.press("Enter");
  const modal = page.locator("#privacyModal");
  await expect(modal).toHaveClass(/open/);
  await expect(page.getByRole("dialog", { name: "Privacy" })).toBeVisible();
  await expect(page.locator("#privacyModalClose")).toBeFocused();
  for (const t of ["No accounts", "only in this browser", "Umami", "No cookies", "Do Not Track", "SomaFM", "press play"]) {
    await expect(modal).toContainText(t);
  }
  // Tab stays inside the dialog.
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement.closest("#privacyModal"))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(modal).not.toHaveClass(/open/);
  await expect(btn).toBeFocused();

  await btn.click();
  await page.locator("#privacyModalClose").click();
  await expect(modal).not.toHaveClass(/open/);
  await expect(btn).toBeFocused();
});

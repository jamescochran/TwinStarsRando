import { test, expect } from "@playwright/test";

// Phase 0 data safety: record identity and migration, cross-tab safety, honest saves,
// persistence and robustness. Seeds are written once per context ("__seeded"), so a
// reload or a second page in the same context sees what the app itself persisted.
function seed(values) {
  return async (target) => {
    await target.addInitScript((v) => {
      if (localStorage.getItem("__seeded")) return;
      localStorage.setItem("__seeded", "1");
      localStorage.setItem("hasSeenTip", "1");
      localStorage.setItem("seenPrimarySecondaryNotice", "1");
      for (const [k, val] of Object.entries(v)) localStorage.setItem(k, typeof val === "string" ? val : JSON.stringify(val));
    }, values);
  };
}
const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("gameRecords") || "[]"));
// No toast currently shown matches `text` (passes when there is no toast at all).
async function noToast(page, text) {
  const shown = (await page.locator(".toast").allTextContents()).join(" | ");
  if (text instanceof RegExp) expect(shown).not.toMatch(text); else expect(shown).not.toContain(text);
}
const historyStamps = (page) => page.locator("#historyTableContainer tbody tr:not(.notes-row) td:first-child").allTextContents();

// Every shape of record that past versions of the app wrote.
const HISTORICAL = {
  // Initial commit (2026-05): no droid, no notes, no validation at load.
  initial:   { characters: ["Bood", "Stag Solar"], scenario: "Escape The Brig!", result: "Win", difficulty: "Easy", playtime: 754, timestamp: "5/6/2026, 9:40:12 AM" },
  // playtime was optional in isValidRecord (records imported or edited by hand).
  noPlay:    { characters: ["Saaze", "Kinglan"], scenario: "Rule The World!", result: "Loss", difficulty: "Hard", timestamp: "5/7/2026, 8:00:00 PM" },
  nullPlay:  { characters: ["Saaze", "Bood"], scenario: "Rule The World!", result: "Loss", difficulty: "Medium", playtime: null, timestamp: "5/8/2026, 8:00:00 PM" },
  // Droid Assistants (2026-05-21).
  droid:     { characters: ["Fanoobia", "Inpon Gol"], scenario: "Stop The Virus!", result: "Win", difficulty: "Medium", playtime: 1200, timestamp: "5/22/2026, 7:15:00 PM", droid: "F1D0" },
  // Notes (edit records, 2026-05-21).
  notes:     { characters: ["Inzill Mey", "Strezelsior"], scenario: "Hunt The Bounty!", result: "Loss", difficulty: "Easy", playtime: 300, timestamp: "6/1/2026, 10:00:00 AM", notes: "close one" },
  // A day/month locale (en-GB) and a timestamp nothing can parse.
  dayFirst:  { characters: ["Kinglan", "Bood"], scenario: "Steal The Plans!", result: "Win", difficulty: "Hard", playtime: 60, timestamp: "25/06/2026, 18:30:00" },
  garbage:   { characters: ["Brenimov-X", "Bood"], scenario: "Confine The Quarks!", result: "Win", difficulty: "Easy", playtime: 61, timestamp: "R-unparseable" },
};

test.describe("record identity and migration", () => {
  test("every historical record shape loads, gains an id and createdAt, and keeps its fields", async ({ page }) => {
    const shapes = Object.values(HISTORICAL);
    // An older record merged in from a backup sits at the END of the array.
    const merged = { ...HISTORICAL.initial, characters: ["Roux Jaezmina", "Saaze"], timestamp: "1/2/2026, 9:00:00 AM" };
    const droids = ["F1D0"];
    await seed({ gameRecords: [...shapes, merged], enabledPacks: ["series1", "series2", "captaincrag"] })(page);
    await page.goto("/");
    const recs = await stored(page);
    expect(recs).toHaveLength(shapes.length + 1);
    for (const r of recs) {
      expect(typeof r.id).toBe("string");
      expect(r.id.length).toBeGreaterThan(0);
      expect(Number.isFinite(Date.parse(r.createdAt))).toBe(true);
    }
    expect(new Set(recs.map(r => r.id)).size).toBe(recs.length);
    // Original fields are untouched.
    shapes.concat(merged).forEach((s, i) => {
      for (const [k, v] of Object.entries(s)) expect(recs[i][k]).toEqual(v);
    });
    expect(await page.evaluate(() => localStorage.getItem("gameRecordsVersion"))).toBe("2");
    // createdAt follows the timestamp where readable.
    expect(new Date(recs[0].createdAt).getMonth()).toBe(4);   // May
    expect(new Date(recs[5].createdAt).getDate()).toBe(25);   // 25/06 read day-first
    // The unparseable one sits just after its predecessor in save order.
    expect(Date.parse(recs[6].createdAt)).toBeGreaterThan(Date.parse(recs[5].createdAt));
    // Ids are stable across reloads (a second migration does not reassign them).
    await page.reload();
    expect((await stored(page)).map(r => r.id)).toEqual(recs.map(r => r.id));
    // Newest first sorts by date, so the old merged record is last, not first.
    await page.getByRole("tab", { name: "Mission Log" }).click();
    const stamps = await historyStamps(page);
    expect(stamps[stamps.length - 1]).toBe(merged.timestamp);
    expect(stamps[0]).not.toBe(merged.timestamp);
    void droids;
  });

  test("a new record has an id, ISO createdAt and the display timestamp; an edit adds updatedAt", async ({ page }) => {
    await seed({})(page);
    await page.goto("/");
    await page.getByRole("button", { name: /Randomize Combination/i }).click();
    await page.locator("#saveRecordBtn").click();
    let [r] = await stored(page);
    expect(r.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(r.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(typeof r.timestamp).toBe("string");
    expect(r.updatedAt).toBeUndefined();
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await page.locator(".btn-edit-record").first().click();
    await page.selectOption("#editResult", "Loss");
    await page.click("#editRecordSave");
    [r] = await stored(page);
    expect(r.result).toBe("Loss");
    expect(r.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// Six records R0..R5, all the same combination, distinguishable by timestamp and notes.
const six = Array.from({ length: 6 }, (_, i) => ({
  characters: ["Bood", "Saaze"], scenario: "Escape The Brig!", result: "Win", difficulty: "Easy",
  timestamp: `1/${i + 1}/2026, 1:00:00 PM`, notes: "rec" + i,
}));
const labelOf = (i) => `Bood & Saaze, 1/${i + 1}/2026, 1:00 PM`;

test.describe("undo vs open dialog (H4)", () => {
  test("Undo can't act behind the Edit dialog, and Save edits the record that was opened", async ({ page }) => {
    await seed({ gameRecords: six })(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await page.getByRole("button", { name: "Delete " + labelOf(1) }).click();
    await page.click("#deleteRecordConfirm");
    await page.getByRole("button", { name: "Edit " + labelOf(4) }).click();
    await expect(page.locator("#editNotes")).toHaveValue("rec4");
    // Old code: the Undo toast stayed clickable above the dialog and re-inserted R1,
    // shifting the index the dialog held.
    await page.locator(".toast .toast-action").click({ timeout: 1000 }).catch(() => {});
    await page.fill("#editNotes", "EDITED");
    await page.click("#editRecordSave");
    const recs = await stored(page);
    expect(recs.find(r => r.notes === "EDITED").timestamp).toBe(six[4].timestamp);
    expect(recs.some(r => r.notes === "rec3")).toBe(true);
  });

  test("Undo can't act behind the Delete dialog, and Delete removes the record that was opened", async ({ page }) => {
    await seed({ gameRecords: six })(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await page.getByRole("button", { name: "Delete " + labelOf(0) }).click();
    await page.click("#deleteRecordConfirm");
    await page.getByRole("button", { name: "Delete " + labelOf(5) }).click();
    await page.locator(".toast .toast-action").click({ timeout: 1000 }).catch(() => {});
    await page.click("#deleteRecordConfirm");
    const notes = (await stored(page)).map(r => r.notes);
    expect(notes).not.toContain("rec5");
    expect(notes).toContain("rec4");
  });

  test("the Undo toast is hidden while a dialog is open and usable again after", async ({ page }) => {
    await seed({ gameRecords: six })(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await page.getByRole("button", { name: "Delete " + labelOf(2) }).click();
    await page.click("#deleteRecordConfirm");
    await expect(page.locator(".toast .toast-action")).toBeVisible();
    await page.getByRole("button", { name: "Edit " + labelOf(3) }).click();
    await expect(page.locator(".toast .toast-action")).toBeHidden();
    await page.click("#editRecordCancel");
    await page.locator(".toast .toast-action").click();
    expect((await stored(page)).map(r => r.notes)).toContain("rec2");
  });
});

test.describe("cross-tab safety (H2)", () => {
  test("two open tabs never erase each other's records, and each shows the other's", async ({ context }) => {
    await seed({})(context);
    const a = await context.newPage();
    await a.goto("/");
    const b = await context.newPage();
    await b.goto("/");
    // Tab A saves two missions.
    for (let i = 0; i < 2; i++) {
      await a.getByRole("button", { name: /Randomize Combination/i }).click();
      await a.locator("#saveRecordBtn").click();
    }
    // Tab B, opened before those saves, saves one.
    await b.getByRole("button", { name: /Randomize Combination/i }).click();
    await b.locator("#saveRecordBtn").click();
    expect(await stored(a)).toHaveLength(3);
    await b.getByRole("tab", { name: "Mission Log" }).click();
    await expect(b.locator("#historyCount")).toHaveText("3 records");
    // A deletes one of its records; B (not reloaded) then edits another: still 2, with the edit.
    await a.getByRole("tab", { name: "Mission Log" }).click();
    await expect(a.locator("#historyCount")).toHaveText("3 records");
    await a.locator("#historyTableContainer .btn-delete-record").first().click();
    await a.click("#deleteRecordConfirm");
    await expect(b.locator("#historyCount")).toHaveText("2 records");
    await b.locator("#historyTableContainer .btn-edit-record").first().click();
    await b.fill("#editNotes", "from B");
    await b.click("#editRecordSave");
    const recs = await stored(a);
    expect(recs).toHaveLength(2);
    expect(recs.filter(r => r.notes === "from B")).toHaveLength(1);
  });

  test("enabled packs changed in another tab are picked up", async ({ context }) => {
    await seed({})(context);
    const a = await context.newPage();
    await a.goto("/");
    const b = await context.newPage();
    await b.goto("/");
    await a.evaluate(() => localStorage.setItem("enabledPacks", JSON.stringify(["series1", "series2"])));
    await expect(b.locator("#activePacksLabel")).toContainText("Series 2");
  });
});

test.describe("honest saves (H3)", () => {
  // Make writes to the records key fail, as a full or blocked storage would.
  const blockRecordWrites = (page) => page.addInitScript(() => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (window.__blockWrites && k === "gameRecords") throw new DOMException("full", "QuotaExceededError");
      return orig.call(this, k, v);
    };
  });

  test("a failed save shows a persistent error with Export, keeps the game unsaved and says nothing about success", async ({ page }) => {
    await seed({ gameRecords: [six[0]] })(page);
    await blockRecordWrites(page);
    await page.goto("/");
    await page.evaluate(() => { window.__blockWrites = true; });
    await page.getByRole("button", { name: /Randomize Combination/i }).click();
    await page.fill("#recordNotes", "keep me");
    await page.locator("#saveRecordBtn").click();
    const bar = page.locator("#storageError");
    await expect(bar).toBeVisible();
    await expect(bar).toContainText("not saved");
    await noToast(page, "saved to Mission Log");
    await expect(page.locator("#saveRecordBtn")).toBeEnabled();
    await expect(page.locator("#recordNotes")).toHaveValue("keep me");
    expect(await page.evaluate(() => records.length)).toBe(1);
    // The error is still there well after a toast would have gone.
    await page.waitForTimeout(3500);
    await expect(bar).toBeVisible();
    // Export includes the record that couldn't be saved.
    const [download] = await Promise.all([page.waitForEvent("download"), page.click("#storageErrorExport")]);
    const text = await (await download.createReadStream()).toArray().then(c => Buffer.concat(c).toString());
    const exported = JSON.parse(text);
    expect(exported).toHaveLength(2);
    expect(exported.some(r => r.notes === "keep me")).toBe(true);
    // Retry once storage works.
    await page.evaluate(() => { window.__blockWrites = false; });
    await page.locator("#saveRecordBtn").click();
    expect(await stored(page)).toHaveLength(2);
  });

  test("failed edit, delete, clear and import leave storage and the log as they were", async ({ page }) => {
    await seed({ gameRecords: six.slice(0, 3) })(page);
    await blockRecordWrites(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await page.evaluate(() => { window.__blockWrites = true; });
    const before = await stored(page);
    // Edit
    await page.getByRole("button", { name: "Edit " + labelOf(0) }).click();
    await page.fill("#editNotes", "nope");
    await page.click("#editRecordSave");
    await expect(page.locator("#storageError")).toBeVisible();
    await noToast(page, "Record updated");
    // Delete
    await page.getByRole("button", { name: "Delete " + labelOf(1) }).click();
    await page.click("#deleteRecordConfirm");
    await noToast(page, "Record deleted");
    // Clear
    await page.click("#clearDataBtn");
    await page.click("#modalConfirm");
    await noToast(page, "Cleared");
    // Import replace + merge
    const file = { name: "r.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify([{ ...six[5], notes: "imported" }])) };
    for (const btn of ["#importReplace", "#importMerge"]) {
      await page.locator("#importFile").setInputFiles(file);
      await page.click(btn);
    }
    await noToast(page, /Replaced|Added/);
    expect(await stored(page)).toEqual(before);
    expect(await page.evaluate(() => records.map(r => r.notes))).toEqual(["rec0", "rec1", "rec2"]);
    await expect(page.locator("#historyCount")).toHaveText("3 records");
  });

  test("an info toast never replaces an error toast", async ({ page }) => {
    await seed({})(page);
    await page.goto("/");
    await page.evaluate(() => { toast("Something failed.", "error"); toast("All good."); });
    await expect(page.locator(".toast.error")).toHaveText("Something failed.");
    // The info one is shown once the error has gone.
    await expect(page.locator(".toast.info")).toHaveText("All good.", { timeout: 8000 });
  });

  test("storage persistence is requested after the first successful save", async ({ page }) => {
    await seed({})(page);
    await page.addInitScript(() => {
      window.__persistCalls = 0;
      const s = navigator.storage || {};
      try {
        Object.defineProperty(navigator, "storage", { configurable: true, value: {
          ...s, persisted: () => Promise.resolve(false), persist: () => { window.__persistCalls++; return Promise.resolve(true); },
        } });
      } catch (e) {}
    });
    await page.goto("/");
    expect(await page.evaluate(() => window.__persistCalls)).toBe(0);
    await page.getByRole("button", { name: /Randomize Combination/i }).click();
    await page.locator("#saveRecordBtn").click();
    await expect.poll(() => page.evaluate(() => window.__persistCalls)).toBe(1);
  });
});

test.describe("robustness (M1, L5)", () => {
  test("setting the clock back can't make playtime negative or produce a record that is dropped later", async ({ page }) => {
    await seed({})(page);
    await page.addInitScript(() => {
      const real = Date.now.bind(Date);
      window.__clockOffset = 0;
      Date.now = () => real() + window.__clockOffset;
    });
    await page.goto("/");
    await page.getByRole("button", { name: /Randomize Combination/i }).click();
    await page.evaluate(() => { window.__clockOffset = -3600 * 1000; });
    await page.click("#pauseBtn");
    await expect(page.locator("#timerDisplay")).not.toContainText("-");
    await page.click("#pauseBtn");
    await page.waitForTimeout(400);
    await expect(page.locator("#timerDisplay")).not.toContainText("-");
    await page.locator("#saveRecordBtn").click();
    const [r] = await stored(page);
    expect(r.playtime).toBeGreaterThanOrEqual(0);
    await page.reload();
    expect(await stored(page)).toHaveLength(1);
  });

  test("records rejected at load are appended to the backup, not only the first time", async ({ browser }) => {
    const good = six[0];
    const context = await browser.newContext();
    const page = await context.newPage();
    await seed({ gameRecords: [good, { ...good, scenario: "Bad One" }] })(page);
    await page.goto("/");
    await page.evaluate((g) => localStorage.setItem("gameRecords", JSON.stringify([g, { ...g, scenario: "Bad Two" }])), good);
    await page.reload();
    const backup = await page.evaluate(() => JSON.parse(localStorage.getItem("gameRecordsBackup")));
    const scen = backup.map(r => r.scenario);
    expect(scen).toContain("Bad One");
    expect(scen).toContain("Bad Two");
    await context.close();
  });

  test("corrupt lastResult/lastDifficulty are ignored", async ({ page }) => {
    await seed({ lastResult: "Bogus", lastDifficulty: "Insane" })(page);
    await page.goto("/");
    await expect(page.locator("#result")).toHaveValue("Win");
    await expect(page.locator("#difficulty")).not.toHaveValue("");
  });

  for (const [name, raw] of [["empty list", "[]"], ["unknown ids", '["bogus"]'], ["legacy string", "series2"], ["JSON string", '"series1,series2"'], ["not JSON", "{oops"]]) {
    test(`enabledPacks ${name} falls back to a playable collection`, async ({ page }) => {
      await seed({ enabledPacks: raw })(page);
      await page.goto("/");
      expect(await page.locator("#manualChar1 option").count()).toBeGreaterThan(1);
      await page.getByRole("button", { name: /Randomize Combination/i }).click();
      await expect(page.locator("#comboHeading")).toContainText("Current mission");
      expect(await page.evaluate(() => currentCombination.characters.every(Boolean))).toBe(true);
    });
  }
});

test.describe("import merge (M5)", () => {
  test("dedupes by id and content, applies newer edits, and keeps differing copies instead of dropping them", async ({ page }) => {
    const A = { characters: ["Bood", "Saaze"], scenario: "Escape The Brig!", result: "Win", difficulty: "Easy", playtime: 60, timestamp: "1/1/2026, 1:00:00 PM" };
    const B = { ...A, timestamp: "1/2/2026, 1:00:00 PM" };
    const C = { id: "c-1", createdAt: "2026-01-03T12:00:00.000Z", ...A, timestamp: "1/3/2026, 1:00:00 PM" };
    await seed({ gameRecords: [A, C] })(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "Mission Log" }).click();
    const file = [
      A,                                                    // identical, no id → duplicate
      { ...A, result: "Loss", notes: "edited elsewhere" },  // same old key, different content → kept too
      B, B,                                                 // new, twice in the file → added once
      { ...C, result: "Loss", updatedAt: "2026-02-01T00:00:00.000Z" }, // same id, newer edit → applied
    ];
    await page.locator("#importFile").setInputFiles({ name: "r.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(file)) });
    await page.click("#importMerge");
    await expect(page.locator(".toast")).toContainText("Added 2 new records");
    await expect(page.locator(".toast")).toContainText("1 updated");
    const recs = await stored(page);
    expect(recs).toHaveLength(4);
    expect(recs.some(r => r.notes === "edited elsewhere")).toBe(true);
    expect(recs.filter(r => r.timestamp === B.timestamp)).toHaveLength(1);
    expect(recs.find(r => r.id === "c-1").result).toBe("Loss");
    expect(new Set(recs.map(r => r.id)).size).toBe(4);
    // Importing the same file again adds nothing.
    await page.locator("#importFile").setInputFiles({ name: "r.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(file)) });
    await page.click("#importMerge");
    await expect(page.locator(".toast")).toContainText("Added 0 new records");
    expect(await stored(page)).toHaveLength(4);
  });

  test("an older copy of an edited record does not overwrite the edit", async ({ page }) => {
    const C = { id: "c-1", createdAt: "2026-01-03T12:00:00.000Z", updatedAt: "2026-03-01T00:00:00.000Z", characters: ["Bood", "Saaze"], scenario: "Escape The Brig!", result: "Loss", difficulty: "Easy", timestamp: "1/3/2026, 1:00:00 PM" };
    await seed({ gameRecords: [C] })(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "Mission Log" }).click();
    const old = { ...C, result: "Win" }; delete old.updatedAt;
    await page.locator("#importFile").setInputFiles({ name: "r.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify([old])) });
    await page.click("#importMerge");
    const recs = await stored(page);
    expect(recs).toHaveLength(1);
    expect(recs[0].result).toBe("Loss");
  });
});

test.describe("loadCombination (M7)", () => {
  test("selectors show exactly the loaded mission and a lock it doesn't match is released", async ({ page }) => {
    await seed({})(page);
    await page.goto("/");
    await page.selectOption("#manualChar1", "Bood");
    await page.click("#lockChar1");
    await expect(page.locator("#lockChar1")).toHaveAttribute("aria-pressed", "true");
    // A mission with the locked character as Secondary (e.g. from the unplayed list).
    await page.evaluate(() => loadCombination({ characters: ["Saaze", "Bood"], scenario: "Rule The World!" }));
    await expect(page.locator("#manualChar1")).toHaveValue("Saaze");
    await expect(page.locator("#manualChar2")).toHaveValue("Bood");
    await expect(page.locator("#manualScenario")).toHaveValue("Rule The World!");
    await expect(page.locator("#lockChar1")).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator(".toast")).toContainText("lock released");
  });
});

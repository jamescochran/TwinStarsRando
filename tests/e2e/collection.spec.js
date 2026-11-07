import { test, expect } from "@playwright/test";
import fs from "fs";

// Collection by item (T1.4 / R7), stats scope (logic audit M6) and the Collection Shelf.
// Seeds are written once per context so a reload sees what the app persisted.
function seed(values = {}) {
  return async (page) => {
    await page.route("https://umami.1jc.in/**", r => r.abort());
    await page.addInitScript((v) => {
      window.__events = [];
      window.umami = { track: (name, data) => { window.__events.push([name, data]); } };
      if (localStorage.getItem("__seeded")) return;
      localStorage.setItem("__seeded", "1");
      localStorage.setItem("hasSeenTip", "1");
      localStorage.setItem("seenPrimarySecondaryNotice", "1");
      for (const [k, val] of Object.entries(v)) localStorage.setItem(k, typeof val === "string" ? val : JSON.stringify(val));
    }, values);
  };
}

const REC = {
  characters: ["Bood", "Stag Solar"], scenario: "Escape The Brig!", result: "Win",
  difficulty: "Easy", playtime: 60, timestamp: "1/1/2026, 1:00:00 PM",
};
const pools = (page) => page.evaluate(() => ({ characters: [...characters], scenarios: [...scenarios], droids: [...droids] }));

async function openCollection(page) {
  await page.locator("#settingsBtn").click();
  await expect(page.locator("#settingsModal")).toHaveClass(/open/);
}
async function applyPreset(page, label, mode = "replace") {
  await page.locator(mode === "add" ? "#presetModeAdd" : "#presetModeReplace").check();
  await page.locator("#collectionPreset").selectOption({ label });
  await page.locator("#collectionPresetApply").click();
}
async function done(page) {
  await page.locator("#settingsClose").click();
  await expect(page.locator("#settingsModal")).not.toHaveClass(/open/);
}

test.describe("ownership by item", () => {
  test("unticking single items constrains 200 randomizer draws, droid picks and the manual selectors", async ({ page }) => {
    await seed({ enabledPacks: ["series1", "droids1"] })(page);
    await page.goto("/");
    await openCollection(page);
    await page.locator("#packExpand-series1").click();
    await expect(page.locator("#packItems-series1")).toBeVisible();
    // Keep 2 scenarios and 3 characters of Series 1.
    for (const s of ["Rule The World!", "Stop The Virus!", "Hunt The Bounty!", "Steal The Plans!"]) {
      await page.getByRole("checkbox", { name: s }).uncheck();
    }
    for (const c of ["Fanoobia", "Inpon Gol", "Grant Rockgardner", "Roux Jaezmina", "Yanfred Jima", "Saaze", "Inzill Mey", "Strezelsior", "Kinglan"]) {
      await page.getByRole("checkbox", { name: c, exact: true }).uncheck();
    }
    await page.locator("#packExpand-droids1").click();
    await page.getByRole("checkbox", { name: "MC-CY", exact: true }).uncheck();
    await expect(page.locator("#pack-series1")).toHaveJSProperty("indeterminate", true);
    await expect(page.locator("#packCount-series1")).toHaveText("5 of 18 owned");
    await done(page);
    await expect(page.locator("#activePacksLabel")).toContainText("Series 1 (5 of 18)");

    const owned = { characters: ["Bood", "Stag Solar", "Brenimov-X"], scenarios: ["Escape The Brig!", "Confine The Quarks!"], droids: ["C.R.A.N.K.", "Domino 2-5"] };
    expect(await pools(page)).toEqual(owned);
    const draws = await page.evaluate(() => {
      const out = [];
      for (let i = 0; i < 200; i++) { doGenerate(); out.push(currentCombination); }
      return out;
    });
    const seen = new Set();
    for (const d of draws) {
      for (const c of d.characters) { expect(owned.characters).toContain(c); seen.add(c); }
      expect(owned.scenarios).toContain(d.scenario);
      seen.add(d.scenario);
    }
    expect(seen.size).toBe(5); // every owned item is reachable
    const droidsDrawn = new Set();
    for (let i = 0; i < 30; i++) {
      await page.locator("#droidRandBtn").click();
      droidsDrawn.add(await page.locator("#droidSelect").inputValue());
    }
    expect([...droidsDrawn].sort()).toEqual(["C.R.A.N.K.", "Domino 2-5"]);
    const opts = (id) => page.locator(`#${id} option`).evaluateAll(os => os.map(o => o.value).filter(Boolean));
    expect((await opts("manualChar1")).sort()).toEqual([...owned.characters].sort());
    expect((await opts("manualScenario")).sort()).toEqual([...owned.scenarios].sort());
  });

  test("unplayed combinations list only owned items and count both ways", async ({ page }) => {
    await seed({ enabledPacks: ["series1"] })(page);
    await page.goto("/");
    await openCollection(page);
    await applyPreset(page, "Free print-and-play: Escape the Brig");
    await done(page);
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await expect(page.locator("#unplayedContainer .panel-intro")).toContainText("0 of 2 combinations played");
    await expect(page.locator("#unplayedContainer")).toContainText("As printed on the box (either order): 0 of 1");
    await expect(page.locator("#unplayedGrid .unplayed-item")).toHaveCount(2);
    await expect(page.locator("#unplayedGrid")).toContainText("Inzill Mey & Strezelsior");
  });

  test("free print-and-play presets, the wallet pick and Add mode", async ({ page }) => {
    await seed({ enabledPacks: ["series1", "series2"] })(page);
    await page.goto("/");
    await openCollection(page);
    await applyPreset(page, "Free print-and-play: Escape the Brig");
    await expect(page.locator("#collectionStatus")).toContainText("1 scenario, 2 characters");
    expect(await page.evaluate(() => [...ownedItems].sort())).toEqual(["c:Inzill Mey", "c:Strezelsior", "s:Escape The Brig!"]);
    await expect(page.locator("#pack-series2")).not.toBeChecked();

    await applyPreset(page, "Free print-and-play: Master the Trials", "add");
    await expect(page.locator("#collectionStatus")).toContainText("2 scenarios, 4 characters");

    // Single scenario wallet: Sc.04 plus the two characters the player picks, added.
    await page.locator("#walletScenario").selectOption({ label: "04 Stop The Virus!" });
    await page.locator("#walletChar1").selectOption("Saaze");
    await page.locator("#walletChar2").selectOption("Saaze");
    await page.locator("#walletApply").click();
    await expect(page.locator("#settingsWarning")).toContainText("two different characters");
    await page.locator("#walletChar2").selectOption("Kinglan");
    await page.locator("#walletApply").click();
    await done(page);
    expect(await pools(page)).toEqual({
      characters: ["Saaze", "Inzill Mey", "Strezelsior", "Kinglan", "Dain Taubo", "Grulexon"],
      scenarios: ["Escape The Brig!", "Stop The Virus!", "Master the Trials!"],
      droids: [],
    });
    // Replace mode with a wallet leaves exactly that wallet.
    await openCollection(page);
    await page.locator("#presetModeReplace").check();
    await page.locator("#walletScenario").selectOption({ label: "07 Master the Trials!" });
    await page.locator("#walletChar1").selectOption("Smiff");
    await page.locator("#walletChar2").selectOption("Zoaze");
    await page.locator("#walletApply").click();
    await done(page);
    expect(await pools(page)).toEqual({ characters: ["Smiff", "Zoaze"], scenarios: ["Master the Trials!"], droids: [] });
  });

  test("an item collection survives a reload and keeps writing enabledPacks for older versions", async ({ page }) => {
    await seed({ enabledPacks: ["series1", "series2"] })(page);
    await page.goto("/");
    await openCollection(page);
    await applyPreset(page, "Both free print-and-play starters");
    await done(page);
    const stored = await page.evaluate(() => ({ items: JSON.parse(localStorage.getItem("ownedItems")), packs: JSON.parse(localStorage.getItem("enabledPacks")) }));
    expect(stored.packs.sort()).toEqual(["series1", "series2"]);
    expect(stored.items.v).toBe(1);
    expect(stored.items.items).toHaveLength(6);
    await page.reload();
    expect(await pools(page)).toEqual({
      characters: ["Inzill Mey", "Strezelsior", "Dain Taubo", "Grulexon"],
      scenarios: ["Escape The Brig!", "Master the Trials!"],
      droids: [],
    });
    await expect(page.locator("#activePacksLabel")).toContainText("Series 1 (3 of 18) · Series 2 (3 of 18)");
  });

  test("the minimum (2 characters and 1 scenario) is guarded with a clear message", async ({ page }) => {
    await seed({})(page);
    await page.goto("/");
    await openCollection(page);
    await applyPreset(page, "Free print-and-play: Escape the Brig");
    await page.locator("#packExpand-series1").click();
    const inzill = page.getByRole("checkbox", { name: "Inzill Mey", exact: true });
    await inzill.uncheck({ force: true }).catch(() => {});
    await expect(page.locator("#settingsWarning")).toHaveText(/at least 2 characters and 1 scenario/);
    await expect(inzill).toBeChecked();
    await page.getByRole("checkbox", { name: /01 Escape The Brig!/ }).click();
    await expect(page.getByRole("checkbox", { name: /01 Escape The Brig!/ })).toBeChecked();
    await page.locator("#pack-series1").click(); // indeterminate -> tick all: always allowed
    await expect(page.locator("#settingsWarning")).toHaveText("");
    await page.locator("#pack-series1").click(); // untick the only pack: refused
    await expect(page.locator("#settingsWarning")).toHaveText(/at least 2 characters and 1 scenario/);
    await expect(page.locator("#pack-series1")).toBeChecked();
    await done(page);
    expect((await pools(page)).characters).toHaveLength(12);
  });

  test("SYZYGY needs every scenario of a series owned", async ({ page }) => {
    await seed({ enabledPacks: ["series1", "series2"] })(page);
    await page.goto("/");
    await openCollection(page);
    await page.locator("#packExpand-series1").click();
    await page.getByRole("checkbox", { name: /06 Hunt The Bounty!/ }).uncheck();
    await done(page);
    await page.getByRole("tab", { name: "SYZYGY" }).click();
    await expect(page.locator("#szSel1")).toHaveAttribute("aria-disabled", "true");
    await expect(page.locator("#szSel1")).toContainText("all 6 of its scenarios");
    await expect(page.locator("#szSel2")).toHaveAttribute("aria-disabled", "false");
    await page.locator("#szSel2").click();
    await expect(page.locator("#szSetS1")).toHaveCount(0); // Series 1 is incomplete: no set choice
  });
});

test.describe("migration from enabledPacks", () => {
  const cases = [
    ["JSON array", ["series2", "captaincrag"], 13, 6],
    ["legacy comma string", "series1,scenario13", 14, 7],
    ["legacy plain string", "series2", 12, 6],
    ["JSON-encoded string", '"series1,series2"', 24, 12],
    ["unknown ids", '["bogus"]', 12, 6],
    ["corrupt", "{oops", 12, 6],
  ];
  for (const [name, raw, nChars, nScens] of cases) {
    test(`${name} becomes owned items`, async ({ page }) => {
      await seed({ enabledPacks: raw })(page);
      await page.goto("/");
      const p = await pools(page);
      expect(p.characters).toHaveLength(nChars);
      expect(p.scenarios).toHaveLength(nScens);
    });
  }

  test("an older version rewriting enabledPacks wins over stale items", async ({ page }) => {
    // ownedItems saved for ["series1"], then an older app version (or another tab) set series2 only.
    const items = { v: 1, items: ["s:Escape The Brig!", "c:Inzill Mey", "c:Strezelsior"], packs: "series1" };
    await seed({ ownedItems: items, enabledPacks: ["series2"] })(page);
    await page.goto("/");
    const p = await pools(page);
    expect(p.characters).toHaveLength(12);
    expect(p.characters).toContain("Smiff");
  });

  test("valid items with a matching enabledPacks are kept; corrupt items fall back to the packs", async ({ page }) => {
    const items = { v: 1, items: ["s:Escape The Brig!", "c:Inzill Mey", "c:Strezelsior", "c:Nobody"], packs: "series1" };
    await seed({ ownedItems: items, enabledPacks: ["series1"] })(page);
    await page.goto("/");
    expect((await pools(page)).characters).toEqual(["Inzill Mey", "Strezelsior"]);
    await page.evaluate(() => localStorage.setItem("ownedItems", "{not json"));
    await page.reload();
    expect((await pools(page)).characters).toHaveLength(12);
    await page.evaluate(() => localStorage.setItem("ownedItems", JSON.stringify({ v: 1, items: ["c:Bood"], packs: "series1" })));
    await page.reload();
    expect((await pools(page)).characters).toHaveLength(12); // unplayable -> packs
  });
});

test.describe("cross-tab sync", () => {
  test("an item change in one tab reaches the other", async ({ context }) => {
    await seed({ enabledPacks: ["series1"] })(context);
    const a = await context.newPage();
    await a.goto("/");
    const b = await context.newPage();
    await b.goto("/");
    await openCollection(a);
    await applyPreset(a, "Free print-and-play: Escape the Brig");
    await done(a);
    await expect(b.locator("#activePacksLabel")).toContainText("Series 1 (3 of 18)");
    expect(await pools(b)).toEqual({ characters: ["Inzill Mey", "Strezelsior"], scenarios: ["Escape The Brig!"], droids: [] });
  });
});

test.describe("stats scope (M6)", () => {
  const recs = [
    REC,
    { ...REC, characters: ["Smiff", "Zoaze"], scenario: "Master the Trials!", result: "Loss", timestamp: "1/2/2026, 1:00:00 PM" },
    { ...REC, characters: ["Stag Solar", "Bood"], timestamp: "1/3/2026, 1:00:00 PM", droid: "C.R.A.N.K." },
  ];

  test("defaults to Your collection, shows counts beside percentages, and toggles to All logged games", async ({ page }) => {
    await seed({ gameRecords: recs, enabledPacks: ["series1"] })(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "Mission Log" }).click();
    const stats = page.locator("#statsContent");
    await expect(page.locator("#statsScopeCollection")).toHaveAttribute("aria-pressed", "true");
    // The droid game uses an unowned droid, so it is outside the collection.
    await expect(page.locator("#statsScopeNote")).toContainText("1 of 3 logged games use only items you own");
    const card = (label) => stats.locator(".stats-summary-card", { has: page.getByText(label, { exact: true }) });
    await expect(card("Games").locator(".stats-summary-value")).toHaveText("1");
    await expect(card("Win Rate")).toContainText("1 of 1 won");
    await expect(card("Combos Played").locator(".stats-summary-value")).toHaveText("1 of 792");
    await expect(card("Combos Played")).toContainText("<1%");
    await expect(card("Combos Played")).not.toContainText(/(^|\D)0%/);
    await expect(stats).toContainText("1 of 792 ordered combinations");
    await expect(stats).toContainText("1 of 396 unordered combinations");
    await expect(stats).not.toContainText("Droid Coverage");

    await page.locator("#statsScopeAll").click();
    await expect(page.locator("#statsScopeAll")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#statsScopeAll")).toBeFocused();
    await expect(page.locator("#statsScopeNote")).toContainText("all 3 logged games");
    await expect(card("Games").locator(".stats-summary-value")).toHaveText("3");
    await expect(card("Win Rate")).toContainText("2 of 3 won");
    // Everything published: 29 characters, 14 scenarios.
    await expect(card("Combos Played").locator(".stats-summary-value")).toHaveText("3 of 11368");
    await expect(stats).toContainText("2 of 5684 unordered combinations");
    await expect(stats).toContainText("Droid Coverage");
    await expect(card("Droid Games")).toContainText("1 of 3 games");

    await page.reload();
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await expect(page.locator("#statsScopeAll")).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("Collection Shelf", () => {
  test("lists every published item with how it was released, ownership and only official links", async ({ page }) => {
    await seed({ enabledPacks: ["series1"] })(page);
    await page.goto("/");
    await openCollection(page);
    await applyPreset(page, "Free print-and-play: Master the Trials");
    const toggle = page.locator("#shelfToggle");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const shelf = page.locator("#collectionShelf");
    await expect(shelf).toBeVisible();
    await expect(shelf.locator(".shelf-item")).toHaveCount(21);
    for (const kind of ["Wallet", "Kickstarter stretch goal", "ShyCon exclusive", "Free print-and-play", "Booklet"]) {
      await expect(shelf.locator(".shelf-kind", { hasText: kind }).first()).toBeVisible();
    }
    const item = (name) => shelf.locator(".shelf-item", { has: page.locator(".shelf-name", { hasText: name }) });
    await expect(item("Free print-and-play: Master the Trials").locator(".shelf-status")).toHaveText("Owned");
    await expect(item("Series II wallet").locator(".shelf-status")).toHaveText("Partly owned: 3 of 18");
    await expect(item("Series I wallet").locator(".shelf-status")).toHaveText("Not owned");
    await expect(item("Scenario 13: Topple the Giant!")).toContainText("ShyCon");
    for (const n of ["Moonset #1", "Moonset #2", "Moonset #3"]) {
      await expect(item(n).locator(".shelf-status")).toHaveText("Not supported (different rules)");
    }
    const hrefs = await shelf.locator("a").evaluateAll(as => as.map(a => [a.href, a.target, a.rel]));
    expect(hrefs.length).toBe(22);
    for (const [href, target, rel] of hrefs) {
      expect(href === "https://buttonshygames.com/pages/twin-stars" || /^https:\/\/boardgamegeek\.com\/boardgame\/\d+\/[a-z0-9-]+$/.test(href), href).toBe(true);
      expect(target).toBe("_blank");
      expect(rel).toContain("noopener");
    }
    // Shelf changes feed back into the dialog without a reload.
    await item("SYZYGY Mode booklet").getByRole("checkbox", { name: "I own this booklet" }).check();
    await expect(item("SYZYGY Mode booklet").locator(".shelf-status")).toHaveText("Owned");
    await page.locator("#pack-series1").check();
    await expect(item("Series I wallet").locator(".shelf-status")).toHaveText("Owned");
    await done(page);
    expect(await page.evaluate(() => ownedItems.has("b:syzygy1"))).toBe(true);
  });

  test("shelf_open and collection_change are tracked with counts only", async ({ page }) => {
    await seed({})(page);
    await page.goto("/");
    await openCollection(page);
    await page.locator("#shelfToggle").click();
    await applyPreset(page, "Free print-and-play: Escape the Brig");
    await done(page);
    const ev = await page.evaluate(() => window.__events);
    expect(ev.filter(e => e[0] === "shelf_open")).toEqual([["shelf_open", {}]]);
    expect(ev.filter(e => e[0] === "collection_change")).toEqual([["collection_change", { items: 3 }]]);
    // Closing without a change sends nothing.
    await openCollection(page);
    await done(page);
    expect((await page.evaluate(() => window.__events)).filter(e => e[0] === "collection_change")).toHaveLength(1);
  });

  test("keyboard: expand a pack, toggle an item, open the shelf, all without a mouse", async ({ page }) => {
    await seed({})(page);
    await page.goto("/");
    await openCollection(page);
    await expect(page.locator("#pack-series1")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator("#packExpand-series1")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#packExpand-series1")).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("checkbox", { name: /01 Escape The Brig!/ })).toBeFocused();
    await page.keyboard.press("Space");
    await expect(page.getByRole("checkbox", { name: /01 Escape The Brig!/ })).not.toBeChecked();
    await expect(page.locator("#packCount-series1")).toHaveText("17 of 18 owned");
    await page.locator("#shelfToggle").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#collectionShelf")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#settingsModal")).not.toHaveClass(/open/);
    expect((await pools(page)).scenarios).not.toContain("Escape The Brig!");
  });

  const AXE = process.env.AXE_CORE_PATH;
  for (const theme of ["dark", "light"]) {
    test(`My Collection with items, presets and shelf has no axe violations (${theme})`, async ({ browser }) => {
      test.skip(!AXE || !fs.existsSync(AXE), "set AXE_CORE_PATH to axe.min.js to run");
      const context = await browser.newContext({ bypassCSP: true });
      const page = await context.newPage();
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await seed({ gameRecords: [REC] })(page);
      await page.goto("/");
      await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
      await openCollection(page);
      await page.locator("#packExpand-series1").click();
      await page.locator("#shelfToggle").click();
      await page.waitForTimeout(300);
      await page.addScriptTag({ path: AXE });
      const res = await page.evaluate(() => axe.run("#settingsModal", { resultTypes: ["violations"] }));
      expect(res.violations.map(v => `${v.id}: ${v.nodes.slice(0, 3).map(n => n.target.join(" ")).join(", ")}`)).toEqual([]);
      await done(page);
      await page.getByRole("tab", { name: "Mission Log" }).click();
      const res2 = await page.evaluate(() => axe.run("#statsPanel", { resultTypes: ["violations"] }));
      expect(res2.violations.map(v => `${v.id}: ${v.nodes.slice(0, 3).map(n => n.target.join(" ")).join(", ")}`)).toEqual([]);
      await context.close();
    });
  }
});

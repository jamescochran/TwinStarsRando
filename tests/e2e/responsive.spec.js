import { test, expect } from "@playwright/test";

// Responsive layout regressions: no horizontal overflow on any tab at phone and desktop
// widths, data tables become cards on phones, dialogs stay reachable on short screens,
// and frequent touch targets are at least 44px on phones.

const S1 = ["Bood", "Stag Solar", "Fanoobia", "Inpon Gol", "Grant Rockgardner", "Roux Jaezmina",
  "Yanfred Jima", "Saaze", "Inzill Mey", "Strezelsior", "Kinglan", "Brenimov-X"];
const SCEN = ["Escape The Brig!", "Rule The World!", "Stop The Virus!", "Hunt The Bounty!", "Steal The Plans!", "Confine The Quarks!"];

function records(n = 32) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({
      characters: [S1[i % 12], S1[(i + 5) % 12]],
      scenario: SCEN[i % 6],
      result: i % 3 ? "Win" : "Loss",
      difficulty: ["Easy", "Medium", "Hard"][i % 3],
      timestamp: `${(i % 12) + 1}/${(i % 27) + 1}/2026, 10:${String(i % 60).padStart(2, "0")}:00 PM`,
      playtime: 600 + i * 41,
      ...(i % 4 === 0 ? { notes: "Close game — used the advanced variant and barely survived the final round." } : {}),
      ...(i % 3 === 0 ? { droid: "MC-CY" } : {}),
    });
  }
  return out;
}

const SZ_DONE = {
  mode: "syzygy1", characters: ["Grant Rockgardner", "Roux Jaezmina", "Brenimov-X"], removed: [false, false, false],
  stage: 3, branchChosen: 0, scenarios: ["Confine The Quarks!", "Escape The Brig!", "Steal The Plans!", "Hunt The Bounty!"],
  carryover: [{ energy: 0, health: 0 }, { energy: 0, health: 0 }, { energy: 0, health: 0 }], alloc: null,
  stageResults: [
    { stage: 0, scenario: "Confine The Quarks!", chars: [1, 2], result: "Win", ts: "x" },
    { stage: 1, scenario: "Escape The Brig!", chars: [0, 2], result: "Win", ts: "x" },
    { stage: 2, scenario: "Hunt The Bounty!", chars: [0, 1], result: "Win", ts: "x" },
  ],
  losses: 0, retrying: false, started: "x", completed: true, finalRank: { rank: "LEGENDS", desc: "There's apparently a song." },
};

async function seed(page, extra = {}) {
  await page.addInitScript(({ recs, extra }) => {
    if (sessionStorage.getItem("__seeded")) return;
    sessionStorage.setItem("__seeded", "1");
    localStorage.clear();
    localStorage.setItem("hasSeenTip", "1");
    localStorage.setItem("seenPrimarySecondaryNotice", "1");
    localStorage.setItem("enabledPacks", JSON.stringify(["series1", "series2", "droids1"]));
    localStorage.setItem("gameRecords", JSON.stringify(recs));
    for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, JSON.stringify(v));
  }, { recs: records(), extra });
}

// Page-level overflow plus any visible element sticking out of the viewport that is not
// inside its own horizontal scroll container.
async function overflow(page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const bad = [];
    const clipped = (el) => {
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const s = getComputedStyle(a);
        if (/(auto|scroll|hidden)/.test(s.overflowX) && a.scrollWidth > a.clientWidth + 1) return true;
      }
      return false;
    };
    document.querySelectorAll("body *").forEach((el) => {
      if (el.closest(".modal-overlay:not(.open), .sr-only, thead") || el.id === "importFile") return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if ((r.right > vw + 1 || r.left < -1) && !clipped(el)) bad.push(`${el.tagName}.${el.className} [${Math.round(r.left)}..${Math.round(r.right)}]`);
    });
    return { scrollWidth: document.documentElement.scrollWidth, vw, bad: bad.slice(0, 5) };
  });
}

async function openTab(page, name) {
  await page.getByRole("tab", { name }).click();
  await page.waitForTimeout(100);
}

for (const width of [360, 1440]) {
  test.describe(`no horizontal overflow at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("randomizer with a loaded mission and its history", async ({ page }) => {
      await seed(page);
      await page.goto("/");
      await page.locator("#manualChar1").selectOption("Bood");
      await page.locator("#manualChar2").selectOption("Roux Jaezmina");
      await page.locator("#manualScenario").selectOption("Escape The Brig!");
      await page.locator("#loadManualCombo").click();
      await expect(page.locator("#comboHistory table")).toBeVisible();
      const o = await overflow(page);
      expect(o.scrollWidth).toBeLessThanOrEqual(o.vw);
      expect(o.bad).toEqual([]);
      // The per-combination history must not need sideways scrolling to reach Delete.
      const wrap = page.locator("#comboHistory .history-table-wrap");
      expect(await wrap.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    });

    test("mission log, stats and unplayed list", async ({ page }) => {
      await seed(page);
      await page.goto("/");
      await openTab(page, "Mission Log");
      await expect(page.locator("#historyTableContainer tbody tr").first()).toBeVisible();
      const o = await overflow(page);
      expect(o.scrollWidth).toBeLessThanOrEqual(o.vw);
      expect(o.bad).toEqual([]);
      const wrap = page.locator("#historyTableContainer .history-table-wrap");
      expect(await wrap.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
      // Every record keeps its edit and delete actions on screen.
      const del = page.locator("#historyTableContainer .btn-delete-record").first();
      const box = await del.boundingBox();
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    });

    test("SYZYGY setup", async ({ page }) => {
      await seed(page);
      await page.goto("/");
      await openTab(page, "SYZYGY");
      await page.locator("#szSel1").click();
      await page.locator(".syzygy-char-btn").first().click();
      const o = await overflow(page);
      expect(o.scrollWidth).toBeLessThanOrEqual(o.vw);
      expect(o.bad).toEqual([]);
    });

    test("SYZYGY completed campaign log", async ({ page }) => {
      await seed(page, { syzygyCampaign: SZ_DONE });
      await page.goto("/");
      await openTab(page, "SYZYGY");
      await expect(page.locator("#syzygyCampaignContent table")).toBeVisible();
      const o = await overflow(page);
      expect(o.scrollWidth).toBeLessThanOrEqual(o.vw);
      expect(o.bad).toEqual([]);
      const wrap = page.locator("#syzygyCampaignContent .history-table-wrap");
      expect(await wrap.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    });
  });
}

test.describe("phone layout", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("Mission Log rows are stacked cards with 44px edit/delete targets", async ({ page }) => {
    await seed(page);
    await page.goto("/");
    await openTab(page, "Mission Log");
    const row = page.locator("#historyTableContainer tbody tr:not(.notes-row)").first();
    await expect(row).toHaveCSS("display", "grid");
    for (const sel of [".btn-edit-record", ".btn-delete-record"]) {
      const b = await row.locator(sel).boundingBox();
      expect(b.width).toBeGreaterThanOrEqual(44);
      expect(b.height).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe("short landscape screen", () => {
  test.use({ viewport: { width: 667, height: 375 } });

  test("My Collection dialog fits the screen and its Done button is reachable", async ({ page }) => {
    await seed(page);
    await page.goto("/");
    await page.locator("#settingsBtn").click();
    const box = page.locator("#settingsModal [role=dialog]");
    await expect(box).toBeVisible();
    const r = await box.boundingBox();
    expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.y + r.height).toBeLessThanOrEqual(375);
    await expect(page.locator("#settingsModalTitle")).toBeInViewport();
    await expect(page.locator("#settingsClose")).toBeInViewport();
    await page.locator("#settingsClose").click();
    await expect(page.locator("#settingsModal")).not.toHaveClass(/open/);
  });

  test("header is compact so the tabs are on the first screen", async ({ page }) => {
    await seed(page);
    await page.goto("/");
    await expect(page.locator(".tab-nav")).toBeInViewport();
    await expect(page.locator("#generateBtn")).toBeInViewport();
  });
});

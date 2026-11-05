import { test, expect } from "@playwright/test";

// Visual-consistency regressions found in the post-merge QA pass: form controls use the
// design-system fonts, controls are >= 16px on touch layouts (iOS zoom), every
// non-destructive dialog has the same header close control, rulebook tabs stay on one
// row, and SYZYGY steppers are full touch size on phones.

const SZ_ACTIVE = {
  mode: "syzygy1", characters: ["Grant Rockgardner", "Roux Jaezmina", "Brenimov-X"], removed: [false, false, false],
  stage: 0, branchChosen: null, scenarios: ["Confine The Quarks!", "Escape The Brig!", "Steal The Plans!", "Hunt The Bounty!"],
  carryover: [{ energy: 1, health: 2 }, { energy: 0, health: 0 }, { energy: 2, health: 1 }],
  alloc: { chars: [{ energy: 1, health: 1 }, { energy: 0, health: 2 }] }, stageResults: [], losses: 0,
  retrying: false, started: "x", completed: false, finalRank: null,
};

async function seed(page, extra = {}) {
  await page.addInitScript((extra) => {
    if (sessionStorage.getItem("__seeded")) return;
    sessionStorage.setItem("__seeded", "1");
    localStorage.clear();
    localStorage.setItem("hasSeenTip", "1");
    localStorage.setItem("seenPrimarySecondaryNotice", "1");
    localStorage.setItem("enabledPacks", JSON.stringify(["series1", "series2", "droids1"]));
    for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, JSON.stringify(v));
  }, extra);
}

async function loadMission(page) {
  await page.selectOption("#manualChar1", "Bood");
  await page.selectOption("#manualChar2", "Stag Solar");
  await page.click("#loadManualCombo");
}

test("buttons and form controls use the design-system fonts, not the UA default", async ({ page }) => {
  await seed(page, { syzygyCampaign: SZ_ACTIVE });
  await page.goto("/");
  await loadMission(page);
  const bad = async () => page.evaluate(() => [...document.querySelectorAll("button, select, textarea, input:not([type=file])")]
    .filter(el => el.getBoundingClientRect().width > 0)
    .filter(el => !/Orbitron|Exo 2/.test(getComputedStyle(el).fontFamily))
    .map(el => el.id || el.className));
  expect(await bad()).toEqual([]);
  await page.click("#syzygyCampaignTab");
  expect(await bad()).toEqual([]);
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("selects and textareas are at least 16px so iOS does not zoom on focus", async ({ page }) => {
    await seed(page);
    await page.goto("/");
    await loadMission(page);
    await page.click("#historyTab");
    await page.click("#randomizerTab");
    const sizes = await page.evaluate(() => [...document.querySelectorAll("select, textarea")]
      .map(el => [el.id, parseFloat(getComputedStyle(el).fontSize)]));
    for (const [id, size] of sizes) expect(size, id).toBeGreaterThanOrEqual(16);
  });

  test("rulebook tabs stay on a single row", async ({ page }) => {
    await seed(page);
    await page.goto("/");
    await page.click("#rulesBtn");
    const tops = await page.locator(".rules-tab").evaluateAll(els => els.map(e => Math.round(e.getBoundingClientRect().top)));
    expect(tops.length).toBeGreaterThan(1);
    expect(new Set(tops).size).toBe(1);
  });

  test("SYZYGY resource and outcome steppers are 44px touch targets", async ({ page }) => {
    await seed(page, { syzygyCampaign: SZ_ACTIVE });
    await page.goto("/");
    await page.click("#syzygyCampaignTab");
    const sizes = await page.locator(".btn-sz-step").evaluateAll(els => els.map(e => {
      const r = e.getBoundingClientRect(); return Math.min(r.width, r.height);
    }));
    expect(sizes.length).toBeGreaterThan(8);
    for (const s of sizes) expect(s).toBeGreaterThanOrEqual(44);
  });
});

test("non-destructive dialogs share one header close control", async ({ page }) => {
  await seed(page);
  await page.goto("/");
  await loadMission(page);
  const dialogs = [
    ["#tipsTriggerBtn", "tipsModal", "#tipsModalClose"],
    ["#rulesBtn", "rulesModal", "#rulesClose"],
    ["#settingsBtn", "settingsModal", "#settingsDismiss"],
    ["#diceRollerBtn", "diceModal", "#diceModalClose"],
    ["#combinationDisplay .btn-faq-inline", "faqModal", "#faqClose"],
  ];
  for (const [opener, id, close] of dialogs) {
    await page.locator(opener).first().click();
    const overlay = page.locator("#" + id);
    await expect(overlay).toHaveClass(/open/);
    const btn = overlay.locator(".dialog-header .dialog-close");
    await expect(btn).toHaveCount(1);
    // Named after its dialog ("Close Rules FAQ"), so it is unambiguous out of context.
    await expect(btn).toHaveAttribute("aria-label", /^Close \S/);
    await expect(overlay.locator(close)).toHaveClass(/dialog-close/);
    await btn.click();
    await expect(overlay).not.toHaveClass(/open/);
  }
});

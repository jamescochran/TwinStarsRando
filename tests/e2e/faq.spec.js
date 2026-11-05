import { test, expect } from "@playwright/test";
import fs from "node:fs";

// Rules FAQ / Rules Oracle: anchors, search, mission view, designer-ruling fixes,
// JSON-LD and CSP.
const ALL_PACKS = ["series1", "series2", "scenario13", "scenario14", "captaincrag", "droids1", "droids2"];

async function boot(page, packs = ALL_PACKS) {
  await page.addInitScript((p) => {
    if (localStorage.getItem("__seeded")) return;
    localStorage.setItem("__seeded", "1");
    localStorage.setItem("hasSeenTip", "1");
    localStorage.setItem("seenPrimarySecondaryNotice", "1");
    localStorage.setItem("enabledPacks", JSON.stringify(p));
  }, packs);
  await page.goto("/");
}

async function loadMission(page, c1, c2, scenario) {
  await page.locator("#manualChar1").selectOption(c1);
  await page.locator("#manualChar2").selectOption(c2);
  await page.locator("#manualScenario").selectOption(scenario);
  await page.locator("#loadManualCombo").click();
  await expect(page.locator("#combinationDisplay .combo-display")).toBeVisible();
}

test("every character and scenario in CONTENT_PACKS has an FAQ anchor", async ({ page }) => {
  await boot(page);
  const missing = await page.evaluate(() => {
    const out = [];
    CONTENT_PACKS.forEach(p => p.characters.forEach(c => {
      const id = CHAR_FAQ_ANCHOR[c];
      if (!id || !document.getElementById(id)) out.push(c);
    }));
    CONTENT_PACKS.forEach(p => p.scenarios.forEach(s => {
      const n = SCENARIO_NUMBER[s];
      if (!n || !document.querySelector(`#faqModal #faq-sc-${n}`)) out.push(s);
    }));
    return out;
  });
  expect(missing).toEqual([]);
});

test("mission card has FAQ links for both characters and scenarios 13 and 14", async ({ page }) => {
  await boot(page);
  for (const [c1, c2, sc, n] of [["Feth Doriet", "Pummtoggs", "Topple the Giant!", "13"], ["Striker", "Captain Crag", "Save the Spacewhales!", "14"]]) {
    await loadMission(page, c1, c2, sc);
    await expect(page.locator("#combinationDisplay .btn-faq-inline")).toHaveCount(3);
    await expect(page.locator(`#combinationDisplay [data-faq-anchor="faq-sc-${n}"]`)).toHaveCount(1);
  }
  // Scenario 13 says plainly that nothing has been published.
  await expect(page.locator("#faqModal [data-faq-group='faq-sc-13'] .faq-none")).toContainText("No rulings");
});

test("search filters as you type, highlights, and announces the count", async ({ page }) => {
  await boot(page);
  await page.locator("#faqBtn").click();
  await expect(page.locator("#faqModal")).toHaveClass(/open/);
  const input = page.getByRole("searchbox", { name: "Search rulings" });
  await input.fill("Phaeton");
  const visible = page.locator("#faqAll details.faq-item:visible");
  await expect(visible).toHaveCount(1);
  await expect(visible.first().locator("summary mark").first()).toHaveText(/Phaeton/i);
  await expect(page.locator("#faqSearchStatus")).toHaveText("1 ruling matches.");
  // Multi-word queries AND their terms; the count follows.
  await input.fill("spacewhale");
  await expect(page.locator("#faqSearchStatus")).toHaveText(/^\d+ rulings? match/);
  // Hyphen-insensitive: "reroll" finds "re-roll".
  await input.fill("reroll bood");
  await expect(page.locator("#faqSearchStatus")).toHaveText(/^\d+ rulings? match/);
  // No results: message plus a spelling suggestion that runs the corrected search.
  await input.fill("Phaetn");
  await expect(page.locator("#faqSearchStatus")).toHaveText("No rulings match.");
  await expect(page.locator("#faqEmpty")).toBeVisible();
  await page.locator("#faqEmpty .faq-suggest").click();
  await expect(input).toHaveValue("phaeton");
  await expect(visible).toHaveCount(1);
  // Enter jumps to the first result; Escape in a filled box clears it without closing.
  await input.focus();
  await page.keyboard.press("Enter");
  await expect(visible.first().locator("summary")).toBeFocused();
  await input.focus();
  await page.keyboard.press("Escape");
  await expect(input).toHaveValue("");
  await expect(page.locator("#faqModal")).toHaveClass(/open/);
  expect(await page.locator("#faqAll details.faq-item:visible").count()).toBeGreaterThan(100);
});

test("with a mission loaded, the FAQ opens with that mission's rulings first", async ({ page }) => {
  await boot(page);
  await loadMission(page, "Bood", "Stag Solar", "Hunt The Bounty!");
  await page.locator('#combinationDisplay [data-faq-anchor="faq-sc-06"]').click();
  await expect(page.locator("#faqModal")).toHaveClass(/open/);
  const first = page.locator("#faqModal .faq-content .faq-section").first();
  await expect(first.locator("h3")).toHaveText("For this mission");
  const scenarioQs = await page.locator("#faqAll [data-faq-group='faq-sc-06'] summary").allTextContents();
  const missionQs  = await first.locator("details.faq-item summary").allTextContents();
  expect(scenarioQs.length).toBeGreaterThan(5);
  expect(missionQs.slice(0, scenarioQs.length)).toEqual(scenarioQs);
  // Then both characters' rulings, then general ones.
  const groups = await first.locator(".faq-group > h4").allTextContents();
  expect(groups).toEqual(["Scenario 06: Hunt the Bounty!", "Bood", "Stag Solar", "Most-asked general rules"]);
  expect(missionQs).toContain("Can Bood pay health instead of energy for the universal re-roll?");
  // The full FAQ still follows, with its anchors.
  await expect(page.locator("#faqAll #faq-char-bood")).toHaveCount(1);
});

test("conflicts are resolved per designer rulings", async ({ page }) => {
  await boot(page);
  const text = (sel) => page.locator(sel).evaluate(el => el.textContent.replace(/\s+/g, " "));
  // Hunt the Bounty: energy is a resource and can re-roll search dice.
  const bounty = await text("#faqAll [data-faq-group='faq-sc-06']");
  expect(bounty).toMatch(/re-roll search \(inquiry\) dice\? Can energy pay for it\? Yes\./);
  const general = await text("#faqAll");
  expect(general).not.toMatch(/search dice can only be re-rolled using resources rather than energy/);
  // Bood may pay health for the universal re-roll.
  expect(await text("#faqAll [data-faq-group='faq-char-bood']")).toMatch(/health instead of energy/);
  // Reduction/combo ordering is flagged Disputed with both rulings.
  const disputed = page.locator("#faqAll details.faq-item", { has: page.locator("summary", { hasText: "When exactly do you check for a combo?" }) });
  await expect(disputed.locator(".faq-badge")).toContainText("Disputed");
  await expect(disputed).toContainText("Rule the World (2017)");
  await expect(disputed).toContainText("Hunt the Bounty (2018)");
  // "Recommended With" errata.
  await expect(page.locator("#faqAll", { hasText: "Recommended With" })).toHaveCount(1);
});

test("every entry has a text authority badge and a BGG source link", async ({ page }) => {
  await boot(page);
  const bad = await page.evaluate(() => [...document.querySelectorAll("#faqAll details.faq-item")].filter(d => {
    const badge = d.querySelector(".faq-badge");
    const links = [...d.querySelectorAll(".faq-sources a")];
    return !badge || !badge.textContent.trim() || !links.length ||
      links.some(a => !/^https:\/\/boardgamegeek\.com\/thread\/\d+$/.test(a.href) || a.target !== "_blank" || !a.rel.includes("noopener"));
  }).map(d => d.querySelector("summary").textContent));
  expect(bad).toEqual([]);
});

test("FAQPage JSON-LD matches the visible entries and the page has no CSP violations", async ({ page }) => {
  const violations = [];
  page.on("console", m => { if (/Content.Security.Policy|CSP/i.test(m.text())) violations.push(m.text()); });
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener("securitypolicyviolation", e => window.__csp.push(e.violatedDirective + " " + e.blockedURI));
  });
  await boot(page);
  await page.locator("#faqBtn").click();
  await page.waitForTimeout(300);
  const { ld, qs } = await page.evaluate(() => ({
    ld: JSON.parse(document.getElementById("faqJsonLd").textContent),
    qs: [...document.querySelectorAll("#faqAll details.faq-item summary")].map(s => s.textContent.replace(/\s+/g, " ").trim()),
  }));
  expect(ld["@type"]).toBe("FAQPage");
  expect(ld.mainEntity.map(q => q.name)).toEqual(qs);
  expect(await page.evaluate(() => window.__csp)).toEqual([]);
  expect(violations).toEqual([]);
});

const AXE = process.env.AXE_CORE_PATH;
for (const theme of ["dark", "light"]) {
  test(`FAQ dialog has no axe violations (${theme} theme)`, async ({ browser }) => {
    test.skip(!AXE || !fs.existsSync(AXE), "set AXE_CORE_PATH to axe.min.js to run");
    const context = await browser.newContext({ bypassCSP: true });
    const page = await context.newPage();
    await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
    await boot(page);
    await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    await loadMission(page, "Bood", "Stag Solar", "Hunt The Bounty!");
    await page.locator('#combinationDisplay [data-faq-anchor="faq-sc-06"]').click();
    await page.locator("#faqModal details.faq-item").first().evaluate(d => { d.open = true; });
    await page.getByRole("searchbox", { name: "Search rulings" }).fill("energy");
    await page.waitForTimeout(500);
    await page.addScriptTag({ path: AXE });
    const res = await page.evaluate(() => axe.run("#faqModal", { resultTypes: ["violations"] }));
    const summary = res.violations.map(v => `${v.id}: ${v.nodes.slice(0, 3).map(n => n.target.join(" ")).join(", ")}`);
    expect(summary).toEqual([]);
    await context.close();
  });
}

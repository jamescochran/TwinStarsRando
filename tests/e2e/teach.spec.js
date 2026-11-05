import { test, expect } from "@playwright/test";
import fs from "fs";

// Teach Mode (first-run tutorial), the mission card's Setup checklist and the Dice
// Roller's turn-step rail (teach.js).

async function boot(page, storage = {}, { firstRun = false } = {}) {
  await page.route("https://umami.1jc.in/**", r => r.abort());
  await page.route(/somafm\.com/, r => r.abort());
  await page.addInitScript(({ v, firstRun }) => {
    window.__events = [];
    window.umami = { track: (name, data) => { window.__events.push([name, data]); } };
    if (sessionStorage.getItem("__seeded")) return;
    sessionStorage.setItem("__seeded", "1");
    localStorage.clear();
    if (!firstRun) localStorage.setItem("hasSeenTip", "1");
    localStorage.setItem("seenPrimarySecondaryNotice", "1");
    for (const [k, val] of Object.entries(v)) localStorage.setItem(k, typeof val === "string" ? val : JSON.stringify(val));
  }, { v: storage, firstRun });
  await page.goto("/");
}
const events = (page) => page.evaluate(() => window.__events.map(e => e[0]));
const teachState = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("tsr:teach") || "null"));

test.describe("Teach Mode", () => {
  test("offered from the first-run tip; walks through, resumes after closing, and finishes with Escape the Brig and owned characters", async ({ page }) => {
    await boot(page, { enabledPacks: ["series2", "series1"] }, { firstRun: true });
    await expect(page.locator("#onboardingTip")).toBeVisible();
    await page.getByRole("button", { name: "New to Twin Stars? Learn to play" }).click();
    const dlg = page.getByRole("dialog", { name: "Learn to play" });
    await expect(dlg).toBeVisible();
    await expect(page.locator("#onboardingTip")).toBeHidden();
    await expect(page.locator("#teachProgress")).toHaveText("Step 1 of 7");
    await expect(page.locator("#teachStepTitle")).toHaveText("What you need");
    await expect(page.locator("#teachStepTitle")).toBeFocused();
    await expect(page.locator("#teachBack")).toBeDisabled();
    // Illustrated with SVG die faces, no images.
    expect(await page.locator(".teach-art svg.tdie").count()).toBe(4);
    expect(await page.locator("#teachModal img").count()).toBe(0);

    await page.locator("#teachNext").click();
    await page.locator("#teachNext").click();
    await expect(page.locator("#teachProgress")).toHaveText("Step 3 of 7");
    expect(await teachState(page)).toEqual({ status: "started", step: 2 });
    expect((await events(page)).filter(e => e === "teach_start")).toHaveLength(1);

    // Close (Escape) pauses; a resume prompt appears on the Randomizer tab.
    await page.keyboard.press("Escape");
    await expect(dlg).toBeHidden();
    await expect(page.locator("#teachResume")).toContainText("step 3 of 7");

    // Survives a reload.
    await page.reload();
    await expect(page.locator("#teachResume")).toBeVisible();
    await page.getByRole("button", { name: "Resume" }).click();
    await expect(page.locator("#teachProgress")).toHaveText("Step 3 of 7");
    await expect(page.locator("#teachResume")).toHaveCount(0);

    // Keyboard through to the end.
    for (let i = 0; i < 4; i++) await page.locator("#teachNext").click();
    await expect(page.locator("#teachProgress")).toHaveText("Step 7 of 7");
    await expect(page.locator("#teachNext")).toHaveText("Finish");
    await expect(dlg.getByRole("link", { name: /Escape the Brig \(BoardGameGeek\)/ })).toHaveAttribute("href", /boardgamegeek\.com\/filepage\/171071\//);
    await expect(dlg.getByRole("link", { name: /Master the Trials \(BoardGameGeek\)/ })).toHaveAttribute("href", /boardgamegeek\.com\/filepage\/171067\//);
    await expect(dlg.getByRole("link", { name: /Escape the Brig/ })).toHaveAttribute("rel", /noopener/);
    await page.getByRole("button", { name: "Start your first mission" }).click();
    await expect(dlg).toBeHidden();

    await expect(page.locator("#comboHeading")).toHaveText(/Bood and Stag Solar, Scenario 01: Escape The Brig!/);
    await expect(page.locator("#difficulty")).toHaveValue("Easy");
    expect((await teachState(page)).status).toBe("done");
    const ev = await events(page);
    // Resuming is not a new start.
    expect(ev.filter(e => e === "teach_start")).toHaveLength(0);
    expect(ev.filter(e => e === "teach_complete")).toHaveLength(1);

    // Never offered again.
    await page.reload();
    await expect(page.locator("#teachResume")).toHaveCount(0);
    await expect(page.locator("#onboardingTip")).toBeHidden();
  });

  test("first mission uses characters the player owns (Series 2 only)", async ({ page }) => {
    await boot(page, { enabledPacks: ["series2"], "tsr:teach": { status: "started", step: 6 } });
    await page.getByRole("button", { name: "Resume" }).click();
    await expect(page.locator(".teach-note")).toContainText("isn't in your collection");
    await page.getByRole("button", { name: "Start your first mission" }).click();
    await expect(page.locator("#comboHeading")).toHaveText(/Dain Taubo and Grulexon, Scenario 01: Escape The Brig!/);
  });

  test("Skip tutorial dismisses it for good; Tips can still open it", async ({ page }) => {
    await boot(page);
    await page.locator("#tipsTriggerBtn").click();
    await page.getByRole("button", { name: /Learn to play/ }).click();
    await expect(page.locator("#tipsModal")).not.toHaveClass(/open/);
    await page.locator("#teachNext").click();
    await page.getByRole("button", { name: "Skip tutorial" }).click();
    await expect(page.locator("#teachModal")).not.toHaveClass(/open/);
    expect((await teachState(page)).status).toBe("dismissed");
    await expect(page.locator("#teachResume")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("#teachResume")).toHaveCount(0);
    // Re-opening from Tips starts at step 1 and does not re-arm prompts.
    await page.locator("#tipsTriggerBtn").click();
    await page.getByRole("button", { name: /Learn to play/ }).click();
    await expect(page.locator("#teachProgress")).toHaveText("Step 1 of 7");
    await page.locator("#teachClose").click();
    await expect(page.locator("#teachResume")).toHaveCount(0);
    expect((await teachState(page)).status).toBe("dismissed");
  });

  test("resume prompt can be dismissed", async ({ page }) => {
    await boot(page, { "tsr:teach": { status: "started", step: 1 } });
    await page.getByRole("button", { name: "Dismiss tutorial" }).click();
    await expect(page.locator("#teachResume")).toHaveCount(0);
    expect((await teachState(page)).status).toBe("dismissed");
  });

  test("corrupt tsr:teach is treated as new", async ({ page }) => {
    await boot(page, { "tsr:teach": "{not json" });
    await expect(page.locator("#teachResume")).toHaveCount(0);
    expect(await page.evaluate(() => window.tsrTeach.state())).toEqual({ status: "new", step: 0 });
  });

  test("tutorial dialog traps focus and fits a 360px phone", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await boot(page);
    await page.evaluate(() => window.tsrTeach.open());
    for (let step = 0; step < 7; step++) {
      const sw = await page.evaluate(() => {
        const box = document.querySelector("#teachModal .modal-box");
        return { box: box.scrollWidth - box.clientWidth, doc: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      });
      expect(sw.box).toBeLessThanOrEqual(0);
      expect(sw.doc).toBeLessThanOrEqual(0);
      const nextBox = await page.locator("#teachNext").boundingBox();
      expect(nextBox.height).toBeGreaterThanOrEqual(44);
      if (step < 6) await page.locator("#teachNext").click();
    }
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => !!document.activeElement.closest("#teachModal"))).toBe(true);
    }
  });
});

test.describe("Setup checklist", () => {
  async function loadMission(page, a, b, sc) {
    await page.locator("#manualChar1").selectOption(a);
    await page.locator("#manualChar2").selectOption(b);
    await page.locator("#manualScenario").selectOption(sc);
    await page.locator("#loadManualCombo").click();
  }

  test("collapsible checklist on the mission card with a per-scenario note that persists", async ({ page }) => {
    await boot(page, { enabledPacks: ["series1"], lastDifficulty: "Hard" });
    await loadMission(page, "Saaze", "Kinglan", "Stop The Virus!");
    const det = page.locator("#setupChecklist");
    await expect(det).toBeVisible();
    await expect(det).not.toHaveAttribute("open", "");
    await det.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(det).toHaveAttribute("open", "");
    await expect(det).toContainText("Saaze (Primary) on the left");
    await expect(det).toContainText("Kinglan (Secondary) on the right");
    await expect(page.locator("#setupDiff")).toHaveText("Hard");
    await page.locator("#difficulty").selectOption("Easy");
    await expect(page.locator("#setupDiff")).toHaveText("Easy");
    expect((await events(page)).filter(e => e === "setup_open")).toHaveLength(1);

    await page.getByLabel(/My setup note for this scenario/).fill("Virus tokens on the far track");
    await expect(page.locator("#setupNoteStatus")).toHaveText("Note saved.");
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("tsr:setupNotes")))).toEqual({ "Stop The Virus!": "Virus tokens on the far track" });

    // The FAQ link lands on this scenario's rulings.
    await page.getByRole("button", { name: "Commonly asked about Scenario 04" }).click();
    await expect(page.locator("#faqModal")).toHaveClass(/open/);
    await page.keyboard.press("Escape");

    // Seen every time: a different pairing on the same scenario, after a reload, shows the note in the summary.
    await page.reload();
    await loadMission(page, "Bood", "Fanoobia", "Stop The Virus!");
    await expect(page.locator("#setupChecklist summary")).toContainText("Virus tokens on the far track");
    await page.locator("#setupChecklist summary").click();
    await expect(page.locator("#setupNote")).toHaveValue("Virus tokens on the far track");
    // Another scenario has its own (empty) note.
    await loadMission(page, "Bood", "Fanoobia", "Rule The World!");
    await expect(page.locator("#setupChecklist summary")).not.toContainText("Virus");
    // Clearing removes it.
    await loadMission(page, "Bood", "Fanoobia", "Stop The Virus!");
    await page.locator("#setupChecklist summary").click();
    await page.locator("#setupNote").fill("");
    await expect(page.locator("#setupNoteStatus")).toHaveText("Note cleared.");
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("tsr:setupNotes")))).toEqual({});
  });

  test("checklist stays open across the card re-render after saving", async ({ page }) => {
    await boot(page, { enabledPacks: ["series1"] });
    await loadMission(page, "Bood", "Saaze", "Escape The Brig!");
    await page.locator("#setupChecklist summary").click();
    await page.locator("#saveRecordBtn").click();
    await expect(page.locator("#saveRecordBtn")).toHaveText("Saved");
    await expect(page.locator("#setupChecklist")).toHaveAttribute("open", "");
  });
});

test.describe("Turn-step rail", () => {
  async function openDice(page) {
    await page.locator("#generateBtn").click();
    await page.locator("#diceRollerBtn").click();
    await expect(page.locator("#diceModal")).toHaveClass(/open/);
  }

  test("on by default for new players; hide/show persists; never blocks rolling", async ({ page }) => {
    await boot(page, { enabledPacks: ["series1"] });
    await openDice(page);
    const rail = page.locator("#turnRail");
    await expect(rail).toBeVisible();
    await expect(rail.getByRole("heading", { name: "Turn steps" })).toBeVisible();
    // Opening the roller rolls, so the next step is Place.
    await expect(rail.locator('[aria-current="step"]')).toContainText("Place");
    await expect(rail).toContainText("Reducing below 1 forces");
    await expect(rail).toContainText("1 energy: re-roll one die");
    await rail.getByRole("button", { name: /No combo/ }).click();
    await expect(rail.locator('[aria-current="step"]')).toContainText("No combo");
    await expect(page.locator("#turnRailDetail")).toContainText("Reduce one die by 1");

    // Dice still work with the rail showing (nothing overlays them).
    const box = await page.locator("#rollBtn").boundingBox();
    const hit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y).id, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    expect(hit).toBe("rollBtn");
    await page.locator("#rollBtn").click();
    await expect(rail.locator('[aria-current="step"]')).toContainText("Place");
    await page.locator("#die0").click();
    await expect(page.locator("#die0")).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Hide turn steps" }).click();
    await expect(rail).toBeHidden();
    await expect(page.locator("#turnRailShow")).toBeFocused();
    expect(await page.evaluate(() => localStorage.getItem("tsr:rail"))).toBe("off");
    const ev = await page.evaluate(() => window.__events.filter(e => e[0] === "rail_toggle"));
    expect(ev).toEqual([["rail_toggle", { on: false }]]);

    await page.reload();
    await openDice(page);
    await expect(page.locator("#turnRail")).toBeHidden();
    await page.locator("#turnRailShow").click();
    await expect(page.locator("#turnRail")).toBeVisible();
    await expect(page.locator("#turnRailHide")).toBeFocused();
    expect(await page.evaluate(() => localStorage.getItem("tsr:rail"))).toBe("on");
  });

  test("Tips setting toggles the rail", async ({ page }) => {
    await boot(page, { enabledPacks: ["series1"] });
    await page.locator("#tipsTriggerBtn").click();
    const cb = page.getByLabel("Show turn steps in the Dice Roller");
    await expect(cb).toBeChecked();
    await cb.uncheck();
    expect(await page.evaluate(() => localStorage.getItem("tsr:rail"))).toBe("off");
    await page.keyboard.press("Escape");
    await openDice(page);
    await expect(page.locator("#turnRail")).toBeHidden();
  });

  test("players with a long Mission Log start with the rail hidden", async ({ page }) => {
    const recs = Array.from({ length: 12 }, (_, i) => ({ characters: ["Bood", "Saaze"], scenario: "Escape The Brig!", result: "Win", difficulty: "Easy", playtime: 60, timestamp: `1/${i + 1}/2026, 1:00:00 PM` }));
    await boot(page, { enabledPacks: ["series1"], gameRecords: recs });
    await openDice(page);
    await expect(page.locator("#turnRail")).toBeHidden();
    await expect(page.locator("#turnRailShow")).toBeVisible();
  });

  test("dice roller with the rail fits a 360px phone and Roll stays reachable", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await boot(page, { enabledPacks: ["series1"] });
    await openDice(page);
    const dims = await page.evaluate(() => {
      const box = document.querySelector("#diceModal .modal-box");
      return { over: box.scrollWidth - box.clientWidth, doc: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    expect(dims.over).toBeLessThanOrEqual(0);
    expect(dims.doc).toBeLessThanOrEqual(0);
    const roll = await page.locator("#rollBtn").boundingBox();
    expect(roll.y + roll.height).toBeLessThanOrEqual(640);
    for (const b of await page.locator("#turnRail button").all()) {
      const bb = await b.boundingBox();
      expect(bb.height).toBeGreaterThanOrEqual(36);
    }
  });
});

const AXE = process.env.AXE_CORE_PATH;
for (const theme of ["dark", "light"]) {
  test(`tutorial, rail and setup checklist have no axe violations (${theme})`, async ({ browser }) => {
    test.skip(!AXE || !fs.existsSync(AXE), "set AXE_CORE_PATH to axe.min.js to run");
    const context = await browser.newContext({ bypassCSP: true });
    const page = await context.newPage();
    await boot(page, { theme, enabledPacks: ["series1"] });
    await page.addScriptTag({ path: AXE });
    await page.locator("#generateBtn").click();
    await page.locator("#setupChecklist summary").click();
    let res = await page.evaluate(() => axe.run("#combinationDisplay", { resultTypes: ["violations"] }));
    expect(res.violations.map(v => v.id)).toEqual([]);
    await page.locator("#diceRollerBtn").click();
    await page.waitForTimeout(700);
    res = await page.evaluate(() => axe.run("#diceModal", { resultTypes: ["violations"] }));
    expect(res.violations.map(v => v.id)).toEqual([]);
    await page.keyboard.press("Escape");
    for (let step = 0; step < 7; step++) {
      if (step === 0) await page.evaluate(() => window.tsrTeach.open());
      else await page.locator("#teachNext").click();
      res = await page.evaluate(() => axe.run("#teachModal", { resultTypes: ["violations"] }));
      expect(res.violations.map(v => `${step}:${v.id}:${v.nodes.map(n => n.target.join(" ")).join(",")}`)).toEqual([]);
    }
    await context.close();
  });
}

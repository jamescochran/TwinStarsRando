import { test, expect } from "@playwright/test";

// Keyboard, dialog-focus, undo and journey regressions (UX interaction pass).
function seed(values = {}) {
  return async (page) => {
    await page.addInitScript((v) => {
      if (localStorage.getItem("__seeded")) return;
      localStorage.setItem("__seeded", "1");
      localStorage.setItem("hasSeenTip", "1");
      localStorage.setItem("seenPrimarySecondaryNotice", "1");
      localStorage.setItem("enabledPacks", JSON.stringify(["series1"]));
      for (const [k, val] of Object.entries(v)) localStorage.setItem(k, typeof val === "string" ? val : JSON.stringify(val));
    }, values);
  };
}

const REC = {
  characters: ["Bood", "Stag Solar"], scenario: "Escape The Brig!", result: "Win",
  difficulty: "Easy", playtime: 60, timestamp: "1/1/2026, 1:00:00 PM",
};
const activeId = (page) => page.evaluate(() => document.activeElement && document.activeElement.id);

test.describe("tabs (WAI-ARIA tabs pattern)", () => {
  test("only the selected tab is in the Tab order; arrows, Home and End move and select", async ({ page }) => {
    await seed()(page);
    await page.goto("/");
    const tabs = page.locator(".tab-nav [role='tab']");
    await expect(tabs.nth(0)).toHaveAttribute("tabindex", "0");
    await expect(tabs.nth(1)).toHaveAttribute("tabindex", "-1");
    await page.locator("#randomizerTab").focus();
    await page.keyboard.press("ArrowRight");
    expect(await activeId(page)).toBe("historyTab");
    await expect(page.locator("#historyTab")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#historyTab")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#randomizerTab")).toHaveAttribute("tabindex", "-1");
    await expect(page.locator("#historyPage")).toBeVisible();
    await page.keyboard.press("End");
    expect(await activeId(page)).toBe("syzygyCampaignTab");
    await expect(page.locator("#syzygyCampaignPage")).toBeVisible();
    await page.keyboard.press("Home");
    expect(await activeId(page)).toBe("randomizerTab");
    await page.keyboard.press("ArrowLeft");
    expect(await activeId(page)).toBe("syzygyCampaignTab");
    // Tab from the selected tab leaves the tab list (goes to the panel), not to another tab.
    await page.keyboard.press("Tab");
    expect(await activeId(page)).toBe("syzygyCampaignPage");
  });
});

test.describe("dialogs", () => {
  test("focus moves in, is trapped, Escape closes and returns focus; page behind is inert", async ({ page }) => {
    await seed()(page);
    await page.goto("/");
    await page.locator("#tipsTriggerBtn").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#tipsModal")).toHaveClass(/open/);
    expect(await page.evaluate(() => !!document.activeElement.closest("#tipsModal"))).toBe(true);
    expect(await page.evaluate(() => document.querySelector(".app-shell").inert)).toBe(true);
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => !!document.activeElement.closest("#tipsModal"))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(page.locator("#tipsModal")).not.toHaveClass(/open/);
    expect(await activeId(page)).toBe("tipsTriggerBtn");
    expect(await page.evaluate(() => document.querySelector(".app-shell").inert)).toBe(false);
  });

  test("Tab cannot escape the dice roller (hidden buttons are skipped)", async ({ page }) => {
    await seed()(page);
    await page.goto("/");
    await page.getByRole("button", { name: /Randomize Combination/i }).click();
    await page.locator("#diceRollerBtn").click();
    await page.locator("#skillCheckBtn").focus();
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => !!document.activeElement.closest("#diceModal"))).toBe(true);
    }
  });

  test("Skill Check keeps focus inside the dialog", async ({ page }) => {
    await seed()(page);
    await page.goto("/");
    await page.getByRole("button", { name: /Randomize Combination/i }).click();
    await page.locator("#diceRollerBtn").click();
    await page.locator("#skillCheckBtn").focus();
    await page.keyboard.press("Enter");
    expect(await activeId(page)).toBe("skillDoneBtn");
  });

  test("Flip buttons only appear when Hebolt Rom is playing", async ({ page }) => {
    await seed({ enabledPacks: ["series1", "series2"] })(page);
    await page.goto("/");
    await page.locator("#manualChar1").selectOption("Bood");
    await page.locator("#manualChar2").selectOption("Smiff");
    await page.locator("#loadManualCombo").click();
    await page.locator("#diceRollerBtn").click();
    await expect(page.locator("#dieFlip0")).toBeHidden();
    await page.keyboard.press("Escape");
    await page.locator("#manualChar2").selectOption("Hebolt Rom");
    await page.locator("#loadManualCombo").click();
    await page.locator("#diceRollerBtn").click();
    await expect(page.locator("#dieFlip0")).toBeVisible();
  });
});

test.describe("recording a game", () => {
  test("notes can be added when saving; focus and the recorded time stay visible", async ({ page }) => {
    await seed()(page);
    await page.goto("/");
    await page.getByRole("button", { name: /Randomize Combination/i }).click();
    await page.getByRole("textbox", { name: /Notes/ }).fill("Used the advanced variant");
    await page.waitForTimeout(1100);
    await page.locator("#saveRecordBtn").click();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("gameRecords")));
    expect(stored[0].notes).toBe("Used the advanced variant");
    await expect(page.locator("#recordNotes")).toHaveValue("");
    expect(await activeId(page)).toBe("saveStatusText");
    await expect(page.locator("#saveStatus")).toContainText("Saved to Mission Log");
    await expect(page.locator("#timerDisplay")).not.toHaveText("00:00");
    await page.locator("#viewLogBtn").click();
    await expect(page.locator("#historyPage")).toBeVisible();
    await expect(page.locator("#historyTableContainer .notes-row")).toContainText("Used the advanced variant");
  });

  test("starting a new mission asks first when a game has been running for a minute", async ({ page }) => {
    await page.clock.install();
    await seed()(page);
    await page.goto("/");
    await page.getByRole("button", { name: /Randomize Combination/i }).click();
    const first = await page.locator(".combo-characters").textContent();
    await page.clock.fastForward(61000);
    await page.getByRole("button", { name: /Randomize Combination/i }).click();
    await expect(page.locator("#discardGameModal")).toHaveClass(/open/);
    await page.locator("#discardGameCancel").click();
    await expect(page.locator("#discardGameModal")).not.toHaveClass(/open/);
    await expect(page.locator(".combo-characters")).toHaveText(first);
    await expect(page.locator("#timerDisplay")).not.toHaveText("00:00");
    await page.getByRole("button", { name: /Randomize Combination/i }).click();
    await page.locator("#discardGameConfirm").click();
    await expect(page.locator("#timerDisplay")).toHaveText("00:00");
  });

  test("difficulty badges do not rely on colour alone", async ({ page }) => {
    await seed({ gameRecords: [REC, { ...REC, difficulty: "Hard", result: "Loss", timestamp: "2" }] })(page);
    await page.goto("/");
    await page.locator("#loadManualCombo").click(); // Bood & Stag Solar, Escape The Brig!
    await expect(page.getByRole("listitem", { name: /Easy: won/ })).toBeVisible();
    await expect(page.getByRole("listitem", { name: /Hard: played, not yet won/ })).toBeVisible();
    await expect(page.getByRole("listitem", { name: /Medium: not played yet/ })).toBeVisible();
    await expect(page.locator(".diff-badge.win")).toContainText("✓");
    await expect(page.locator(".diff-badge.loss")).toContainText("✗");
  });
});

test.describe("Mission Log", () => {
  test("deleting a record can be undone, and focus stays in the table", async ({ page }) => {
    await seed({ gameRecords: [REC, { ...REC, timestamp: "2" }] })(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await page.locator("#historyTableContainer .btn-delete-record").first().click();
    await expect(page.locator("#deleteRecordMsg")).toContainText("Bood & Stag Solar");
    await page.locator("#deleteRecordConfirm").click();
    await expect(page.locator("#historyTableContainer tbody tr")).toHaveCount(1);
    expect(await page.evaluate(() => document.activeElement.classList.contains("btn-delete-record"))).toBe(true);
    await page.locator(".toast-action").click();
    await expect(page.locator("#historyTableContainer tbody tr")).toHaveCount(2);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("gameRecords")).length)).toBe(2);
  });

  test("Clear All can be undone with Ctrl+Z", async ({ page }) => {
    await seed({ gameRecords: [REC, { ...REC, timestamp: "2" }] })(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await page.locator("#clearDataBtn").click();
    await expect(page.locator("#confirmModalMsg")).toContainText("all 2 mission records");
    await page.locator("#modalConfirm").click();
    expect(await activeId(page)).toBe("missionLogHeading");
    await expect(page.locator("#historyTableContainer table")).toHaveCount(0);
    await page.keyboard.press("Control+z");
    await expect(page.locator("#historyTableContainer tbody tr")).toHaveCount(2);
  });

  test("filters show a count and an empty result offers Clear Filters", async ({ page }) => {
    await seed({ gameRecords: [REC, { ...REC, timestamp: "2", result: "Loss" }] })(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await page.locator("#historyFilterResult").selectOption("Loss");
    await expect(page.locator("#historyCount")).toHaveText("Showing 1 of 2 records");
    await page.locator("#historyFilterDifficulty").selectOption("Hard");
    await page.getByRole("button", { name: "Clear Filters" }).click();
    await expect(page.locator("#historyTableContainer tbody tr")).toHaveCount(2);
    await expect(page.locator("#historyFilterResult")).toHaveValue("");
  });
});

test.describe("SYZYGY keyboard journey", () => {
  test("setup, branch choice and outcomes work by keyboard; focus is kept; outcome can be undone", async ({ page }) => {
    await seed()(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "SYZYGY" }).click();
    await page.locator("#szSel1").focus();
    await page.keyboard.press("Enter");
    expect(await activeId(page)).toBe("szSel1");
    for (const c of ["Bood", "Stag Solar", "Fanoobia"]) {
      const btn = page.locator(`.syzygy-char-btn[data-char="${c}"]`);
      await btn.focus();
      await page.keyboard.press("Enter");
      expect(await page.evaluate(() => document.activeElement.dataset.char)).toBe(c);
    }
    await page.locator("#szStartBtn").focus();
    await page.keyboard.press("Enter");
    expect(await activeId(page)).toBe("szStageHeading");
    // Steppers have names and keep focus when re-rendered.
    const plus = page.getByRole("button", { name: /^Add 1 health to/ }).first();
    await plus.focus();
    await page.keyboard.press("Enter");
    expect(await page.evaluate(() => document.activeElement.getAttribute("aria-label"))).toMatch(/^Add 1 health to/);
    await page.locator("#szWinBtn").focus();
    await page.keyboard.press("Enter");
    // Branch choice is reachable and operable by keyboard.
    await expect(page.locator("#szBranchL")).toHaveJSProperty("tagName", "BUTTON");
    await page.locator("#szBranchL").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#szStageHeading")).toContainText("Stage B");
    expect(await activeId(page)).toBe("szStageHeading");
    await page.locator("#szLossBtn").click();
    await expect(page.locator(".toast")).toContainText("Defeat recorded");
    await page.locator(".toast-action").click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("syzygyCampaign")));
    expect(saved.losses).toBe(0);
    expect(saved.stageResults).toHaveLength(1);
  });
});

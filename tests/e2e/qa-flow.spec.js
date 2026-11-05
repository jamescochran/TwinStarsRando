import { test, expect } from "@playwright/test";

// Regression tests for the second-pass QA (workflows, keyboard, screen-reader semantics).
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
const rec = (i, extra = {}) => ({
  characters: ["Bood", "Stag Solar"], scenario: "Escape The Brig!", result: "Win",
  difficulty: "Easy", playtime: 60, timestamp: `1/${i + 1}/2026, 1:00:00 PM`, ...extra,
});

test("Edit/Delete buttons have short but unique names", async ({ page }) => {
  await seed({ gameRecords: [rec(0), rec(1)] })(page);
  await page.goto("/");
  await page.getByRole("tab", { name: "Mission Log" }).click();
  await expect(page.getByRole("button", { name: "Edit Bood & Stag Solar, 1/2/2026, 1:00 PM" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete Bood & Stag Solar, 1/1/2026, 1:00 PM" })).toBeVisible();
  const names = await page.locator("#historyTableContainer button").evaluateAll(b => b.map(x => x.getAttribute("aria-label")));
  expect(new Set(names).size).toBe(names.length);
  for (const n of names) expect(n.length).toBeLessThan(50);
});

test("Import is one control: file input is out of the Tab order and accessibility tree", async ({ page }) => {
  await seed({ gameRecords: [rec(0)] })(page);
  await page.goto("/");
  await page.getByRole("tab", { name: "Mission Log" }).click();
  await expect(page.getByRole("button", { name: "Import" })).toHaveCount(1);
  await expect(page.locator("#importFile")).toHaveAttribute("tabindex", "-1");
  await expect(page.locator("#importFile")).toHaveAttribute("aria-hidden", "true");
});

test("Import dialog actions: Cancel first, destructive in the middle, primary last", async ({ page }) => {
  await seed({ gameRecords: [rec(0)] })(page);
  await page.goto("/");
  await page.getByRole("tab", { name: "Mission Log" }).click();
  await page.locator("#importFile").setInputFiles({ name: "b.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify([rec(5)])) });
  const ids = await page.locator("#importConfirmModal .modal-actions button").evaluateAll(b => b.map(x => x.id));
  expect(ids).toEqual(["importCancel", "importReplace", "importMerge"]);
  await expect(page.locator("#importCancel")).toBeFocused();
});

test("invalid import file gives a specific message", async ({ page }) => {
  await seed({ gameRecords: [rec(0)] })(page);
  await page.goto("/");
  await page.getByRole("tab", { name: "Mission Log" }).click();
  await page.locator("#importFile").setInputFiles({ name: "x.json", mimeType: "application/json", buffer: Buffer.from('{"not":"a list"}') });
  await expect(page.locator("#ariaLive")).toHaveText("Couldn't import: this file isn't a Mission Log backup.");
});

test.describe("Undo toast is reachable from the keyboard", () => {
  test("Tab jumps to Undo once, Escape returns focus, Tab from Undo continues", async ({ page }) => {
    await seed({ gameRecords: [rec(0), rec(1), rec(2)] })(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await page.locator("#historyTableContainer .btn-delete-record").first().click();
    await page.locator("#deleteRecordConfirm").click();
    const focused = await page.evaluate(() => document.activeElement.getAttribute("aria-label"));
    await expect(page.locator("#ariaLive")).toContainText("Press Tab to reach Undo");
    // The toast lives in a labelled landmark (axe "region") and focus wasn't stolen.
    await expect(page.getByRole("region", { name: "Notifications" }).locator(".toast")).toHaveCount(1);
    expect(focused).toMatch(/^Delete /);
    await page.keyboard.press("Tab");
    await expect(page.locator(".toast-action")).toBeFocused();
    await page.keyboard.press("Escape");
    expect(await page.evaluate(() => document.activeElement.getAttribute("aria-label"))).toBe(focused);
    await page.keyboard.press("Tab"); // offered once only: normal Tab order now
    await expect(page.locator(".toast-action")).not.toBeFocused();
  });

  test("activating Undo from the keyboard restores the record and keeps focus on the page", async ({ page }) => {
    await seed({ gameRecords: [rec(0), rec(1)] })(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await page.locator("#historyTableContainer .btn-delete-record").first().click();
    await page.locator("#deleteRecordConfirm").click();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.locator("#historyCount")).toHaveText("2 records");
    expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
  });
});

test("rulebook page can be scrolled from the keyboard", async ({ page }) => {
  await seed({})(page);
  await page.goto("/");
  await page.locator("#rulesBtn").click();
  const wrap = page.locator(".rules-img-wrap");
  await expect(wrap).toHaveAttribute("tabindex", "0");
  await expect(page.getByRole("region", { name: /Rulebook page/ })).toHaveCount(1);
});

test("Unplayed Combinations list is a single Tab stop with arrow-key navigation", async ({ page }) => {
  await seed({ gameRecords: [rec(0)] })(page);
  await page.goto("/");
  await page.getByRole("tab", { name: "Mission Log" }).click();
  const grid = page.locator("#unplayedGrid");
  await expect(grid.locator('.btn-load-unplayed[tabindex="0"]')).toHaveCount(1);
  await grid.locator(".btn-load-unplayed").first().focus();
  await page.keyboard.press("ArrowDown");
  await expect(grid.locator(".btn-load-unplayed").nth(1)).toBeFocused();
  for (let i = 0; i < 40; i++) await page.keyboard.press("ArrowDown"); // past the first batch of 30
  await expect(grid.locator(".btn-load-unplayed").nth(41)).toBeFocused();
  await page.keyboard.press("Home");
  await expect(grid.locator(".btn-load-unplayed").first()).toBeFocused();
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement.closest("#unplayedGrid"))).toBe(false);
});

test("mission card does not auto-scroll when it is already fully visible", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await seed({})(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Randomize Combination/i }).click();
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test("Escape on the discard-game dialog keeps the game", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-01-01T12:00:00") });
  await page.clock.pauseAt(new Date("2026-01-01T12:00:01"));
  await seed({})(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Randomize Combination/i }).click();
  const before = await page.locator("#manualChar1").inputValue();
  await page.clock.runFor(61000);
  await page.getByRole("button", { name: /Randomize Combination/i }).click();
  await expect(page.locator("#discardGameModal")).toHaveClass(/open/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#discardGameModal")).not.toHaveClass(/open/);
  await expect(page.locator("#manualChar1")).toHaveValue(before);
});

test("dialog close buttons say which dialog they close", async ({ page }) => {
  await seed({})(page);
  await page.goto("/");
  await page.locator("#tipsTriggerBtn").click();
  await expect(page.getByRole("button", { name: "Close Tips" })).toBeFocused();
  await page.keyboard.press("Escape");
  await page.locator("#rulesBtn").click();
  await expect(page.getByRole("button", { name: "Close Rulebooks" })).toBeFocused();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /Randomize Combination/i }).click();
  await page.locator("#combinationDisplay .btn-faq-inline").first().click();
  await expect(page.getByRole("button", { name: "Close Rules FAQ" })).toBeFocused();
  await page.keyboard.press("Escape");
  await page.locator("#settingsBtn").click();
  await expect(page.getByRole("button", { name: "Close My Collection" })).toBeVisible();
});

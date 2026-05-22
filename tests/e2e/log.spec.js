import { test, expect } from "@playwright/test";

async function saveRecord(page, { result = "Win", difficulty = "Medium" } = {}) {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("enabledPacks", JSON.stringify(["series1"]));
    localStorage.setItem("hasSeenTip", "1");
  });
  await page.goto("/");
  await page.getByRole("button", { name: /Randomize Combination/i }).click();

  // Select result and difficulty, then save
  await page.locator("#result").selectOption(result);
  await page.locator("#difficulty").selectOption(difficulty);
  await page.locator("#saveRecordBtn").click();
}

test("saving a record makes it appear in Mission Log", async ({ page }) => {
  await saveRecord(page);
  await page.getByRole("tab", { name: "Mission Log" }).click();
  const rows = page.locator("#historyTableContainer table tbody tr");
  await expect(rows.first()).toBeVisible({ timeout: 5000 });
});

test("saved record shows the correct result", async ({ page }) => {
  await saveRecord(page, { result: "Win" });
  await page.getByRole("tab", { name: "Mission Log" }).click();
  await expect(page.locator("#historyTableContainer .result-pill.win").first()).toBeVisible({ timeout: 5000 });
});

test("saved record shows the correct difficulty", async ({ page }) => {
  await saveRecord(page, { difficulty: "Hard" });
  await page.getByRole("tab", { name: "Mission Log" }).click();
  await expect(page.locator("#historyTableContainer td").filter({ hasText: "Hard" }).first()).toBeVisible({ timeout: 5000 });
});

test("export JSON button is enabled after saving a record", async ({ page }) => {
  await saveRecord(page);
  await page.getByRole("tab", { name: "Mission Log" }).click();
  await expect(page.locator("#exportBtn")).not.toBeDisabled({ timeout: 3000 });
});

test("clear all button opens confirmation modal", async ({ page }) => {
  await saveRecord(page);
  await page.getByRole("tab", { name: "Mission Log" }).click();
  await page.locator("#clearDataBtn").click();
  await expect(page.locator("#confirmModal")).toHaveClass(/open/);
});

test("cancelling clear all does not delete records", async ({ page }) => {
  await saveRecord(page);
  await page.getByRole("tab", { name: "Mission Log" }).click();
  await page.locator("#clearDataBtn").click();
  await page.locator("#modalCancel, #confirmCancel").click();
  await expect(page.locator("#confirmModal")).not.toHaveClass(/open/);
  // Record should still be there
  const rows = page.locator("#historyTableContainer table tbody tr");
  await expect(rows.first()).toBeVisible({ timeout: 5000 });
});

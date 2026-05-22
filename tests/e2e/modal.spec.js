import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("enabledPacks", JSON.stringify(["series1"]));
    localStorage.setItem("hasSeenTip", "1");
  });
  await page.reload();
});

test("My Collection modal opens and closes via Done button", async ({ page }) => {
  await page.getByRole("button", { name: /My Collection/i }).click();
  const modal = page.locator("#settingsModal");
  await expect(modal).toHaveClass(/open/);
  await page.locator("#settingsClose").click();
  await expect(modal).not.toHaveClass(/open/);
});

test("My Collection modal closes on backdrop click", async ({ page }) => {
  await page.getByRole("button", { name: /My Collection/i }).click();
  const modal = page.locator("#settingsModal");
  await expect(modal).toHaveClass(/open/);
  await modal.click({ position: { x: 5, y: 5 } }); // click backdrop, not modal box
  await expect(modal).not.toHaveClass(/open/);
});

test("My Collection modal closes on Escape", async ({ page }) => {
  await page.getByRole("button", { name: /My Collection/i }).click();
  const modal = page.locator("#settingsModal");
  await expect(modal).toHaveClass(/open/);
  await page.keyboard.press("Escape");
  await expect(modal).not.toHaveClass(/open/);
});

test("Tips modal opens via ? button and closes via X", async ({ page }) => {
  await page.locator("#tipsTriggerBtn").click();
  const modal = page.locator("#tipsModal");
  await expect(modal).toHaveClass(/open/);
  await page.locator("#tipsModalClose").click();
  await expect(modal).not.toHaveClass(/open/);
});

test("Tips modal closes on Escape", async ({ page }) => {
  await page.locator("#tipsTriggerBtn").click();
  const modal = page.locator("#tipsModal");
  await expect(modal).toHaveClass(/open/);
  await page.keyboard.press("Escape");
  await expect(modal).not.toHaveClass(/open/);
});

test("dice roller modal opens during active session", async ({ page }) => {
  await page.getByRole("button", { name: /Randomize Combination/i }).click();
  await expect(page.locator("#diceRollerBtn")).toBeVisible();
  await page.locator("#diceRollerBtn").click();
  await expect(page.locator("#diceModal")).toHaveClass(/open/);
});

test("dice roller modal closes on Escape", async ({ page }) => {
  await page.getByRole("button", { name: /Randomize Combination/i }).click();
  await page.locator("#diceRollerBtn").click();
  await expect(page.locator("#diceModal")).toHaveClass(/open/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#diceModal")).not.toHaveClass(/open/);
});

test("focus is trapped inside open modal", async ({ page }) => {
  await page.getByRole("button", { name: /My Collection/i }).click();
  await expect(page.locator("#settingsModal")).toHaveClass(/open/);
  // Tab through focusable elements — none should exit the modal
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.closest(".modal-overlay") !== null);
    expect(focused).toBe(true);
  }
});

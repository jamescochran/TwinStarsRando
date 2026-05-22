import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("enabledPacks", JSON.stringify(["series1", "series2"]));
  });
  await page.goto("/");
});

test("Randomize button exists and is clickable", async ({ page }) => {
  const btn = page.getByRole("button", { name: /Randomize Combination/i });
  await expect(btn).toBeVisible();
  await btn.click();
  // After clicking, combination display should show characters
  await expect(page.locator(".combo-characters")).toBeVisible();
});

test("randomize populates character selectors", async ({ page }) => {
  await page.getByRole("button", { name: /Randomize Combination/i }).click();
  const char1 = page.locator("#manualChar1");
  const char2 = page.locator("#manualChar2");
  await expect(char1).not.toHaveValue("");
  await expect(char2).not.toHaveValue("");
});

test("randomize populates scenario selector", async ({ page }) => {
  await page.getByRole("button", { name: /Randomize Combination/i }).click();
  const scenario = page.locator("#manualScenario");
  await expect(scenario).not.toHaveValue("");
});

test("lock button on char1 prevents that character changing on re-randomize", async ({ page }) => {
  await page.getByRole("button", { name: /Randomize Combination/i }).click();
  const char1Sel = page.locator("#manualChar1");
  const lockedValue = await char1Sel.inputValue();

  // Lock char1
  await page.locator("[aria-label='Lock Character 1'], .lock-btn").first().click();

  // Re-randomize several times
  for (let i = 0; i < 5; i++) {
    await page.getByRole("button", { name: /Randomize Combination/i }).click();
    await expect(char1Sel).toHaveValue(lockedValue);
  }
});

test("character 1 and 2 dropdowns have options", async ({ page }) => {
  const char1 = page.locator("#manualChar1");
  // char2 is populated after char1 changes — trigger the change event
  await char1.selectOption({ index: 1 });
  const char2 = page.locator("#manualChar2");
  const options1 = await char1.locator("option").count();
  const options2 = await char2.locator("option").count();
  expect(options1).toBeGreaterThan(5);
  expect(options2).toBeGreaterThan(5);
});

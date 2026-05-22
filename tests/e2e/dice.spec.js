import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("enabledPacks", JSON.stringify(["series1"]));
    localStorage.setItem("hasSeenTip", "1");
  });
  await page.goto("/");
  await page.getByRole("button", { name: /Randomize Combination/i }).click();
  await page.locator("#diceRollerBtn").click();
  await expect(page.locator("#diceModal")).toHaveClass(/open/);
});

test("dice roller modal shows two dice", async ({ page }) => {
  const dice = page.locator(".die");
  await expect(dice).toHaveCount(2);
});

test("Roll button changes at least one die value over 8 rolls", async ({ page }) => {
  const getValues = () =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll(".die")).map((el) => el.dataset.val)
    );

  const initial = await getValues();
  let changed = false;
  for (let i = 0; i < 8; i++) {
    await page.locator("#rollBtn").click();
    const after = await getValues();
    if (JSON.stringify(initial) !== JSON.stringify(after)) {
      changed = true;
      break;
    }
  }
  // With 2d6 and 8 rolls, the chance of never changing is (1/6)^8 ≈ 0.0006%
  expect(changed).toBe(true);
});

test("dice modal closes via close button", async ({ page }) => {
  await page.locator("#diceModalClose").click();
  await expect(page.locator("#diceModal")).not.toHaveClass(/open/);
});

test("dice modal closes via Escape", async ({ page }) => {
  await page.keyboard.press("Escape");
  await expect(page.locator("#diceModal")).not.toHaveClass(/open/);
});

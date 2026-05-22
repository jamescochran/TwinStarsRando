import { test, expect } from "@playwright/test";

async function loadCombination(page) {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("enabledPacks", JSON.stringify(["series1"]));
    localStorage.setItem("hasSeenTip", "1");
  });
  await page.goto("/");
  await page.getByRole("button", { name: /Randomize Combination/i }).click();
  await expect(page.locator("#timerDisplay")).toBeVisible();
}

test("timer display is visible after loading a combination", async ({ page }) => {
  await loadCombination(page);
  await expect(page.locator("#timerDisplay")).toBeVisible();
});

test("timer starts running after loading a combination", async ({ page }) => {
  await loadCombination(page);
  const initial = await page.locator("#timerDisplay").textContent();
  await page.waitForTimeout(1200);
  const after = await page.locator("#timerDisplay").textContent();
  expect(after).not.toBe(initial);
});

test("pause button stops the timer", async ({ page }) => {
  await loadCombination(page);
  await page.waitForTimeout(1200);
  await page.locator("#pauseBtn").click();
  const paused = await page.locator("#timerDisplay").textContent();
  await page.waitForTimeout(1200);
  const afterPause = await page.locator("#timerDisplay").textContent();
  expect(afterPause).toBe(paused);
});

test("resume resumes the timer after pause", async ({ page }) => {
  await loadCombination(page);
  // Wait for timer to advance past 00:00
  await page.waitForTimeout(1500);
  await page.locator("#pauseBtn").click();
  const paused = await page.locator("#timerDisplay").textContent();
  // Timer should have advanced to at least 00:01
  expect(paused).not.toBe("00:00");
  // Click pause again to resume
  await page.locator("#pauseBtn").click();
  await page.waitForTimeout(1500);
  const afterResume = await page.locator("#timerDisplay").textContent();
  expect(afterResume).not.toBe(paused);
});

test("restart button opens confirmation modal", async ({ page }) => {
  await loadCombination(page);
  await page.locator("#restartBtn").click();
  await expect(page.locator("#restartModal")).toHaveClass(/open/);
});

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
  await expect(page.locator("#timerDisplay")).not.toHaveText(initial);
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
  await expect(page.locator("#timerDisplay")).not.toHaveText(paused);
});

// Regression: the display used to tick once a second in phase with the original start,
// so right after Resume it could show the paused value for up to ~2 s (flaky under load).
test("display follows the real elapsed time right after pause and resume", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-01-01T12:00:00") });
  await page.clock.pauseAt(new Date("2026-01-01T12:00:01"));
  await loadCombination(page);
  await page.clock.runFor(2100);
  await page.locator("#pauseBtn").click();
  await expect(page.locator("#timerDisplay")).toHaveText("00:02");
  await page.clock.runFor(1200);              // paused: time doesn't count
  await page.locator("#pauseBtn").click();    // resume
  await page.clock.runFor(1500);              // 2.1 + 1.5 = 3.6 s played
  await expect(page.locator("#timerDisplay")).toHaveText("00:03");
});

test("restart button opens confirmation modal", async ({ page }) => {
  await loadCombination(page);
  await page.locator("#restartBtn").click();
  await expect(page.locator("#restartModal")).toHaveClass(/open/);
});

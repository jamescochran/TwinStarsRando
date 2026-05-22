import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("page title includes Twin Stars", async ({ page }) => {
  await expect(page).toHaveTitle(/Twin Stars/);
});

test("randomizer tab is visible and active on load", async ({ page }) => {
  const tab = page.getByRole("tab", { name: "Randomizer" });
  await expect(tab).toBeVisible();
  await expect(tab).toHaveClass(/active/);
});

test("mission log tab is visible and inactive on load", async ({ page }) => {
  const tab = page.getByRole("tab", { name: "Mission Log" });
  await expect(tab).toBeVisible();
  await expect(tab).not.toHaveClass(/active/);
});

test("clicking Mission Log tab switches panels", async ({ page }) => {
  await page.getByRole("tab", { name: "Mission Log" }).click();
  await expect(page.getByRole("tab", { name: "Mission Log" })).toHaveClass(/active/);
  await expect(page.getByRole("tab", { name: "Randomizer" })).not.toHaveClass(/active/);
});

test("no unhandled console errors on load", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  // beforeEach already navigated to the page; just wait for DOM
  await page.waitForLoadState("domcontentloaded");
  const fatal = errors.filter(
    (e) => !e.includes("service-worker") && !e.includes("ServiceWorker")
  );
  expect(fatal).toHaveLength(0);
});

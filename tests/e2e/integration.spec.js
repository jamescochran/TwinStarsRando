// Integration checks for behaviour that spans parallel workstreams.
import { test, expect } from "@playwright/test";

test("a SYZYGY campaign saved in another tab is picked up, not overwritten", async ({ context }) => {
  const a = await context.newPage();
  const b = await context.newPage();
  await a.goto("/");
  await b.goto("/");
  await expect(a.locator("#randomizerTab")).toBeVisible();
  // Tab B starts a campaign and stores it.
  await b.evaluate(() => {
    const chars = CONTENT_PACKS.find(p => p.id === "series1").characters.slice(0, 3);
    szStart("syzygy1", chars);
  });
  // Tab A receives the storage event and holds the same campaign in memory.
  await expect.poll(() => a.evaluate(() => _sz && _sz.mode)).toBe("syzygy1");
  const same = await a.evaluate(() => JSON.stringify(_sz) === localStorage.getItem("syzygyCampaign"));
  expect(same).toBe(true);
});

test("a failed SYZYGY save shows the storage error banner", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#randomizerTab")).toBeVisible();
  const ok = await page.evaluate(() => {
    const chars = CONTENT_PACKS.find(p => p.id === "series1").characters.slice(0, 3);
    Storage.prototype.setItem = () => { throw new DOMException("full", "QuotaExceededError"); };
    _sz = szNewCampaign("syzygy1", chars, CONTENT_PACKS.find(p => p.id === "series1").scenarios.slice(), "series1");
    return saveSz();
  });
  expect(ok).toBe(false);
  await expect(page.locator("#storageError")).toBeVisible();
  await expect(page.locator("#storageErrorText")).toContainText("SYZYGY");
});

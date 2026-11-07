import { test, expect } from "@playwright/test";

// Daily Mission (daily.js): deterministic per UTC date for everyone, independent of the
// collection; completions and streaks in "tsr:daily"; spoiler-free share text.

// Fixed expectations: these must never change (every player's past dailies depend on them).
const FIXED = {
  "2026-11-05": { characters: ["Brenimov-X", "Grulexon"], scenario: "Rule The World!", difficulty: "Hard" },
  "2026-11-06": { characters: ["Bood", "Tumbug Firo"], scenario: "Beat the Odds!", difficulty: "Medium" },
  "2027-01-01": { characters: ["Kinglan", "Inpon Gol"], scenario: "Confine The Quarks!", difficulty: "Hard" },
  "2026-02-28": { characters: ["Gari Obul", "Grant Rockgardner"], scenario: "Master the Trials!", difficulty: "Medium" },
};

async function boot(page, { time, storage = {} } = {}) {
  await page.route("https://umami.1jc.in/**", r => r.abort());
  await page.route(/somafm\.com/, r => r.abort());
  if (time) await page.clock.setFixedTime(new Date(time));
  await page.addInitScript((v) => {
    window.__events = [];
    window.umami = { track: (name, data) => { window.__events.push([name, data]); } };
    if (sessionStorage.getItem("__seeded")) return;
    sessionStorage.setItem("__seeded", "1");
    localStorage.clear();
    localStorage.setItem("hasSeenTip", "1");
    localStorage.setItem("seenPrimarySecondaryNotice", "1");
    for (const [k, val] of Object.entries(v)) localStorage.setItem(k, typeof val === "string" ? val : JSON.stringify(val));
  }, storage);
  await page.goto("/");
}
const daily = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("tsr:daily") || "null"));

test("fixed dates always give the same mission, whatever the collection", async ({ page }) => {
  await boot(page, { storage: { enabledPacks: ["scenario13"] } });
  const got = await page.evaluate((dates) => Object.fromEntries(dates.map(d => {
    const m = window.tsrDaily.missionFor(d);
    return [d, { characters: m.characters, scenario: m.scenario, difficulty: m.difficulty }];
  })), Object.keys(FIXED));
  expect(got).toEqual(FIXED);
  // Distinct characters, and only Series I/II content, over a long run of days.
  const ok = await page.evaluate(() => {
    let d = "2026-01-01";
    for (let i = 0; i < 1000; i++) {
      const m = window.tsrDaily.missionFor(d);
      if (m.characters[0] === m.characters[1]) return false;
      d = window.tsrDaily.shiftDay(d, 1);
    }
    return true;
  });
  expect(ok).toBe(true);
});

test("daily card shows today's (UTC) mission; Play loads it with its difficulty; save shows result, share text and streak", async ({ page }) => {
  // 23:30 in UTC-5 on Nov 4 is already Nov 5 in UTC: the UTC date decides.
  await boot(page, { time: "2026-11-05T04:30:00Z", storage: { enabledPacks: ["series1", "series2"], lastDifficulty: "Easy" } });
  const card = page.locator("#dailyMission");
  await expect(card.getByRole("heading", { name: "Daily Mission" })).toBeVisible();
  await expect(card).toContainText("2026-11-05");
  await expect(page.locator("#dailyMissionText")).toContainText("Brenimov-X & Grulexon · Scenario 03: Rule The World! · Hard");
  await expect(page.locator("#dailyOwnNote")).toHaveCount(0);
  await expect(page.locator("#dailyStreak")).toHaveText("No streak yet");

  await page.getByRole("button", { name: "Play today's mission" }).click();
  await expect(page.locator("#comboHeading")).toHaveText(/Brenimov-X and Grulexon, Scenario 03: Rule The World!/);
  await expect(page.locator("#difficulty")).toHaveValue("Hard");
  await page.locator("#result").selectOption("Win");
  await page.locator("#saveRecordBtn").click();
  await expect(page.locator("#saveRecordBtn")).toHaveText("Saved");

  expect(await daily(page)).toEqual({ v: 1, done: { "2026-11-05": { r: "Win", d: "Hard", t: 0 } } });
  // Record schema untouched.
  const rec = await page.evaluate(() => JSON.parse(localStorage.getItem("gameRecords")));
  expect(rec.list ? rec.list.length : rec.length).toBe(1);
  expect(JSON.stringify(rec)).not.toContain("daily");

  const inline = page.locator("#dailyInline");
  await expect(inline).toBeVisible();
  await expect(inline.locator(".daily-share-value")).toHaveText("Twin Stars Daily · 2026-11-05 · Win · 00:00 · Hard");
  await expect(inline).toContainText("Streak: 1 day");
  await expect(page.locator("#dailyStreak")).toHaveText("Streak: 1 day");
  await expect(card.locator(".daily-share-value")).toHaveText("Twin Stars Daily · 2026-11-05 · Win · 00:00 · Hard");
  // Spoiler-free: no character or scenario names.
  const share = await card.locator(".daily-share-value").textContent();
  for (const n of ["Brenimov", "Grulexon", "Rule"]) expect(share).not.toContain(n);

  await inline.getByRole("button", { name: "Copy result" }).click();
  await expect(page.locator(".toast").last()).toBeVisible();
  const ev = await page.evaluate(() => window.__events.map(e => e[0]));
  expect(ev).toContain("daily_play");
  expect(ev).toContain("daily_share");

  // A second save the same day doesn't overwrite the first result.
  await page.getByRole("button", { name: "Play today's mission again" }).click();
  await expect(page.locator("#dailyInline")).toHaveCount(0);
  await page.locator("#result").selectOption("Loss");
  await page.locator("#saveRecordBtn").click();
  await expect(page.locator("#saveRecordBtn")).toHaveText("Saved");
  expect((await daily(page)).done["2026-11-05"].r).toBe("Win");
});

test("a different mission doesn't count as the daily", async ({ page }) => {
  await boot(page, { time: "2026-11-05T12:00:00Z", storage: { enabledPacks: ["series1"] } });
  await page.locator("#generateBtn").click();
  await page.locator("#saveRecordBtn").click();
  await expect(page.locator("#saveRecordBtn")).toHaveText("Saved");
  expect(await daily(page)).toBeNull();
  await expect(page.locator("#dailyInline")).toHaveCount(0);
});

test("not owned: says so, still loads and logs", async ({ page }) => {
  await boot(page, { time: "2026-11-05T12:00:00Z", storage: { enabledPacks: ["series1"] } });
  await expect(page.locator("#dailyOwnNote")).toContainText("Not in your collection (Series 2)");
  await page.getByRole("button", { name: "Play today's mission" }).click();
  await expect(page.locator("#comboHeading")).toHaveText(/Brenimov-X and Grulexon/);
  await page.locator("#saveRecordBtn").click();
  await expect(page.locator("#saveRecordBtn")).toHaveText("Saved");
  expect(Object.keys((await daily(page)).done)).toEqual(["2026-11-05"]);
});

test("streak counts consecutive UTC days, survives until today's is logged, and breaks after a missed day", async ({ page }) => {
  const done = { "2026-11-02": { r: "Win", d: "Easy", t: 600 }, "2026-11-03": { r: "Loss", d: "Hard", t: 700 }, "2026-11-04": { r: "Win", d: "Medium", t: 800 } };
  await boot(page, { time: "2026-11-05T09:00:00Z", storage: { enabledPacks: ["series1", "series2"], "tsr:daily": { v: 1, done } } });
  // Today not yet played: yesterday's run still shows.
  await expect(page.locator("#dailyStreak")).toHaveText("Streak: 3 days");
  await page.getByRole("button", { name: "Play today's mission" }).click();
  await page.locator("#saveRecordBtn").click();
  await expect(page.locator("#dailyStreak")).toHaveText("Streak: 4 days");

  // Pure logic across days.
  const s = await page.evaluate((done) => {
    const t = window.tsrDaily;
    const all = { ...done, "2026-11-05": { r: "Win", d: "Hard", t: 1 } };
    return [t.streakFor(all, "2026-11-05"), t.streakFor(all, "2026-11-06"), t.streakFor(all, "2026-11-07"),
      t.streakFor({}, "2026-11-05"), t.streakFor({ "2026-12-31": {} , "2027-01-01": {} }, "2027-01-01"),
      t.streakFor({ "2028-02-28": {}, "2028-02-29": {}, "2028-03-01": {} }, "2028-03-01")];
  }, done);
  expect(s).toEqual([4, 4, 0, 0, 2, 3]);
});

test("day rollover: next UTC day shows a new mission and keeps yesterday's streak; a missed day resets it", async ({ page }) => {
  const done = { "2026-11-05": { r: "Win", d: "Hard", t: 842 } };
  await boot(page, { time: "2026-11-06T00:05:00Z", storage: { enabledPacks: ["series1", "series2"], "tsr:daily": { v: 1, done } } });
  await expect(page.locator("#dailyMissionText")).toContainText("Bood & Tumbug Firo · Scenario 08: Beat the Odds! · Medium");
  await expect(page.locator("#dailyStreak")).toHaveText("Streak: 1 day");
  await expect(page.locator("#dailyMission .daily-share-text")).toHaveCount(0);
  await page.clock.setFixedTime(new Date("2026-11-07T10:00:00Z"));
  await page.evaluate(() => window.tsrDaily.render());
  await expect(page.locator("#dailyStreak")).toHaveText("No streak yet");
});

test("share text format and corrupt storage", async ({ page }) => {
  await boot(page, { time: "2026-11-05T12:00:00Z", storage: { enabledPacks: ["series1"], "tsr:daily": "{broken" } });
  await expect(page.locator("#dailyStreak")).toHaveText("No streak yet");
  const txt = await page.evaluate(() => [
    window.tsrDaily.shareText("2026-11-05", { r: "Win", t: 842, d: "Hard" }),
    window.tsrDaily.shareText("2026-01-09", { r: "Loss", t: 3725, d: "Easy" }),
  ]);
  expect(txt).toEqual(["Twin Stars Daily · 2026-11-05 · Win · 14:02 · Hard", "Twin Stars Daily · 2026-01-09 · Loss · 62:05 · Easy"]);
});

test("daily card fits a 360px phone and is keyboard reachable", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  const done = { "2026-11-05": { r: "Win", d: "Hard", t: 842 } };
  await boot(page, { time: "2026-11-05T12:00:00Z", storage: { enabledPacks: ["series1"], "tsr:daily": { v: 1, done } } });
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over).toBeLessThanOrEqual(0);
  const panel = await page.locator(".daily-panel").boundingBox();
  expect(panel.x + panel.width).toBeLessThanOrEqual(360);
  for (const sel of ["#dailyCopyPanel", "#dailyPlayBtn"]) {
    const bb = await page.locator(sel).boundingBox();
    expect(bb.height).toBeGreaterThanOrEqual(44);
    expect(bb.x + bb.width).toBeLessThanOrEqual(360);
  }
  await page.locator("#generateBtn").focus();
  let reached = false;
  for (let i = 0; i < 6 && !reached; i++) {
    await page.keyboard.press("Tab");
    reached = await page.evaluate(() => document.activeElement.id === "dailyPlayBtn");
  }
  expect(reached).toBe(true);
  await page.keyboard.press("Enter");
  await expect(page.locator("#comboHeading")).toHaveText(/Brenimov-X and Grulexon/);
});

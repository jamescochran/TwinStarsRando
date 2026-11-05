import { test, expect } from "@playwright/test";
import fs from "fs";

// Pairing Lab + Gauntlet (insights.js): hand-computed fixture numbers, the gauntlet flow
// through the normal Save Record path, reload persistence, empty states, keyboard, 360px.

const S1 = "Escape The Brig!", S2 = "Rule The World!", S3 = "Stop The Virus!";
let n = 0;
const R = (chars, scenario, result, difficulty, extra = {}) => {
  n++;
  return {
    id: `fx-${n}`, createdAt: `2026-01-${String(n).padStart(2, "0")}T10:00:00.000Z`,
    timestamp: `1/${n}/2026, 10:00:00 AM`, characters: chars, scenario, result, difficulty, playtime: 600, ...extra,
  };
};
const BS = ["Bood", "Saaze"], SB = ["Saaze", "Bood"], SF = ["Stag Solar", "Fanoobia"],
      BST = ["Bood", "Stag Solar"], FS = ["Fanoobia", "Saaze"];
// Hand tallies:
//   Bood→Saaze 4/5, Saaze→Bood 1/2 (unordered Bood & Saaze 5/7), Stag Solar→Fanoobia 1/1,
//   Bood→Stag Solar 0/3, Fanoobia→Saaze 0/1. 12 games, 6 wins.
//   Characters: Bood 5/10, Saaze 5/8, Stag Solar 1/4, Fanoobia 1/2.
//   MC-CY 1/2, no droid 5/10. Hard only: Bood & Saaze 1/3, Fanoobia & Saaze 0/1.
const FIXTURE = [
  R(BS, S1, "Win", "Easy", { droid: "MC-CY" }), R(BS, S1, "Win", "Hard"), R(BS, S2, "Win", "Medium"),
  R(BS, S2, "Loss", "Hard"), R(BS, S3, "Win", "Medium"),
  R(SB, S1, "Loss", "Hard"), R(SB, S3, "Win", "Easy"),
  R(SF, S1, "Win", "Medium"),
  R(BST, S2, "Loss", "Medium", { droid: "MC-CY" }), R(BST, S3, "Loss", "Medium"), R(BST, S1, "Loss", "Medium"),
  R(FS, S2, "Loss", "Hard"),
];

async function boot(page, storage = {}, opts = {}) {
  await page.route("https://umami.1jc.in/**", r => r.abort());
  await page.route(/somafm\.com/, r => r.abort());
  await page.addInitScript((v) => {
    window.__events = [];
    window.umami = { track: (name, data) => { window.__events.push([name, data]); } };
    if (localStorage.getItem("__seeded")) return;
    localStorage.setItem("__seeded", "1");
    localStorage.setItem("hasSeenTip", "1");
    localStorage.setItem("seenPrimarySecondaryNotice", "1");
    for (const [k, val] of Object.entries(v)) localStorage.setItem(k, typeof val === "string" ? val : JSON.stringify(val));
  }, { enabledPacks: ["series1", "droids1"], ...storage });
  await page.goto("/");
  if (opts.log) await page.getByRole("tab", { name: "Mission Log" }).click();
}
const events = (page) => page.evaluate(() => window.__events);

test.describe("pure computations (hand-computed fixture)", () => {
  test("fixture: pairs, Wilson order, characters, droids, heat map, never beaten, order effect", async ({ page }) => {
    await boot(page);
    const out = await page.evaluate((recs) => {
      const I = window.TSInsights;
      const r4 = x => Math.round(x * 10000) / 10000;
      const brief = list => list.map(t => [t.label, t.wins, t.games, r4(t.lower)]);
      return {
        unordered: brief(I.pairStats(recs, { ordered: false })),
        ordered: brief(I.pairStats(recs, { ordered: true })),
        chars: brief(I.characterStats(recs)),
        droids: brief(I.droidStats(recs)),
        heatU: I.heatMap(recs, { ordered: false })["Bood\x1FSaaze"],
        heatO: I.heatMap(recs, { ordered: true })["Bood\x1FSaaze"],
        heatSB: I.heatMap(recs, { ordered: true })["Saaze\x1FBood"],
        never: I.neverBeaten(recs, { ordered: false }).map(t => [t.label, t.games]),
        bestS1: brief(I.bestTeamFor(recs, "Escape The Brig!", { ordered: false })),
        order: I.orderEffect(recs).map(e => [e.pair.join("&"), e.a.primary, e.a.wins, e.a.games, e.b.primary, e.b.wins, e.b.games, Math.round(e.diff * 100)]),
        hard: brief(I.pairStats(I.filterByDifficulty(recs, "Hard"), { ordered: false })),
        w: [I.wilsonLower(1, 1), I.wilsonLower(8, 10), I.wilsonLower(0, 0)].map(r4),
      };
    }, FIXTURE);

    // Wilson lower bounds (z = 1.96) computed by hand: 5/7 .3589, 1/1 .2065, 0/n 0.
    // 0-win pairs: less evidence against (0 of 1) ranks above 0 of 3.
    expect(out.unordered).toEqual([
      ["Bood & Saaze", 5, 7, 0.3589],
      ["Fanoobia & Stag Solar", 1, 1, 0.2065],
      ["Fanoobia & Saaze", 0, 1, 0],
      ["Bood & Stag Solar", 0, 3, 0],
    ]);
    expect(out.ordered).toEqual([
      ["Bood & Saaze", 4, 5, 0.3755],
      ["Stag Solar & Fanoobia", 1, 1, 0.2065],
      ["Saaze & Bood", 1, 2, 0.0945],
      ["Fanoobia & Saaze", 0, 1, 0],
      ["Bood & Stag Solar", 0, 3, 0],
    ]);
    expect(out.chars).toEqual([
      ["Saaze", 5, 8, 0.3057], ["Bood", 5, 10, 0.2366], ["Fanoobia", 1, 2, 0.0945], ["Stag Solar", 1, 4, 0.0456],
    ]);
    expect(out.droids).toEqual([["No droid", 5, 10, 0.2366], ["MC-CY", 1, 2, 0.0945]]);
    expect(out.heatU).toEqual({ [S1]: { wins: 2, games: 3 }, [S2]: { wins: 1, games: 2 }, [S3]: { wins: 2, games: 2 } });
    expect(out.heatO).toEqual({ [S1]: { wins: 2, games: 2 }, [S2]: { wins: 1, games: 2 }, [S3]: { wins: 1, games: 1 } });
    expect(out.heatSB).toEqual({ [S1]: { wins: 0, games: 1 }, [S3]: { wins: 1, games: 1 } });
    expect(out.never).toEqual([["Bood & Stag Solar", 3], ["Fanoobia & Saaze", 1]]);
    // 2 of 3 (.2077) narrowly beats 1 of 1 (.2065).
    expect(out.bestS1).toEqual([["Bood & Saaze", 2, 3, 0.2077], ["Fanoobia & Stag Solar", 1, 1, 0.2065], ["Bood & Stag Solar", 0, 1, 0]]);
    expect(out.order).toEqual([["Bood&Saaze", "Bood", 4, 5, "Saaze", 1, 2, 30]]);
    expect(out.hard).toEqual([["Bood & Saaze", 1, 3, 0.0615], ["Fanoobia & Saaze", 0, 1, 0]]);
    expect(out.w).toEqual([0.2065, 0.4902, 0]);
  });

  test("gauntlet order, progress links and share text", async ({ page }) => {
    await boot(page);
    const out = await page.evaluate((recs) => {
      const I = window.TSInsights;
      const scen = ["Escape The Brig!", "Confine The Quarks!", "Rule The World!", "Stop The Virus!"];
      const g = { pair: ["Bood", "Saaze"], scenarios: I.gauntletOrder(scen, recs, ["Bood", "Saaze"], "unplayed"), startedAt: "2026-02-01T00:00:00.000Z", links: {} };
      const mk = (id, sc, result, day, chars = ["Bood", "Saaze"], playtime = 1500) =>
        ({ id, createdAt: `2026-02-0${day}T00:00:00.000Z`, characters: chars, scenario: sc, result, difficulty: "Hard", playtime, timestamp: "x" });
      const later = [
        mk("a", "Confine The Quarks!", "Win", 2),
        mk("b", "Confine The Quarks!", "Loss", 3),             // second attempt: ignored
        mk("c", "Escape The Brig!", "Loss", 4, ["Saaze", "Bood"]), // other order: not this team
        mk("d", "Escape The Brig!", "Loss", 5),
      ];
      const p1 = I.gauntletProgress(g, [...recs, ...later]);
      const done = [...later, mk("e", "Rule The World!", "Win", 6), mk("f", "Stop The Virus!", "Win", 7)];
      const p2 = I.gauntletProgress({ ...g, links: p1.links }, [...recs, ...done]);
      // Deleting a linked record frees its scenario again.
      const p3 = I.gauntletProgress({ ...g, links: p2.links }, [...recs, ...done.filter(r => r.id !== "a")]);
      return {
        unplayedFirst: g.scenarios,
        numeric: I.gauntletOrder(["Stop The Virus!", "Escape The Brig!", "Rule The World!"], recs, ["Bood", "Saaze"], "numeric"),
        p1: [p1.played, p1.wins, p1.losses, p1.next, p1.complete, p1.links],
        p2: [p2.played, p2.wins, p2.losses, p2.complete, p2.seconds, p2.difficulty],
        share: I.gauntletShareText(g, p2),
        p3: [p3.played, p3.links["Confine The Quarks!"], p3.next],
        dur: [I.formatDuration(0), I.formatDuration(59 * 60), I.formatDuration(8040)],
      };
    }, FIXTURE);
    // Bood→Saaze has played 01, 03, 04 in the fixture; 02 is unplayed so comes first.
    expect(out.unplayedFirst).toEqual(["Confine The Quarks!", "Escape The Brig!", "Rule The World!", "Stop The Virus!"]);
    expect(out.numeric).toEqual(["Escape The Brig!", "Rule The World!", "Stop The Virus!"]);
    expect(out.p1).toEqual([2, 1, 1, "Rule The World!", false, { "Confine The Quarks!": "a", "Escape The Brig!": "d" }]);
    expect(out.p2).toEqual([4, 3, 1, true, 6000, "Hard"]);
    expect(out.share).toBe("Twin Stars Gauntlet · Bood & Saaze · 3/4 · Hard · 1h 40m\n02✓ 01✗ 03✓ 04✓");
    expect(out.p3).toEqual([4, "b", null]); // the retry "b" now stands in for deleted "a"
    expect(out.dur).toEqual(["under 1m", "59m", "2h 14m"]);
  });
});

test.describe("Pairing Lab UI", () => {
  test("shows fixture numbers, Wilson note, toggles, filters and logs lab_open", async ({ page }) => {
    await boot(page, { gameRecords: FIXTURE }, { log: true });
    await expect(page.locator("#labBody")).toBeHidden();
    await page.getByRole("button", { name: "Open Pairing Lab" }).click();
    expect((await events(page)).filter(e => e[0] === "lab_open")).toHaveLength(1);
    const rows = page.locator("#labPairsTable tbody tr");
    await expect(rows).toHaveCount(4);
    await expect(rows.nth(0)).toContainText("Bood & Saaze");
    await expect(rows.nth(0)).toContainText("5 of 7");
    await expect(rows.nth(0)).toContainText("71%");
    await expect(rows.nth(1)).toContainText("Fanoobia & Stag Solar");
    await expect(rows.nth(1)).toContainText("few games");
    await expect(page.locator("#labBody")).toContainText("8 of 10 ranks above a pair that won 1 of 1");
    await expect(page.locator("#labNeverBeaten li")).toHaveText([/Bood & Stag Solar\s*0 of 3/, /Fanoobia & Saaze\s*0 of 1/]);
    await expect(page.locator("#labBestResult")).toContainText("Bood & Saaze, won 2 of 3");
    await page.locator("#labBestFor").selectOption(S3);
    await expect(page.locator("#labBestResult")).toContainText("Bood & Saaze, won 2 of 2");
    // Heat map: Bood & Saaze on Scenario 01 = 2/3, with words for screen readers.
    const cell = page.locator("#labHeat tbody tr").first().locator(`td[data-scenario="${S1}"]`);
    await expect(cell).toContainText("2/3");
    await expect(cell).toContainText("won 2 of 3");
    await expect(cell).toHaveClass(/ins-mid|ins-hi/);
    await expect(page.locator("#labOrder")).toContainText("Bood leading: 4 of 5 (80%)");
    await expect(page.locator("#labOrder")).toContainText("Saaze leading: 1 of 2 (50%)");
    await expect(page.locator("#labChars tbody tr").first()).toContainText("Saaze");
    await expect(page.locator("#labDroids")).toContainText("MC-CY");

    await page.getByRole("button", { name: "Primary → Secondary" }).click();
    await expect(page.getByRole("button", { name: "Primary → Secondary" })).toHaveAttribute("aria-pressed", "true");
    await expect(rows).toHaveCount(5);
    await expect(rows.nth(0)).toContainText("4 of 5");
    await expect(rows.nth(0).locator("th")).toHaveText(/Primary\s*Bood.*Secondary\s*Saaze/);

    await page.locator("#labDifficulty").selectOption("Hard");
    await expect(rows).toHaveCount(3); // Bood→Saaze 1/2, Saaze→Bood 0/1, Fanoobia→Saaze 0/1
    await page.getByRole("button", { name: "Either order" }).click();
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText("1 of 3");

    // Remembered open across reload.
    await page.reload();
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await expect(page.locator("#labPairsTable")).toBeVisible();
  });

  test("empty and low-data states say how many games are needed", async ({ page }) => {
    await boot(page, { gameRecords: FIXTURE.slice(0, 2), "tsr:labOpen": "1" }, { log: true });
    await expect(page.locator("#labBody")).toContainText("needs at least 3 saved games; you have 2. Save 1 more");
    await page.locator("#labDifficulty").selectOption("Hard");
    await expect(page.locator("#labBody")).toContainText("3 saved Hard games; you have 1. Save 2 more");
  });

  test("with no records the Lab explains and the Gauntlet still offers to start", async ({ page }) => {
    await boot(page, { "tsr:labOpen": "1" }, { log: true });
    await expect(page.locator("#labBody")).toContainText("you have 0");
    await expect(page.getByRole("button", { name: "Start Gauntlet" })).toBeEnabled();
  });

  test("the Lab updates after a new record is saved", async ({ page }) => {
    await boot(page, { gameRecords: FIXTURE, "tsr:labOpen": "1" }, { log: true });
    await expect(page.locator("#labPairsTable tbody tr").first()).toContainText("5 of 7");
    await page.getByRole("tab", { name: "Randomizer" }).click();
    await page.locator("#manualChar1").selectOption("Saaze");
    await page.locator("#manualChar2").selectOption("Bood");
    await page.locator("#loadManualCombo").click();
    await page.locator("#result").selectOption("Win");
    await page.locator("#saveRecordBtn").click();
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await expect(page.locator("#labPairsTable tbody tr").first()).toContainText("6 of 8");
  });

  test("keyboard: open the Lab, switch view and filter without a mouse", async ({ page }) => {
    await boot(page, { gameRecords: FIXTURE }, { log: true });
    await page.locator("#labToggle").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#labToggle")).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Tab"); // difficulty
    await expect(page.locator("#labDifficulty")).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab"); // second segment
    await expect(page.getByRole("button", { name: "Primary → Secondary" })).toBeFocused();
    await page.keyboard.press("Space");
    await expect(page.getByRole("button", { name: "Primary → Secondary" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Primary → Secondary" })).toBeFocused();
    // The heat map scroller is reachable by keyboard.
    expect(await page.locator(".ins-heat-wrap").getAttribute("tabindex")).toBe("0");
  });
});

async function saveResult(page, result) {
  await page.locator("#result").selectOption(result);
  await page.locator("#difficulty").selectOption("Medium");
  await page.locator("#saveRecordBtn").click();
  await expect(page.locator("#saveRecordBtn")).toHaveText("Saved");
}

test.describe("Gauntlet", () => {
  test("start → play next (pair locked) → save advances → reload → summary + copy", async ({ page, browserName, context }) => {
    if (browserName === "chromium") await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await boot(page, { enabledPacks: ["series1"] }, { log: true });
    await page.locator("#gPickA").selectOption("Bood");
    await page.locator("#gPickB").selectOption("Saaze");
    await page.getByLabel("Scenario number order").check();
    await page.getByRole("button", { name: "Start Gauntlet" }).click();
    await expect(page.locator("#gauntletHeading")).toBeFocused();
    expect((await events(page)).find(e => e[0] === "gauntlet_start")[1]).toEqual({ scenarios: 6 });
    await expect(page.locator("#gauntletBody .g-step")).toHaveCount(6);
    await expect(page.locator("#gauntletBody .g-step").first()).toContainText("Next");

    const order = ["Escape The Brig!", "Confine The Quarks!", "Rule The World!", "Stop The Virus!", "Steal The Plans!", "Hunt The Bounty!"];
    const results = ["Win", "Loss", "Win", "Win", "Loss", "Win"];
    await page.getByRole("button", { name: /^Play next: Scenario 01/ }).click();
    for (let i = 0; i < order.length; i++) {
      await expect(page.locator("#randomizerPage")).toBeVisible();
      await expect(page.locator("#comboHeading")).toHaveText(`Current mission: Bood and Saaze, Scenario 0${i + 1}: ${order[i]}`);
      await expect(page.locator("#lockChar1")).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator("#lockChar2")).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator("#gauntletBar")).toContainText(`Playing Scenario 0${i + 1}`);
      await saveResult(page, results[i]);
      await expect(page.locator("#gauntletBar")).toContainText(i + 1 < 6 ? `${i + 1} of 6 played` : "complete · 4 of 6 won");
      await expect(page.locator("#gauntletBar .g-step").nth(i)).toContainText(results[i] === "Win" ? "won" : "lost", { ignoreCase: true });
      if (i === 2) {
        // Survives reload: progress is in tsr:gauntlet, linked to the saved record ids.
        await page.reload();
        await expect(page.locator("#gauntletBar")).toContainText("3 of 6 played");
        const st = await page.evaluate(() => ({ g: JSON.parse(localStorage.getItem("tsr:gauntlet")), recs: JSON.parse(localStorage.getItem("gameRecords")) }));
        expect(Object.keys(st.g.links)).toEqual(order.slice(0, 3));
        expect(Object.values(st.g.links)).toEqual(st.recs.map(r => r.id));
        // The record schema is untouched.
        for (const r of st.recs) expect(Object.keys(r).sort()).toEqual(["characters", "createdAt", "difficulty", "id", "playtime", "result", "scenario", "timestamp"]);
      }
      if (i + 1 < 6) await page.locator("#gBarPlayNext").click();
    }
    expect((await events(page)).find(e => e[0] === "gauntlet_complete")[1]).toEqual({ wins: 4, total: 6 });
    await page.getByRole("button", { name: "See summary" }).click();
    await expect(page.locator("#gauntletHeading")).toBeFocused();
    await expect(page.locator("#gauntletBody")).toContainText("Gauntlet complete");
    const text = await page.locator("#gShareText").inputValue();
    expect(text).toMatch(/^Twin Stars Gauntlet · Bood & Saaze · 4\/6 · Medium( · [^\n]+)?\n01✓ 02✗ 03✓ 04✓ 05✗ 06✓$/);
    await page.getByRole("button", { name: "Copy result" }).click();
    await expect.poll(async () => (await events(page)).some(e => e[0] === "gauntlet_share")).toBe(true);
    await expect(page.locator("#toastRegion")).toContainText(/copied|selected/i);
    if (browserName === "chromium") expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text);
    // Complete state survives reload too.
    await page.reload();
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await expect(page.locator("#gShareText")).toHaveValue(text);
  });

  test("unplayed-first order, current mission's pair, abandon with undo", async ({ page }) => {
    const recs = [R(["Bood", "Saaze"], "Escape The Brig!", "Win", "Easy"), R(["Bood", "Saaze"], "Confine The Quarks!", "Win", "Easy")];
    await boot(page, { enabledPacks: ["series1"], gameRecords: recs });
    await page.locator("#manualChar1").selectOption("Bood");
    await page.locator("#manualChar2").selectOption("Saaze");
    await page.locator("#loadManualCombo").click();
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await page.locator("#gPickA").selectOption("Kinglan");
    await page.getByRole("button", { name: /Use current mission's pair/ }).click();
    await expect(page.locator("#gPickA")).toHaveValue("Bood");
    await expect(page.locator("#gPickB")).toHaveValue("Saaze");
    await page.getByRole("button", { name: "Start Gauntlet" }).click(); // default: unplayed first
    await expect(page.getByRole("button", { name: /^Play next/ })).toHaveText("Play next: Scenario 03: Rule The World!");
    const names = await page.locator("#gauntletBody .g-name").allTextContents();
    expect(names.map(s => s.slice(0, 11))).toEqual(["Scenario 03", "Scenario 04", "Scenario 05", "Scenario 06", "Scenario 01", "Scenario 02"]);
    // Older records don't count: the gauntlet starts at 0.
    await expect(page.locator("#gauntletBody")).toContainText("0 of 6 played");

    await page.getByRole("button", { name: "Abandon" }).click();
    await expect(page.getByRole("button", { name: "Start Gauntlet" })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("tsr:gauntlet"))).toBeNull();
    await page.locator("#toastRegion").getByRole("button", { name: "Undo" }).click();
    await expect(page.locator("#gauntletBody")).toContainText("0 of 6 played");
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("tsr:gauntlet")).pair)).toEqual(["Bood", "Saaze"]);
  });

  test("ignores a corrupt tsr:gauntlet value", async ({ page }) => {
    await boot(page, { "tsr:gauntlet": "{not json" }, { log: true });
    await expect(page.getByRole("button", { name: "Start Gauntlet" })).toBeVisible();
    await expect(page.locator("#gauntletBar")).toBeHidden();
  });
});

test.describe("360px phone", () => {
  test.use({ viewport: { width: 360, height: 740 } });
  test("Lab, heat map and Gauntlet fit without page-level horizontal scroll", async ({ page }) => {
    const g = { v: 1, id: "g1", pair: ["Grant Rockgardner", "Roux Jaezmina"], order: "numeric",
      scenarios: ["Escape The Brig!", "Confine The Quarks!", "Rule The World!", "Stop The Virus!", "Steal The Plans!", "Hunt The Bounty!"],
      startedAt: "2026-01-01T00:00:00.000Z", links: {} };
    await boot(page, { gameRecords: FIXTURE, "tsr:labOpen": "1", "tsr:gauntlet": g });
    await expect(page.locator("#gauntletBar")).toContainText("0 of 6 played");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await page.getByRole("button", { name: "Primary → Secondary" }).click();
    await expect(page.locator("#labHeat")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    const box = await page.locator("#gPlayNext").boundingBox();
    expect(box.x + box.width).toBeLessThanOrEqual(360);
  });
});

const AXE = process.env.AXE_CORE_PATH;
for (const theme of ["dark", "light"]) {
  test(`Pairing Lab + Gauntlet have no axe violations (${theme})`, async ({ browser }) => {
    test.skip(!AXE || !fs.existsSync(AXE), "set AXE_CORE_PATH to axe.min.js to run");
    const context = await browser.newContext({ bypassCSP: true });
    const page = await context.newPage();
    const g = { v: 1, id: "g1", pair: ["Bood", "Saaze"], order: "numeric", scenarios: [S1, S2, S3],
      startedAt: "2026-01-01T00:00:00.000Z", links: {} };
    await boot(page, { gameRecords: FIXTURE, "tsr:labOpen": "1", "tsr:gauntlet": g, theme });
    await page.addScriptTag({ path: AXE });
    const bar = await page.evaluate(() => axe.run("#gauntletBar", { resultTypes: ["violations"] }));
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await expect(page.locator("#labHeat")).toBeVisible();
    const lab = await page.evaluate(() => axe.run("#insightsRoot", { resultTypes: ["violations"] }));
    const summary = [...bar.violations, ...lab.violations].map(v => `${v.id}: ${v.nodes.slice(0, 3).map(n => n.target.join(" ")).join(", ")}`);
    expect(summary).toEqual([]);
    await context.close();
  });
}

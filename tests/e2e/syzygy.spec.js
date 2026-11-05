import { test, expect } from "@playwright/test";

// SYZYGY v2: the campaign follows the two SYZYGY booklets (rules/twinstars1-syzygy.png,
// rules/twinstars2-syzygy.png). The state machine is driven in the page (szNewCampaign /
// szApply are plain globals in app.js), then the UI flows are exercised end to end.

function seed(values = {}, packs = ["series1", "series2"]) {
  return async (page) => {
    await page.addInitScript(({ v, packs }) => {
      if (localStorage.getItem("__seeded")) return;
      localStorage.setItem("__seeded", "1");
      localStorage.setItem("hasSeenTip", "1");
      localStorage.setItem("seenPrimarySecondaryNotice", "1");
      localStorage.setItem("enabledPacks", JSON.stringify(packs));
      for (const [k, val] of Object.entries(v)) localStorage.setItem(k, typeof val === "string" ? val : JSON.stringify(val));
    }, { v: values, packs });
  };
}
const saved = (page, key = "syzygyCampaign") => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);

// Every terminal sequence of the booklets (W = win, L = loss).
const TERMINAL = {
  syzygy1: {
    "GROSKSH'D": ["LL", "LWL", "WLL", "LWWL", "WLWL", "WWLL"],
    LEGENDS: ["WWWW"],
    FREE: ["LWWWW", "WLWWW", "WWLWW", "WWWLW"],
    ALIVE: ["LWWWL", "WLWWL", "WWLWL", "WWWLL"],
  },
  syzygy2: {
    LOADED: ["WWW"],
    SAFE: ["LWWW", "WLWW"],
    "BACK TO SQUARE ONE": ["LLWWW", "LWLWW"],
    "LOST IN THE UNIVERSE": ["WWL", "WLL", "LLL", "LWWL", "WLWL", "LLWL", "LWLL", "LLWWL", "LWLWL"],
  },
};

test.describe("SYZYGY state machine", () => {
  test("every terminal sequence of both booklets ends with the right rank, and no earlier", async ({ page }) => {
    await seed()(page);
    await page.goto("/");
    const out = await page.evaluate((TERMINAL) => {
      const res = [];
      let count = 0;
      for (const [mode, ranks] of Object.entries(TERMINAL)) {
        for (const [rank, seqs] of Object.entries(ranks)) {
          for (const seq of seqs) {
            count++;
            let c = szNewCampaign(mode, ["Bood", "Saaze", "Kinglan"], ["c0", "c1", "c2", "c3", "c4", "c5"]);
            for (let k = 0; k < seq.length; k++) {
              if (c.completed) { res.push(`${mode} ${seq}: ended early after ${k}`); break; }
              if (c.card === null) c.card = 1 + 2 * (c.node - 1);   // B or C: take the left card
              const pool = szPool(c);
              const lostBefore = seq.slice(0, k).split("").filter(x => x === "L").length;
              const lastWasLoss = k > 0 && seq[k - 1] === "L";
              const wantPool = mode === "syzygy1" && lastWasLoss && lostBefore === 1 ? 3 : 5;
              if (pool !== wantPool) res.push(`${mode} ${seq}: pool ${pool} at step ${k}, want ${wantPool}`);
              c = szApply(c, seq[k] === "W" ? "Win" : "Loss", []);
            }
            if (!c.completed) res.push(`${mode} ${seq}: not finished`);
            else if (c.rank.rank !== rank) res.push(`${mode} ${seq}: ${c.rank.rank}, want ${rank}`);
            if (!isValidSz(c)) res.push(`${mode} ${seq}: final campaign fails isValidSz`);
          }
        }
      }
      return { res, count };
    }, TERMINAL);
    expect(out.count).toBe(29);
    expect(out.res).toEqual([]);
  });

  test("Mode I: four sections, a loss retries the same section, B/C switch is allowed", async ({ page }) => {
    await seed()(page);
    await page.goto("/");
    const r = await page.evaluate(() => {
      let c = szNewCampaign("syzygy1", ["A1", "A2", "A3"], ["s0", "s1", "s2", "s3", "s4", "s5"]);
      const trail = [];
      c = szApply(c, "Win", []);                     // A won → section B, card not chosen yet
      trail.push([c.node, c.card]);
      c.card = 2;                                    // pick B right
      c = szApply(c, "Loss", []);                    // first loss: retry B with 3
      trail.push([c.node, c.card, c.retry, szPool(c)]);
      c.card = 1;                                    // switch to B left on the retry
      c = szApply(c, "Win", []);
      trail.push([c.node, c.card, c.retry, szPool(c)]);
      return { trail, scen: c.results.map(x => x.scenario + ":" + x.node + (x.retry ? "r" : "")) };
    });
    expect(r.trail).toEqual([[1, null], [1, 2, true, 3], [2, null, false, 5]]);
    expect(r.scen).toEqual(["s0:A", "s2:B", "s1:Br"]);
  });

  test("Mode II: graph moves, no retries, losing two characters is LOST", async ({ page }) => {
    await seed()(page);
    await page.goto("/");
    const r = await page.evaluate(() => {
      let c = szNewCampaign("syzygy2", ["A1", "A2", "A3"], ["S", "a", "b", "x", "y", "z"]);
      const path = [c.node];
      for (const x of ["Loss", "Win", "Loss"]) { c = szApply(c, x, []); path.push(c.node); }
      const noRetry = c.retry === false && szPool(c) === 5;
      // Losing two characters ends the campaign even off the bottom row.
      let d = szNewCampaign("syzygy2", ["A1", "A2", "A3"], ["S", "a", "b", "x", "y", "z"]);
      d.playing = [0, 1];
      d = szApply(d, "Loss", [0]);                 // S → a, A1 eliminated, A2 + A3 must play
      const afterOne = [d.node, d.completed, d.playing];
      d = szApply(d, "Loss", [2]);                 // a → x would continue, but 2 characters are gone
      return { path, noRetry, afterOne, end: [d.node, d.completed, d.rank.rank] };
    });
    expect(r.path).toEqual(["S", "a", "b", "y"]);
    expect(r.noRetry).toBe(true);
    expect(r.afterOne).toEqual(["a", false, [1, 2]]);
    expect(r.end).toEqual(["LOST", true, "LOST IN THE UNIVERSE"]);
  });

  test("isValidSz accepts only v2 campaigns", async ({ page }) => {
    await seed()(page);
    await page.goto("/");
    const r = await page.evaluate(() => {
      const c = szNewCampaign("syzygy1", ["A1", "A2", "A3"], ["s0", "s1", "s2", "s3", "s4", "s5"]);
      const v1 = { mode: "syzygy1", characters: ["a", "b", "c"], removed: [false, false, false], stage: 0, branchChosen: null,
        scenarios: ["a", "b", "c", "d"], carryover: [{ energy: 0, health: 0 }, { energy: 0, health: 0 }, { energy: 0, health: 0 }],
        stageResults: [], losses: 0 };
      return [isValidSz(c), isValidSz(v1), isLegacySz(v1), isValidSz({ ...c, playing: [0, 0] }), isValidSz({ ...c, node: 7 }), isValidSz({ ...c, alloc: null })];
    });
    expect(r).toEqual([true, false, true, false, false, false]);
  });
});

async function startCampaign(page, modeSel, chars) {
  await page.getByRole("tab", { name: "SYZYGY" }).click();
  await page.locator(modeSel).click();
  for (const c of chars) await page.locator(`.syzygy-char-btn[data-char="${c}"]`).click();
  await page.locator("#szStartBtn").click();
}

test.describe("SYZYGY campaign UI", () => {
  test("Mode I: choose players, allocate, retry with 3 after a loss, eliminate, switch card, finish FREE", async ({ page }) => {
    await seed()(page);
    await page.goto("/");
    await startCampaign(page, "#szSel1", ["Bood", "Stag Solar", "Fanoobia"]);
    await expect(page.locator("#szStageHeading")).toContainText("Section A");
    // Outcome is blocked until the player chooses who plays.
    await expect(page.locator("#szWinBtn")).toBeDisabled();
    await page.locator('[data-player="0"]').click();
    await page.locator('[data-player="2"]').click();
    await expect(page.locator(".syzygy-playing").first()).toContainText("Sitting out: Stag Solar (heals to full)");
    await expect(page.locator(".syzygy-pool-bar")).toHaveText("5 resources left to share");
    await page.getByRole("button", { name: "Add 1 health to Bood" }).click();
    await page.getByRole("button", { name: "Add 1 energy to Fanoobia" }).click();
    await expect(page.locator(".syzygy-pool-bar")).toHaveText("3 resources left to share");
    await page.getByRole("button", { name: "Add 1 left-over energy to Bood" }).click();
    await page.locator("#szWinBtn").click();

    // Section B: pick a card.
    await expect(page.locator("#szStageHeading")).toContainText("Section B: Choose a Card");
    const s = await saved(page);
    expect(s.v).toBe(2);
    expect(s.carry[0]).toEqual({ health: 0, energy: 1 });
    expect(s.playing).toBeNull();                      // chosen again before each scenario
    await expect(page.locator(".sz-map")).toContainText("✓");
    await expect(page.locator(".sz-map")).toContainText("Won");
    await page.locator("#szBranchL").click();
    await expect(page.locator("#szStageHeading")).toContainText("Section B");
    await page.locator('[data-player="0"]').click();
    await page.locator('[data-player="1"]').click();
    // Defeat asks who hit 0 health.
    await page.locator("#szLossBtn").click();
    await expect(page.locator("#szLossHeading")).toBeFocused();
    await page.getByLabel("Stag Solar reached 0 health").check();
    await page.locator("#szLossConfirm").click();
    await expect(page.locator(".toast")).toContainText("Stag Solar is out of the campaign");
    // Retry: 3 resources, same section, may switch card; only 2 left so both play.
    await expect(page.locator("#szStageHeading")).toContainText("Section B · Retry");
    await expect(page.locator(".syzygy-retry-notice")).toContainText("only 3 resources");
    await expect(page.locator(".syzygy-pool-bar")).toHaveText("3 resources left to share");
    await expect(page.locator(".syzygy-char-card.removed")).toContainText("Eliminated");
    await expect(page.locator("[data-player]")).toHaveCount(0);
    const before = (await saved(page)).card;
    await page.locator("#szSwitchBtn").click();
    const after = await saved(page);
    expect(after.card).not.toBe(before);
    expect([1, 2]).toContain(after.card);
    expect(after.eliminated).toEqual([false, true, false]);
    await page.locator("#szWinBtn").click();
    // Section C: back to 5, pick right card, win; D: win.
    await expect(page.locator(".syzygy-retry-notice")).toHaveCount(0);
    await page.locator("#szBranchR").click();
    await expect(page.locator(".syzygy-pool-bar")).toHaveText("5 resources left to share");
    await page.locator("#szWinBtn").click();
    await expect(page.locator("#szStageHeading")).toContainText("Section D");
    await page.locator("#szWinBtn").click();
    await expect(page.locator(".syzygy-rank-value")).toHaveText("FREE");
    await expect(page.locator("#syzygyCampaignContent tbody tr")).toHaveCount(5);
    await expect(page.locator("#syzygyCampaignContent")).toContainText("Eliminated: Stag Solar");
  });

  test("Mode II: Waypoint pyramid, no retry, bottom-row loss is LOST", async ({ page }) => {
    await seed()(page);
    await page.goto("/");
    await startCampaign(page, "#szSel2", ["Bood", "Smiff", "Zoaze"]);
    const s = await saved(page);
    expect(s.cards.slice().sort()).toEqual(["Beat the Odds!", "Control the Skies!", "Destroy the Order!", "Master the Trials!", "Sell the Junk!", "Serve the Rabble!"]);
    await expect(page.locator(".sz-map-2 .sz-node")).toHaveCount(9);   // 6 waypoints + LOST, LOST, HOME
    await expect(page.locator(".sz-pos-S")).toContainText("Playing now");
    await expect(page.locator(".sz-pos-b")).toContainText("Next if you win");
    await expect(page.locator(".sz-pos-a")).toContainText("Next if you lose");
    await page.locator('[data-player="0"]').click();
    await page.locator('[data-player="1"]').click();
    await page.locator("#szLossBtn").click();
    await page.locator("#szLossConfirm").click();              // lost another way: nobody eliminated
    await expect(page.locator(".syzygy-retry-notice")).toHaveCount(0);
    await expect(page.locator(".sz-pos-S")).toContainText("Lost");
    await expect(page.locator(".sz-pos-a")).toContainText("Playing now");
    await page.locator('[data-player="1"]').click();
    await page.locator('[data-player="2"]').click();
    await expect(page.locator(".syzygy-pool-bar")).toHaveText("5 resources left to share");
    await page.locator("#szWinBtn").click();                   // a → b
    await page.locator('[data-player="0"]').click();
    await page.locator('[data-player="2"]').click();
    await page.locator("#szLossBtn").click();
    await page.locator("#szLossConfirm").click();              // b → y
    await expect(page.locator(".sz-pos-y")).toContainText("Playing now");
    await page.locator('[data-player="0"]').click();
    await page.locator('[data-player="1"]').click();
    await page.locator("#szLossBtn").click();
    await page.locator("#szLossConfirm").click();              // y loss → LOST
    await expect(page.locator(".syzygy-rank-value")).toHaveText("LOST IN THE UNIVERSE");
    await expect(page.locator(".sz-end.is-loss")).toContainText("You ended here");
  });

  test("Mode II reaches HOME as SAFE with one loss", async ({ page }) => {
    await seed()(page);
    await page.goto("/");
    await startCampaign(page, "#szSel2", ["Bood", "Smiff", "Zoaze"]);
    for (const r of ["W", "L", "W", "W"]) {
      await page.locator('[data-player="0"]').click();
      await page.locator('[data-player="1"]').click();
      if (r === "W") await page.locator("#szWinBtn").click();
      else { await page.locator("#szLossBtn").click(); await page.locator("#szLossConfirm").click(); }
    }
    await expect(page.locator(".syzygy-rank-value")).toHaveText("SAFE");
    await expect(page.locator(".sz-end.is-win")).toContainText("HOME");
  });

  test("mode gating: Mode I needs Series 1; Mode II works with Series 2 alone; both name the booklet", async ({ page }) => {
    await seed({}, ["series2"])(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "SYZYGY" }).click();
    await expect(page.locator("#szSel1")).toHaveAttribute("aria-disabled", "true");
    await expect(page.locator("#szSel1")).toContainText("Needs Series 1");
    await expect(page.locator("#szSel2")).toHaveAttribute("aria-disabled", "false");
    for (const id of ["#szSel1", "#szSel2"]) await expect(page.locator(id)).toContainText("Requires the SYZYGY booklet");
    await page.locator("#szSel2").click();
    await expect(page.locator("#szSetS1")).toHaveCount(0);       // only one series owned: no choice
  });

  test("Mode II with both series offers the scenario set; Series 1 cards are used when picked", async ({ page }) => {
    await seed()(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "SYZYGY" }).click();
    await page.locator("#szSel2").click();
    await expect(page.locator("#szSetS2")).toHaveAttribute("aria-pressed", "true");
    await page.locator("#szSetS1").click();
    for (const c of ["Bood", "Stag Solar", "Fanoobia"]) await page.locator(`.syzygy-char-btn[data-char="${c}"]`).click();
    await page.locator("#szStartBtn").click();
    const s = await saved(page);
    expect(s.set).toBe("series1");
    expect(s.cards).toContain("Escape The Brig!");
  });

  test("recording an outcome and abandoning can both be undone", async ({ page }) => {
    await seed()(page);
    await page.goto("/");
    await startCampaign(page, "#szSel1", ["Bood", "Stag Solar", "Fanoobia"]);
    await page.locator('[data-player="0"]').click();
    await page.locator('[data-player="1"]').click();
    await page.locator("#szLossBtn").click();
    await page.getByLabel("Bood reached 0 health").check();
    await page.locator("#szLossConfirm").click();
    expect((await saved(page)).eliminated).toEqual([true, false, false]);
    await page.locator(".toast-action").click();
    let s = await saved(page);
    expect(s.losses).toBe(0);
    expect(s.eliminated).toEqual([false, false, false]);
    expect(s.results).toHaveLength(0);
    await page.locator("#szAbandonBtn").click();
    await page.locator("#szAbandonConfirm").click();
    await expect(page.getByText("Begin Campaign")).toBeVisible();
    await page.locator(".toast-action").click();
    s = await saved(page);
    expect(s.v).toBe(2);
    await expect(page.locator("#szAbandonBtn")).toBeVisible();
  });
});

const V1_ACTIVE = {
  mode: "syzygy1", characters: ["Grant Rockgardner", "Roux Jaezmina", "Brenimov-X"], removed: [false, false, false],
  stage: 1, branchChosen: 0, scenarios: ["Confine The Quarks!", "Escape The Brig!", "Steal The Plans!", "Hunt The Bounty!"],
  carryover: [{ energy: 1, health: 2 }, { energy: 0, health: 0 }, { energy: 2, health: 1 }],
  alloc: null, stageResults: [{ stage: 0, scenario: "Confine The Quarks!", chars: [1, 2], result: "Win", ts: "x" }], losses: 0,
  retrying: false, started: "1/2/2026", completed: false, finalRank: null,
};

test.describe("SYZYGY v1 migration", () => {
  test("an unfinished v1 campaign is offered Keep read-only, never converted", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await seed({ syzygyCampaign: V1_ACTIVE })(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "SYZYGY" }).click();
    await expect(page.locator("#szStageHeading")).toHaveText("SYZYGY Has Changed");
    await expect(page.locator("#szLegacyPanel")).toContainText("Confine The Quarks!");
    expect(await saved(page)).toEqual(V1_ACTIVE);            // untouched until the player decides
    await page.locator("#szLegacyKeep").click();
    await expect(page.getByText("Begin Campaign")).toBeVisible();
    await expect(page.locator("#szKeptPanel")).toContainText("Old Campaign (read-only)");
    await expect(page.locator("#szKeptPanel")).toContainText("Confine The Quarks!");
    expect(await saved(page)).toBeNull();
    expect(await saved(page, "syzygyCampaignV1")).toEqual(V1_ACTIVE);
    // A new campaign can start alongside the kept one, and it survives a reload.
    await page.locator("#szSel1").click();
    for (const c of ["Bood", "Stag Solar", "Fanoobia"]) await page.locator(`.syzygy-char-btn[data-char="${c}"]`).click();
    await page.locator("#szStartBtn").click();
    await page.reload();
    await page.getByRole("tab", { name: "SYZYGY" }).click();
    await expect(page.locator("#szAbandonBtn")).toBeVisible();
    expect(await saved(page, "syzygyCampaignV1")).toEqual(V1_ACTIVE);
    expect(errors).toEqual([]);
  });

  test("an unfinished v1 campaign can be abandoned (with undo)", async ({ page }) => {
    await seed({ syzygyCampaign: V1_ACTIVE })(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "SYZYGY" }).click();
    await page.locator("#szLegacyAbandon").click();
    await expect(page.getByText("Begin Campaign")).toBeVisible();
    expect(await saved(page)).toBeNull();
    await page.locator(".toast-action").click();
    await expect(page.locator("#szStageHeading")).toHaveText("SYZYGY Has Changed");
    expect(await saved(page)).toEqual(V1_ACTIVE);
  });

  test("a finished v1 campaign keeps showing its rank and log", async ({ page }) => {
    await seed({ syzygyCampaign: { ...V1_ACTIVE, completed: true, losses: 2, finalRank: { rank: "ALIVE", desc: "x" } } })(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "SYZYGY" }).click();
    await expect(page.locator(".syzygy-rank-value")).toHaveText("ALIVE");
    await expect(page.locator("#syzygyCampaignContent tbody tr")).toHaveCount(1);
  });
});

test.describe("SYZYGY keyboard only", () => {
  // Moves focus with Tab until the predicate matches (proves the control is in the Tab order).
  async function tabTo(page, selector, max = 80) {
    for (let i = 0; i < max; i++) {
      if (await page.evaluate((s) => document.activeElement && document.activeElement.matches(s), selector)) return;
      await page.keyboard.press("Tab");
    }
    throw new Error("Tab never reached " + selector);
  }

  test("a Mode II campaign can be set up, played and finished with the keyboard alone", async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "WebKit's default Tab order skips buttons (Safari's option-Tab setting)");
    await seed()(page);
    await page.goto("/");
    await page.locator("#syzygyCampaignTab").focus();
    await page.keyboard.press("Enter");
    await tabTo(page, "#szSel2");
    await page.keyboard.press("Enter");
    for (const c of ["Bood", "Smiff", "Zoaze"]) {
      await tabTo(page, `.syzygy-char-btn[data-char="${c}"]`);
      await page.keyboard.press("Enter");
    }
    await tabTo(page, "#szStartBtn");
    await page.keyboard.press("Enter");
    for (let k = 0; k < 3; k++) {
      await expect(page.locator("#szStageHeading")).toBeFocused();
      await tabTo(page, '[data-player="0"]');
      await page.keyboard.press("Enter");
      await tabTo(page, '[data-player="1"]');
      await page.keyboard.press(" ");
      await tabTo(page, 'button[aria-label="Add 1 energy to Bood"]');
      await page.keyboard.press("Enter");
      await tabTo(page, "#szWinBtn");
      await page.keyboard.press("Enter");
    }
    await expect(page.locator(".syzygy-rank-value")).toHaveText("LOADED");
    await expect(page.locator("#szStageHeading")).toBeFocused();
  });
});

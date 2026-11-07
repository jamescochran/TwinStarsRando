import { test, expect } from "@playwright/test";

// Mission Board (board.js): counters for health, energy and scenario tracks on a running
// mission, with first-use setup remembered per character/scenario, undo/redo, wake lock,
// reload restore and recording the outcome through the normal save path.

const A = "Bood", B = "Stag Solar", C = "Saaze", SC = "Escape The Brig!";

async function setup(page, storage = {}) {
  await page.route("https://umami.1jc.in/**", r => r.abort());
  await page.route(/somafm\.com/, r => r.abort());
  await page.addInitScript((v) => {
    window.__events = [];
    window.umami = { track: (name, data) => { window.__events.push([name, data]); } };
    window.__wake = { requests: 0, releases: 0 };
    try {
      Object.defineProperty(navigator, "wakeLock", { configurable: true, value: {
        request: async () => {
          window.__wake.requests++;
          if (window.__wakeReject) throw new DOMException("refused", "NotAllowedError");
          const l = { released: false, addEventListener() {}, release: async () => { if (!l.released) { l.released = true; window.__wake.releases++; } } };
          return l;
        },
      } });
    } catch (e) {}
    if (sessionStorage.getItem("__seeded")) return;
    sessionStorage.setItem("__seeded", "1");
    localStorage.clear();
    localStorage.setItem("hasSeenTip", "1");
    localStorage.setItem("seenPrimarySecondaryNotice", "1");
    localStorage.setItem("enabledPacks", JSON.stringify(["series1"]));
    localStorage.setItem("lastDifficulty", "Medium");
    localStorage.setItem("tsr:board:enabled", "1"); // opt-in; tests that check the default override it
    for (const [k, val] of Object.entries(v)) {
      if (val === null) localStorage.removeItem(k);
      else localStorage.setItem(k, typeof val === "string" ? val : JSON.stringify(val));
    }
  }, storage);
  await page.goto("/");
}

async function loadMission(page, a, b, sc) {
  await page.locator("#manualChar1").selectOption(a);
  await page.locator("#manualChar2").selectOption(b);
  await page.locator("#manualScenario").selectOption(sc);
  await page.getByRole("button", { name: /Load Mission/i }).click();
  await expect(page.locator("#timerDisplay")).toBeVisible();
}

// The app smooth-scrolls a newly loaded card into view, which can make a click land
// mid-scroll; open the board idempotently and retry until it is showing.
async function openBoardUI(page) {
  const toggle = page.locator("#boardToggleBtn");
  await expect(async () => {
    if (await toggle.getAttribute("aria-expanded") !== "true") await toggle.click();
    await expect(page.locator("#missionBoard")).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10000 });
}

// Characters and scenario already set up, so the board opens straight to its counters.
const KNOWN = {
  [`tsr:board:char:${A}`]: { health: 5 },
  [`tsr:board:char:${B}`]: { health: 4 },
  [`tsr:board:scenario:${SC}`]: {
    energy: { Easy: 4, Medium: 3, Hard: 2 },
    tracks: [
      { name: "Base precision", min: 0, max: 6, start: 2 },
      { name: "Current precision", min: 0, max: 6, start: 2 },
    ],
  },
};

const val = (page, label) => page.getByRole("spinbutton", { name: label, exact: true });

async function openKnownBoard(page) {
  await setup(page, KNOWN);
  await loadMission(page, A, B, SC);
  await openBoardUI(page);
  await expect(page.locator("#missionBoard")).toBeVisible();
}

test("first use asks for starting values, remembers them, and prefills new ones", async ({ page }) => {
  await setup(page);
  await loadMission(page, A, B, SC);
  await openBoardUI(page);
  await expect(page.getByRole("heading", { name: "Set Up the Mission Board" })).toBeVisible();

  // Empty required fields are refused with a message.
  await page.locator("#bdSetupSave").click();
  await expect(page.locator("#bdSetupErr")).toBeVisible();
  await expect(page.locator("#bdSetH0")).toBeFocused();

  await page.locator("#bdSetH0").fill("5");
  await page.locator("#bdSetH1").fill("6");
  await page.locator("#bdSetEEasy").fill("4");
  await page.locator("#bdSetEMedium").fill("3");
  await page.locator("#bdSetEHard").fill("2");
  // A preset track is offered and editable; add a second one.
  await expect(page.locator(".bd-t-name").first()).toHaveValue("Track 1");
  await page.locator(".bd-t-name").first().fill("Base precision");
  await page.locator(".bd-t-max").first().fill("6");
  await page.locator(".bd-t-start").first().fill("2");
  await page.locator("#bdAddTrack").click();
  await page.locator(".bd-t-name").nth(1).fill("Current precision");
  await page.locator(".bd-t-max").nth(1).fill("6");
  await page.locator(".bd-t-start").nth(1).fill("2");
  await page.locator("#bdSetupSave").click();

  await expect(val(page, `${A} health`)).toHaveText("5");
  await expect(val(page, `${B} health`)).toHaveText("6");
  await expect(val(page, "Energy")).toHaveText("3"); // Medium
  await expect(val(page, "Base precision")).toHaveText("2");
  await expect(val(page, "Current precision")).toHaveText("2");
  // The two similar tracks are styled differently.
  const styles = await page.locator(".bd-tracks .bd-counter").evaluateAll(els => els.map(el => getComputedStyle(el).borderTopStyle + getComputedStyle(el).borderTopColor));
  expect(styles[0]).not.toBe(styles[1]);

  const stored = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith("tsr:board:")).map(k => [k, localStorage.getItem(k)])));
  expect(JSON.parse(stored[`tsr:board:char:${A}`]).health).toBe(5);
  expect(JSON.parse(stored[`tsr:board:scenario:${SC}`]).energy).toEqual({ Easy: 4, Medium: 3, Hard: 2 });
  const ev = await page.evaluate(() => window.__events.filter(e => e[0].startsWith("board_")));
  expect(ev.map(e => e[0])).toEqual(["board_open", "board_setup_saved"]);
  expect(ev[1][1]).toEqual({ tracks: 2, edit: false });

  // Same mission again: no prompt, fresh counters.
  await loadMission(page, A, B, SC);
  await openBoardUI(page);
  await expect(val(page, `${A} health`)).toHaveText("5");
  await expect(page.locator("#bdSetup")).toHaveCount(0);

  // A new character: prompt again, prefilled from what was entered before.
  await loadMission(page, A, C, SC);
  await openBoardUI(page);
  await expect(page.locator("#bdSetup")).toBeVisible();
  await expect(page.locator("#bdSetH0")).toHaveValue("5");
  await expect(page.locator("#bdSetH1")).toHaveValue("6");
  await expect(page.locator("#bdSetEHard")).toHaveValue("2");
  await expect(page.locator(".bd-t-name").nth(1)).toHaveValue("Current precision");

  // Edit setup later.
  await page.locator("#bdSetH1").fill("3");
  await page.locator("#bdSetupSave").click();
  await expect(val(page, `${C} health`)).toHaveText("3");
  await page.locator("#bdEdit").click();
  await page.locator("#bdSetH0").fill("7");
  await page.locator("#bdSetupSave").click();
  await expect(page.locator(".bd-h0 .bd-range")).toHaveText("0–7");
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)).health, `tsr:board:char:${A}`)).toBe(7);
});

test("counters change, clamp, and undo/redo every step (buttons and Ctrl+Z)", async ({ page }) => {
  await openKnownBoard(page);
  const hp = val(page, `${A} health`);
  const minus = page.getByRole("button", { name: `${A} health minus 1` });
  const plus = page.getByRole("button", { name: `${A} health plus 1` });
  await minus.click(); await minus.click(); await minus.click();
  await expect(hp).toHaveText("2");
  await plus.click(); await plus.click(); await plus.click();
  await plus.click({ force: true }); // at max 5: a no-op (aria-disabled but still focusable)
  await expect(hp).toHaveText("5");
  await expect(plus).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("button", { name: "Energy minus 1" }).click();
  await expect(val(page, "Energy")).toHaveText("2");
  await expect(page.locator("#bdLogLast")).toContainText("Energy 3 → 2");

  await page.locator("#bdUndo").click();
  await expect(val(page, "Energy")).toHaveText("3");
  await page.locator("#bdUndo").click();
  await page.locator("#bdUndo").click();
  await expect(hp).toHaveText("3");
  await page.locator("#bdRedo").click();
  await expect(hp).toHaveText("4");

  // Keyboard shortcuts (focus on the page, not a text field).
  await page.locator("#bdTitle").focus();
  const mod = process.platform === "darwin" ? "Meta" : "Control";
  await page.keyboard.press(`${mod}+z`);
  await expect(hp).toHaveText("3");
  await page.keyboard.press(`${mod}+Shift+z`);
  await expect(hp).toHaveText("4");
  for (let i = 0; i < 6; i++) await page.keyboard.press(`${mod}+z`);
  await expect(hp).toHaveText("5");
  await expect(page.locator("#bdUndo")).toHaveAttribute("aria-disabled", "true");

  // Typing a value with Set (out of range is clamped).
  await page.getByRole("button", { name: "Set Base precision" }).click();
  await page.locator("#bdInput-t0").fill("9");
  await page.keyboard.press("Enter");
  await expect(val(page, "Base precision")).toHaveText("6");
  await expect(val(page, "Base precision")).toBeFocused();
  await expect(val(page, "Current precision")).toHaveText("2");
});

test("keyboard: arrows, Home/End on a focused counter; announcements are throttled", async ({ page }) => {
  await openKnownBoard(page);
  await page.evaluate(() => {
    window.__said = [];
    new MutationObserver(() => { const t = document.getElementById("ariaLive").textContent; if (t) window.__said.push(t); })
      .observe(document.getElementById("ariaLive"), { childList: true, characterData: true, subtree: true });
  });
  const hp = val(page, `${B} health`);
  await hp.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowLeft");
  await expect(hp).toHaveText("1");
  await expect(hp).toHaveAttribute("aria-valuenow", "1");
  await expect(hp).toHaveAttribute("aria-valuetext", "1 of 4");
  await expect.poll(() => page.evaluate(() => window.__said.filter(s => s.includes("health")))).toEqual([`${B} health 1`]);
  await page.keyboard.press("End");
  await expect(hp).toHaveText("4");
  await page.keyboard.press("Home");
  await expect(hp).toHaveText("0");
  await page.keyboard.press("ArrowUp");
  await expect(hp).toHaveText("1");
  // Enter opens typing; Escape cancels without a change.
  await page.keyboard.press("Enter");
  await expect(page.locator("#bdInput-h1")).toBeFocused();
  await page.keyboard.type("3");
  await page.keyboard.press("Escape");
  await expect(hp).toHaveText("1");
  await expect(page.locator("#missionBoard")).toBeVisible();
  // Difficulty radio group: arrows move the selection and the energy follows (unused pool).
  await page.getByRole("radio", { name: "Medium" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Hard" })).toBeFocused();
  await expect(page.getByRole("radio", { name: "Hard" })).toHaveAttribute("aria-checked", "true");
  await expect(val(page, "Energy")).toHaveText("2");
  await expect(page.locator("#difficulty")).toHaveValue("Hard");
});

test("wake lock is requested while the board is open and released on close", async ({ page }) => {
  await openKnownBoard(page);
  await expect.poll(() => page.evaluate(() => window.__wake.requests)).toBe(1);
  await expect(page.locator("#bdWake")).toBeVisible();
  await page.locator("#bdClose").click();
  await expect(page.locator("#missionBoard")).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.__wake.releases)).toBe(1);
  await expect(page.locator("#boardToggleBtn")).toBeFocused();
});

test("a refused wake lock does not break the board", async ({ page }) => {
  await page.addInitScript(() => { window.__wakeReject = true; });
  await openKnownBoard(page);
  await page.getByRole("button", { name: `${A} health minus 1` }).click();
  await expect(val(page, `${A} health`)).toHaveText("4");
  await expect(page.locator("#bdWake")).toBeHidden();
  expect(await page.evaluate(() => window.__wake.requests)).toBeGreaterThan(0);
});

test("reload restores the mission, the board and its history, with the timer paused", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-03-01T12:00:00") });
  await page.clock.pauseAt(new Date("2026-03-01T12:00:01"));
  await openKnownBoard(page);
  await page.clock.runFor(95_000);
  await page.getByRole("button", { name: `${A} health minus 1` }).click();
  await page.getByRole("button", { name: "Current precision plus 1" }).click();
  await page.reload();
  await expect(page.locator("#missionBoard")).toBeVisible();
  await expect(val(page, `${A} health`)).toHaveText("4");
  await expect(val(page, "Current precision")).toHaveText("3");
  await expect(page.locator(".combo-characters")).toContainText(A);
  await expect(page.locator("#pauseBtn")).toHaveText("Resume");
  await expect(page.locator("#timerDisplay")).toHaveText("01:35");
  await page.clock.runFor(5000);
  await expect(page.locator("#timerDisplay")).toHaveText("01:35");
  // History survived too.
  await page.locator("#bdUndo").click();
  await expect(val(page, "Current precision")).toHaveText("2");
  // A closed board stays closed after reload, but the mission comes back.
  await page.locator("#bdClose").click();
  await page.reload();
  await expect(page.locator("#missionBoard")).toBeHidden();
  await expect(page.locator("#boardToggleBtn")).toHaveText(/Mission Board/);
  await openBoardUI(page);
  await expect(val(page, `${A} health`)).toHaveText("4");
});

test("0 health offers Record Loss, which saves exactly one valid record with the timer's time", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-03-01T12:00:00") });
  await page.clock.pauseAt(new Date("2026-03-01T12:00:01"));
  await openKnownBoard(page);
  await page.clock.runFor(125_000);
  const minus = page.getByRole("button", { name: `${B} health minus 1` });
  for (let i = 0; i < 4; i++) await minus.click();
  await expect(page.locator("#bdAlert")).toContainText(`${B} is out of health`);
  // Undo takes it back.
  await page.locator("#bdAlertUndo").click();
  await expect(page.locator("#bdAlert")).toBeHidden();
  await minus.click();
  await page.locator("#bdLoss").click();
  const dlg = page.getByRole("dialog", { name: "Record Loss?" });
  await expect(dlg).toBeVisible();
  await expect(dlg).toContainText("Loss, Medium, time 02:05");
  await page.locator("#bdRecSave").click();
  await expect(page.locator("#saveStatusText")).toContainText("Loss, Medium, 02:05");
  const recs = await page.evaluate(() => JSON.parse(localStorage.getItem("gameRecords")));
  expect(recs).toHaveLength(1);
  expect(recs[0]).toMatchObject({ characters: [A, B], scenario: SC, result: "Loss", difficulty: "Medium", playtime: 125 });
  expect(typeof recs[0].id).toBe("string");
  expect(await page.evaluate(() => isValidRecord(JSON.parse(localStorage.getItem("gameRecords"))[0]))).toBe(true);
  // The game is over: board closed, session cleared, nothing to save twice.
  await expect(page.locator("#missionBoard")).toBeHidden();
  await expect(page.locator("#boardToggleBtn")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("tsr:board:session"))).toBeNull();
  const ev = await page.evaluate(() => window.__events.filter(e => e[0] === "board_record"));
  expect(ev).toEqual([["board_record", { result: "Loss" }]]);
});

test("Record Win uses the board's difficulty; cancel saves nothing", async ({ page }) => {
  await openKnownBoard(page);
  await page.getByRole("radio", { name: "Easy" }).click();
  await expect(val(page, "Energy")).toHaveText("4");
  await page.locator("#bdWin").click();
  await page.locator("#bdRecCancel").click();
  expect(await page.evaluate(() => localStorage.getItem("gameRecords"))).toBeNull();
  await page.locator("#bdWin").click();
  await page.locator("#bdRecSave").click();
  const recs = await page.evaluate(() => JSON.parse(localStorage.getItem("gameRecords")));
  expect(recs).toHaveLength(1);
  expect(recs[0]).toMatchObject({ result: "Win", difficulty: "Easy" });
});

test("'Use the board by default' opens it when a mission starts", async ({ page }) => {
  await setup(page, { ...KNOWN, "tsr:board:auto": "1" });
  await loadMission(page, A, B, SC);
  await expect(page.locator("#missionBoard")).toBeVisible();
  await expect(val(page, `${A} health`)).toHaveText("5");
  await page.locator("#bdAuto").uncheck();
  expect(await page.evaluate(() => localStorage.getItem("tsr:board:auto"))).toBe("0");
  const ev = await page.evaluate(() => window.__events.filter(e => e[0] === "board_open"));
  expect(ev[0][1]).toMatchObject({ auto: true });
});

for (const theme of ["dark", "light"]) {
  test(`fits 360px with no horizontal overflow (${theme})`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await setup(page, { ...KNOWN, theme });
    await loadMission(page, A, B, SC);
    await openBoardUI(page);
    await page.locator("#bdLog summary").click();
    const check = () => page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const bad = [...document.querySelectorAll("#missionBoard *")].filter(el => {
        const r = el.getBoundingClientRect();
        return r.width && (r.right > vw + 1 || r.left < -1);
      }).map(el => el.className);
      return { sw: document.documentElement.scrollWidth, vw, bad };
    });
    let o = await check();
    expect(o.bad).toEqual([]);
    expect(o.sw).toBeLessThanOrEqual(o.vw);
    // Touch targets for +/− are at least 44px.
    const box = await page.getByRole("button", { name: `${A} health plus 1` }).boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    // Setup form fits too.
    await page.locator("#bdEdit").click();
    await page.locator("#bdAddTrack").click();
    o = await check();
    expect(o.bad).toEqual([]);
    expect(o.sw).toBeLessThanOrEqual(o.vw);
  });
}

test("every board control has an accessible name", async ({ page }) => {
  await openKnownBoard(page);
  const unnamed = await page.evaluate(() => [...document.querySelectorAll("#missionBoard button, #missionBoard [role=spinbutton], #missionBoard input")]
    .filter(el => !(el.getAttribute("aria-label") || el.textContent.trim() || el.closest("label")))
    .map(el => el.outerHTML.slice(0, 80)));
  expect(unnamed).toEqual([]);
});

test.describe("opt-in setting", () => {
  async function openTips(page) {
    await page.locator("#tipsTriggerBtn").click();
    await expect(page.locator("#tipsModal")).toBeVisible();
  }

  test("is off for a new player: no board button, no auto-open, and the Tips setting is unticked", async ({ page }) => {
    await setup(page, { "tsr:board:enabled": null });
    await loadMission(page, A, B, SC);
    await expect(page.locator("#boardToggleBtn")).toHaveCount(0);
    await expect(page.locator("#missionBoard")).toBeHidden();
    await openTips(page);
    const box = page.getByRole("checkbox", { name: /Show the Mission Board/ });
    await expect(box).not.toBeChecked();
    // The setting explains what the board is, visibly and to screen readers.
    await expect(page.locator("#boardSettingHint")).toBeVisible();
    await expect(box).toHaveAccessibleDescription(/instead of with tokens or paperclips/);
  });

  test("switched off, it never opens; turning it on in Tips shows the button on the running mission; turning it off closes the board", async ({ page }) => {
    await setup(page, { ...KNOWN, "tsr:board:enabled": "0", "tsr:board:auto": "1" });
    await loadMission(page, A, B, SC);
    await expect(page.locator("#boardToggleBtn")).toHaveCount(0);
    await expect(page.locator("#missionBoard")).toBeHidden(); // switched off beats auto-open

    await openTips(page);
    await page.getByRole("checkbox", { name: /Show the Mission Board/ }).check();
    await page.locator("#tipsModalClose").click();
    await openBoardUI(page);
    await expect(val(page, `${A} health`)).toHaveText("5");
    expect(await page.evaluate(() => localStorage.getItem("tsr:board:enabled"))).toBe("1");
    expect(await page.evaluate(() => window.__events.filter(e => e[0] === "board_setting"))).toEqual([["board_setting", { on: true }]]);

    await openTips(page);
    await page.getByRole("checkbox", { name: /Show the Mission Board/ }).uncheck();
    await page.locator("#tipsModalClose").click();
    await expect(page.locator("#missionBoard")).toBeHidden();
    await expect(page.locator("#boardToggleBtn")).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("tsr:board:session"))).toBeNull();

    // Off stays off after a reload.
    await page.reload();
    await loadMission(page, A, B, SC);
    await expect(page.locator("#boardToggleBtn")).toHaveCount(0);
  });

  test("a player who already used the board keeps it without touching the setting", async ({ page }) => {
    await setup(page, { ...KNOWN, "tsr:board:enabled": null, "tsr:board:last": { health: 4, energy: { Easy: 4, Medium: 3, Hard: 2 } } });
    await loadMission(page, A, B, SC);
    await expect(page.locator("#boardToggleBtn")).toBeVisible();
    await expect(page.locator("#boardToggleBtn")).toHaveAttribute("title", /health, the shared energy pool/);
    await openTips(page);
    await expect(page.getByRole("checkbox", { name: /Show the Mission Board/ })).toBeChecked();
  });
});

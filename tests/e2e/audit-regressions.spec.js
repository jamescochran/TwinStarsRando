import { test, expect } from "@playwright/test";

// Regression tests for the pre-release audit (see AUDIT_REPORT.md).
// Seeds are written once per context ("__seeded" flag) so that page.reload() in a test
// sees what the app itself persisted rather than a fresh copy of the seed.
function seed(values) {
  return async (page) => {
    await page.addInitScript((v) => {
      if (localStorage.getItem("__seeded")) return;
      localStorage.setItem("__seeded", "1");
      localStorage.setItem("hasSeenTip", "1");
      localStorage.setItem("seenPrimarySecondaryNotice", "1");
      for (const [k, val] of Object.entries(v)) localStorage.setItem(k, typeof val === "string" ? val : JSON.stringify(val));
    }, values);
  };
}

const REC = {
  characters: ["Bood", "Stag Solar"], scenario: "Escape The Brig!", result: "Win",
  difficulty: "Easy", playtime: 60, timestamp: "1/1/2026, 1:00:00 PM",
};

function contrast(fg, bg) {
  const lum = (rgb) => {
    const [r, g, b] = rgb.map((c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}
const parseRgb = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number);

test.describe("service worker", () => {
  test("first visit does not reload the page by itself", async ({ page }) => {
    let loads = 0;
    page.on("load", () => loads++);
    await seed({})(page);
    await page.goto("/");
    // A marker on the live document survives only if the document is never replaced.
    await page.evaluate(() => { window.__sameDocument = true; });
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForTimeout(2000);
    const stillSame = await page.evaluate(() => window.__sameDocument === true);
    expect(stillSame, `document was replaced (load events seen: ${loads})`).toBe(true);
  });
});

test.describe("data safety", () => {
  test("note field is capped at the length the loader accepts, so records survive a reload", async ({ page }) => {
    await seed({ gameRecords: [REC] })(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await page.locator(".btn-edit-record").first().click();
    await expect(page.locator("#editNotes")).toHaveAttribute("maxlength", "2000");
    await page.locator("#editNotes").evaluate((el) => { el.value = "x".repeat(2500); }); // bypass maxlength like a paste would
    await page.locator("#editRecordSave").click();
    await page.reload();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("gameRecords")));
    expect(stored).toHaveLength(1);
    expect(stored[0].notes.length).toBeLessThanOrEqual(2000);
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await expect(page.locator("#historyTableContainer tbody tr").first()).toBeVisible();
  });

  test("records rejected at load are backed up instead of overwritten", async ({ page }) => {
    const bad = { ...REC, scenario: "Not A Scenario" };
    await seed({ gameRecords: [REC, bad] })(page);
    await page.goto("/");
    await page.getByRole("button", { name: /Randomize Combination/i }).click();
    await page.locator("#saveRecordBtn").click();
    const { current, backup } = await page.evaluate(() => ({
      current: JSON.parse(localStorage.getItem("gameRecords")).length,
      backup: JSON.parse(localStorage.getItem("gameRecordsBackup") || "[]"),
    }));
    expect(current).toBe(2); // the valid original + the new one
    expect(backup).toHaveLength(2);
    expect(backup.some((r) => r.scenario === "Not A Scenario")).toBe(true);
  });

  test("import rejects records with an unknown droid", async ({ page }) => {
    await seed({})(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "Mission Log" }).click();
    const file = { name: "r.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify([REC, { ...REC, timestamp: "2", droid: { evil: 1 } }])) };
    await page.locator("#importFile").setInputFiles(file);
    await expect(page.locator("#importConfirmMsg")).toContainText("Found 1 valid record(s). 1 invalid record(s) will be skipped.");
  });

  test("app still starts when localStorage access throws", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", { get() { throw new DOMException("denied", "SecurityError"); } });
    });
    await page.goto("/");
    expect(await page.locator("#manualChar1 option").count()).toBeGreaterThan(5);
    await expect(page.locator("#combinationDisplay")).toContainText("No mission loaded");
    await page.getByRole("button", { name: /Randomize Combination/i }).click();
    await expect(page.locator(".combo-characters")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("a corrupt saved SYZYGY campaign is reset instead of blanking the tab", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await seed({ syzygyCampaign: { mode: "syzygy1", note: "old format" } })(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "SYZYGY" }).click();
    await expect(page.getByText("Begin Campaign")).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("randomizer state", () => {
  test("closing My Collection keeps a locked character selected", async ({ page }) => {
    await seed({ enabledPacks: ["series1", "series2"] })(page);
    await page.goto("/");
    await page.locator("#manualChar1").selectOption("Kinglan");
    await page.locator("#lockChar1").click();
    await page.locator("#settingsBtn").click();
    await page.locator("#settingsClose").click();
    await expect(page.locator("#manualChar1")).toHaveValue("Kinglan");
    await expect(page.locator("#lockChar1")).toHaveAttribute("aria-pressed", "true");
  });

  test("a lock is released when its character's pack is disabled", async ({ page }) => {
    await seed({ enabledPacks: ["series1", "series2"] })(page);
    await page.goto("/");
    await page.locator("#manualChar1").selectOption("Smiff"); // Series 2
    await page.locator("#lockChar1").click();
    await page.locator("#settingsBtn").click();
    await page.locator("#pack-series2").uncheck();
    await page.locator("#settingsClose").click();
    await expect(page.locator("#lockChar1")).toHaveAttribute("aria-pressed", "false");
  });

  test("timer is announced as running, and Restart is disabled once the record is saved", async ({ page }) => {
    await seed({})(page);
    await page.goto("/");
    await page.getByRole("button", { name: /Randomize Combination/i }).click();
    await expect(page.locator("#timerDisplay")).toHaveAttribute("aria-label", /running/i);
    await expect(page.locator("#restartBtn")).toBeEnabled();
    await page.locator("#saveRecordBtn").click();
    await expect(page.locator("#restartBtn")).toBeDisabled();
    await expect(page.locator("#pauseBtn")).toBeDisabled();
  });
});

test.describe("stats", () => {
  test("Droid Coverage appears right after a droid pack is enabled", async ({ page }) => {
    await seed({ gameRecords: [REC] })(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await expect(page.locator("#statsContent")).not.toContainText("Droid Coverage");
    await page.locator("#settingsBtn").click();
    await page.locator("#pack-droids1").check();
    await page.locator("#settingsClose").click();
    await expect(page.locator("#statsContent")).toContainText("Droid Coverage");
  });

  test("Completed % ignores combinations from packs that are switched off", async ({ page }) => {
    const s2 = ["Dain Taubo", "Grulexon", "Gari Obul", "Smiff", "Zoaze"];
    const recs = [];
    for (const a of s2) for (const b of s2) if (a !== b) recs.push({ ...REC, characters: [a, b], scenario: "Master the Trials!", timestamp: a + b });
    await seed({ gameRecords: recs, enabledPacks: ["series1", "series2"] })(page);
    await page.goto("/");
    await page.locator("#settingsBtn").click();
    await page.locator("#pack-series2").uncheck();
    await page.locator("#settingsClose").click();
    await page.getByRole("tab", { name: "Mission Log" }).click(); // stats are computed after the pack change
    const completed = page.locator(".stats-summary-card", { hasText: "Completed" });
    await expect(completed).toContainText("0%"); // 20 Series-2 combos are not part of the 792 available
  });
});

test.describe("keyboard and screen reader access", () => {
  test("Import is reachable with the Tab key", async ({ page }) => {
    await seed({ gameRecords: [REC] })(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await page.locator("#exportBtn").focus();
    await page.keyboard.press("Tab");
    await expect(page.locator("#importFile")).toBeFocused();
  });

  test("Shift+Tab from the first FAQ question stays inside the dialog", async ({ page }) => {
    await seed({})(page);
    await page.goto("/");
    await page.getByRole("button", { name: /Randomize Combination/i }).click();
    await page.locator("#combinationDisplay .btn-faq-inline").last().click();
    await page.locator("#faqModal summary").first().focus();
    await page.keyboard.press("Shift+Tab");
    expect(await page.evaluate(() => !!document.activeElement.closest("#faqModal"))).toBe(true);
  });

  test("dice can be locked from the keyboard", async ({ page }) => {
    await seed({})(page);
    await page.goto("/");
    await page.getByRole("button", { name: /Randomize Combination/i }).click();
    await page.locator("#diceRollerBtn").click();
    await page.waitForFunction(() => !document.querySelector(".die.rolling"));
    await page.locator("#die0").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#die0")).toHaveClass(/locked/);
    await page.keyboard.press("Space");
    await expect(page.locator("#die0")).not.toHaveClass(/locked/);
  });

  test("form controls have accessible names", async ({ page }) => {
    await seed({ enabledPacks: ["series1", "droids1"] })(page);
    await page.goto("/");
    await expect(page.getByRole("combobox", { name: /Character 1/ })).toBeVisible();
    await expect(page.getByRole("combobox", { name: /Character 2/ })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Scenario" })).toBeVisible();
    await page.getByRole("button", { name: /Randomize Combination/i }).click();
    await expect(page.getByRole("combobox", { name: "Droid assistant" })).toBeVisible();
  });
});

test.describe("colour contrast (WCAG AA, 4.5:1)", () => {
  for (const theme of ["dark", "light"]) {
    test(`primary button, active tab, dim text and accents in ${theme} theme`, async ({ page }) => {
      await seed({ theme })(page);
      await page.goto("/");
      const pairs = await page.evaluate(() => {
        const pick = (sel, prop = "color") => getComputedStyle(document.querySelector(sel))[prop];
        const bgOf = (sel) => { let el = document.querySelector(sel); while (el) { const c = getComputedStyle(el).backgroundColor; if (c && c !== "rgba(0, 0, 0, 0)") return c; el = el.parentElement; } return "rgb(255,255,255)"; };
        return {
          cta:       [pick("#generateBtn"), pick("#generateBtn", "backgroundColor")],
          tab:       [pick("#randomizerTab"), pick("#randomizerTab", "backgroundColor")],
          save:      [pick("#saveRecordBtn"), pick("#saveRecordBtn", "backgroundColor")],
          dim:       [getComputedStyle(document.documentElement).getPropertyValue("--text-dim").trim(), bgOf(".panel")],
          teal:      [getComputedStyle(document.documentElement).getPropertyValue("--accent-teal").trim(), bgOf(".panel")],
          yellow:    [getComputedStyle(document.documentElement).getPropertyValue("--accent-yellow").trim(), bgOf(".panel")],
          orangeTxt: [getComputedStyle(document.documentElement).getPropertyValue("--accent-orange").trim(), bgOf(".panel")],
        };
      });
      const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
      const rgb = (v) => (v.startsWith("#") ? hex(v) : parseRgb(v));
      for (const name of ["cta", "tab", "save", "dim", "teal", "yellow"]) {
        expect(contrast(rgb(pairs[name][0]), rgb(pairs[name][1])), name).toBeGreaterThanOrEqual(4.5);
      }
      if (theme === "light") expect(contrast(rgb(pairs.orangeTxt[0]), rgb(pairs.orangeTxt[1])), "orange text").toBeGreaterThanOrEqual(4.5);
    });
  }
});

test.describe("phone layout", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("Mission Log rows fit the screen: result and delete are visible without sideways scrolling", async ({ page }) => {
    const recs = [{ ...REC, characters: ["Grant Rockgardner", "Strezelsior"], scenario: "Confine The Quarks!", notes: "Close game" }, REC];
    await seed({ gameRecords: recs })(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "Mission Log" }).click();
    const wrap = page.locator("#historyTableContainer .history-table-wrap");
    const { sw, cw } = await wrap.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth }));
    expect(sw).toBeLessThanOrEqual(cw);
    const vw = 375;
    for (const sel of [".result-pill", ".btn-delete-record", ".btn-edit-record"]) {
      const box = await page.locator(`#historyTableContainer ${sel}`).first().boundingBox();
      expect(box.x + box.width, sel).toBeLessThanOrEqual(vw);
    }
    await expect(page.locator("#historyTableContainer table")).toHaveAttribute("role", "table");
  });

  test("history filter dropdown labels are not clipped", async ({ page }) => {
    await seed({ gameRecords: [REC] })(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "Mission Log" }).click();
    const clipped = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll(".history-select").forEach((sel) => {
        if (getComputedStyle(sel).display === "none") return;
        const probe = document.createElement("span");
        const cs = getComputedStyle(sel);
        probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-family:${cs.fontFamily};font-size:${cs.fontSize};font-weight:${cs.fontWeight};letter-spacing:${cs.letterSpacing};text-transform:${cs.textTransform}`;
        probe.textContent = sel.options[sel.selectedIndex].text;
        document.body.appendChild(probe);
        const avail = sel.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 20; // native arrow
        if (probe.offsetWidth > avail) out.push(probe.textContent);
        probe.remove();
      });
      return out;
    });
    expect(clipped).toEqual([]);
  });
});

test.describe("SYZYGY", () => {
  test("Abandon uses the app dialog and requires confirmation", async ({ page }) => {
    await seed({})(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "SYZYGY" }).click();
    await page.locator("#szSel1").click();
    for (const c of ["Bood", "Stag Solar", "Fanoobia"]) await page.locator(`.syzygy-char-btn[data-char="${c}"]`).click();
    await expect(page.locator(".syzygy-char-btn[aria-pressed='true']")).toHaveCount(3);
    await page.locator("#szStartBtn").click();
    await page.locator("#szAbandonBtn").click();
    await expect(page.locator("#szAbandonModal")).toHaveClass(/open/);
    await page.locator("#szAbandonCancel").click();
    await expect(page.locator("#szAbandonBtn")).toBeVisible(); // still in the campaign
    await page.locator("#szAbandonBtn").click();
    await page.locator("#szAbandonConfirm").click();
    await expect(page.getByText("Begin Campaign")).toBeVisible();
  });
});

test.describe("toasts", () => {
  test("only one toast is on screen at a time", async ({ page }) => {
    await seed({})(page);
    await page.goto("/");
    await page.getByRole("button", { name: /Randomize Combination/i }).click();
    await page.locator("#saveRecordBtn").click();           // "Record saved!"
    await page.getByRole("tab", { name: "Mission Log" }).click();
    await page.locator("#exportBtn").click();               // "Exported successfully!"
    await expect(page.locator(".toast")).toHaveCount(1);
  });
});

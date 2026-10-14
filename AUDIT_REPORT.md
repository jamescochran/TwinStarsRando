# Twin Stars Randomizer — Pre-release Audit

Scope: whole app (single-file PWA: `index.html`, `service-worker.js`, `manifest.json`, tests, CI).
Method: read all code, ran the Playwright suite, drove the real app in headless Chromium at 320/375/768/1280 px in dark and light themes, and compared the SYZYGY logic against the rulebook images bundled in `rules/`. Contrast ratios were computed (WCAG formula), not eyeballed.

Legend — **Confirmed**: reproduced in the running app. **Code-evidenced**: follows directly from the code, not run end-to-end. **Needs decision**: fixing changes intended behaviour, so I will not change it without your say-so.

---

## 1. Executive summary

The app is in good shape for its size: no XSS paths found (every dynamic value goes through `esc()`), no secrets, a sensible CSP, localStorage handling is mostly defensive, and the visual design is coherent and consistent.

The things a real user would hit:

1. **SYZYGY mode does not follow its own rulebook** (High, needs decision). Both campaign modes use the wrong number of stages / wrong scenario set, and SYZYGY II gives wrong ranks for most outcomes; one rank (SAFE) is unreachable.
2. **First-time visitors get an unexpected page reload** about 350 ms after load (service-worker `controllerchange`). It wipes anything done in that window and makes one existing e2e test fail deterministically here.
3. **A log entry can be silently and permanently destroyed**: the note field accepts more text than the loader allows, and the loader drops what it rejects, then the next save overwrites it.
4. **Opening "My Collection" and pressing Done resets the manual selection and breaks locks.**
5. **The app crashes at start-up if `localStorage` is blocked**, although the rest of the code was written to tolerate that.
6. **Phone usability of the Mission Log**: the log table is 742 px wide inside a ~300 px viewport; Result/Scenario/Edit/Delete are off-screen.
7. **Accessibility**: the primary call-to-action fails contrast (2.84:1), all `--text-dim` text fails (2.2–2.9:1), light-mode teal/yellow/orange text fails, the Import control and the dice are unreachable by keyboard, and the FAQ dialog leaks keyboard focus.

No Critical issues were found.

Tests: the existing 33 Playwright tests all failed at first because of this sandbox (the installed Playwright wants a Chromium build that is not present). With the pre-installed Chromium wired in via a temporary local config, **32 passed and 1 failed** (`randomizer.spec.js:48`). That failure is a real symptom of finding M1, not a test bug.

---

## 2. Findings

### High

**H1 — SYZYGY I and II diverge from the bundled rulebooks** · Confirmed · *Needs decision* · `index.html` ≈ L4188–4320 (rank tables, `szStart`, `szRecordOutcome`, `szCalcRank`)
Evidence (rulebook images `rules/twinstars1-syzygy.png`, `rules/twinstars2-syzygy.png` vs. code):
- *SYZYGY I*: the rulebook has **four** scenarios (A, B, C, D; B and C each let you pick one of two; A and D are fixed positions in a 1-2-2-1 layout built from all six Series 1 scenarios). The app plays **three** stages (A, "B/C", D) and uses only four of the six scenarios, but its rank table ("LEGENDS = 3 wins") is keyed to three. The card even says "4-scenario campaign".
- *SYZYGY II*: the rulebook is a six-card pyramid (1-2-3). A win follows black arrows, a loss follows red arrows, a loss on the bottom row loses the game, and reaching HOME always takes exactly 3 wins; the rank is the number of losses on the way (0 = LOADED, 1 = SAFE, 2 = BACK TO SQUARE ONE). The app instead plays any 3 scenarios from whatever packs are enabled in a straight line and ends after 3 results or 2 losses. I ran `szRecordOutcome` over every win/loss sequence:

  | Sequence | App says | Rulebook |
  |---|---|---|
  | W,W,W | LOADED | LOADED |
  | W,W,L | BACK TO SQUARE ONE | LOST (bottom-row loss) |
  | L,W,W | BACK TO SQUARE ONE | play on; HOME would be SAFE after a 3rd win |
  | L,L,W | LOST after 2 scenarios | still playing; HOME = BACK TO SQUARE ONE |
  | any path | **SAFE is unreachable** | |
- Characters can never be marked **eliminated** (`removed[]` is read but never written), though both rulebooks remove a character who is reduced to 0 health and end the game when two are lost.
- Bench rotation is forced (`stage % alive`), whereas the rulebook says you *choose* who sits out.
- Mode gating: `hasSeries2 = series1 || series2` lets SYZYGY II start with only Series 1 owned; SYZYGY II scenarios should be the six Series 2 scenarios.

User impact: the final rank shown is wrong for most outcomes. Recommended fix: model each mode as a small state graph taken straight from the rulebooks (I can do this; it is a rewrite of ~150 lines and changes visible behaviour, hence the question). **Not changed.**

### Medium

**M1 — Unexpected reload on first visit** · Confirmed · `index.html` ≈ L4825–4836
`controllerchange` fires when the service worker first claims the page, and the handler reloads whenever no game is active. Measured: 2 `load` events within 3 s of the first visit, 1 on later visits. A first-time user who has already opened My Collection loses that state; it also reloads mid-modal or mid-SYZYGY-setup on later app updates. This is why `randomizer.spec.js:48` fails here (the page reloads between `selectOption` and the assertion). Fix: only react when a controller existed before; never reload with a modal open.

**M2 — Permanent silent data loss for long notes** · Confirmed · `index.html` L2913, L3906–3909, L2821–2829
The edit-notes textarea has no `maxlength`, but `isValidRecord` rejects notes over 2000 characters. Repro: save a 2500-character note → reload → toast says the record "could not be loaded"; save any new record → the old one is gone from `localStorage`. The same drop-then-overwrite path would also erase records if a future version renames a character/scenario. Fix: `maxlength`, clamp on save, and keep a backup copy of anything the loader discards.

**M3 — App fails to initialise when `localStorage` throws** · Confirmed · L4816, L4161
Everything else wraps storage in `try/catch`, but two reads do not. With storage blocked (privacy settings, some embedded contexts) the script aborts: 0 characters in the selectors, no empty-state message, uncaught `SecurityError`. Fix: wrap both reads.

**M4 — "My Collection → Done" resets selections and desynchronises locks** · Confirmed · L3008–3025, L3537–3561
`populateSelectors()` rebuilds the dropdowns from scratch on every close, even with no change. Repro: pick Kinglan as Character 1, lock it, open My Collection, press Done → the selector shows Bood while the lock still shows as pressed, so the next Randomize keeps *Bood*. Fix: preserve valid values; drop a lock whose value is no longer available.

**M5 — Stats go stale after changing packs, and "Completed %" counts disabled-pack combos** · Confirmed (stale) / Code-evidenced (count) · L3395–3397, L3537–3561
`closeSettings()` never marks stats dirty, so Droid Coverage does not appear after enabling a droid pack and percentages stay frozen until the next record is saved. When recomputed, `playedKeys.size` includes combos from packs that are no longer enabled while the denominator only counts enabled ones, so it disagrees with the "N of M combinations played" line under Unplayed.

**M6 — Mission Log is not usable on a phone** · Confirmed · L455–475, `displayHistory`
The 7-column table is 742 px wide in a 301 px container (375 px device). Result, Scenario, difficulty and the Edit/Delete buttons require sideways scrolling with no hint. The five filter dropdowns also clip their labels ("ALL DIFFICULTIE", "ALL CHARACTER!"). Fix (CSS only): stack each row as a card below 560 px; tighten filter text.

**M7 — Accessibility: contrast** · Confirmed (computed) · CSS variables L40–68, L170, L210
- Primary CTA and active tab: white on `#ff6b35` = **2.84:1** (needs 4.5).
- `--text-dim` is used for real text (labels, descriptions, the "Scenario NN:" prefix, timer label, footer): **2.28:1** dark / **2.86:1** light.
- Light theme: teal text 3.3:1, yellow 3.0:1, orange 2.3:1, "Save Record" label 3.6:1, hard-coded `#ff4455` on `.btn-danger` 2.8:1 (and a near-black border).

**M8 — Accessibility: keyboard and screen-reader** · Confirmed (a–c) / Code-evidenced (d–f)
a. **Import** is a `<label>` for a `display:none` input: Tab goes Export → Clear All; keyboard users cannot import.
b. **FAQ dialog leaks focus**: the focus trap ignores `<summary>`, so Shift+Tab from the first question lands on `<body>` outside the dialog. (The trap also ignores textarea/links.)
c. **Dice cannot be locked from the keyboard**: `.die` is a bare `<div>` with a click handler.
d. Manual-selection `<select>`s have no accessible name (the visible text is a `<div>`); the droid `<select>` has none either.
e. Timer's `aria-label` says "Timer stopped" while it is running (re-render restores only paused/stopped).
f. All "?" FAQ buttons are named just "Rules FAQ"; SYZYGY character buttons and the dice-lock state are not exposed as pressed/state.

**M9 — "Restart" after saving a record revives a timer that can't be saved** · Confirmed · L3102, L3873
After Save the timer is stopped and Pause is disabled, but Restart stays enabled; pressing it starts a clock while Save Record is disabled. Fix: disable Restart whenever the timer is stopped.

**M10 — In-progress game is lost on reload / app kill** · Confirmed · *Needs decision*
Current mission, droid and timer live only in memory. Mobile browsers routinely discard background tabs; a 40-minute session is gone. Fix needs a product decision (should the clock keep running while the app is closed, or be paused?). Proposal: persist `{combo, droid, accumulated ms, paused}` and restore as *paused*. **Not changed.**

**M11 — Randomize / Load Mission silently discards a running timer** · Confirmed · *Needs decision* · L3700–3703
Measured 00:03 → 00:00 on a single tap of the full-width Randomize button. Suggest a confirmation only when a game with elapsed time is unsaved. **Not changed.**

### Low

- **L1** Delegated click handlers are re-added to `#comboHistory` and `#historyTableContainer` on *every* render, so they accumulate (code-evidenced; no visible effect today, but a leak and a trap for future edits).
- **L2** Toasts: two close together overlap at the same coordinates (Confirmed, 740–776 vs 742–778 px); every toast lasts 2.6 s regardless of length, too short for the 140-character "Roles added…" notice.
- **L3** After saving, the timer on the card shows `00:00` rather than the recorded time (Confirmed).
- **L4** "Abandon campaign" uses the browser `confirm()` while every other destructive action uses the app's own dialog (inconsistent; `confirm` is also suppressed in some embedded/PWA contexts).
- **L5** A malformed `syzygyCampaign` value (older/corrupt) throws on render and blanks the SYZYGY tab on every visit until site data is cleared (Confirmed).
- **L6** Touch targets: "My Collection" 107×20, FAQ "?" buttons 18×18, lock buttons 24×24, record edit/delete ≈ 26×22, dice ± 26×26. Text at 7–9 px: "My Collection", Primary/Secondary role labels (7 px), rulebook tabs, SYZYGY labels.
- **L7** "Newest first" sorts by array position, so records imported with *Merge* from an older backup appear as the newest; export filename uses the UTC date.
- **L8** `isValidRecord` does not validate `droid` (any value is accepted and shown), and imported objects keep unknown fields.
- **L9** The rulebook PNGs are 1.9–7.5 MB each (≈30 MB total) and are not precached, so the Rules viewer is slow on mobile data and unavailable offline until each is opened once, despite the README's "works offline". Recommend converting to WebP/JPEG (not done: binary asset change I cannot visually QA at scale).
- **L10** `manifest.json` forces `portrait`, awkward for tablets at a game table; "maskable" icons reuse the "any" images.
- **L11** `netlify.toml` security headers are inert on GitHub Pages (the URL in the README); `<meta>` CSP cannot carry `frame-ancestors`. No exploitable impact found (no auth, no server).
- **L12** Droid `<select>` uses the native arrow while all other selects use the custom chevron; the "&" in the mission card dangles at the end of the Primary line.
- **L13** Tests: no coverage for import/export, edit/delete, My Collection, stats, SYZYGY, persistence or accessibility; `serve` in `package.json` is unused (the config uses `npx serve@14`).

### Looked at and fine
`esc()` escaping and CSP; Umami script has SRI; external links use `rel="noopener noreferrer"`; localStorage record validation on load/import; modal Escape/backdrop handling; reduced-motion support; `:focus-visible` ring; wall-clock timer (no drift); service-worker cache name *is* current (last `index.html` change 2026-05-25 matches the cache stamp — I checked, it is not stale); no page-level horizontal overflow at 320 px.

---

## 3. Highest-value UI/UX improvements
1. Phone Mission Log as stacked cards (M6) — the main data view currently hides the result.
2. Fix contrast on the CTA and dim text (M7) — one consistent token change, same look.
3. Remove the surprise reload and the lock/selection reset (M1, M4) — the two things users see without looking for bugs.
4. Protect running games (M10, M11) — product decision.

## 4. Could not be verified here
- Firefox/WebKit/iOS Safari (only Chromium is installed; Firefox suite not run).
- Real-device touch, PWA install and true offline behaviour; service-worker update flow beyond the first-install reload.
- Radio streaming and Umami (outbound network is blocked in this sandbox).
- Screen-reader behaviour (no AT available); findings are from the DOM/ARIA tree.
- Lighthouse/axe were not run (no network to fetch axe); contrast was computed manually.

---

## 5. Fix status (after the fix pass)

Branch `audit-fixes` (local, uncommitted — this session has read-only access to GitHub). Files changed: `index.html`, `service-worker.js` (cache name bumped, as the README requires for any deploy), `README.md` (documents the new backup key), new `tests/e2e/audit-regressions.spec.js`. `AUDIT_REPORT.md` is this file.

| ID | Status | What changed |
|---|---|---|
| H1 SYZYGY vs rulebook | **Open — needs your decision** | Not touched. Proposal: model each mode as a small state graph copied from the rulebooks; SYZYGY I = 4 scenarios (A, B, C, D) from all six Series 1 cards; SYZYGY II = six Series 2 cards in the 1-2-3 pyramid, 3 wins to reach HOME, bottom-row loss = LOST, rank by losses; add an "Eliminated" control; let the player choose who sits out. |
| M1 reload on first visit | Fixed | Only reloads on a real update, never with a modal / game / SYZYGY setup open |
| M2 note-length data loss | Fixed | `maxlength=2000` + clamp on save; records rejected at load are copied to `gameRecordsBackup` before anything is overwritten |
| M3 blocked localStorage | Fixed | Both unguarded reads wrapped; corrupt radio volume no longer throws |
| M4 selection/lock reset | Fixed | Selections kept; a lock whose item left the collection is released with a message |
| M5 stale/incorrect stats | Fixed | Stats refresh when My Collection closes; completion counts only enabled-pack combos |
| M6 phone Mission Log | Fixed | Stacked cards below 560 px (table roles restored for screen readers); characters column wraps so desktop no longer scrolls sideways either; filter labels no longer clipped |
| M7 contrast | Fixed | Tokens: dark `--text-dim` → `#7380ab`; light `--text-dim` `#4f5e8a`, teal `#006e5a`, yellow `#7d5a00`, orange `#b03a0a`. Orange buttons/tabs use dark text in dark theme (same convention as the teal buttons) and white in light theme. `.btn-danger` now uses the theme's loss colour. Hover colours became tokens so they stay readable. All ≥ 4.5:1 and covered by a test |
| M8 keyboard / SR | Fixed | Import is focusable (with focus ring); focus trap includes summaries/textarea/links; dice lock via Enter/Space; all selects named; timer label correct; FAQ buttons name their subject; pressed state on SYZYGY buttons |
| M9 Restart after save | Fixed | Restart disabled while the timer is stopped |
| M10 persist in-progress game | **Open — needs your decision** | Proposal above |
| M11 Randomize discards timer | **Open — needs your decision** | Suggest confirming only when an unsaved game has elapsed time |
| L1 listener accumulation | Fixed | Delegated handlers assigned, not re-added |
| L2 toasts | Fixed | One at a time; duration scales with length |
| L4 native `confirm()` | Fixed | Uses an app dialog like the other destructive actions |
| L5 corrupt SYZYGY state | Fixed | Validated on load; reset with a message |
| L6 sizes | Mostly fixed | Text floor raised from 7–8 px to 9–10 px; targets enlarged (lock 32 px, dice/steppers 32 px, edit/delete ≈ 30 px, header buttons ≈ 30 px, FAQ "?" keeps its 18 px look with a 32 px tap area). Footer text links remain 16 px high (inline links) |
| L8 droid validation | Fixed | Droid must be a known droid. Unknown extra fields are still kept |
| L7 (export date) | Fixed (local date) | "Newest first" ordering for merged imports **not** changed (timestamps are locale strings; would need a stored ISO date) |
| L3, L9, L10, L11, L13 | Open | L3 timer shows 00:00 after save; L9 7 MB rulebook PNGs / not precached; L10 manifest portrait lock; L11 headers inert on GitHub Pages; L13 broader test coverage (partly addressed by the 21 new tests) |
| L12 | Partly | Droid select now matches the other selects; the dangling "&" is unchanged |

### Verification actually performed
- Original suite: 33 tests; **all 33 failed in this sandbox** (installed Playwright expects a newer Chromium than the pre-installed one). With a temporary local config pointing at the pre-installed Chromium (removed afterwards, repo config unchanged): 32 passed, 1 failed (`randomizer.spec.js:48`, caused by M1).
- After the fixes: **54 / 54 pass on Chromium** (33 existing + 21 new).
- The 21 new tests were run against the *original* `index.html`: all fail there (19 on first run; the two that initially passed — Completed % and clipped filter labels — were tightened and now fail on the original too; the Completed % one fails there partly because of the M1 reload, so the stale-stats fix itself is proven by the Droid Coverage test).
- Visual re-check of 320/375/768/1280 px in both themes after the CSS changes: no page-level horizontal overflow; Mission Log fits at every width.
- Not run: Firefox/WebKit, real devices, axe/Lighthouse, screen readers, build/lint/type-check (there is no build step, linter or type checker in this project).

### Review of my own changes
- Orange fill with dark text in dark theme is a visible (deliberate) look change; it matches how teal buttons already work. Easy to switch to a darker orange with white text if you prefer the old feel.
- `populateSelectors` now calls `updateLockButtons()` and can toast; it is also called at start-up, where locks are all false, so nothing fires.
- The phone card layout overrides table display, so roles are re-applied from JS; if the log markup is ever rewritten, keep `restoreTableRoles`.
- `gameRecordsBackup` keeps only the *first* snapshot; it is never read by the app (recovery is manual via DevTools or a future "restore" button).
- Pre-commit hook: when you commit, it will also restamp the footer date/SHA and re-bump the cache name; the manual cache bump here is harmless.

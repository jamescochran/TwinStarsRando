# Project status (updated 2026-11-07)

Everything that was in progress is now merged into `main` and live at https://jamescochran.github.io/TwinStarsRando. No pull requests are open. The product plan behind the work is published at https://claude.ai/artifact/Lt33G9WuFEhChHFNJcs9WZ (private to the owner).

## On `main` (merged and live)

| What | PR | Notes |
|---|---|---|
| Security hardening: CI read-only token, SHA-pinned actions, test dependency fixes | #109 | |
| No inline scripts in the page's security policy, framing protection, tighter service worker | #110 | |
| UX/UI overhaul: design tokens, contrast, responsive layout, accessibility, undo, WebKit in CI | #111 | |
| Phase 0 + 1: data safety, AVIF/WebP rulebooks with offline cache, gated deploy workflow, privacy-safe analytics, 130-entry FAQ with search, SYZYGY to the rulebook, self-hosted fonts, install prompt, link previews | #112 | |
| Phase 2: Pairing Lab and Gauntlet (`insights.js`), Collection by item with presets and the Collection Shelf (`collection.js`), Mission Board (`board.js`) | #115 | |
| CodeQL `init` and `analyze` updated to v4.39.2 together (replaced Dependabot's #113 and #114, which each bumped only one half and failed the scan) | #116 | |
| Teach Mode, setup checklist, turn-step rail and Daily Mission (`teach.js`, `daily.js`) | #117 | Reviewed by the owner on the preview |
| Mission Board is opt-in: off until "Show the Mission Board" is ticked in Tips & Features. The setting and the button's tooltip explain what it is. Players who already used the board keep it. | #118 | |
| Test that flags any new image file or embedded image for owner review (`tests/e2e/graphics-review.spec.js`) | #119 | |
| Ambient radio fixed: SomaFM refused streams referred by this site (403). The page now sends no Referer to other sites, and the service worker no longer proxies other origins (audit L8). | #120 | Confirmed playing on the live site in a normal Chrome |

Every PR above merged only after the full suite passed in Chromium, Firefox and WebKit, along with CodeQL and the build check. The last local run had 713 passed, 0 failed and 25 skipped. The skips are mainly the axe accessibility checks, which need `AXE_CORE_PATH`; CI skips them too.

## Branches not merged (kept on purpose)

| Branch | Why |
|---|---|
| `issue-14` (Suggest Unplayed button), `feature/issue-25-auto-load` | From May 2026, built on the old single-file app and about 130 commits behind. Issue #25 is already on `main` by other commits. Issue #14 is closed. The app has an unplayed-combinations list, and Pairing Lab overlaps with it. Rebuild the button fresh if it is wanted. Kept per rule 2. |

Every other branch on GitHub is already in `main`. Some were merged as squashed PRs, so their commits look different.

## Not started

- Navigation restructure into the planned five sections (Play, Logbook, Campaigns, Rules, Shelf).
- Splitting `app.js` into modules (R15).
- A final whole-app QA pass after Phase 2 and 3.
- Campaign Map polish beyond what SYZYGY v2 already shows.
- The remaining Low items in `docs/handoff/logic-audit.md` (L8 is now fixed).
- Running the axe accessibility checks: supply axe-core through `AXE_CORE_PATH` locally or in CI.

## Known test quirks

- `platform.spec.js` "mid-game update shows a Reload button" failed once in Firefox under the full local run's load, then passed 5 of 5 alone and in CI. CI retries once.
- The radio request test is skipped on Linux WebKit, because Playwright cannot see WebKit's media requests there.
- SomaFM refuses headless browsers (their user agent says `HeadlessChrome`), so no test plays the live stream. To check by hand, run a normal Chrome under `xvfb-run` against the live site.
- The project pins Playwright 1.64.1. A machine with older browsers needs `npx playwright install chromium firefox webkit` in `tests/`.

## Rules from the owner

1. **No art or graphics of Button Shy's cards or tokens.** The official rulebooks from BoardGameGeek are allowed.
2. **Don't delete anything.**
3. **Don't add new graphics without the owner's review.** `graphics-review.spec.js` enforces this. To approve a new image after review, add it to `REVIEWED` in that file.

The owner approved the existing graphics on 2026-11-07:
- the hexagon "TS" app icons
- `og-image.jpg`
- the three screenshots in `screenshots/`
- the AVIF and WebP copies of the rulebooks

Still awaiting a look: the small gauge mark drawn in CSS on the Mission Board button (`.bd-gauge-icon`). It is one `<span>` plus two CSS rules.

## Owner actions

1. ~~**GitHub Pages source:**~~ Done (2026-11-05).
2. **Captain Crag rulebook:** the image in `rules/` is truncated. Download the official file from BoardGameGeek file page 217405 while logged in, then follow `rules/README.md`.
3. **Unverified names:** check "Striker" vs "Ztriker" (Scenario 14) and "Feth Doriet" / "Pummtoggs" (Scenario 13) against the physical cards.
4. **Permission:** ask Button Shy about storing per-card data, if that is ever wanted. Today the Mission Board uses values the user enters.
5. **Netlify (optional):** a Netlify site is still connected to the repo and builds a preview for each PR. The site is not hosted there and nothing depends on it. Its checks are neutral and never block a merge. Disconnect it in Netlify, or under GitHub → Settings → Applications, if the previews aren't wanted.

## Useful references

- FAQ generator: `tools/faq/` (edit `faq_data.py`, then run `python3 tools/faq/gen.py index.html`).
- Release and deploy: README → "Release / deploy". Every push to `main` runs the tests, then deploys to GitHub Pages with a per-deploy cache name.

## Handoff documents (in `docs/handoff/`)

- `product-plan.html`: the full audit, feature concepts, roadmap and task-level plan (same as the published page).
- `logic-audit.md`: logic findings with severities and the SYZYGY correct-logic specification. H1–H5, M1, M2, M4–M7 and L8 are fixed; the remaining Low items are listed there.
- `product-research.md`: evidence from 84 BoardGameGeek threads, BGG stats, the content inventory and competitor scan, all with citations.
- `bgg-faq-merged.md`: the 95-entry researched FAQ that the in-app FAQ was built from (source for `tools/faq/faq_data.py`).

## How to resume

1. Start from `main`. Run the suite with `cd tests && npm ci && npx playwright install --with-deps chromium firefox webkit && npx playwright test`.
2. Pick up "Not started" in the order of the product plan's roadmap: modularize `app.js` first (R15), then the five-section navigation.

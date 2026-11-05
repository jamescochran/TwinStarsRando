# Project status: where the work stopped (2026-11-05, ~03:20 UTC)

The work was wound down at the owner's request. This file records where each piece stands so it can be picked up later. The product plan behind it is published at https://claude.ai/artifact/Lt33G9WuFEhChHFNJcs9WZ (private to the owner).

## On `main` (merged and live)

| What | PR | Notes |
|---|---|---|
| Security hardening: CI read-only token, SHA-pinned actions, test dependency fixes | #109 | |
| No inline scripts in the page's security policy, framing protection, tighter service worker | #110 | |
| UX/UI overhaul: design tokens, contrast, responsive layout, accessibility, undo, WebKit in CI | #111 | 294 tests passed in three browsers |
| Phase 0 + 1: data safety, AVIF/WebP rulebooks with offline cache, gated deploy workflow, privacy-safe analytics, 130-entry FAQ with search, SYZYGY to the rulebook, self-hosted fonts, install prompt, link previews | #112 | All CI checks passed before merge |

## On branch `phase2` (pushed, NOT merged, NOT fully tested)

`phase2` = `main` + three Phase 2 features, each built in its own script file:

| Feature | File | Worker's own test run |
|---|---|---|
| Pairing Lab and Gauntlet | `insights.js` | 549 passed |
| Collection by item, presets, Collection Shelf, scoped stats | `collection.js` | 612 passed |
| Mission Board (token-free health, energy, tracks) | `board.js` | 572 passed, 1 flaky Firefox failure (`data-safety.spec.js:154`, passed 5/5 alone) |

**Not yet verified:** the full suite on `phase2` after the Mission Board merge. The run was cut off by a timeout. The last merge resolved only "keep both" list conflicts (script lists in `build-site.sh`, `service-worker.js`, the analytics allow-list, CSS blocks), and `check-build-site.sh` passes.

**Next step:** run the full suite in Chromium, Firefox and WebKit on `phase2`, look into the flaky cross-tab test, then open a PR to `main`.

## Work-in-progress branches (pushed, NOT merged)

| Branch | What | State |
|---|---|---|
| `wip/teach-and-daily` | Teach Mode, setup checklist, turn-step rail, Daily Mission (`teach.js`, `daily.js`) | Committed, but its final test run was stopped. It merged `phase2` (Pairing Lab), but not Collection or the Mission Board. Die faces use Unicode (⚀–⚅) instead of SVG. Needs `git merge phase2`, a full test run and a review before merging. |
| `wip/graphics-review-check` | A test that flags any new image file for owner review | Passed locally on its own; not run in the full suite. |

## Not started

- Navigation restructure into the planned five sections (Play, Logbook, Campaigns, Rules, Shelf).
- Splitting `app.js` into modules (R15).
- A final whole-app QA pass after Phase 2.
- Campaign Map polish beyond what SYZYGY v2 already shows.

## Rules from the owner

1. **No art or graphics of Button Shy's cards or tokens.** The official rulebooks from BoardGameGeek are allowed.
2. **Don't delete anything.**
3. **Don't add new graphics without the owner's review.**

Graphics added earlier tonight, before rule 3, are on `main` and awaiting the owner's review. Nothing was removed.

- The app icon, redrawn as a hexagon with "TS": `icon-192.png`, `icon-512.png`, `icon-144.png`, `icon-384.png`, `apple-touch-icon.png`, `icon-maskable-192.png`, `icon-maskable-512.png`.
- `og-image.jpg`, the link-preview card.
- Three files in `screenshots/`, which are captures of the app's own interface.
- AVIF and WebP copies of the four rulebooks in `rules/`.
- The Mission Board button has a small gauge mark drawn in CSS (`.bd-gauge-icon`). It is one `<span>` plus two CSS rules, and is easy to remove if not wanted.

## Owner actions

1. ~~**GitHub Pages source:**~~ Done (2026-11-05): Source is set to **GitHub Actions**, so deploys now run the tests and the version stamp.
2. **Captain Crag rulebook:** the image in `rules/` is truncated. Download the official file from BoardGameGeek file page 217405 while logged in, then follow `rules/README.md`.
3. **Unverified names:** check "Striker" vs "Ztriker" (Scenario 14) and "Feth Doriet" / "Pummtoggs" (Scenario 13) against the physical cards.
4. **Permission:** ask Button Shy about storing per-card data, if that is ever wanted. Today the Mission Board uses values the user enters.

## Useful references

- Logic audit with reproductions and the SYZYGY specification: kept in the session; key findings are in the plan above.
- FAQ generator: `tools/faq/` (edit `faq_data.py`, then run `python3 tools/faq/gen.py index.html`).
- Release and deploy: README → "Release / deploy".

## Handoff documents (in `docs/handoff/`)

- `product-plan.html`: the full audit, feature concepts, roadmap and task-level plan (same as the published page).
- `logic-audit.md`: logic findings with severities and the SYZYGY correct-logic specification. H1, H2, H3, H4, H5, M1, M2, M4, M5, M6 and M7 are fixed on `main`/`phase2`; remaining Low items are listed there.
- `product-research.md`: evidence from 84 BoardGameGeek threads, BGG stats, the content inventory and competitor scan, all with citations.
- `bgg-faq-merged.md`: the 95-entry researched FAQ that the in-app FAQ was built from (source for `tools/faq/faq_data.py`).

## How to resume

1. `git checkout phase2` and run the suite: `cd tests && npm ci && npx playwright install --with-deps chromium firefox webkit && npx playwright test`.
2. Fix anything that fails, then open a PR from `phase2` to `main`.
3. Bring in `wip/teach-and-daily` (`git merge phase2` on that branch first), test, review and merge.
4. Then the remaining items under "Not started", in the order listed in the product plan's roadmap.

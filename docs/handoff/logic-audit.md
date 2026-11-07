# Logic audit: Twin Stars Randomizer (`ux-audit` @ 57d67e8)

**Result:** 0 Critical, 5 High, 7 Medium, 12 Low.

- Scope: all application logic in `app.js` and `service-worker.js`. The site has no server.
- Evidence: reproduction scripts and their output are in `logic-audit/scripts/` (`*.js` with matching `*.out`).
- Labels: **Confirmed** means reproduced with a script. **Code-evidenced** means read from the code but not run.
- Engines: H2, H3, H4 and M1 reproduced identically in Chromium, Firefox and WebKit.
- Partly audited: real PWA install, real-device behaviour, and service-worker update and offline behaviour in Firefox and WebKit. The service-worker tests ran in Chromium only.

## High

### H1. SYZYGY I and II do not follow the rulebooks (Confirmed)

**Location:** `app.js` lines 1888–1900 (rank tables), `szStart` at line 1979, `szRecordOutcome` at lines 2008–2048, the bench logic at lines 1942–1953, and `szCalcRank` at line 1966.

`sz.js` ran every win/loss sequence of up to 6 results through the real functions and compared each against a model of the rulebook.

**SYZYGY I:** 7 of 10 decisive sequences are wrong. The app plays 3 stages, but the rulebook has 4.

| Sequence | App says | Rulebook says |
|---|---|---|
| W,W,W | LEGENDS | D is still to play |
| L,W,W,W | FREE | One scenario early |
| W,W,L,L | ALIVE | GROSKSH'D (only 2 completed) |

**SYZYGY II:** 6 of 7 decisive sequences are wrong, and SAFE can never be reached.

| Sequence | App says | Rulebook says |
|---|---|---|
| L,L | LOST | The campaign continues |
| L,W,W | BACK TO SQUARE ONE | The campaign continues; the next win reaches HOME as SAFE |
| W,W,L | BACK TO SQUARE ONE | LOST (loss on the bottom row) |

**Other deviations:**
- SYZYGY II applies the 3-resource retry rule, which exists only in SYZYGY I.
- No character is ever eliminated, because `removed[]` is never written.
- The bench is forced by `stage % alive`. In the rules, the player chooses who sits out.
- After a loss in B or C, the player can't switch to the other card in that section.
- SYZYGY II draws 3 scenarios from all enabled packs. The pyramid needs 6 cards.
- A benched character isn't healed to full.

**Fix:** implement the state graphs in the specification below, with a v2 campaign schema.

### H2. Two open tabs or windows erase each other's data (Confirmed, all 3 engines)

**Cause:** records load once at start-up (line 216), and every save rewrites the whole array (line 251). Nothing listens for `storage` events from other tabs.

**Repro:** tab A saves 2 games, then tab B, opened earlier, saves 1. Storage now holds 1 record instead of 3. The same happens to SYZYGY campaign progress.

**Fix:**
- Listen for the `storage` event and reload records, the campaign and the pack list.
- Make every write read-modify-write against what is currently stored.
- Give records stable ids.

### H3. The app says "Saved" when storage fails (Confirmed)

**Cause:** `toast()` replaces any existing toast. The "Could not save" error is overwritten at once by each caller's success message. The in-memory records are changed before the write and never rolled back.

**Repro:** a replace with 60,000 records reports "Replaced…", but storage still holds the old records, and every later save fails too. `saveSz` fails silently in the same way.

**Fix:**
- Make `saveRecords()` return success or failure, and roll back on failure.
- Show a persistent error with a prompt to export.
- Never let an info toast replace an error.

### H4. Undo while an Edit or Delete dialog is open changes the wrong record (Confirmed, all 3 engines, `race.js`)

**Cause:** the undo toast sits above the dialog overlay and stays clickable. The dialogs hold an array index, which shifts when Undo re-inserts a record.

**Repro:** delete R1, open Edit on R4, click Undo, then Save. R3 is overwritten and R4 is unchanged. The same sequence with Delete removes R4 instead of R5.

**Fix:** use stable record ids, and hide or disable the undo toast while a dialog is open.

### H5. A deploy won't reach installed users unless the cache name is bumped (Confirmed, `sw2.js`)

**Cause:** `CACHE` is still `twin-stars-2026-10-14-1927`, although app files changed in many commits since. The pre-commit hook that bumps it only runs when `core.hooksPath` is set, and never on merge commits. In the test, users never got the new code.

**Fix:** bump `CACHE` before deploying. Add a CI check, or derive the cache name from a content hash.

## Medium

### M1. Invalid records can be saved and are later dropped on load (Confirmed)

**Cause:** setting the clock back makes the timer negative (for example `-60:-59` and a playtime of `-3599`), while the app still says "Saved". On reload, `isValidRecord` drops the record. `gameRecordsBackup` is written only when it is empty, so a second dropped record is lost for good. A corrupt `lastResult` produces a blank result the same way.

**Fix:**
- Clamp each timer segment to zero or more.
- Validate a record before saving it.
- Validate `lastResult` and `lastDifficulty` before applying them.
- Make the backup append-only.

### M2. SYZYGY II shows "only 3 resource points" after any loss (Code-evidenced)

The 3-point retry rule exists only in SYZYGY I, but the app applies it after any loss (line 2025).

**Fix:** set the retry flag only in SYZYGY I.

### M3. An in-progress game is lost on reload and on closing My Collection (reload Confirmed; My Collection Code-evidenced)

**Cause:** after a reload the running mission and its time are gone. Closing My Collection with the running mission's pack unticked ends the mission with no confirmation (`closeSettings`, lines 1076–1086).

**Fix:** save the current game and restore it as paused. Send the My Collection close through `guardUnsaved`.

### M4. Every deploy deletes the cached rulebook images, so offline Rules break (Confirmed)

**Cause:** the images live in the versioned cache, which `activate` deletes.

**Fix:** move them to a persistent `rules-v1` cache.

### M5. Records have no identity (Code-evidenced, with a dedupe check)

**Cause:**
- "Newest first" sorts by position in the array, so records merged from an old backup appear as the newest.
- Merge dedupes on timestamp, characters and scenario only. An edited copy from another device is silently skipped.
- Timestamps are `toLocaleString()` strings, so they depend on the locale and can't be sorted.

**Fix:** give each record a UUID and an ISO timestamp, fill them in for old records on load, sort by timestamp and dedupe by id.

### M6. Stats mix scopes, and rounding hides progress (Confirmed)

**Cause:** Games, Win Rate and Playtime count records from disabled packs. Combos Played and the droid figures count only enabled packs. One played combination out of 792 shows as "0%".

**Fix:** pick one scope and label it, and show counts next to percentages.

### M7. Loading a combination while a character is locked swaps the selectors (Confirmed)

**Cause:** `loadCombination` (lines 1329–1330) still swaps the characters, left over from before Primary/Secondary roles. The card can show one order while the selectors show the other, and a lock moves silently to another character.

**Fix:** set the selectors to exactly the loaded combination, and release changed locks with a message.

## Low

| # | Location | Problem | Evidence |
|---|---|---|---|
| L1 | `doGenerate` | With both characters locked, the toast says "scenario re-rolled", but the same scenario comes back 1 time in 6. | Confirmed |
| L2 | `_diceAdjust` | Pressing − on a 1 wraps to 6. The rulebook says reducing below 1 forces the ⚠⚠ combo. | Confirmed |
| L3 | `openDiceModal` | Reopening the dice dialog re-rolls both dice and clears locks. | Code-evidenced |
| L4 | Dice | `Math.ceil(random*6)` can return 0 if `Math.random()` is exactly 0. Otherwise uniform: χ²=4.5 over 6M rolls. | Confirmed |
| L5 | `enabledPacks` | A corrupt or legacy value gives 0 characters, and Randomize loads a blank mission. | Confirmed |
| L6 | `isValidSz` | Doesn't check `alloc`, `stage` or names. A bad saved campaign crashes the SYZYGY tab or leaves no buttons. | Confirmed |
| L7 | Import | Unknown fields are kept, there is no size cap, and `Math.max(...)` overflows around 100k records. No prototype pollution occurred. | Confirmed |
| L8 | Service worker | Proxies cross-origin requests, including the radio stream; it should bypass them. | Code-evidenced |
| L9 | Service worker | A navigation with a query string misses the cache, so the app fails offline. | Code-evidenced |
| L10 | `rules/twinstars-crag.png` | The file is truncated at exactly 1,920,000 bytes; the bottom ~21% of the image is black. | Confirmed |
| L11 | Content data | Series 1 scenarios use "The"; other packs use "the". Renaming needs a migration, or stored records get dropped. | — |
| L12 | FAQ content | The Gari Obul and Hebolt Rom rulings and a Scenario 14 section are missing. | — |

## Checked and correct

- **Randomizer:** uniform, with χ² in bounds over 13,200 draws, unlocked and with either character locked. Characters are always distinct, and pack choices are respected.
- **Timer:** pause and resume arithmetic is exact.
- **Dice:** the Hebolt Rom flip and the Skill Check restore are correct.
- **Content data:** `SCENARIO_NUMBER` matches the designer-approved FAQ. There are no duplicates, and all FAQ anchors exist.
- **XSS:** every template uses `esc()`, including today's new ones. There are no inline handlers and no `eval`.
- **Blocked storage:** the app still starts cleanly. Saving is still affected by H3.
- **Import:** a non-array file, deeply nested JSON and mixed valid and invalid records are all handled. Undo of Replace works.
- **Service-worker update flow:** no reload on first visit, and an update reload only when idle. Scope is correct on a GitHub Pages subpath and on the Netlify root.
- **Event listeners:** they don't accumulate.

## SYZYGY: correct-logic specification

### Both modes

- Choose 3 characters, each at half health rounded up.
- In each scenario, the player chooses which 2 play. The third heals to full. If only 2 are alive, both play.
- Each scenario gets 5 resources, split between ❤ and ⚡. ⚡ is capped by the scenario card.
- Unused resources carry over to the next stage.
- A character whose 0 health caused a loss is eliminated.

### SYZYGY I

- Shuffle all 6 Series 1 scenarios into a 1-2-2-1 layout: A, B (2 cards), C (2 cards), D.
- **Win:** go to the next section. A win at D ends the campaign.
- **First loss:** retry with 3 resources. In B or C, the player may switch to the other card in that section.
- **Second loss:** the game ends.

| Wins | Losses | Rank |
|---|---|---|
| 4 | 0 | LEGENDS |
| 4 | 1 | FREE |
| 3 (second loss at D) | 2 | ALIVE |
| 2 or fewer | 2 | GROSKSH'D |

**Terminal sequences:**
- GROSKSH'D: L,L; L,W,L; W,L,L; L,W,W,L; W,L,W,L; W,W,L,L
- LEGENDS: W,W,W,W
- FREE: L,W,W,W,W; W,L,W,W,W; W,W,L,W,W; W,W,W,L,W
- ALIVE: L,W,W,W,L; W,L,W,W,L; W,W,L,W,L; W,W,W,L,L

### SYZYGY II "Waypoint"

Shuffle 6 cards into a right-aligned pyramid: row 1 is `S`, row 2 is `a b`, row 3 is `x y z`.

| Node | Win goes to | Loss goes to |
|---|---|---|
| S | b | a |
| a | b | x |
| b | z | y |
| x | y | LOST |
| y | z | LOST |
| z | HOME | LOST |

- There are no retries and no resource penalty.
- A loss on the bottom row, or losing 2 characters, means LOST IN THE UNIVERSE.
- Reaching HOME always takes exactly 3 wins.
- The rank at HOME depends on losses: 0 is LOADED, 1 is SAFE, 2 is BACK TO SQUARE ONE.

**Terminal sequences:**
- LOADED: W,W,W
- SAFE: L,W,W,W; W,L,W,W
- BACK TO SQUARE ONE: L,L,W,W,W; L,W,L,W,W
- LOST: W,W,L; W,L,L; L,L,L; L,W,W,L; W,L,W,L; L,L,W,L; L,W,L,L; L,L,W,W,L; L,W,L,W,L

### Implementation

```js
const SZ2 = { S:{W:"b",L:"a"}, a:{W:"b",L:"x"}, b:{W:"z",L:"y"}, x:{W:"y",L:"LOST"}, y:{W:"z",L:"LOST"}, z:{W:"HOME",L:"LOST"} };
const SZ1_SECTIONS = [[0],[1,2],[3,4],[5]]; // A, B, C, D
```

- Use a v2 campaign object: `{v:2, mode, characters, eliminated, node|section, card, wins, losses, retry, playing, carry, results, completed, rank}`.
- `szRecordOutcome(result, eliminatedIdx)` applies one row of the tables above.
- `isValidSz` should accept only v2. For an unfinished v1 campaign, offer to abandon it or keep it read-only, rather than converting it.

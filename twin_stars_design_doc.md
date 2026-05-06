# Twin Stars Adventure Series — Randomizer
## Design & Requirements Document

**Current Version: 1.3.6**
**Last Updated: March 2026**

---

## What Is This?

A free, unofficial fan-made companion app for the **Twin Stars Adventure Series** card games, designed by Jason Tagmire & Mike Mullins and published by Button Shy Games.

The app supports content from multiple Twin Stars releases. Users select which games they own, and the app randomizes character and scenario combinations from only their collection.

The app does five things:
1. Lets the user configure which Twin Stars content they own
2. Picks a random character combination and scenario from their active collection — or lets them pick manually
3. Times the session automatically while they play
4. Tracks results so they can see what they've played, how they did, and what's left unplayed
5. Supports light and dark themes, defaulting to the user's OS preference

This is not affiliated with or endorsed by Button Shy Games. All Twin Stars characters, scenarios, and game content are the intellectual property of Button Shy Games and their creators.

---

## Who Made It

Made with love by *THE* James Dean Cochran.

- Bluesky: https://bsky.app/profile/jamescochran.bsky.social
- Tip jar: https://ko-fi.com/jamescochran
- Community: https://discord.gg/aUBMvnu (Button Shy Discord)
- GitHub: https://github.com/jamescochran/jamescochran.github.io

---

## Architecture

**Stack:** Plain HTML, CSS, vanilla JavaScript — no frameworks, no libraries, no build tools.

**File structure:**
```
TwinStarsRando/
  index.html          ← the entire app (HTML + CSS + JS in one file)
  service-worker.js   ← PWA offline caching
  manifest.json       ← PWA install metadata
  icon-192.png        ← PWA icon
  icon-512.png        ← PWA icon
```

**Why one HTML file?** The app logic (HTML structure, CSS styles, JavaScript) all lives in `index.html`. This is a deliberate choice — it keeps the project simple, requires no build pipeline, and makes the app easy to understand. The three extra files (`service-worker.js`, `manifest.json`, icons) exist only because the PWA spec requires them to be separate — they cannot be inlined.

**Internet required:** The app fetches Orbitron and Exo 2 from Google Fonts on load. An internet connection is required for correct visual styling. The app is functional without it but will fall back to system fonts.

**Storage:** `localStorage` only. See the Data Model section for the full key list.

Nothing is ever sent to a server.

---

## PWA Details

The app is installable as a Progressive Web App on mobile and desktop.

**manifest.json** — declares the app name, icons, theme colors, and display mode. Key fields:
- `name`: "Twin Stars Adventure Series Randomizer"
- `short_name`: "Twin Stars"
- `display`: "standalone"
- `background_color` / `theme_color`: `#07091a`
- Icons: 192×192 and 512×512 PNG, each with separate `"any"` and `"maskable"` purpose entries

**service-worker.js** — caches all app assets on install so the app shell loads instantly. Uses a cache-first strategy. The cache name is tied to the app version (e.g. `"twin-stars-v1.3.6"`) — **this must be updated with every deployment** or PWA users will receive stale content.

---

## Content Packs

Content is organized into packs. Each pack has an `id`, `name`, `shortName`, `desc`, a list of `characters`, and a list of `scenarios`. The user selects which packs they own via the "My Collection" modal. The randomizer and manual dropdowns only include content from enabled packs.

Characters and scenarios from different packs can be freely mixed — any character can be paired with any scenario regardless of which release they came from.

**Current packs:**

| ID | Name | Characters | Scenarios |
|---|---|---|---|
| `series1` | Series 1 Wallet | 12 | 6 |
| `series2` | Series 2 Wallet | 12 | 6 |
| `scenario14` | Scenario 14: Save the Spacewhales! | 2 | 1 |
| `captaincrag` | Captain Crag | 1 | 0 |

**Series 1 characters (12):**
Bood, Stag Solar, Fanoobia, Inpon Gol, Grant Rockgardner, Roux Jaezmina, Yanfred Jima, Saaze, Inzill Mey, Strezelsior, Kinglan, Brenimov-X

**Series 1 scenarios (6):**
Escape The Brig!, Rule The World!, Stop The Virus!, Hunt The Bounty!, Steal The Plans!, Confine The Quarks!

**Series 2 characters (12):**
Dain Taubo, Grulexon, Gari Obul, Smiff, Zoaze, Tumbug Firo, Mzerzo, Phaeton, Hebolt Rom, Tarla Voke, Gruffles, "Mad" Anxy

**Series 2 scenarios (6):**
Master the Trials!, Beat the Odds!, Control the Skies!, Sell the Junk!, Destroy the Order!, Serve the Rabble!

**Scenario 14 characters (2):**
Striker, Bippinnidip

**Scenario 14 scenarios (1):**
Save the Spacewhales!

**Captain Crag characters (1):**
Captain Crag *(fan-voted PNP Arcade promo — no new scenarios)*

**Validation:** Import validation uses `ALL_CHARACTERS_SET` and `ALL_SCENARIOS_SET`, which include every character and scenario from every pack regardless of what's currently enabled. This means records from any pack can always be imported even if that pack is toggled off.

**Minimum requirement:** At least 2 characters and 1 scenario must be active for the app to function. The settings modal enforces this and prevents disabling a pack that would violate it.

---

## Feature Reference

### Header

Stacked title styled to match original card art: "Twin Stars / Adventure / Randomizer". Author credit above in small caps. Positioned elements:

- **"My Collection" button** — top-right corner. Opens the content pack settings modal. Styled as a small bordered Orbitron-font button.
- **Theme toggle button** — left of "My Collection". Switches between dark and light mode. Shows a moon icon in dark mode, sun icon in light mode.
- **Active packs label** — below the header rule. Shows which packs are currently enabled, e.g. "Series 1 · Series 2 · Cpt. Crag". Updated automatically when settings change.
- **Onboarding tooltip** — appears automatically on first load, pointing at the My Collection and theme toggle buttons. Dismissed permanently via "Got it" button. Never shown again once dismissed (`hasSeenTip` flag in localStorage).

---

### My Collection Modal

Opens when the user taps "My Collection". Lists all content packs as checkbox rows. Each row shows the pack name and a brief description of what it contains.

- Checking a box adds that pack's characters/scenarios to the active pool
- Unchecking removes them
- If unchecking would leave fewer than 2 characters or 0 scenarios, the action is blocked and a warning is shown
- Closing the modal (via "Done" button or tapping the backdrop) saves the selection to `localStorage`, rebuilds the active content arrays, repopulates the dropdowns, and refreshes all displays

---

### Tab 1: Randomizer

Two ways to load a combination:

**Randomize Combination**
Large orange button. Shuffles the active characters array using a `Math.random()` sort, takes the first two, sorts them alphabetically, and picks a random scenario. Loads the result immediately and starts the timer. Hides the Manual Selection panel.

**Manual Selection** *(collapsed by default, shown via "+ Manual Selection" link)*
Three dropdowns: Character 1, Character 2, Scenario. The two character dropdowns are always kept in sync — selecting a character in one removes it from the other, making it impossible to select the same character twice. Pressing "Load Mission" loads the combination.

After any combination is loaded, the manual dropdowns update to reflect it.

---

### Combination Card

Displayed once a combination is loaded. Contains:

- **Character names** — displayed large with "&" between them
- **Scenario name**
- **Play count** — "Never played", "Played 1 time", or "Played N times"
- **Difficulty badges** — three badges (Easy, Medium, Hard), each with a colored dot:
  - Dim dot — never played this combo at this difficulty
  - Teal dot — won at least once at this difficulty
  - Red dot — played at this difficulty but never won
- **Timer** — starts automatically when a combination loads. Shows elapsed time in MM:SS format.
  - **Restart button** — shows a confirmation modal before resetting to 00:00
  - **Pause / Resume button** — toggles pause state; button turns orange while paused

---

### Record Outcome Panel

Appears below the combination card once a combination is loaded.

- **Result** dropdown: Win / Loss
- **Difficulty** dropdown: Easy / Medium / Hard
- **Save Record button** — stops the timer, saves the record with the elapsed time and a timestamp, restarts the timer for the next round, refreshes the combination card and history

The last-used Result and Difficulty values are remembered in `localStorage` and pre-selected on the next save.

---

### Combo History Panel

Appears below the Record Outcome panel once a combination is loaded. Shows a table of all past records for the *current combination only*: Date/Time, Result, Difficulty, Time, and a ✕ delete button per row.

Deleting a record removes it from the array, saves, and refreshes the card and combo history.

---

### Tab 2: Mission Log

**Mission Log table** — every record ever saved, across all combinations: Date/Time, Characters, Scenario, Result, Difficulty, Time, and a ✕ delete button per row. Deleting a record also refreshes the Unplayed Combinations list and the active combination card if one is loaded.

**Export** — downloads all records as a JSON file named `twin_stars_records_YYYY-MM-DD.json`.

**Import** — file picker (no submit button needed — fires on file selection). Reads the file, parses JSON, runs every record through `isValidRecord()`, replaces the current records with the valid ones, and shows a toast confirming how many were imported and how many were skipped. Invalid records are dropped silently.

**Clear All** — shows a confirmation modal. Deletes all records on confirm.

**Unplayed Combinations** — lists all character/scenario combinations from the active content that haven't been played yet. Shows a count ("X of Y combinations played"). Each entry has a "Play" button that loads that combination and switches to the Randomizer tab. Only the first 20 unplayed combos are shown; remaining count shown as "…and N more". The total combination count formula is: `characters.length × (characters.length - 1) / 2 × scenarios.length`.

---

### Footer

- Byline: "Made with love by THE James Dean Cochran" (THE is a link to Bluesky)
- Ko-fi tip jar link
- Hot Dogs BGG link (James's other favorite Button Shy game)
- Button Shy Discord invite
- "Buy Twin Stars" link (Button Shy store)
- BGG page for Twin Stars
- GitHub link
- IP disclaimer

---

### Modals

Three modal overlays share the same `.modal-overlay` + `.modal-box` structure. All close when clicking/tapping the backdrop.

| Modal | ID | Trigger | Actions |
|---|---|---|---|
| Restart Timer | `restartModal` | Restart button on timer | Cancel / Restart |
| Clear All Records | `confirmModal` | "Clear All" button | Cancel / Clear All |
| My Collection | `settingsModal` | "My Collection" button | Checkbox list + Done |

---

### Toast Notifications

Short-lived notification banners that appear at the bottom-center of the screen and auto-dismiss after ~2.6 seconds. Two styles: `info` (teal) and `error` (red). Used for: record saved, export success, import results, validation errors, clear confirmation.

---

## Data Model

### Record

Each saved play session is stored as:

```json
{
  "characters": ["CharA", "CharB"],
  "scenario":   "Scenario Name!",
  "result":     "Win",
  "difficulty": "Medium",
  "playtime":   847,
  "timestamp":  "3/19/2026, 9:14:00 PM"
}
```

| Field | Type | Notes |
|---|---|---|
| `characters` | `[string, string]` | Always two, always sorted alphabetically |
| `scenario` | `string` | Must be a known scenario name |
| `result` | `"Win" \| "Loss"` | |
| `difficulty` | `"Easy" \| "Medium" \| "Hard"` | |
| `playtime` | `number \| null` | Elapsed seconds. `null` or absent on old pre-timer records |
| `timestamp` | `string` | `new Date().toLocaleString()` — human-readable, not ISO |

### localStorage Keys

| Key | Value | Notes |
|---|---|---|
| `"gameRecords"` | JSON array of records | All saved play sessions |
| `"enabledPacks"` | JSON array of pack ID strings | e.g. `["series1","series2"]` |
| `"lastResult"` | `"Win"` or `"Loss"` | Pre-selects result dropdown on next save |
| `"lastDifficulty"` | `"Easy"`, `"Medium"`, or `"Hard"` | Pre-selects difficulty dropdown on next save |
| `"theme"` | `"dark"` or `"light"` | Saved theme preference; defaults to OS setting if absent |
| `"hasSeenTip"` | `"1"` | Set after the onboarding tooltip is dismissed; never shows again once set |

### Combo Key

Combinations are identified by a string key used to look up records:
```
[char1]|[char2]-[scenario]
```
Characters are always sorted alphabetically before building this key. `|` and `-` are separators — if any future character or scenario name contains these characters, the key logic must be updated.

Example: `"Bood|Stag Solar-Escape The Brig!"`

---

## Color Palette

| Variable | Value | Used For |
|---|---|---|
| `--bg-deep` | `#07091a` | Page background |
| `--bg-panel` | `#0e1228` | Panel backgrounds |
| `--bg-card` | `#131830` | Card/input backgrounds |
| `--border` | `#1e2d55` | Default borders |
| `--border-glow` | `#2a4a8a` | Highlighted borders |
| `--accent-orange` | `#ff6b35` | Primary actions, active tab |
| `--accent-teal` | `#00d4aa` | Wins, secondary actions, teal accents |
| `--accent-yellow` | `#f0b429` | Button Shy brand color — Discord link |
| `--text-primary` | `#e8eaf6` | Main text |
| `--text-muted` | `#7a88b0` | Secondary text |
| `--text-dim` | `#3e4f78` | Hints, labels, disabled |
| `--loss-color` | `#ff4455` | Losses, errors, danger actions |
| `#6aab96` | (inline) | *THE* in footer byline — muted seafoam |
| `#e8b800` | (inline) | Hot Dogs link — mustard yellow |

---

## Typography

- **Headings / UI labels / buttons:** Orbitron (Google Fonts) — weights 400, 700, 900
- **Body text / dropdowns / tables:** Exo 2 (Google Fonts) — weights 300, 400, 600
- **Fallback:** system sans-serif if Google Fonts is unavailable

---

## External Links

| Label | URL |
|---|---|
| Bluesky (THE) | https://bsky.app/profile/jamescochran.bsky.social |
| Ko-fi | https://ko-fi.com/jamescochran |
| Hot Dogs (BGG) | https://boardgamegeek.com/boardgame/211988/hot-dogs |
| Button Shy Discord | https://discord.gg/aUBMvnu |
| Buy Twin Stars | https://buttonshygames.com/products/twin-stars |
| Twin Stars BGG | https://boardgamegeek.com/boardgame/231854/twin-stars-adventure-series-i |
| GitHub | https://github.com/jamescochran/jamescochran.github.io |

---

## Roadmap

### v1.4 — Scenario Numbers in Display
Each scenario has an official number in the Twin Stars series. Add a `number` field to each scenario in `CONTENT_PACKS` and display it as a muted prefix everywhere a scenario name appears.

**Display format:** `Scenario 05:` in `--text-dim` color, followed by the scenario name in the normal color. Example: `Scenario 05: Steal the Plans!`

**Scope of changes:**
- Add `number` to each scenario object in the content pack data (e.g. `{ name: "Steal the Plans!", number: 5 }`)
- Update scenario display in the combination card, manual selection dropdown, mission log table, unplayed combinations list, and combo history panel
- Sort scenario lists by number everywhere they appear (dropdowns, unplayed list, etc.)
- Scenario numbers for current packs:
  - Series 1: Scenarios 01–06 (order matches current list order)
  - Series 2: Scenarios 07–12 (order matches current list order)
  - Scenario 14: Save the Spacewhales! — Scenario 14
  - Scenario 13: Topple the Giant! — Scenario 13 *(not yet in app — add when v2.0 ships)*
  - Captain Crag has no scenarios

---

### v2.0 — Additional Content Packs
Content not yet in the app. Each should be added as its own pack in `CONTENT_PACKS`:

| Content | Details |
|---|---|
| Scenario 13: Topple the Giant! | 1 scenario, 2 characters (names unknown — need physical card) |
| Series I Droid Assistants | C.R.A.N.K., MC-CY, Domino 2-5 — adds a third-character mechanic |
| Series II Droid Assistants | F1D0, T.R.IX, MANTIS — same mechanic as Series I droids |
| SYZYGY Mode (Series I) | Campaign mode overlay — needs design work to determine record fields |
| SYZYGY: Waypoints (Series II) | Campaign mode overlay — separate from Series I SYZYGY |

Note: Droid Assistants add a "third character" to any game, not a second — this requires new UI (a third optional slot) and a new record field to track which droid was used. Design needed before implementation.

---

### v2.1 — Lock Slots
Allow the user to lock any combination of the two character slots and the scenario slot before randomizing. Locked slots keep their current value; only unlocked slots get re-randomized. Examples:

- Lock the scenario → only characters change on each roll
- Lock Character 1 → keep your favorite character, randomize their partner and mission
- Lock both characters → only the scenario changes
- Lock any two → only the remaining slot randomizes

UI approach: a small lock icon or toggle next to each slot on the combination card. Locked slots are visually distinct (e.g. highlighted border or lock icon). The "Randomize" button respects all locks. If all three slots are locked, the button is disabled or a toast explains nothing will change.

---

### v3.0 — Record Keeping and Stats
- Edit individual records (fix a wrong result or difficulty)
- Optional notes field per record
- Sort and filter the history table
- Win rate per combination
- Completion grid — visual checklist of all possible combinations (will be compelling at 396+ combos)
- "Suggest an unplayed combination" — weighted random that favors what you haven't tried

---

### v4.0 — Sharing and Convenience
- Shareable combination codes — a short string someone else can paste to load the same combo
- Printable / human-readable export (not just raw JSON)
- Favorite or flag combinations to revisit
- Remember the last loaded combination when reopening the app
- "Play again" shortcut after saving a record
- Import merge — combine two record sets rather than replace one with the other

---

### v4.1 — Accessibility
- All interactive elements keyboard navigable (tab order, Enter/Space activation)
- Screen reader friendly — `aria-label` on icon-only buttons, `role` on custom controls
- Focus indicators visible in both light and dark themes

---

### v4.2 — App Icon Refresh
The current icon is a placeholder. Replace with a hand-designed or illustrated icon that matches the space/sci-fi tone of the app. Both 192×192 and 512×512 versions required. The 512px version must be safe for maskable use (important content within the inner 80% safe zone).

---

### Future / Unscheduled
- Community leaderboard or shared win rates (needs a backend — major scope change)
- Cloud sync across devices (needs a backend)
- Two-player companion mode — both players tracking simultaneously

# Twin Stars Adventure Series — Randomizer

A free, unofficial fan-made companion app for the **Twin Stars Adventure Series** card games, designed by Jason Tagmire & Mike Mullins and published by Button Shy Games.

**Live app:** https://jamescochran.github.io/TwinStarsRando

---

## What It Does

1. Configure which Twin Stars content you own
2. Pick a random character combination and scenario — or choose manually
3. Time the session automatically while you play
4. Track results so you can see what you've played, how you did, and what's left unplayed
5. Light and dark themes, defaulting to your OS preference

*Not affiliated with or endorsed by Button Shy Games. All Twin Stars characters, scenarios, and game content are the intellectual property of Button Shy Games and their creators.*

---

## Made By

Made with love by *THE* James Dean Cochran.

- Bluesky: https://bsky.app/profile/jamescochran.bsky.social
- Tip jar: https://ko-fi.com/jamescochran
- Community: https://discord.gg/aUBMvnu (Button Shy Discord)

---

## Architecture

**Stack:** Plain HTML, CSS, vanilla JavaScript — no frameworks, no libraries, no build tools.

```
TwinStarsRando/
  index.html          ← the entire app (HTML + CSS + JS in one file)
  service-worker.js   ← PWA offline caching
  manifest.json       ← PWA install metadata
  icon-192.png        ← PWA icon (192×192)
  icon-512.png        ← PWA icon (512×512)
```

The entire app logic lives in `index.html`. The three extra files exist only because the PWA spec requires them to be separate. No build pipeline required.

**Fonts:** Orbitron and Exo 2 fetched from Google Fonts. An internet connection is needed for correct styling; falls back to system fonts offline.

**Storage:** `localStorage` only. Nothing is ever sent to a server.

---

## Content Packs

| ID | Name | Characters | Scenarios |
|---|---|---|---|
| `series1` | Series 1 Wallet | 12 | 6 |
| `series2` | Series 2 Wallet | 12 | 6 |
| `scenario14` | Scenario 14: Save the Spacewhales! | 2 | 1 |
| `captaincrag` | Captain Crag | 1 | 0 |

**Series 1 characters:** Bood, Stag Solar, Fanoobia, Inpon Gol, Grant Rockgardner, Roux Jaezmina, Yanfred Jima, Saaze, Inzill Mey, Strezelsior, Kinglan, Brenimov-X

**Series 1 scenarios:** Escape The Brig!, Rule The World!, Stop The Virus!, Hunt The Bounty!, Steal The Plans!, Confine The Quarks!

**Series 2 characters:** Dain Taubo, Grulexon, Gari Obul, Smiff, Zoaze, Tumbug Firo, Mzerzo, Phaeton, Hebolt Rom, Tarla Voke, Gruffles, "Mad" Anxy

**Series 2 scenarios:** Master the Trials!, Beat the Odds!, Control the Skies!, Sell the Junk!, Destroy the Order!, Serve the Rabble!

**Scenario 14:** Characters: Striker, Bippinnidip — Scenario: Save the Spacewhales!

**Captain Crag:** Promo character, no new scenarios.

Any character can be paired with any scenario regardless of which pack they came from.

**Minimum requirement:** At least 2 characters and 1 scenario must be active. The settings modal enforces this.

---

## Data Model

### Record

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
| `playtime` | `number \| null` | Elapsed seconds. `null` on pre-timer records |
| `timestamp` | `string` | `new Date().toLocaleString()` |

### localStorage Keys

| Key | Value |
|---|---|
| `"gameRecords"` | JSON array of all saved records |
| `"enabledPacks"` | JSON array of pack ID strings |
| `"lastResult"` | `"Win"` or `"Loss"` |
| `"lastDifficulty"` | `"Easy"`, `"Medium"`, or `"Hard"` |
| `"theme"` | `"dark"` or `"light"` |
| `"hasSeenTip"` | `"1"` after onboarding tooltip dismissed |

### Combo Key

Combinations are identified by: `[char1]|[char2]-[scenario]`

Characters are always sorted alphabetically first. Example: `"Bood|Stag Solar-Escape The Brig!"`

**Note for new content:** If any future character or scenario name contains `|` or `-`, the key logic must be updated. All current names have been verified safe.

---

## Developer Notes

### Service Worker Cache

The cache name in `service-worker.js` is tied to the app version (e.g. `"twin-stars-2026-05-06-1128"`). **This must be updated on every deployment** or PWA users will receive stale content indefinitely.

### XSS / innerHTML

All data is passed through `esc()` before being inserted via `innerHTML`. This uses a temporary DOM element's `textContent`/`innerHTML` round-trip to escape HTML. **Known gap:** `esc()` does not escape double quotes, which breaks `data-*` attributes for `"Mad" Anxy` — tracked in Issue #3.

### Import Validation

`isValidRecord()` validates all fields of every imported record against known-good values from `ALL_CHARACTERS_SET` and `ALL_SCENARIOS_SET`. Invalid records are silently skipped. The `timestamp` field is accepted as a free string (escaped on render, not validated for format).

### Math.random()

Used for shuffling and scenario selection. Not cryptographically secure — appropriate for a board game tool.

### Timer Accuracy

`setInterval` at 1000ms. Browser background throttling may cause minor drift over long sessions; acceptable for a game timer.

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
| `--accent-teal` | `#00d4aa` | Wins, secondary actions |
| `--accent-yellow` | `#f0b429` | Button Shy brand color |
| `--text-primary` | `#e8eaf6` | Main text |
| `--text-muted` | `#7a88b0` | Secondary text |
| `--text-dim` | `#3e4f78` | Hints, labels, disabled |
| `--loss-color` | `#ff4455` | Losses, errors, danger |

**Typography:** Orbitron (headings/UI) and Exo 2 (body) from Google Fonts; system sans-serif fallback.

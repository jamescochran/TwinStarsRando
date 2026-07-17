# Twin Stars Adventure Series — Randomizer

[![Tests](https://github.com/jamescochran/TwinStarsRando/actions/workflows/tests.yml/badge.svg)](https://github.com/jamescochran/TwinStarsRando/actions/workflows/tests.yml)
[![CodeQL](https://github.com/jamescochran/TwinStarsRando/actions/workflows/codeql.yml/badge.svg)](https://github.com/jamescochran/TwinStarsRando/actions/workflows/codeql.yml)
[![Dependabot](https://img.shields.io/badge/Dependabot-enabled-025e8c?logo=dependabot)](https://github.com/jamescochran/TwinStarsRando/network/updates)

> *"Bood and 'Mad' Anxy again? Really? You've played that combo eleven times."*
> — this app, judging you gently

A free, unofficial companion PWA for **Twin Stars Adventure Series** — the pocket-sized cooperative card game designed by Jason Tagmire & Mike Mullins and published by [Button Shy Games](https://buttonshygames.com/products/twin-stars).

**➜ Play it now:** https://jamescochran.github.io/TwinStarsRando

---

## The Problem

You sit down with your copy of Twin Stars. You stare at the character cards. You say "let's just do Bood and Stag Solar again" because that's the first two you grabbed. You play the same three combos on rotation for six months. Brenimov-X has never seen the table. Neither has Bippinnidip. They're right there. They have feelings.

## The Solution

Hit **Randomize**. The app picks two characters and a scenario at random from the content packs you own. The timer starts. You play. You log the result. The cycle continues until you've played every possible combination across every difficulty — at which point the app congratulates you and you reconsider your life choices.

---

## What It Does

- **Randomizes** character pairs and scenarios from your owned content — or lets you pick manually if you're that kind of person
- **Locks** any character or scenario so it survives the next randomize; re-roll everything else freely
- **Assigns a Droid Assistant** — pick or randomize a droid from your owned Droid Assistant packs for extra challenge
- **Times** your session automatically with pause, resume, and restart
- **Logs** every result — Win/Loss, difficulty, elapsed time, timestamp; edit any record after the fact and add optional notes
- **Tracks** per-combination history and shows exactly which combos you've never touched (with a direct "Play" button so there are no excuses)
- **Sorts and filters** the Mission Log by date, result, difficulty, character, or scenario
- **Stats panel** — overall win rate, completion percentage, and playtime averages at a glance
- **Rolls dice** — built-in dice roller during active sessions; tap a die to lock it (teal glow), +/− to adjust, swap both dice, flip to opposite face (Hebolt Rom); Skill Check mode rolls white dice then restores your normal dice exactly as you left them
- **Remembers** your last result and difficulty setting so you don't have to re-select them every time
- **Plays ambient radio** — optional [SomaFM Mission Control](https://somafm.com/missioncontrol/) stream (online only); ♫ button in the header, volume popover, lock-screen controls via mediaSession API
- **Tips & Features** — tap **?** in the header anytime for a quick reference of every non-obvious feature
- **Works offline** once installed — no server, no account, no subscription, no data leaving your device, ever
- **Installs as a PWA** — add it to your home screen and it feels like a native app

Light and dark themes. Defaults to your OS preference. Looks great in the dark while your play area is lit by a single dramatic lamp.

---

## Getting Started

1. Open the app on your phone or desktop
2. Tap **My Collection** (top right) and check off which Twin Stars products you own
3. Hit **Randomize Combination**
4. Play the game
5. Log your result
6. Repeat until you've beaten every combination on every difficulty, or until your friends stage an intervention

That's it. No tutorial. No onboarding flow. No email required.

---

## Content Packs

| Pack | Characters | Scenarios |
|------|-----------|-----------|
| Series 1 Wallet *(base game)* | 12 | 6 |
| Series 2 Wallet | 12 | 6 |
| Scenario 13: Topple the Giant! | 2 | 1 |
| Scenario 14: Save the Spacewhales! | 2 | 1 |
| Captain Crag *(promo)* | 1 | — |

Any character can be paired with any scenario regardless of pack. Character 1 is **Primary**; Character 2 is **Secondary** — so order matters. With all five packs, that's **11,368 unique ordered character-pair + scenario combinations** (29 × 28 × 14). At one per day you'd be done in just over 31 years. Totally manageable.

<details>
<summary>Full character and scenario list</summary>

**Series 1 characters:** Bood, Stag Solar, Fanoobia, Inpon Gol, Grant Rockgardner, Roux Jaezmina, Yanfred Jima, Saaze, Inzill Mey, Strezelsior, Kinglan, Brenimov-X

**Series 1 scenarios:** Escape The Brig!, Rule The World!, Stop The Virus!, Hunt The Bounty!, Steal The Plans!, Confine The Quarks!

**Series 2 characters:** Dain Taubo, Grulexon, Gari Obul, Smiff, Zoaze, Tumbug Firo, Mzerzo, Phaeton, Hebolt Rom, Tarla Voke, Gruffles, "Mad" Anxy

**Series 2 scenarios:** Master the Trials!, Beat the Odds!, Control the Skies!, Sell the Junk!, Destroy the Order!, Serve the Rabble!

**Scenario 13:** Feth Doriet, Pummtoggs — Topple the Giant!

**Scenario 14:** Striker, Bippinnidip — Save the Spacewhales!

**Captain Crag:** Promo character. No new scenarios. Tremendous hat.

</details>

---

## For Developers

This thing is aggressively simple. One HTML file. No framework. No build step. The only `node_modules` is in `tests/` and it's gitignored.

### First-time setup

After cloning, activate the pre-commit hook that auto-bumps the service worker cache name on every commit:

```sh
git config core.hooksPath .githooks
```

### Testing

Tests live in `tests/` and use [Playwright](https://playwright.dev/). To run locally:

```sh
cd tests
npm ci
npx playwright install firefox   # or chromium on Linux with system deps
npm test
```

CI runs on every push and pull request via `.github/workflows/tests.yml`.

### Stack

```
TwinStarsRando/
  index.html          ← the entire app (HTML + CSS + JS in one file, ~3900 lines)
  service-worker.js   ← PWA offline caching
  manifest.json       ← PWA install metadata
  netlify.toml        ← security headers + service worker no-cache config
  icon-192.png        ← app icon (192×192)
  icon-512.png        ← app icon (512×512)
  rules/              ← bundled rulebook images (served as static assets)
  tests/              ← Playwright e2e test suite
```

**Fonts:** Orbitron (headings) and Exo 2 (body) from Google Fonts. Both are cached by the service worker on first visit — offline looks correct from the second load onward. Falls back to system sans-serif on the first offline load.

**Storage:** `localStorage` only. Nothing is ever sent to a server. There is no server.

**Analytics:** Self-hosted [Umami](https://umami.is/) instance (`umami.1jc.in`) — page views only, no personal data, no third-party tracking.

### Data Model

Each saved record looks like this:

```json
{
  "characters": ["Bood", "Stag Solar"],
  "scenario":   "Escape The Brig!",
  "result":     "Win",
  "difficulty": "Medium",
  "playtime":   847,
  "timestamp":  "3/19/2026, 9:14:00 PM"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `characters` | `[string, string]` | Always two; index 0 = Primary (Character 1), index 1 = Secondary (Character 2) |
| `scenario` | `string` | Must match a known scenario name |
| `result` | `"Win" \| "Loss"` | |
| `difficulty` | `"Easy" \| "Medium" \| "Hard"` | |
| `playtime` | `number \| null` | Elapsed seconds; `null` on pre-timer records |
| `timestamp` | `string` | `new Date().toLocaleString()` — locale-dependent format |
| `notes` | `string` | Optional free-text note added via record edit |

### localStorage Keys

| Key | Value |
|-----|-------|
| `"gameRecords"` | JSON array of all saved records |
| `"enabledPacks"` | JSON array of active pack ID strings |
| `"lastResult"` | `"Win"` or `"Loss"` — persisted across sessions |
| `"lastDifficulty"` | `"Easy"`, `"Medium"`, or `"Hard"` — persisted across sessions |
| `"theme"` | `"dark"` or `"light"` |
| `"hasSeenTip"` | `"1"` once the onboarding tooltip has been dismissed |
| `"radioVolume"` | Float string `"0"`–`"1"` — ambient radio volume (default `"0.3"`) |
| `"seenPrimarySecondaryNotice"` | `"1"` once the Primary/Secondary migration notice has been shown |

### Combo Key Format

Combinations are keyed as: `[char1]\x1F[char2]\x1E[scenario]`

Characters are joined in order (Primary first, Secondary second). The delimiters are ASCII control characters — unit separator (`\x1F`) between characters and record separator (`\x1E`) before the scenario — so they can never appear in a character or scenario name.

### XSS / innerHTML

All user-visible data passes through `esc()` before insertion via `innerHTML`. This escapes `<`, `>`, `&`, and `"` — the last via a `.replace(/"/g, '&quot;')` pass after the `textContent`/`innerHTML` round-trip, which handles names like `"Mad" Anxy` in `data-*` attributes.

### Service Worker Cache

The cache name in `service-worker.js` (`twin-stars-YYYY-MM-DD-HHMM`) **must be bumped on every deployment** or installed PWA users will receive stale content indefinitely. The fonts live in a separate persistent `FONTS_CACHE` that survives app cache rotations.

---

## Color Palette

| Variable | Dark | Light | Used for |
|----------|------|-------|----------|
| `--bg-deep` | `#07091a` | `#f0f2fb` | Page background |
| `--bg-panel` | `#0e1228` | `#e4e8f8` | Panel backgrounds |
| `--bg-card` | `#131830` | `#dce0f4` | Card / input backgrounds |
| `--accent-orange` | `#ff6b35` | *(same)* | Primary actions, active tab |
| `--accent-teal` | `#00d4aa` | `#008f74` | Wins, secondary actions |
| `--accent-yellow` | `#f0b429` | `#b07d00` | Button Shy brand color |
| `--loss-color` | `#ff4455` | `#c8001e` | Losses, errors, danger |

---

## Contributing

Issues and pull requests welcome. The tracker is [right here on GitHub](https://github.com/jamescochran/TwinStarsRando/issues). Known bugs and planned features are all logged there — pick something and go for it.

---

## Credits & Disclaimer

**Twin Stars Adventure Series** is designed by Jason Tagmire & Mike Mullins and published by [Button Shy Games](https://buttonshygames.com). All characters, scenarios, and game content are their intellectual property.

This is an unofficial, free, fan-made app. Not affiliated with or endorsed by Button Shy Games. If you don't own Twin Stars yet, [go buy it](https://buttonshygames.com/products/twin-stars). It fits in your wallet and it's wonderful.

Ambient radio provided by [SomaFM](https://somafm.com/) — [Mission Control](https://somafm.com/missioncontrol/) channel. If you enjoy the stream, [support SomaFM](https://somafm.com/support/).

Made with love by [*THE* James Dean Cochran](https://bsky.app/profile/jamescochran.bsky.social).
If it brings you joy, [buy me a coffee](https://ko-fi.com/jamescochran) or send me a copy of [Hot Dogs](https://boardgamegeek.com/boardgame/211988/hot-dogs).
Come talk Button Shy with us on [Discord](https://discord.gg/aUBMvnu).

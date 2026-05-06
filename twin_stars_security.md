# Twin Stars Randomizer — Security & Risk Document

**Applies to: v1.3.6+**
**Audience: Developers maintaining or extending this codebase**

---

## Overview

This app has an unusually low threat surface. It runs as a hosted PWA with no server, no user accounts, no network requests, and stores only game records locally. Most standard web security concerns do not apply here.

---

## Threat Surface

### 1. localStorage — Data Storage

**What it is:** All game records are stored in the browser's localStorage under the key `"gameRecords"` as a JSON string. Enabled content packs are stored under `"enabledPacks"`.

**Risks:**
- localStorage is readable by any JavaScript running on the same origin.
- localStorage is not encrypted. Anyone with physical access to the machine and browser can read the records via developer tools.
- If localStorage becomes full (typically 5–10MB), writes will fail. The app catches this and shows an error toast rather than crashing silently.
- If the stored JSON is corrupted, the app catches the parse error on load and starts with an empty state rather than crashing.

**Verdict:** Low risk for this use case. Records are game scores, not sensitive personal data.

---

### 2. innerHTML and XSS

**What it is:** The app uses `innerHTML` to render combination and history data into the page.

**What was done:** All data is passed through an `esc()` helper function before being inserted into HTML. This function creates a temporary DOM element, sets its `textContent` (which is always safe), and reads back the escaped `innerHTML`. This prevents any HTML or JavaScript in data values from being interpreted by the browser.

```javascript
function esc(str) {
  const d = document.createElement("div");
  d.textContent = String(str);
  return d.innerHTML;
}
```

**Where this matters most — import:** When a user imports a JSON file, those records are passed through `isValidRecord()` before being accepted. This function checks that every field matches known-good values from `ALL_CHARACTERS_SET` and `ALL_SCENARIOS_SET`, which include every character and scenario across all content packs. A record with a character name of `<script>alert('xss')</script>` would be rejected entirely, not escaped-and-displayed.

**Residual risk:** The `timestamp` field is accepted from imported records as a plain string without format validation. It is escaped via `esc()` before rendering, so it cannot execute code — but a malicious file could cause a weird-looking timestamp to appear in the history table. This is cosmetic only.

**Verdict:** Handled. The combination of input validation on import and escaping on render means injected content cannot execute.

---

### 3. File Import — Malicious JSON

**What it is:** The user can import a `.json` file to restore their records.

**Risks:**
- A malicious actor could craft a JSON file and convince the user to import it.
- The file could contain garbage data intended to corrupt the record store.
- The file could attempt HTML injection (mitigated by `esc()` and `isValidRecord()`).

**What was done:**
- `isValidRecord()` validates every field of every imported record against known-good values. Invalid records are silently skipped and the user is told how many were dropped.
- The import replaces the current records entirely — this is intentional and expected behavior, but it means a bad import wipes existing data. Users should export before importing if they want to preserve history.
- The file is read as text and parsed as JSON. A non-JSON file will throw a parse error, which is caught and shown as a toast.

**Verdict:** Low risk. Validation is strict. The only realistic attack scenario is a user being socially engineered into importing a file that wipes their records — the data itself has no value to an attacker.

---

### 4. Fonts — Google Fonts Dependency

Both fonts (Orbitron and Exo 2) are fetched from Google Fonts on load. The app makes external network requests to `fonts.googleapis.com` and `fonts.gstatic.com`.

**Implications:**
- Requires an internet connection for correct visual styling. Falls back to system sans-serif if offline.
- Google receives the user's IP address and browser information as part of the font request — same as any Google Fonts site.
- If Google Fonts is unavailable, the app still functions but renders in the fallback font.

**Verdict:** Accepted. This is a deliberate trade-off for simplicity. The app handles no sensitive personal data, so the font request privacy exposure is low concern for this use case.

---

### 5. Math.random() — Randomization

**What it is:** The randomizer uses `Math.random()` to shuffle characters and pick a scenario.

**Risk:** `Math.random()` is not cryptographically secure. It is theoretically predictable given knowledge of the browser's internal state.

**Verdict:** Not a concern. This is a board game companion tool, not a gambling or security application. `Math.random()` is entirely appropriate here.

---

### 6. setInterval — Timer Accuracy

**What it is:** The playtime timer uses `setInterval` with a 1000ms tick.

**Risk:** `setInterval` is not perfectly accurate — it can drift slightly, especially when the browser tab is in the background (browsers throttle background timers to save battery). Over a typical 20–45 minute game session, drift is negligible in practice.

**Verdict:** Acceptable for a game timer. Not a correctness concern.

---

### 7. Combo Key Collisions

**What it is:** Combinations are identified by a string key in the format `char1|char2-scenario`.

**Risk:** If a character name or scenario name ever contained the characters `|` or `-`, the key could theoretically collide with another combination.

**Current status:** All known characters and scenarios across all content packs (Series 1, Series 2, Scenario 14, Captain Crag) have been checked. None contain `|` or `-`. No collision risk exists with current data.

**Note for future versions:** When new content is added, new character and scenario names must be checked against these separators. Alternatively, the separator could be changed to something less likely to appear naturally, such as `\x00` (null byte).

**Verdict:** Not a current risk. Check when adding new content.

---

### 8. Service Worker Cache Versioning

**What it is:** The PWA service worker caches all app assets. The cache is named with the app version (e.g. `"twin-stars-v1.1.4"`).

**Risk:** If the cache name is not updated when the app is deployed, users who have installed the PWA will continue to receive stale cached content indefinitely.

**What was done:** The cache name is tied to the app version and must be bumped with every deployment.

**Verdict:** Managed. The cache name must be updated in `service-worker.js` with every version bump.

---

## What This App Does NOT Do

For clarity, the following concerns that apply to typical web applications are **not relevant here:**

- **SQL injection** — No database, no queries.
- **CSRF** — No server, no state-changing requests.
- **Authentication / session hijacking** — No accounts, no sessions.
- **Server-side vulnerabilities** — No server exists.
- **Third-party scripts / supply chain** — No JavaScript libraries loaded from external sources.
- **External font privacy** — Low concern. Fonts are fetched from Google Fonts; see Section 4.

---

## Summary Table

| Item | Risk Level | Status |
|---|---|---|
| localStorage data exposure | Low — game scores only | Accepted |
| localStorage corruption on load | Low | Handled — try/catch, graceful fallback |
| localStorage quota exceeded | Low | Handled — error toast |
| XSS via innerHTML | Low | Handled — esc() on all rendered data |
| XSS via import | Low | Handled — isValidRecord() validation |
| Malicious import file | Low | Handled — validation + user controls import |
| External font privacy | Low | Accepted — Google Fonts used, see Section 4 |
| Math.random() predictability | Not applicable | Accepted |
| Timer drift | Not applicable | Accepted |
| Combo key collision | Low (future risk) | Checked — no current conflicts |
| Service worker cache staleness | Low | Managed — cache name tied to version |

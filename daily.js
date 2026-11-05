// Twin Stars Randomizer: Daily Mission.
// Every player gets the same pair, scenario and difficulty on a given UTC date, picked by a
// seeded PRNG over a FIXED list (Series I + Series II), independent of the player's
// collection. Completions live in their own "tsr:daily" key, never in the record schema.
// Plain classic script loaded after app.js; uses its globals.
(function () {
  "use strict";

  const DAILY_KEY = "tsr:daily";
  // Fixed canonical order. Never reorder or extend: that would change every past and
  // future day's mission for everyone. (A new list would need a new SEED_PREFIX.)
  const DAILY_CHARACTERS = [
    "Bood", "Stag Solar", "Fanoobia", "Inpon Gol", "Grant Rockgardner", "Roux Jaezmina",
    "Yanfred Jima", "Saaze", "Inzill Mey", "Strezelsior", "Kinglan", "Brenimov-X",
    "Dain Taubo", "Grulexon", "Gari Obul", "Smiff", "Zoaze", "Tumbug Firo",
    "Mzerzo", "Phaeton", "Hebolt Rom", "Tarla Voke", "Gruffles", "\"Mad\" Anxy"
  ];
  const DAILY_SCENARIOS = [
    "Escape The Brig!", "Rule The World!", "Stop The Virus!", "Hunt The Bounty!",
    "Steal The Plans!", "Confine The Quarks!", "Master the Trials!", "Beat the Odds!",
    "Control the Skies!", "Sell the Junk!", "Destroy the Order!", "Serve the Rabble!"
  ];
  const DAILY_DIFFICULTIES = ["Easy", "Medium", "Hard"];
  const SEED_PREFIX = "tsr-daily-v1|";

  const $ = id => document.getElementById(id);

  // FNV-1a (32-bit) string hash → mulberry32 PRNG. Integer-only maths (Math.imul, >>>),
  // so every engine produces the same sequence.
  function hash32(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const isDateKey = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  function todayUTC(now) { return new Date(now == null ? Date.now() : now).toISOString().slice(0, 10); }
  function shiftDay(dateKey, delta) {
    const [y, m, d] = dateKey.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
  }

  function missionFor(dateKey) {
    const rnd = mulberry32(hash32(SEED_PREFIX + dateKey));
    const n = DAILY_CHARACTERS.length;
    const i = Math.floor(rnd() * n);
    let j = Math.floor(rnd() * (n - 1));
    if (j >= i) j++;
    const scenario   = DAILY_SCENARIOS[Math.floor(rnd() * DAILY_SCENARIOS.length)];
    const difficulty = DAILY_DIFFICULTIES[Math.floor(rnd() * DAILY_DIFFICULTIES.length)];
    return { date: dateKey, characters: [DAILY_CHARACTERS[i], DAILY_CHARACTERS[j]], scenario, difficulty };
  }

  // ─── Storage ────────────────────────────────────────────────────────────────
  function readDaily() {
    let v = null;
    try { v = JSON.parse(localStorage.getItem(DAILY_KEY) || "null"); } catch (e) { v = null; }
    const done = {};
    if (v && v.done && typeof v.done === "object") {
      for (const [k, r] of Object.entries(v.done)) {
        if (!isDateKey(k) || !r || typeof r !== "object") continue;
        if (!VALID_RESULTS.has(r.r) || !VALID_DIFFICULTIES.has(r.d)) continue;
        done[k] = { r: r.r, d: r.d, t: Number.isInteger(r.t) && r.t >= 0 ? r.t : 0 };
      }
    }
    return { v: 1, done };
  }
  function writeDaily(state) {
    // Keep the most recent 400 days; plenty for any streak display.
    const keys = Object.keys(state.done).sort();
    for (const k of keys.slice(0, Math.max(0, keys.length - 400))) delete state.done[k];
    try { localStorage.setItem(DAILY_KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
  }

  // Consecutive UTC days with a logged daily result, ending today, or yesterday when
  // today's isn't logged yet (so the streak doesn't look broken before you've played).
  function streakFor(done, today) {
    let d = done[today] ? today : shiftDay(today, -1);
    let n = 0;
    while (done[d]) { n++; d = shiftDay(d, -1); }
    return n;
  }

  function shareText(dateKey, entry) {
    return `Twin Stars Daily · ${dateKey} · ${entry.r} · ${formatTime(entry.t)} · ${entry.d}`;
  }

  // ─── Ownership ──────────────────────────────────────────────────────────────
  function missingPacks(m) {
    const ownedChars = new Set(Array.isArray(characters) ? characters : []);
    const ownedScen  = new Set(Array.isArray(scenarios) ? scenarios : []);
    const missing = [...m.characters.filter(c => !ownedChars.has(c)), ...(ownedScen.has(m.scenario) ? [] : [m.scenario])];
    if (!missing.length) return [];
    return CONTENT_PACKS.filter(p => missing.some(x => p.characters.includes(x) || p.scenarios.includes(x))).map(p => p.shortName);
  }

  // ─── UI ─────────────────────────────────────────────────────────────────────
  let _pendingDate = null;  // Play pressed; waiting for the mission to load
  let _activeDate  = null;  // the loaded mission is this date's daily

  const sameMission = (comb, m) => !!comb && comb.scenario === m.scenario &&
    comb.characters[0] === m.characters[0] && comb.characters[1] === m.characters[1];

  function resultCardHTML(dateKey, entry, idSuffix) {
    const text = shareText(dateKey, entry);
    return `
      <div class="daily-result">
        <p class="daily-result-line"><span class="daily-result-badge ${entry.r === "Win" ? "win" : "loss"}">${esc(entry.r)}</span> ${esc(formatTime(entry.t))} · ${esc(entry.d)}</p>
        <p class="daily-share-text" id="dailyShare${idSuffix}"><span class="sr-only">Shareable result: </span><span class="daily-share-value">${esc(text)}</span></p>
        <button type="button" class="btn btn-secondary btn-compact daily-copy" data-share="${esc(text)}" id="dailyCopy${idSuffix}" aria-describedby="dailyShare${idSuffix}">Copy result</button>
      </div>`;
  }

  function render() {
    const host = $("dailyMission");
    if (!host) return;
    const today = todayUTC();
    const m = missionFor(today);
    const state = readDaily();
    const entry = state.done[today];
    const streak = streakFor(state.done, today);
    const missing = missingPacks(m);
    const hadFocus = host.contains(document.activeElement) ? document.activeElement.id : null;
    host.innerHTML = `
      <section class="panel daily-panel" aria-labelledby="dailyTitle">
        <div class="daily-head">
          <h2 class="panel-title" id="dailyTitle">Daily Mission</h2>
          <span class="daily-streak" id="dailyStreak">${streak ? `Streak: ${streak} day${streak === 1 ? "" : "s"}` : "No streak yet"}</span>
        </div>
        <p class="daily-date"><time datetime="${today}">${today}</time> · the same mission for every player today (UTC)</p>
        <p class="daily-mission" id="dailyMissionText"><strong>${esc(m.characters[0])}</strong> &amp; <strong>${esc(m.characters[1])}</strong> · ${scenarioHTML(m.scenario)} · <span class="daily-diff">${esc(m.difficulty)}</span></p>
        ${missing.length ? `<p class="daily-own" id="dailyOwnNote">Not in your collection (${esc(missing.join(", "))}). You can still view it, and play and log it if you have the cards.</p>` : ""}
        ${entry ? `<p class="daily-done-label">Today's result</p>${resultCardHTML(today, entry, "Panel")}` : ""}
        <button type="button" class="btn btn-load" id="dailyPlayBtn">${entry ? "Play today's mission again" : "Play today's mission"}</button>
      </section>`;
    $("dailyPlayBtn").addEventListener("click", play);
    bindCopy(host);
    if (hadFocus && $(hadFocus)) $(hadFocus).focus();
  }

  function bindCopy(root) {
    root.querySelectorAll(".daily-copy").forEach(b => b.addEventListener("click", () => copyShare(b)));
  }

  function copyShare(btn) {
    const text = btn.dataset.share || "";
    track("daily_share");
    const selectText = () => {
      const el = btn.parentElement.querySelector(".daily-share-value");
      const sel = window.getSelection && window.getSelection();
      if (!el || !sel) return false;
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
      return true;
    };
    const done = ok => {
      if (ok) { toast("Result copied. Paste it anywhere."); btn.textContent = "Copied"; setTimeout(() => { btn.textContent = "Copy result"; }, 2000); }
      else { selectText(); toast("Couldn't copy automatically. The text is selected: copy it from there.", "error"); }
    };
    const fallback = () => {
      let ok = false;
      if (selectText()) { try { ok = document.execCommand("copy"); } catch (e) { ok = false; } }
      done(ok);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => done(true), fallback);
      else fallback();
    } catch (e) { fallback(); }
  }

  function play() {
    const today = todayUTC();
    const m = missionFor(today);
    guardUnsaved(() => {
      showTab("randomizer");
      const diff = $("difficulty");
      if (diff) diff.value = m.difficulty;
      _pendingDate = today;
      loadCombination({ characters: [...m.characters], scenario: m.scenario }, { focusCard: true });
      _pendingDate = null;
      track("daily_play");
    });
  }

  document.addEventListener("tsr:mission-loaded", e => {
    const inline = $("dailyInline");
    if (inline) inline.remove();
    _activeDate = _pendingDate && sameMission(e.detail, missionFor(_pendingDate)) ? _pendingDate : null;
  });

  document.addEventListener("tsr:record-saved", e => {
    const rec = e.detail;
    // The day the player started it (a game that runs past midnight UTC counts for the day it began);
    // a manually loaded mission that happens to be today's daily counts for today.
    const date = _activeDate || todayUTC();
    if (!sameMission(rec, missionFor(date))) return;
    const state = readDaily();
    const first = !state.done[date];
    if (first) {
      state.done[date] = { r: rec.result, d: rec.difficulty, t: Number.isInteger(rec.playtime) ? rec.playtime : 0 };
      if (!writeDaily(state)) return;
    }
    render();
    // Result card next to the save confirmation, where the player's focus is.
    const status = $("saveStatus");
    if (status && status.parentNode) {
      const div = document.createElement("div");
      div.id = "dailyInline";
      div.className = "daily-inline";
      const streak = streakFor(readDaily().done, todayUTC());
      div.innerHTML = `<p class="daily-done-label">Daily Mission ${esc(date)}${first ? "" : " (your first result today counts)"}</p>${resultCardHTML(date, readDaily().done[date], "Inline")}<p class="daily-inline-streak">${streak ? `Streak: ${streak} day${streak === 1 ? "" : "s"}` : ""}</p>`;
      status.parentNode.insertBefore(div, status.nextSibling);
      bindCopy(div);
    }
  });

  function init() {
    render();
    // Collection changes (My Collection dialog closes) and day rollovers re-render the card.
    const settings = $("settingsModal");
    if (settings) new MutationObserver(() => { if (!settings.classList.contains("open")) render(); })
      .observe(settings, { attributes: true, attributeFilter: ["class"] });
    let shown = todayUTC();
    const check = () => { if (todayUTC() !== shown) { shown = todayUTC(); render(); } };
    document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
    setInterval(check, 60000);
    window.addEventListener("storage", e => { if (e.key === DAILY_KEY || e.key === "enabledPacks" || e.key === null) render(); });
  }

  window.tsrDaily = { missionFor, todayUTC, streakFor, shareText, shiftDay, render };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

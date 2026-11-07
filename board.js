// Twin Stars Randomizer — Mission Board.
// On-screen counters for a running mission: each character's health, the shared energy
// pool and up to four scenario tracks, replacing paperclips and cubes on a lap.
// Classic script loaded after app.js; uses its globals (currentCombination, timer state,
// loadCombination, handleSaveRecord, openModal/closeModal, announce, toast, track, esc).
//
// IP rule: no per-card stats ship with the app. The first time a character or scenario is
// used on the board, the player enters its starting values once; they are remembered in
// localStorage under tsr:board:* and can be edited later.
//
// Storage keys:
//   tsr:board:char:<name>      {health}
//   tsr:board:scenario:<name>  {energy:{Easy,Medium,Hard}, tracks:[{name,min,max,start}]}
//   tsr:board:last             {health, energy} — prefill for characters/scenarios not seen yet
//   tsr:board:auto             "1" = open the board whenever a mission starts
//   tsr:board:session          the running mission's board (survives reload; restored paused)
//   tsr:board:enabled          "1" = show the board (opt-in, set in Tips & Features); "0" = hidden.
//                              Unset: on only for players who already used the board.
(function () {
  "use strict";

  const K_SESSION = "tsr:board:session";
  const K_AUTO    = "tsr:board:auto";
  const K_LAST    = "tsr:board:last";
  const K_ENABLED = "tsr:board:enabled";
  // What the board is, shown as the button's tooltip (and in Tips & Features).
  const ABOUT = "Tracks the game on screen instead of with tokens or paperclips: tap counters for each character's health, the shared energy pool, and up to 4 scenario tracks you name. You type each card's starting numbers once and the app remembers them.";
  const kChar = n => "tsr:board:char:" + n;
  const kScn  = n => "tsr:board:scenario:" + n;
  const DIFFS = ["Easy", "Medium", "Hard"];
  const MAX_TRACKS = 4;
  const LIM = 99;           // every counter stays within ±99
  const HISTORY_CAP = 300;
  const TRACK_MARKS = ["◆", "●", "▲", "■"];
  const TRACK_LETTERS = ["A", "B", "C", "D"];

  // ── Storage helpers (never throw) ─────────────────────────────────────────────
  function readJSON(key) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  let _storageWarned = false;
  function writeJSON(key, val) {
    try {
      if (val == null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) {
      if (!_storageWarned) { _storageWarned = true; toast("Couldn't save the Mission Board — browser storage is full or blocked.", "error"); }
      return false;
    }
  }
  const isInt = v => Number.isInteger(v) && Math.abs(v) <= LIM;

  // The board is opt-in. Before the setting existed it was shown to everyone, so a player
  // who already saved board values, chose auto-open or has a board running keeps it.
  function isEnabled() {
    try {
      const v = localStorage.getItem(K_ENABLED);
      if (v === "1") return true;
      if (v === "0") return false;
      return localStorage.getItem(K_AUTO) === "1" || localStorage.getItem(K_SESSION) != null || localStorage.getItem(K_LAST) != null;
    } catch (e) { return false; }
  }
  function getAuto() { try { return localStorage.getItem(K_AUTO) === "1"; } catch (e) { return false; } }
  function setAuto(on) { try { localStorage.setItem(K_AUTO, on ? "1" : "0"); } catch (e) {} }

  function charCfg(name) {
    const c = readJSON(kChar(name));
    return c && isInt(c.health) && c.health > 0 ? c : null;
  }
  function validTrack(t) {
    return t && typeof t.name === "string" && t.name.trim() && t.name.length <= 24 &&
      isInt(t.min) && (t.max == null || (isInt(t.max) && t.max > t.min)) &&
      isInt(t.start) && t.start >= t.min && (t.max == null || t.start <= t.max);
  }
  function scnCfg(name) {
    const c = readJSON(kScn(name));
    if (!c || !c.energy || !DIFFS.every(d => isInt(c.energy[d]) && c.energy[d] >= 0)) return null;
    if (!Array.isArray(c.tracks) || c.tracks.length > MAX_TRACKS || !c.tracks.every(validTrack)) return null;
    return c;
  }

  // ── Session state ─────────────────────────────────────────────────────────────
  // S = { v, characters, scenario, droid, difficulty, elapsedMs, open,
  //       c: {h0,h1,en,t0..t3} | null (null until setup is done), max: {h0,h1}, tracks: [...],
  //       undo: [{k, from, to, at, dFrom?, dTo?}], redo: [...] }
  let S = null;
  let _comb = null;      // the currentCombination object S belongs to
  let _editing = false;  // the setup form is showing for an edit (not first use)

  function elapsedMs() {
    if (timerPaused || !startTime) return accumulatedTime;
    return accumulatedTime + Math.max(0, Date.now() - startTime);
  }
  function persist() {
    if (!S) return;
    S.elapsedMs = elapsedMs();
    S.droid = _currentDroid || null;
    writeJSON(K_SESSION, S);
  }
  function clearSession() {
    S = null;
    try { localStorage.removeItem(K_SESSION); } catch (e) {}
  }

  // Counter definitions derived from the session.
  function defs() {
    if (!S || !S.c) return [];
    const [a, b] = S.characters;
    const scn = scnCfg(S.scenario);
    const startEnergy = scn ? scn.energy[S.difficulty] : null;
    const list = [
      { k: "h0", name: a, role: "Primary",   kind: "Health", label: `${a} health`, min: 0, max: S.max.h0, cls: "bd-h0" },
      { k: "h1", name: b, role: "Secondary", kind: "Health", label: `${b} health`, min: 0, max: S.max.h1, cls: "bd-h1" },
      { k: "en", name: "Energy", role: S.difficulty, kind: "Shared pool", label: "Energy", min: 0, max: null, ref: startEnergy, cls: "bd-en" },
    ];
    S.tracks.forEach((t, i) => list.push({
      k: "t" + i, name: t.name, role: "Track " + TRACK_LETTERS[i], kind: "", label: t.name,
      min: t.min, max: t.max, ref: t.start, cls: "bd-track bd-v" + i, mark: TRACK_MARKS[i],
    }));
    return list;
  }
  const defOf = k => defs().find(d => d.k === k);
  const clamp = (v, d) => Math.max(d.min, Math.min(d.max == null ? LIM : d.max, v));

  // ── DOM scaffolding ───────────────────────────────────────────────────────────
  const board = document.createElement("section");
  board.id = "missionBoard";
  board.className = "mission-board hidden";
  board.setAttribute("aria-labelledby", "bdTitle");
  const cardHost = document.getElementById("combinationDisplay");
  cardHost.after(board);

  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.id = "boardRecordModal";
  modal.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="bdRecTitle" aria-describedby="bdRecMsg">
      <h2 id="bdRecTitle">Record Win?</h2>
      <p id="bdRecMsg"></p>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" id="bdRecCancel">Cancel</button>
        <button type="button" class="btn btn-save" id="bdRecSave">Save Win</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  // ── Wake lock: keep the screen on while the board is open ─────────────────────
  let _wake = null;
  async function lockScreen() {
    if (!S || !S.open || document.visibilityState !== "visible") return;
    if (!("wakeLock" in navigator) || (_wake && !_wake.released)) return;
    try {
      const l = await navigator.wakeLock.request("screen");
      if (!S || !S.open) { try { l.release(); } catch (e) {} return; }
      _wake = l;
      if (l && typeof l.addEventListener === "function") l.addEventListener("release", () => { if (_wake === l) { _wake = null; syncWakeChip(); } });
    } catch (e) { _wake = null; }  // refused (battery saver, no permission): the board still works
    syncWakeChip();
  }
  function unlockScreen() {
    const l = _wake; _wake = null;
    if (l) { try { const p = l.release(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
    syncWakeChip();
  }
  function syncWakeChip() {
    const chip = document.getElementById("bdWake");
    if (chip) chip.classList.toggle("hidden", !_wake);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") lockScreen(); // the browser drops the lock when hidden
    else persist();
  });
  window.addEventListener("pagehide", persist);
  setInterval(() => { if (S) persist(); }, 5000);

  // ── Card toggle ───────────────────────────────────────────────────────────────
  function savedAlready() { const b = document.getElementById("saveRecordBtn"); return !b || b.disabled; }

  function injectToggle() {
    const card = cardHost.querySelector(".combo-display");
    cardHost.classList.toggle("board-on", !!(S && S.open));
    if (!isEnabled()) { const old = cardHost.querySelector(".board-row"); if (old) old.remove(); return; }
    if (!card || card.querySelector("#boardToggleBtn") || savedAlready()) return;
    const row = document.createElement("div");
    row.className = "board-row";
    row.innerHTML = `<button type="button" class="btn btn-secondary btn-board" id="boardToggleBtn" aria-controls="missionBoard"></button>`;
    row.firstChild.title = ABOUT;
    const anchor = card.querySelector(".timer-row");
    if (anchor) anchor.after(row); else card.appendChild(row);
    row.firstChild.addEventListener("click", () => { if (S && S.open) closeBoard(true); else openBoard({ focus: true }); });
    syncToggle();
  }
  function syncToggle() {
    const btn = document.getElementById("boardToggleBtn");
    if (!btn) return;
    const on = !!(S && S.open);
    btn.setAttribute("aria-expanded", String(on));
    btn.innerHTML = `<span class="bd-gauge-icon" aria-hidden="true"></span>${on ? "Hide Mission Board" : "Mission Board"}`;
    btn.classList.toggle("is-on", on);
  }

  // The mission card is re-rendered by app.js (load, save, edits); watch it instead of
  // hooking every caller. A new currentCombination object means a new mission.
  new MutationObserver(() => {
    if (!currentCombination) {
      if (S || _comb) { closeBoard(false); clearSession(); _comb = null; }
      return;
    }
    if (currentCombination !== _comb) {
      closeBoard(false);
      clearSession();
      _comb = currentCombination;
      if (isEnabled() && getAuto()) openBoard({ auto: true });
    }
    injectToggle();
  }).observe(cardHost, { childList: true });

  // ── Open / close ──────────────────────────────────────────────────────────────
  function newSession() {
    const diff = document.getElementById("difficulty").value;
    return {
      v: 1, characters: [...currentCombination.characters], scenario: currentCombination.scenario,
      droid: null, difficulty: DIFFS.includes(diff) ? diff : "Medium",
      elapsedMs: 0, open: true, c: null, max: null, tracks: [], undo: [], redo: [],
    };
  }

  function openBoard(opts) {
    opts = opts || {};
    if (!currentCombination || savedAlready() || !isEnabled()) return;
    if (!S) S = newSession();
    S.open = true;
    _comb = currentCombination;
    const needSetup = !charCfg(S.characters[0]) || !charCfg(S.characters[1]) || !scnCfg(S.scenario);
    if (!S.c && !needSetup) startCounters();
    board.classList.remove("hidden");
    render(S.c ? null : "setup");
    persist();
    lockScreen();
    syncToggle();
    cardHost.classList.add("board-on");
    if (!opts.restore) track("board_open", { auto: !!opts.auto, setup: !S.c });
    if (opts.focus) {
      const target = document.getElementById(S.c ? "bdTitle" : "bdSetupTitle");
      if (target) target.focus({ preventScroll: true });
      board.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }
  }

  function closeBoard(byUser) {
    const wasOpen = !board.classList.contains("hidden");
    board.classList.add("hidden");
    board.innerHTML = "";
    _editing = false;
    unlockScreen();
    cardHost.classList.remove("board-on");
    if (S) { S.open = false; persist(); }
    syncToggle();
    if (byUser && wasOpen) { const b = document.getElementById("boardToggleBtn"); if (b) b.focus(); }
  }

  function startCounters() {
    const [a, b] = S.characters;
    const scn = scnCfg(S.scenario);
    const h0 = charCfg(a).health, h1 = charCfg(b).health;
    S.max = { h0, h1 };
    S.tracks = scn.tracks.map(t => ({ ...t }));
    S.c = { h0, h1, en: scn.energy[S.difficulty] };
    S.tracks.forEach((t, i) => { S.c["t" + i] = t.start; });
    S.undo = []; S.redo = [];
  }

  // Edited setup mid-game: keep the current values (clamped to the new ranges).
  function reapplyConfig() {
    const [a, b] = S.characters;
    const scn = scnCfg(S.scenario);
    const old = S.c;
    S.max = { h0: charCfg(a).health, h1: charCfg(b).health };
    S.tracks = scn.tracks.map(t => ({ ...t }));
    const c = { h0: Math.min(old.h0, S.max.h0), h1: Math.min(old.h1, S.max.h1), en: old.en };
    S.tracks.forEach((t, i) => {
      const prev = old["t" + i];
      c["t" + i] = prev == null ? t.start : Math.max(t.min, Math.min(t.max == null ? LIM : t.max, prev));
    });
    S.c = c;
    // History entries for tracks that no longer exist can't be replayed.
    const ok = e => e.k[0] !== "t" || Number(e.k.slice(1)) < S.tracks.length;
    S.undo = S.undo.filter(ok); S.redo = S.redo.filter(ok);
  }

  // ── Changes, undo, redo ───────────────────────────────────────────────────────
  function change(k, to, extra) {
    const d = defOf(k);
    if (!d) return;
    const from = S.c[k];
    to = clamp(to, d);
    if (to === from && !(extra && extra.dTo)) { bump(k, true); return; }
    const entry = { k, from, to, at: Math.floor(elapsedMs() / 1000), ...(extra || {}) };
    S.c[k] = to;
    S.undo.push(entry);
    if (S.undo.length > HISTORY_CAP) S.undo.shift();
    S.redo = [];
    afterChange(k);
  }
  function undo() {
    if (!S || !S.c || !S.undo.length) return;
    const e = S.undo.pop();
    S.c[e.k] = e.from;
    if (e.dFrom) setDiffValue(e.dFrom);
    S.redo.push(e);
    afterChange(e.k, "Undone");
  }
  function redo() {
    if (!S || !S.c || !S.redo.length) return;
    const e = S.redo.pop();
    S.c[e.k] = e.to;
    if (e.dTo) setDiffValue(e.dTo);
    S.undo.push(e);
    afterChange(e.k, "Redone");
  }
  function afterChange(k, prefix) {
    persist();
    updateCounter(k);
    updateChrome();
    bump(k, false);
    const d = defOf(k);
    if (d) say(`${prefix ? prefix + ": " : ""}${d.label} ${S.c[k]}`);
  }

  // Screen readers hear the settled value, not every press in a quick burst.
  let _sayTimer = null;
  function say(msg) {
    clearTimeout(_sayTimer);
    _sayTimer = setTimeout(() => announce(msg), 650);
  }

  function bump(k, atLimit) {
    const el = board.querySelector(`.bd-counter[data-k="${k}"] .bd-val`);
    if (!el) return;
    const cls = atLimit ? "bd-limit" : "bd-bump";
    el.classList.remove("bd-bump", "bd-limit");
    void el.offsetWidth;
    el.classList.add(cls);
  }

  // Difficulty sets the starting energy. Switching before energy has been used moves the
  // pool to the new starting value (one undoable step).
  function setDiffValue(d) {
    S.difficulty = d;
    const sel = document.getElementById("difficulty");
    if (sel.value !== d) sel.value = d;
    board.querySelectorAll(".bd-diff button").forEach(b => b.setAttribute("aria-checked", String(b.dataset.d === d)));
  }
  function setDifficulty(d) {
    if (!S || !DIFFS.includes(d) || d === S.difficulty) return;
    const prev = S.difficulty;
    const scn = S.c && scnCfg(S.scenario);
    if (scn && S.c.en === scn.energy[prev]) {
      setDiffValue(d);
      change("en", scn.energy[d], { dFrom: prev, dTo: d });
      updateCounter("en");
    } else {
      setDiffValue(d);
      persist();
      if (S.c) updateCounter("en");
    }
  }

  // ── Rendering ─────────────────────────────────────────────────────────────────
  function gaugeHTML(d, v) {
    if (d.max == null && d.k !== "en") return `<div class="bd-gauge" aria-hidden="true"></div>`; // open-ended track
    const top = d.max != null ? d.max : Math.max(v, d.ref || 0);
    const span = top - d.min;
    if (span <= 0) return `<div class="bd-gauge" aria-hidden="true"></div>`;
    if (span <= 20) {
      let pips = "";
      for (let i = d.min + 1; i <= top; i++) pips += `<span class="bd-pip${i <= v ? " on" : ""}${d.ref != null && i === d.ref ? " ref" : ""}"></span>`;
      return `<div class="bd-gauge bd-pips" aria-hidden="true">${pips}</div>`;
    }
    const pct = Math.round(((v - d.min) / span) * 100);
    return `<div class="bd-gauge bd-bar" aria-hidden="true"><span style="--bd-fill:${pct}%"></span></div>`;
  }
  function rangeText(d) {
    if (d.max != null) return `${d.min}–${d.max}`;
    if (d.ref != null) return `start ${d.ref}`;
    return `min ${d.min}`;
  }
  function valueText(d, v) {
    return d.max != null ? `${v} of ${d.max}` : String(v);
  }

  function counterHTML(d, compact) {
    const v = S.c[d.k];
    const atMin = v <= d.min, atMax = d.max != null && v >= d.max;
    return `
      <div class="bd-counter ${d.cls}${compact ? " bd-compact" : ""}${d.k[0] === "h" && v === 0 ? " bd-zero" : ""}" data-k="${d.k}" role="group" aria-labelledby="bdName-${d.k}">
        <div class="bd-cap">
          ${d.mark ? `<span class="bd-mark" aria-hidden="true">${d.mark}</span>` : ""}
          <span class="bd-name" id="bdName-${d.k}">${esc(d.name)}${d.kind === "Health" ? `<span class="sr-only"> health</span>` : ""}</span>
          <span class="bd-role">${esc(d.role)}${d.kind ? ` · ${esc(d.kind)}` : ""}</span>
        </div>
        <div class="bd-ctl">
          <button type="button" class="bd-step bd-minus" data-k="${d.k}" data-d="-1" aria-label="${esc(d.label)} minus 1"${atMin ? ' aria-disabled="true"' : ""}>−</button>
          <div class="bd-val" tabindex="0" role="spinbutton" data-k="${d.k}" aria-label="${esc(d.label)}"
               aria-valuenow="${v}" aria-valuemin="${d.min}"${d.max != null ? ` aria-valuemax="${d.max}"` : ""} aria-valuetext="${valueText(d, v)}">${v}</div>
          <button type="button" class="bd-step bd-plus" data-k="${d.k}" data-d="1" aria-label="${esc(d.label)} plus 1"${atMax ? ' aria-disabled="true"' : ""}>+</button>
        </div>
        ${compact ? "" : gaugeHTML(d, v)}
        <div class="bd-foot">
          <span class="bd-range">${rangeText(d)}</span>
          <button type="button" class="bd-set" data-k="${d.k}" aria-label="Set ${esc(d.label)}">Set</button>
        </div>
      </div>`;
  }

  function render(mode) {
    if (!S) return;
    if (mode === "setup") { renderSetup(); return; }
    _editing = false;
    const ds = defs();
    const chars = ds.filter(d => d.k[0] === "h");
    const energy = ds.find(d => d.k === "en");
    const tracks = ds.filter(d => d.k[0] === "t");
    board.innerHTML = `
      <div class="bd-head">
        <h2 class="bd-title" id="bdTitle" tabindex="-1">Mission Board</h2>
        <span class="bd-chip hidden" id="bdWake" title="The screen stays on while the board is open">Screen on</span>
        <div class="bd-head-actions">
          <button type="button" class="btn-pause" id="bdEdit">Edit setup</button>
          <button type="button" class="btn-pause" id="bdClose" aria-label="Close Mission Board">Close</button>
        </div>
      </div>
      <div class="bd-diff" role="radiogroup" aria-label="Difficulty (sets starting energy)">
        ${DIFFS.map(d => `<button type="button" role="radio" data-d="${d}" aria-checked="${d === S.difficulty}" tabindex="${d === S.difficulty ? 0 : -1}">${d}</button>`).join("")}
      </div>
      <div class="bd-alert hidden" id="bdAlert" role="alert"></div>
      <div class="bd-grid bd-chars">${chars.map(d => counterHTML(d)).join("")}</div>
      ${tracks.length ? `<div class="bd-grid bd-tracks">${tracks.map(d => counterHTML(d)).join("")}</div>` : ""}
      <details class="bd-log" id="bdLog"><summary><span class="bd-log-title">Log</span> <span id="bdLogLast"></span></summary><ol id="bdLogList"></ol></details>
      <label class="bd-auto"><input type="checkbox" id="bdAuto"${getAuto() ? " checked" : ""}> Use the board by default (open it when a mission starts)</label>
      <div class="bd-dock" role="group" aria-label="Board controls">
        ${counterHTML(energy, true)}
        <div class="bd-dock-actions">
          <button type="button" class="btn-pause bd-undo" id="bdUndo" aria-keyshortcuts="Control+Z Meta+Z">Undo</button>
          <button type="button" class="btn-pause bd-redo" id="bdRedo" aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y">Redo</button>
          <button type="button" class="btn btn-save bd-win" id="bdWin">Record Win</button>
        </div>
      </div>`;
    updateChrome();
    syncWakeChip();
  }

  function updateCounter(k) {
    const el = board.querySelector(`.bd-counter[data-k="${k}"]`);
    const d = defOf(k);
    if (!el || !d) return;
    const v = S.c[k];
    const val = el.querySelector(".bd-val");
    if (val) {
      val.textContent = v;
      val.setAttribute("aria-valuenow", v);
      val.setAttribute("aria-valuetext", valueText(d, v));
    }
    const lim = (b, on) => { if (on) b.setAttribute("aria-disabled", "true"); else b.removeAttribute("aria-disabled"); };
    lim(el.querySelector(".bd-minus"), v <= d.min);
    lim(el.querySelector(".bd-plus"), d.max != null && v >= d.max);
    const g = el.querySelector(".bd-gauge");
    if (g) g.outerHTML = gaugeHTML(d, v);
    el.querySelector(".bd-range").textContent = rangeText(d);
    el.querySelector(".bd-role").textContent = d.role + (d.kind ? " · " + d.kind : "");
    el.classList.toggle("bd-zero", k[0] === "h" && v === 0);
  }

  function logText(e) {
    const d = defOf(e.k);
    const what = d ? d.label : e.k;
    const diff = e.dTo ? ` (${e.dTo})` : "";
    return `${formatTime(e.at || 0)} ${what}${diff} ${e.from} → ${e.to}`;
  }

  function updateChrome() {
    if (!S || !S.c) return;
    const u = document.getElementById("bdUndo"), r = document.getElementById("bdRedo");
    if (u) { if (S.undo.length) u.removeAttribute("aria-disabled"); else u.setAttribute("aria-disabled", "true"); u.setAttribute("aria-label", S.undo.length ? "Undo: " + logText(S.undo[S.undo.length - 1]).replace(/^\S+ /, "") : "Undo (nothing to undo)"); }
    if (r) { if (S.redo.length) r.removeAttribute("aria-disabled"); else r.setAttribute("aria-disabled", "true"); r.setAttribute("aria-label", S.redo.length ? "Redo: " + logText(S.redo[S.redo.length - 1]).replace(/^\S+ /, "") : "Redo (nothing to redo)"); }
    const last = document.getElementById("bdLogLast");
    const list = document.getElementById("bdLogList");
    if (last) last.textContent = S.undo.length ? logText(S.undo[S.undo.length - 1]) : "No changes yet";
    if (list) list.innerHTML = S.undo.slice(-30).reverse().map(e => `<li>${esc(logText(e))}</li>`).join("");
    // Out of health ends the game: offer to record the loss.
    const alert = document.getElementById("bdAlert");
    if (alert) {
      const out = S.characters.filter((_, i) => S.c["h" + i] === 0);
      const show = out.length > 0;
      const was = !alert.classList.contains("hidden");
      if (show && !was) {
        alert.innerHTML = `
          <p><strong>${esc(out.join(" and "))}</strong> ${out.length > 1 ? "are" : "is"} out of health — the mission is lost.</p>
          <div class="bd-alert-actions">
            <button type="button" class="btn btn-danger" id="bdLoss">Record Loss</button>
            <button type="button" class="btn-pause" id="bdAlertUndo">Undo last change</button>
          </div>`;
      }
      alert.classList.toggle("hidden", !show);
      if (!show) alert.innerHTML = "";
    }
  }

  // ── Set a value by typing ─────────────────────────────────────────────────────
  function openSet(k) {
    const el = board.querySelector(`.bd-counter[data-k="${k}"]`);
    const d = defOf(k);
    if (!el || !d || el.querySelector(".bd-input")) return;
    const val = el.querySelector(".bd-val");
    const input = document.createElement("input");
    input.type = "number";
    input.inputMode = "numeric";
    input.className = "bd-input";
    input.id = "bdInput-" + k;
    input.min = d.min;
    if (d.max != null) input.max = d.max;
    input.value = S.c[k];
    input.setAttribute("aria-label", `${d.label}, type a value from ${d.min}${d.max != null ? " to " + d.max : ""}`);
    val.replaceWith(input);
    input.focus();
    input.select();
    let done = false;
    const finish = commit => {
      if (done) return;
      done = true;
      const n = Number(input.value);
      const refocus = document.activeElement === input;
      input.replaceWith(val);
      if (commit && input.value.trim() !== "" && Number.isFinite(n)) change(k, Math.round(n));
      if (refocus) val.focus();
    };
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); finish(true); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); finish(false); }
    });
    input.addEventListener("blur", () => finish(true));
  }

  // ── Board events (delegated: the board re-renders) ────────────────────────────
  board.addEventListener("click", e => {
    const t = e.target.closest("button");
    if (!t || !S) return;
    if (t.classList.contains("bd-step")) {
      if (t.getAttribute("aria-disabled") === "true") { bump(t.dataset.k, true); return; }
      change(t.dataset.k, S.c[t.dataset.k] + Number(t.dataset.d));
      return;
    }
    if (t.classList.contains("bd-set")) { openSet(t.dataset.k); return; }
    if (t.closest(".bd-diff")) { setDifficulty(t.dataset.d); t.focus(); return; }
    switch (t.id) {
      case "bdUndo": undo(); break;
      case "bdRedo": redo(); break;
      case "bdAlertUndo": undo(); if (!document.getElementById("bdAlertUndo")) document.getElementById("bdUndo").focus(); break;
      case "bdClose": closeBoard(true); break;
      case "bdEdit": _editing = true; renderSetup(); break;
      case "bdWin": openRecord("Win"); break;
      case "bdLoss": openRecord("Loss"); break;
    }
  });
  board.addEventListener("change", e => {
    if (e.target.id === "bdAuto" || e.target.id === "bdSetupAuto") setAuto(e.target.checked);
  });
  board.addEventListener("keydown", e => {
    const t = e.target;
    if (t.classList && t.classList.contains("bd-val") && S && S.c) {
      const k = t.dataset.k, d = defOf(k), v = S.c[k];
      let to = null;
      switch (e.key) {
        case "ArrowUp": case "ArrowRight": to = v + 1; break;
        case "ArrowDown": case "ArrowLeft": to = v - 1; break;
        case "PageUp": to = v + 5; break;
        case "PageDown": to = v - 5; break;
        case "Home": to = d.min; break;
        case "End": if (d.max != null) to = d.max; break;
        case "Enter": e.preventDefault(); openSet(k); return;
      }
      if (to != null) { e.preventDefault(); change(k, to); }
      return;
    }
    // Difficulty radio group: arrows move and select.
    if (t.closest && t.closest(".bd-diff") && /^Arrow/.test(e.key)) {
      e.preventDefault();
      const i = DIFFS.indexOf(t.dataset.d);
      const n = DIFFS[(i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : DIFFS.length - 1)) % DIFFS.length];
      setDifficulty(n);
      board.querySelectorAll(".bd-diff button").forEach(b => { b.tabIndex = b.dataset.d === n ? 0 : -1; });
      board.querySelector(`.bd-diff button[data-d="${n}"]`).focus();
    }
  });

  // Long-press a value to type it (touch and mouse).
  let _press = null;
  board.addEventListener("pointerdown", e => {
    const val = e.target.closest(".bd-val");
    if (!val) return;
    const k = val.dataset.k;
    clearTimeout(_press);
    _press = setTimeout(() => { _press = null; openSet(k); }, 550);
  });
  ["pointerup", "pointerleave", "pointercancel", "pointermove"].forEach(type =>
    board.addEventListener(type, e => { if (type === "pointermove" && Math.abs(e.movementX) + Math.abs(e.movementY) < 6) return; clearTimeout(_press); _press = null; })
  );
  board.addEventListener("contextmenu", e => { if (e.target.closest(".bd-val")) e.preventDefault(); });

  // Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl+Y redo, while the board is open. A pending
  // toast Undo (e.g. a deleted record) keeps priority unless focus is on the board.
  document.addEventListener("keydown", e => {
    if (!S || !S.c || board.classList.contains("hidden") || !(e.ctrlKey || e.metaKey)) return;
    const key = e.key.toLowerCase();
    if (key !== "z" && key !== "y") return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || document.querySelector(".modal-overlay.open")) return;
    if (typeof _undoAction === "function" && _undoAction && !board.contains(document.activeElement)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (key === "y" || e.shiftKey) redo(); else undo();
  }, true);

  // ── Setup form ────────────────────────────────────────────────────────────────
  function trackRowHTML(t, i) {
    const v = x => (x == null ? "" : x);
    return `
      <fieldset class="bd-track-row bd-v${i}" data-i="${i}">
        <legend><span class="bd-mark" aria-hidden="true">${TRACK_MARKS[i]}</span> Track ${TRACK_LETTERS[i]}</legend>
        <label class="bd-f bd-f-name">Name<input type="text" maxlength="24" class="bd-t-name" value="${esc(v(t.name))}" autocomplete="off"></label>
        <label class="bd-f">Min<input type="number" inputmode="numeric" class="bd-t-min" value="${v(t.min)}"></label>
        <label class="bd-f">Max <span class="label-optional">(optional)</span><input type="number" inputmode="numeric" class="bd-t-max" value="${v(t.max)}"></label>
        <label class="bd-f">Start<input type="number" inputmode="numeric" class="bd-t-start" value="${v(t.start)}"></label>
        <button type="button" class="btn-pause bd-t-remove" aria-label="Remove track ${TRACK_LETTERS[i]}">Remove</button>
      </fieldset>`;
  }

  function renderSetup() {
    const [a, b] = S.characters;
    const last = readJSON(K_LAST) || {};
    const ca = charCfg(a), cb = charCfg(b), sc = scnCfg(S.scenario);
    const lastE = last.energy || {};
    const pre = (cfg, fallback) => (cfg != null ? cfg : (fallback != null ? fallback : ""));
    const tracks = sc ? sc.tracks : [{ name: "Track 1", min: 0, max: null, start: 0 }];
    const first = !S.c;
    board.innerHTML = `
      <form class="bd-setup" id="bdSetup" novalidate aria-labelledby="bdSetupTitle">
        <div class="bd-head">
          <h2 class="bd-title" id="bdSetupTitle" tabindex="-1">${first ? "Set Up the Mission Board" : "Edit Board Setup"}</h2>
        </div>
        <p class="bd-intro">${first
          ? "Enter the starting values printed on your cards. You only do this once per character and scenario — they are remembered on this device."
          : "Changes are remembered for next time. Current values are kept (trimmed to any new limits)."}</p>
        <div class="bd-err hidden" id="bdSetupErr" role="alert"></div>
        <fieldset class="bd-fs">
          <legend>Starting health</legend>
          <div class="bd-fs-grid">
            <label class="bd-f">${esc(a)} <span class="bd-role">Primary</span><input type="number" inputmode="numeric" id="bdSetH0" min="1" max="${LIM}" value="${pre(ca && ca.health, last.health)}" required></label>
            <label class="bd-f">${esc(b)} <span class="bd-role">Secondary</span><input type="number" inputmode="numeric" id="bdSetH1" min="1" max="${LIM}" value="${pre(cb && cb.health, last.health)}" required></label>
          </div>
        </fieldset>
        <fieldset class="bd-fs">
          <legend>Starting energy — ${esc(scenarioText(S.scenario))}</legend>
          <div class="bd-fs-grid bd-fs-3">
            ${DIFFS.map(d => `<label class="bd-f">${d}<input type="number" inputmode="numeric" id="bdSetE${d}" min="0" max="${LIM}" value="${pre(sc && sc.energy[d], lastE[d])}" required></label>`).join("")}
          </div>
        </fieldset>
        <fieldset class="bd-fs">
          <legend>Scenario tracks <span class="label-optional">(up to ${MAX_TRACKS})</span></legend>
          <p class="bd-hint">Name each track the way you'll recognise it (for example "Base precision" and "Current precision"). Each gets its own colour and shape.</p>
          <div id="bdTrackRows">${tracks.map(trackRowHTML).join("")}</div>
          <button type="button" class="btn-pause" id="bdAddTrack">Add track</button>
        </fieldset>
        <label class="bd-auto"><input type="checkbox" id="bdSetupAuto"${getAuto() ? " checked" : ""}> Use the board by default (open it when a mission starts)</label>
        <div class="modal-actions bd-setup-actions">
          <button type="button" class="btn btn-secondary" id="bdSetupCancel">Cancel</button>
          <button type="submit" class="btn btn-save" id="bdSetupSave">${first ? "Start Board" : "Save"}</button>
        </div>
      </form>`;
    syncAddTrack();
  }

  function syncAddTrack() {
    const rows = board.querySelectorAll(".bd-track-row");
    const add = document.getElementById("bdAddTrack");
    if (add) add.classList.toggle("hidden", rows.length >= MAX_TRACKS);
  }
  function renumberTracks() {
    board.querySelectorAll(".bd-track-row").forEach((row, i) => {
      row.dataset.i = i;
      row.className = "bd-track-row bd-v" + i;
      row.querySelector("legend").innerHTML = `<span class="bd-mark" aria-hidden="true">${TRACK_MARKS[i]}</span> Track ${TRACK_LETTERS[i]}`;
      row.querySelector(".bd-t-remove").setAttribute("aria-label", "Remove track " + TRACK_LETTERS[i]);
    });
    syncAddTrack();
  }

  board.addEventListener("click", e => {
    const t = e.target.closest("button");
    if (!t || !document.getElementById("bdSetup")) return;
    if (t.id === "bdAddTrack") {
      const rows = document.getElementById("bdTrackRows");
      const n = rows.children.length;
      if (n >= MAX_TRACKS) return;
      rows.insertAdjacentHTML("beforeend", trackRowHTML({ name: "Track " + (n + 1), min: 0, max: null, start: 0 }, n));
      renumberTracks();
      rows.lastElementChild.querySelector(".bd-t-name").focus();
    } else if (t.classList.contains("bd-t-remove")) {
      const row = t.closest(".bd-track-row");
      const next = row.nextElementSibling || row.previousElementSibling;
      row.remove();
      renumberTracks();
      (next ? next.querySelector(".bd-t-remove") : document.getElementById("bdAddTrack")).focus();
    } else if (t.id === "bdSetupCancel") {
      if (S.c) { render(); const b = document.getElementById("bdEdit"); if (b) b.focus(); }
      else closeBoard(true);
    }
  });

  board.addEventListener("submit", e => {
    if (e.target.id !== "bdSetup") return;
    e.preventDefault();
    saveSetup();
  });

  function readInt(input, lo, hi, optional) {
    const raw = input.value.trim();
    if (raw === "") return optional ? { v: null } : { err: true };
    const n = Number(raw);
    if (!Number.isInteger(n) || n < lo || n > hi) return { err: true };
    return { v: n };
  }

  function saveSetup() {
    const errs = [];
    let firstBad = null;
    const bad = (el, msg) => { errs.push(msg); el.setAttribute("aria-invalid", "true"); if (!firstBad) firstBad = el; };
    board.querySelectorAll("#bdSetup [aria-invalid]").forEach(el => el.removeAttribute("aria-invalid"));
    const [a, b] = S.characters;
    const h = [0, 1].map(i => {
      const el = document.getElementById("bdSetH" + i);
      const r = readInt(el, 1, LIM);
      if (r.err) bad(el, `Starting health for ${S.characters[i]} must be a whole number from 1 to ${LIM}.`);
      return r.v;
    });
    const energy = {};
    DIFFS.forEach(d => {
      const el = document.getElementById("bdSetE" + d);
      const r = readInt(el, 0, LIM);
      if (r.err) bad(el, `${d} energy must be a whole number from 0 to ${LIM}.`);
      energy[d] = r.v;
    });
    const tracks = [];
    board.querySelectorAll(".bd-track-row").forEach((row, i) => {
      const L = TRACK_LETTERS[i];
      const nameEl = row.querySelector(".bd-t-name");
      const name = nameEl.value.trim().slice(0, 24);
      if (!name) bad(nameEl, `Track ${L} needs a name.`);
      const mn = readInt(row.querySelector(".bd-t-min"), -LIM, LIM);
      if (mn.err) bad(row.querySelector(".bd-t-min"), `Track ${L}: minimum must be a whole number.`);
      const mx = readInt(row.querySelector(".bd-t-max"), -LIM, LIM, true);
      if (mx.err || (mx.v != null && !mn.err && mx.v <= mn.v)) bad(row.querySelector(".bd-t-max"), `Track ${L}: maximum must be more than the minimum (or left empty).`);
      const st = readInt(row.querySelector(".bd-t-start"), -LIM, LIM);
      if (st.err || (!mn.err && st.v < mn.v) || (!mx.err && mx.v != null && st.v > mx.v)) bad(row.querySelector(".bd-t-start"), `Track ${L}: start must be within its range.`);
      tracks.push({ name, min: mn.v, max: mx.v == null ? null : mx.v, start: st.v });
    });
    const errBox = document.getElementById("bdSetupErr");
    if (errs.length) {
      errBox.innerHTML = `<p>Please fix:</p><ul>${errs.map(m => `<li>${esc(m)}</li>`).join("")}</ul>`;
      errBox.classList.remove("hidden");
      firstBad.focus();
      return;
    }
    const ok = writeJSON(kChar(a), { health: h[0] }) && writeJSON(kChar(b), { health: h[1] }) &&
      writeJSON(kScn(S.scenario), { energy, tracks }) && writeJSON(K_LAST, { health: h[1], energy });
    if (!ok) return;
    const wasEdit = !!S.c;
    if (wasEdit) reapplyConfig(); else startCounters();
    persist();
    render();
    track("board_setup_saved", { tracks: tracks.length, edit: wasEdit });
    announce(wasEdit ? "Board setup saved." : "Mission Board ready.");
    const title = document.getElementById("bdTitle");
    if (title) title.focus();
  }

  // ── Recording the outcome ─────────────────────────────────────────────────────
  let _recResult = null;
  function openRecord(result) {
    if (!S || savedAlready()) return;
    _recResult = result;
    const diff = S.difficulty;
    const notes = document.getElementById("recordNotes").value.trim();
    document.getElementById("bdRecTitle").textContent = `Record ${result}?`;
    document.getElementById("bdRecMsg").textContent =
      `${S.characters.join(" & ")} — ${scenarioText(S.scenario)}: ${result}, ${diff}, time ${formatTime(getCurrentElapsed())}.` +
      (notes ? " Your notes from Record Outcome are saved with it." : "");
    const save = document.getElementById("bdRecSave");
    save.textContent = `Save ${result}`;
    save.className = "btn " + (result === "Win" ? "btn-save" : "btn-danger");
    modal.querySelector(".modal-box").classList.toggle("modal-danger", result === "Loss");
    openModal("boardRecordModal", "bdRecSave");
  }
  function closeRecord() { _recResult = null; closeModal("boardRecordModal"); }

  document.getElementById("bdRecCancel").addEventListener("click", closeRecord);
  modal.addEventListener("click", e => { if (e.target === modal) closeRecord(); });
  document.getElementById("bdRecSave").addEventListener("click", () => {
    const result = _recResult;
    if (!result || !S || savedAlready()) { closeRecord(); return; }
    document.getElementById("result").value = result;
    document.getElementById("difficulty").value = S.difficulty;
    closeRecord();
    // The normal save path: validation, commitRecords, timer stop, confirmation and focus.
    handleSaveRecord();
    if (savedAlready()) { track("board_record", { result }); endAfterSave(); }
  });

  function endAfterSave() {
    closeBoard(false);
    clearSession();
    const btn = document.getElementById("boardToggleBtn");
    if (btn) btn.closest(".board-row").remove();
  }
  // Saved through the regular Record Outcome form: the board's game is over too.
  document.getElementById("saveRecordBtn").addEventListener("click", () => { if (S && savedAlready()) endAfterSave(); });
  document.getElementById("difficulty").addEventListener("change", e => { if (S) setDifficulty(e.target.value); });

  // ── Restore after a reload ────────────────────────────────────────────────────
  function validSession(s) {
    if (!s || s.v !== 1 || !Array.isArray(s.characters) || s.characters.length !== 2) return false;
    if (s.characters[0] === s.characters[1] || !s.characters.every(c => ALL_CHARACTERS_SET.has(c))) return false;
    if (!ALL_SCENARIOS_SET.has(s.scenario) || !DIFFS.includes(s.difficulty)) return false;
    if (!Number.isFinite(s.elapsedMs) || s.elapsedMs < 0) return false;
    if (!Array.isArray(s.undo) || !Array.isArray(s.redo)) return false;
    if (s.c == null) return true;
    if (!s.max || !isInt(s.max.h0) || !isInt(s.max.h1) || !Array.isArray(s.tracks) || !s.tracks.every(validTrack)) return false;
    const keys = ["h0", "h1", "en", ...s.tracks.map((_, i) => "t" + i)];
    return keys.every(k => isInt(s.c[k]));
  }

  // ── Setting (Tips & Features) ─────────────────────────────────────────────────
  const setting = document.getElementById("boardSetting");
  function syncSetting() { if (setting) setting.checked = isEnabled(); }
  function applyEnabled() {
    syncSetting();
    if (!isEnabled()) { closeBoard(false); clearSession(); S = null; }
    injectToggle();
  }
  if (setting) setting.addEventListener("change", () => {
    try { localStorage.setItem(K_ENABLED, setting.checked ? "1" : "0"); } catch (e) {}
    track("board_setting", { on: setting.checked });
    applyEnabled();
  });
  window.addEventListener("storage", e => { if (e.key === K_ENABLED || e.key === null) applyEnabled(); });
  syncSetting();

  (function restore() {
    const s = readJSON(K_SESSION);
    if (!s || !isEnabled()) return;
    if (!validSession(s)) { clearSession(); return; }
    loadCombination({ characters: [...s.characters], scenario: s.scenario });
    _comb = currentCombination;
    if (s.droid && droids.includes(s.droid)) _currentDroid = s.droid;
    document.getElementById("difficulty").value = s.difficulty;
    // Resume the clock where it was, paused: the player may not be at the table yet.
    accumulatedTime = Math.floor(s.elapsedMs);
    startTime = Date.now();
    timerPaused = false;
    togglePause();
    displayCombination(currentCombination);
    S = s;
    if (s.open) openBoard({ restore: true });
    else { S.open = false; injectToggle(); }
    toast(`Mission restored — timer paused at ${formatTime(getCurrentElapsed())}.`);
  })();
})();

// Twin Stars Randomizer — application script (moved out of index.html so the CSP
// can drop 'unsafe-inline' from script-src). Loaded at the end of <body>.
  // ─── Privacy-safe usage analytics ───────────────────────────────────────────
  // Anonymous event counts via the self-hosted Umami tag in index.html (see the Privacy
  // dialog). track() is a no-op when Umami isn't loaded (blocked, offline, Do Not Track,
  // or not on the production domain). Callers pass only fixed labels, counts and flags:
  // never free text, character names or record contents. As a backstop, only numbers,
  // booleans and short strings get through.
  function track(name, data) {
    try {
      const u = window.umami;
      if (!u || typeof u.track !== "function") return;
      const clean = {};
      if (data) {
        for (const [k, v] of Object.entries(data)) {
          if (typeof v === "number" || typeof v === "boolean") clean[k] = v;
          else if (typeof v === "string") clean[k] = v.slice(0, 120);
        }
      }
      u.track(name, clean);
    } catch (e) { /* analytics must never break the app */ }
  }

  // Uncaught errors: report at most 3 per page load, truncated, with URLs and anything
  // after the file name stripped so no query strings or local paths get sent.
  let _errorsReported = 0;
  function reportError(message, source, line) {
    if (_errorsReported >= 3) return;
    _errorsReported++;
    const file = String(source || "").split(/[?#]/)[0].split("/").pop().slice(0, 60);
    const msg = String(message || "unknown").replace(/\b(?:https?|blob|data|file):\S*/g, "[url]").slice(0, 120);
    track("js_error", { message: msg, file, line: Number(line) || 0 });
  }
  window.addEventListener("error", e => {
    // Cross-origin "Script error." carries nothing useful; skip it.
    if (!e.filename && /^Script error\.?$/.test(e.message || "")) return;
    reportError(e.message, e.filename, e.lineno);
  });
  window.addEventListener("unhandledrejection", e => {
    const r = e.reason;
    const where = r && typeof r.stack === "string" ? r.stack.match(/([^\/\s()@]+\.js)(?:\?[^:\s)]*)?:(\d+)/) : null;
    reportError(r && r.message ? r.message : String(r), where ? where[1] : "", where ? where[2] : 0);
  });

  // ─── Data ───────────────────────────────────────────────────────────────────

  const CONTENT_PACKS = [
    {
      id: "series1",
      name: "Series 1 Wallet",
      shortName: "Series 1",
      desc: "12 characters · 6 scenarios (the base game)",
      characters: [
        "Bood", "Stag Solar", "Fanoobia", "Inpon Gol",
        "Grant Rockgardner", "Roux Jaezmina", "Yanfred Jima",
        "Saaze", "Inzill Mey", "Strezelsior", "Kinglan", "Brenimov-X"
      ],
      scenarios: [
        "Escape The Brig!", "Rule The World!", "Stop The Virus!",
        "Hunt The Bounty!", "Steal The Plans!", "Confine The Quarks!"
      ]
    },
    {
      id: "series2",
      name: "Series 2 Wallet",
      shortName: "Series 2",
      desc: "12 characters · 6 scenarios",
      characters: [
        "Dain Taubo", "Grulexon", "Gari Obul", "Smiff",
        "Zoaze", "Tumbug Firo", "Mzerzo", "Phaeton",
        "Hebolt Rom", "Tarla Voke", "Gruffles", "\"Mad\" Anxy"
      ],
      scenarios: [
        "Master the Trials!", "Beat the Odds!", "Control the Skies!",
        "Sell the Junk!", "Destroy the Order!", "Serve the Rabble!"
      ]
    },
    {
      id: "scenario13",
      name: "Scenario 13: Topple the Giant!",
      shortName: "Scenario 13",
      desc: "2 characters · 1 scenario",
      characters: ["Feth Doriet", "Pummtoggs"],
      scenarios: ["Topple the Giant!"]
    },
    {
      id: "scenario14",
      name: "Scenario 14: Save the Spacewhales!",
      shortName: "Scenario 14",
      desc: "2 characters · 1 scenario",
      characters: ["Striker", "Bippinnidip"],
      scenarios: ["Save the Spacewhales!"]
    },
    {
      id: "captaincrag",
      name: "Captain Crag",
      shortName: "Cpt. Crag",
      desc: "1 character · no new scenarios",
      characters: ["Captain Crag"],
      scenarios: []
    },
    {
      id: "droids1",
      name: "Series I Droid Assistants",
      shortName: "Droids I",
      desc: "3 droids — C.R.A.N.K., MC-CY, Domino 2-5",
      characters: [],
      scenarios: [],
      droids: ["C.R.A.N.K.", "MC-CY", "Domino 2-5"]
    },
    {
      id: "droids2",
      name: "Series II Droid Assistants",
      shortName: "Droids II",
      desc: "3 droids — F1D0, T.R.IX, MANTIS",
      characters: [],
      scenarios: [],
      droids: ["F1D0", "T.R.IX", "MANTIS"]
    }
  ];

  const ALL_CHARACTERS_SET = new Set(CONTENT_PACKS.flatMap(p => p.characters));
  const ALL_SCENARIOS_SET  = new Set(CONTENT_PACKS.flatMap(p => p.scenarios));
  const ALL_DROIDS_SET     = new Set(CONTENT_PACKS.flatMap(p => p.droids || []));

  const SCENARIO_NUMBER = {
    "Escape The Brig!":      "01",
    "Confine The Quarks!":   "02",
    "Rule The World!":       "03",
    "Stop The Virus!":       "04",
    "Steal The Plans!":      "05",
    "Hunt The Bounty!":      "06",
    "Master the Trials!":    "07",
    "Beat the Odds!":        "08",
    "Control the Skies!":    "09",
    "Sell the Junk!":        "10",
    "Destroy the Order!":    "11",
    "Serve the Rabble!":     "12",
    "Topple the Giant!":     "13",
    "Save the Spacewhales!": "14"
  };

  const CHAR_FAQ_ANCHOR = {
    "Bood":              "faq-char-bood",
    "Brenimov-X":        "faq-char-brenimov-x",
    "Fanoobia":          "faq-char-fanoobia",
    "Grant Rockgardner": "faq-char-grant",
    "Inpon Gol":         "faq-char-inpon-gol",
    "Inzill Mey":        "faq-char-inzill-mey",
    "Kinglan":           "faq-char-kinglan",
    "Phaeton":           "faq-char-phaeton",
    "Roux Jaezmina":     "faq-char-roux",
    "Smiff":             "faq-char-smiff",
    "Strezelsior":       "faq-char-strezelsior",
    "Yanfred Jima":      "faq-char-yanfred",
    "Zoaze":             "faq-char-zoaze",
  };

  const RADIO_STREAMS = [
    "https://ice2.somafm.com/missioncontrol-128-aac",
    "https://ice6.somafm.com/missioncontrol-128-aac",
    "https://ice4.somafm.com/missioncontrol-128-aac",
    "https://ice5.somafm.com/missioncontrol-128-aac",
    "https://ice3.somafm.com/missioncontrol-128-aac",
    "https://ice2.somafm.com/missioncontrol-128-mp3",
    "https://ice6.somafm.com/missioncontrol-128-mp3",
    "https://ice4.somafm.com/missioncontrol-128-mp3",
  ];

  function faqHelpBtn(anchor, subject) {
    const label = subject ? `Rules FAQ: ${subject}` : "Rules FAQ";
    return `<button class="btn-faq-inline" data-faq-anchor="${esc(anchor)}" title="${esc(label)}" aria-label="${esc(label)}">?</button>`;
  }

  function scenarioHTML(name) {
    const num = SCENARIO_NUMBER[name];
    if (!num) return esc(name);
    return `<span class="text-dim">Scenario ${num}:</span> ${esc(name)}`;
  }

  function scenarioText(name) {
    const num = SCENARIO_NUMBER[name];
    return num ? `Scenario ${num}: ${name}` : name;
  }

  let characters    = [];
  let scenarios     = [];
  let droids        = [];
  let _currentDroid = null;

  const VALID_RESULTS      = new Set(["Win", "Loss"]);
  const VALID_DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);

  // ─── Theme ──────────────────────────────────────────────────────────────────

  const MOON_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  const SUN_SVG  = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/></svg>';

  function getInitialTheme() {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch(e) {}
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => {
      const isDark = m.getAttribute("content") === "#07091a";
      m.setAttribute("media", isDark
        ? (theme === "dark"  ? "all" : "not all")
        : (theme === "light" ? "all" : "not all"));
    });
    const btn = document.getElementById("themeBtn");
    // In dark mode show the sun (click to switch to light).
    // In light mode show the moon (click to switch to dark).
    if (btn) {
      btn.innerHTML = theme === "dark" ? SUN_SVG : MOON_SVG;
      btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }
    try { localStorage.setItem("theme", theme); } catch(e) {}
  }

  function toggleTheme() {
    const root = document.documentElement;
    const current = root.getAttribute("data-theme") || "dark";
    // Switch every surface at once: suppress hover-feedback transitions for this frame so
    // buttons don't fade between themes while the page background snaps.
    root.classList.add("theme-switching");
    applyTheme(current === "dark" ? "light" : "dark");
    track("theme_toggle", { theme: current === "dark" ? "light" : "dark" });
    void root.offsetHeight;
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
  }


  applyTheme(getInitialTheme());

  // ─── Onboarding tip ─────────────────────────────────────────────────────────
  function initOnboardingTip() {
    try { if (localStorage.getItem("hasSeenTip")) return; } catch(e) { return; }
    document.getElementById("onboardingTip").classList.remove("hidden");
  }

  function dismissTip() {
    document.getElementById("onboardingTip").classList.add("hidden");
    try { localStorage.setItem("hasSeenTip", "1"); } catch(e) {}
  }

  // ─── Storage ────────────────────────────────────────────────────────────────

  let _radioIndex = 0;
  let _radioState = "stopped";
  let _errorTimeout = null;

  let records = [];
  // Dirty flags: set to true whenever records change, cleared when each view re-renders.
  // This lets showTab() skip expensive re-renders when nothing has changed.
  let historyDirty  = true;
  let unplayedDirty = true;
  let statsDirty    = true;
  try {
    const raw = localStorage.getItem("gameRecords");
    if (raw) {
      const parsed = JSON.parse(raw);
      records = parsed.filter(isValidRecord);
      const dropped = parsed.length - records.length;
      if (dropped > 0) {
        console.warn(`Discarded ${dropped} invalid record(s) from localStorage.`);
        // saveRecords() will overwrite "gameRecords" without the rejected entries, so keep
        // the untouched original (first occurrence only) where it can still be recovered.
        try { if (!localStorage.getItem("gameRecordsBackup")) localStorage.setItem("gameRecordsBackup", raw); } catch(e) {}
        setTimeout(() => toast(`${dropped} saved record(s) could not be loaded and were skipped. A backup copy was kept.`, "error"), 300);
      }
    }
  } catch (e) {
    console.warn("Could not load saved records:", e);
  }

  try {
    if (records.length > 0 && !localStorage.getItem("seenPrimarySecondaryNotice")) {
      localStorage.setItem("seenPrimarySecondaryNotice", "1");
      setTimeout(() => toast("Roles added: Character 1 = Primary, Character 2 = Secondary. Older records show characters in their saved order.", "info"), 800);
    }
  } catch(e) {}

  function syncExportBtn() {
    const empty = !records.length;
    document.getElementById("exportBtn").disabled  = empty;
    document.getElementById("clearDataBtn").disabled = empty;
  }

  function saveRecords() {
    historyDirty  = true;
    unplayedDirty = true;
    statsDirty    = true;
    syncExportBtn();
    try {
      localStorage.setItem("gameRecords", JSON.stringify(records));
    } catch (e) {
      toast("Could not save — storage may be full.", "error");
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────
  // Stable unique key for a character+scenario combination.
  // Uses ASCII control characters (unit separator \x1F, record separator \x1E)
  // as delimiters — they can never appear in a character or scenario name.
  function comboKey(comb) {
    return comb.characters.join("\x1F") + "\x1E" + comb.scenario;
  }

  // XSS-safe HTML escape. Uses a detached div for the <, >, & escaping then adds
  // " escaping so the result is safe inside data-* attribute values too ("Mad" Anxy).
  const _escEl = document.createElement("div");
  function esc(str) {
    _escEl.textContent = String(str);
    return _escEl.innerHTML.replace(/"/g, '&quot;');
  }

  function formatTime(secs) {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return m + ":" + s;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Screen-reader-only announcement through the shared polite live region.
  // Cleared first so repeating the same message is announced again.
  function announce(msg) {
    const live = document.getElementById("ariaLive");
    if (!live) return;
    live.textContent = "";
    setTimeout(() => { live.textContent = msg; }, 30);
  }

  const UNDO_KEY = /Mac|iPhone|iPad/.test(navigator.platform || "") ? "Command+Z" : "Control+Z";
  // The undo callback of the most recent undoable action (cleared when its toast goes).
  let _undoAction = null;

  // toast(msg, type, action?) — action = { label, onClick } adds a button (e.g. Undo).
  function toast(msg, type, action) {
    // One toast at a time (they share a position), shown long enough to read.
    document.querySelectorAll(".toast").forEach(el => el.remove());
    _undoAction = null;
    const t = document.createElement("div");
    t.className = "toast " + (type || "info");
    const text = document.createElement("span");
    text.textContent = msg;
    t.appendChild(text);
    let timer;
    const remove = () => { clearTimeout(timer); t.remove(); if (_undoAction === run) _undoAction = null; };
    let run = null;
    _toastOffered = false;
    if (action) {
      run = () => {
        const fromToast = t.contains(document.activeElement);
        remove(); action.onClick();
        // Focus was on the Undo button, which is gone now: go back to where the user was.
        if (fromToast || document.activeElement === document.body) restoreToastFocus();
      };
      _undoAction = run;
      t.classList.add("has-action");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "toast-action";
      b.textContent = action.label;
      b.addEventListener("click", run);
      t.appendChild(b);
      // Keep it on screen while the pointer or keyboard is on it.
      t.addEventListener("mouseenter", () => clearTimeout(timer));
      t.addEventListener("focusin",    () => clearTimeout(timer));
      t.addEventListener("mouseleave", () => { timer = setTimeout(remove, 4000); });
      announce(`${msg} Press Tab to reach ${action.label}, or ${UNDO_KEY}.`);
    } else {
      // The live region already announces it; hide the visual copy from the a11y tree.
      t.setAttribute("aria-hidden", "true");
      announce(msg);
    }
    (document.getElementById("toastRegion") || document.body).appendChild(t);
    timer = setTimeout(remove, action ? 10000 : Math.max(2600, 1500 + msg.length * 45));
  }

  // Keyboard path to a toast's Undo: while it is showing, the next Tab (from anywhere
  // outside a dialog) jumps to it once; Tab/Shift+Tab/Escape on it go back to where
  // the user was. Focus is never moved without a key press.
  let _toastReturn = null, _toastOffered = false;
  function restoreToastFocus() {
    const el = _toastReturn; _toastReturn = null;
    if (el && el.isConnected && !el.disabled && el.offsetParent !== null) { el.focus(); return; }
    const panel = document.querySelector("[role='tabpanel']:not(.hidden)");
    if (panel) panel.focus();
  }
  document.addEventListener("keydown", e => {
    const btn = document.querySelector("#toastRegion .toast-action");
    if (!btn) { _toastOffered = false; return; }
    const inToast = btn === document.activeElement;
    if (inToast && (e.key === "Escape" || (e.key === "Tab" && e.shiftKey))) {
      e.preventDefault(); restoreToastFocus(); return;
    }
    if (inToast && e.key === "Tab") { const r = _toastReturn; _toastReturn = null; if (r && r.isConnected) r.focus(); return; }
    if (e.key !== "Tab" || e.shiftKey || _toastOffered || document.querySelector(".modal-overlay.open")) return;
    _toastOffered = true;
    e.preventDefault();
    _toastReturn = document.activeElement !== document.body ? document.activeElement : null;
    btn.focus();
  });
  function undoToast(msg, onUndo) { toast(msg, "info", { label: "Undo", onClick: () => { track("undo"); onUndo(); } }); }

  // Ctrl/Cmd+Z reverses the last undoable action while its message is showing
  // (not while typing in a text field, where it must keep its normal meaning).
  document.addEventListener("keydown", e => {
    if (!_undoAction || e.key.toLowerCase() !== "z" || !(e.ctrlKey || e.metaKey) || e.shiftKey) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || document.querySelector(".modal-overlay.open")) return;
    e.preventDefault();
    _undoAction();
  });

  // Guards against corrupted or externally-imported records making it into the array.
  // Characters must be from the known master list so comboKey lookups stay consistent.
  function isValidRecord(r) {
    return (
      r && typeof r === "object" &&
      Array.isArray(r.characters) &&
      r.characters.length === 2 &&
      r.characters[0] !== r.characters[1] &&
      r.characters.every(c => ALL_CHARACTERS_SET.has(c)) &&
      ALL_SCENARIOS_SET.has(r.scenario) &&
      VALID_RESULTS.has(r.result) &&
      VALID_DIFFICULTIES.has(r.difficulty) &&
      typeof r.timestamp === "string" &&
      (r.playtime == null || (Number.isInteger(r.playtime) && r.playtime >= 0)) &&
      (r.notes   == null || (typeof r.notes === "string"  && r.notes.length <= 2000)) &&
      (r.droid   == null || ALL_DROIDS_SET.has(r.droid))
    );
  }


// ─── Timer ──────────────────────────────────────────────────────────────────
// Wall-clock timer using Date.now() rather than counting setInterval ticks,
// so accumulated drift is negligible even over long sessions.
// accumulatedTime holds ms from completed (pre-pause) segments; startTime marks
// when the current running segment began. Elapsed = accumulatedTime + (now - startTime).

let timerInterval   = null;
let timerPaused     = false;
let startTime       = null;
let accumulatedTime = 0;

function startTimer() {
  stopTimer();
  timerPaused     = false;
  accumulatedTime = 0;
  startTime       = Date.now();
  // Tick several times a second: the shown time follows the real elapsed time even after
  // a pause/resume (a 1 s tick phase-locked to the start left the display frozen for up
  // to ~2 s after Resume).
  timerInterval   = setInterval(updateDisplay, 250);
  const el = document.getElementById("timerDisplay");
  if (el) { el.textContent = "00:00"; el.classList.remove("stopped"); el.setAttribute("aria-label", "Timer running: 0 minutes 0 seconds"); }
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  // Fold the running segment in so the card keeps showing the final time.
  if (startTime && !timerPaused) accumulatedTime += Date.now() - startTime;
  timerPaused = false;
  startTime   = null;
  const el = document.getElementById("timerDisplay");
  if (el) {
    el.textContent = formatTime(Math.floor(accumulatedTime / 1000));
    el.classList.add("stopped");
    el.setAttribute("aria-label", "Timer stopped at " + formatTime(Math.floor(accumulatedTime / 1000)));
  }
}

function togglePause() {
  if (!timerInterval && !timerPaused) return; // timer is stopped, not just paused
  const btn = document.getElementById("pauseBtn");
  const display = document.getElementById("timerDisplay");

  if (!timerPaused) {
    timerPaused = true;
    accumulatedTime += Date.now() - startTime;
  } else {
    timerPaused = false;
    startTime = Date.now();
  }

  if (btn) {
    btn.textContent = timerPaused ? "Resume" : "Pause";
    btn.setAttribute("aria-label", timerPaused ? "Resume timer" : "Pause timer");
    btn.classList.toggle("paused", timerPaused);
  }

  if (display) {
    display.textContent = formatTime(getCurrentElapsed());
    display.classList.toggle("paused", timerPaused);
    display.setAttribute("aria-label", timerPaused ? "Timer paused" : "Timer running");
  }
  announce(timerPaused ? `Timer paused at ${formatTime(getCurrentElapsed())}.` : "Timer resumed.");
}


function updateDisplay() {
  if (timerPaused) return;
  const elapsedMs = accumulatedTime + (Date.now() - startTime);
  const el = document.getElementById("timerDisplay");
  const text = formatTime(Math.floor(elapsedMs / 1000));
  if (el && el.textContent !== text) el.textContent = text;
}

function getCurrentElapsed() {
  if (timerPaused || !startTime) return Math.floor(accumulatedTime / 1000);
  return Math.floor((accumulatedTime + (Date.now() - startTime)) / 1000);
}

  // ─── Dropdowns ──────────────────────────────────────────────────────────────
  // Rebuilds tgt dropdown to exclude the value already selected in src,
  // preserving tgt's previous selection if it's still valid.
  function syncDropdown(srcId, tgtId) {
    const exclude = document.getElementById(srcId).value;
    const tgt     = document.getElementById(tgtId);
    const prev    = tgt.value;
    tgt.innerHTML = "";
    characters.forEach(char => {
      if (char === exclude) return;
      const opt = document.createElement("option");
      opt.value = opt.textContent = char;
      tgt.appendChild(opt);
    });
    if (prev && prev !== exclude) tgt.value = prev;
  }

  function populateSelectors() {
    const c1 = document.getElementById("manualChar1");
    const c2 = document.getElementById("manualChar2");
    const sc = document.getElementById("manualScenario");
    // Remember what the user had picked so rebuilding the lists (e.g. after closing
    // My Collection) doesn't silently change a locked character or scenario.
    const prev1 = c1.value, prev2 = c2.value, prevSc = sc.value;
    c1.innerHTML = "";
    sc.innerHTML = "";
    characters.forEach(char => {
      const opt = document.createElement("option");
      opt.value = opt.textContent = char;
      c1.appendChild(opt);
    });
    scenarios.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = scenarioText(s);
      sc.appendChild(opt);
    });
    if (prev1  && characters.includes(prev1))  c1.value = prev1;
    if (prevSc && scenarios.includes(prevSc))  sc.value = prevSc;
    syncDropdown("manualChar1", "manualChar2");
    // A lock on something that is no longer available (pack disabled) is released.
    const released = (locks.char1 && c1.value !== prev1) || (locks.char2 && c2.value !== prev2) || (locks.scenario && sc.value !== prevSc);
    if (locks.char1    && c1.value !== prev1)  locks.char1    = false;
    if (locks.char2    && c2.value !== prev2)  locks.char2    = false;
    if (locks.scenario && sc.value !== prevSc) locks.scenario = false;
    updateLockButtons();
    if (released) toast("A locked item is no longer in your collection — lock released.", "error");
  }

  // ─── Difficulty status ──────────────────────────────────────────────────────
  function getDifficultyStatus(comb) {
    const key       = comboKey(comb);
    const comboRecs = records.filter(r => comboKey(r) === key);
    return ["Easy", "Medium", "Hard"].map(diff => {
      const filtered = comboRecs.filter(r => r.difficulty === diff);
      if (!filtered.length) return { diff, state: "unplayed" };
      return { diff, state: filtered.some(r => r.result === "Win") ? "win" : "loss" };
    });
  }

  const DIFF_STATE_TEXT = { win: "won", loss: "played, not yet won", unplayed: "not played yet" };
  const DIFF_STATE_MARK = { win: "✓", loss: "✗", unplayed: "" };
  function renderDiffBadges(comb) {
    // State is shown by colour, a ✓/✗ mark and (for screen readers / tooltips) words.
    return getDifficultyStatus(comb).map(({ diff, state }) =>
      `<div class="diff-badge ${state}" role="listitem" title="${esc(diff)}: ${DIFF_STATE_TEXT[state]}"><div class="diff-dot" aria-hidden="true"></div>${esc(diff)}${DIFF_STATE_MARK[state] ? `<span class="diff-mark" aria-hidden="true">${DIFF_STATE_MARK[state]}</span>` : ""}<span class="sr-only">: ${DIFF_STATE_TEXT[state]}</span></div>`
    ).join("");
  }

  // Short human description of a record, used to give each row's buttons a unique name.
  // Concise: characters plus the date and time to the minute (seconds dropped).
  function shortStamp(ts) { return String(ts).replace(/(\d{1,2}:\d{2}):\d{2}/, "$1"); }
  function recordLabel(rec) {
    return `${rec.characters.join(" & ")}, ${shortStamp(rec.timestamp)}`;
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  let currentCombination = null;

  const locks = { char1: false, char2: false, scenario: false };

  const SVG_LOCK   = `<svg aria-hidden="true" width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="6" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M3 6V4a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  const SVG_UNLOCK = `<svg aria-hidden="true" width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="6" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M3 6V4a3 3 0 0 1 6 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;

  function updateLockButtons() {
    const btn1  = document.getElementById("lockChar1");
    const btn2  = document.getElementById("lockChar2");
    const btnSc = document.getElementById("lockScenario");
    btn1.innerHTML  = locks.char1    ? SVG_LOCK : SVG_UNLOCK;
    btn2.innerHTML  = locks.char2    ? SVG_LOCK : SVG_UNLOCK;
    btnSc.innerHTML = locks.scenario ? SVG_LOCK : SVG_UNLOCK;
    btn1.classList.toggle("locked",  locks.char1);
    btn2.classList.toggle("locked",  locks.char2);
    btnSc.classList.toggle("locked", locks.scenario);
    btn1.setAttribute("aria-pressed",  String(locks.char1));
    btn2.setAttribute("aria-pressed",  String(locks.char2));
    btnSc.setAttribute("aria-pressed", String(locks.scenario));
    [btn1, btn2, btnSc].forEach(b => {
      b.title = b.getAttribute("aria-pressed") === "true" ? "Locked: kept when you randomize (tap to unlock)" : "Lock to keep it when you randomize";
    });
    const allLocked = locks.char1 && locks.char2 && locks.scenario;
    const genBtn = document.getElementById("generateBtn");
    genBtn.disabled = allLocked;
    const hint = document.getElementById("allLockedHint");
    if (hint) hint.classList.toggle("hidden", !allLocked);
  }

  function displayCombination(comb) {
    const key       = comboKey(comb);
    const playCount = records.filter(r => comboKey(r) === key).length;
    const countText = playCount === 0 ? "Never played" : playCount === 1 ? "Played 1 time" : `Played ${playCount} times`;

    const droidOptions = droids.length
      ? `<option value="">None</option>` + droids.map(d =>
          `<option value="${esc(d)}"${_currentDroid === d ? " selected" : ""}>${esc(d)}</option>`
        ).join("")
      : "";

    document.getElementById("combinationDisplay").innerHTML = `
      <div class="combo-display">
        <h2 class="sr-only" id="comboHeading" tabindex="-1">Current mission: ${esc(comb.characters[0])} and ${esc(comb.characters[1])}, ${esc(scenarioText(comb.scenario))}</h2>
        <div class="combo-characters">
          <span class="combo-char-wrap"><span class="char-role primary-role">Primary</span>${esc(comb.characters[0])}${CHAR_FAQ_ANCHOR[comb.characters[0]] ? faqHelpBtn(CHAR_FAQ_ANCHOR[comb.characters[0]], comb.characters[0]) : ""}</span><span class="combo-vs">&amp;</span><span class="combo-char-wrap"><span class="char-role secondary-role">Secondary</span>${esc(comb.characters[1])}${CHAR_FAQ_ANCHOR[comb.characters[1]] ? faqHelpBtn(CHAR_FAQ_ANCHOR[comb.characters[1]], comb.characters[1]) : ""}</span>
        </div>
        <div class="combo-scenario">${scenarioHTML(comb.scenario)}${SCENARIO_NUMBER[comb.scenario] && parseInt(SCENARIO_NUMBER[comb.scenario]) <= 12 ? faqHelpBtn("faq-sc-" + SCENARIO_NUMBER[comb.scenario], scenarioText(comb.scenario)) : ""}</div>
        <div class="combo-play-count"><span>${esc(countText)}</span></div>
        ${droids.length ? `
        <div class="droid-row">
          <span class="droid-row-label">Droid</span>
          <select class="droid-select" id="droidSelect" aria-label="Droid assistant">${droidOptions}</select>
          <button class="btn-droid-rand" id="droidRandBtn" aria-label="Pick a random droid">Random</button>
        </div>` : ""}
        <div class="difficulty-row" role="list" aria-label="Your results for this combination by difficulty">${renderDiffBadges(comb)}</div>
        <div class="timer-row">
          <div>
            <div class="timer-label">${timerInterval || timerPaused ? "Elapsed Time" : "Recorded Time"}</div>
            <div class="timer-display" id="timerDisplay" aria-live="off" aria-label="Timer stopped">00:00</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn-pause" id="restartBtn" aria-label="Restart timer">Restart</button>
            <button class="btn-pause" id="pauseBtn" aria-label="Pause timer">Pause</button>
          </div>
        </div>
        <div class="dice-row">
          <button class="btn btn-secondary btn-dice" id="diceRollerBtn"><span aria-hidden="true">🎲</span> Roll Dice</button>
        </div>
      </div>`;
    document.querySelectorAll("#combinationDisplay .btn-faq-inline").forEach(btn => {
      btn.addEventListener("click", () => openFaq(btn.dataset.faqAnchor));
    });
    const droidSel = document.getElementById("droidSelect");
    if (droidSel) {
      droidSel.addEventListener("change", () => { _currentDroid = droidSel.value || null; });
      document.getElementById("droidRandBtn").addEventListener("click", () => {
        const pool = droids.filter(d => d !== _currentDroid);
        _currentDroid = (pool.length ? pool : droids)[Math.floor(Math.random() * (pool.length || droids.length))];
        droidSel.value = _currentDroid;
        announce(`Droid: ${_currentDroid}.`);
      });
    }
    document.getElementById("pauseBtn").addEventListener("click", togglePause);
    document.getElementById("restartBtn").addEventListener("click", () => openModal("restartModal", "restartCancel"));
    document.getElementById("diceRollerBtn").addEventListener("click", openDiceModal);

    const timerEl  = document.getElementById("timerDisplay");
    const pauseB   = document.getElementById("pauseBtn");
    const restartB = document.getElementById("restartBtn");
    timerEl.textContent = formatTime(getCurrentElapsed());
    if (timerPaused) {
      pauseB.textContent = "Resume";
      pauseB.setAttribute("aria-label", "Resume timer");
      pauseB.classList.add("paused");
      timerEl.classList.add("paused");
      timerEl.setAttribute("aria-label", "Timer paused");
    } else if (!timerInterval) {
      // Stopped (record already saved): nothing to pause or restart.
      pauseB.disabled   = true;
      restartB.disabled = true;
      timerEl.classList.add("stopped");
      timerEl.setAttribute("aria-label", "Timer stopped at " + formatTime(getCurrentElapsed()));
    } else {
      timerEl.setAttribute("aria-label", "Timer running");
    }
  }

  function displayComboHistory(comb) {
    const div  = document.getElementById("comboHistory");
    const recs = records.filter(r => comboKey(r) === comboKey(comb));

    if (!recs.length) {
      div.innerHTML = `<div class="notice">No records yet for this combination.</div>`;
      return;
    }
    const rows = recs.map((rec) => {
      const globalIdx = records.indexOf(rec);
      return `
      <tr>
        <td class="td-meta">
          <div class="td-nowrap">${esc(rec.timestamp)}</div>
          ${rec.droid ? `<span class="droid-tag">${esc(rec.droid)}</span>` : ""}
        </td>
        <td><span class="result-pill ${rec.result === "Win" ? "win" : "loss"}">${esc(rec.result)}</span></td>
        <td><span class="diff-pill">${esc(rec.difficulty)}</span></td>
        <td class="td-time">${rec.playtime != null ? formatTime(rec.playtime) : "—"}</td>
        <td><button class="btn-delete-record" data-idx="${globalIdx}" title="Delete" aria-label="Delete record from ${esc(shortStamp(rec.timestamp))}">✕</button></td>
      </tr>`;}).join("");

    // Droid coverage summary for this combo
    let droidSummaryHTML = "";
    if (droids.length) {
      const droidsUsed = [...new Set(recs.map(r => r.droid).filter(Boolean))];
      if (droidsUsed.length) {
        const pills = droidsUsed.map(d => `<span class="droid-coverage-pill">${esc(d)}</span>`).join("");
        droidSummaryHTML = `<div class="droid-coverage-row"><span class="droid-coverage-label">Droids used</span><span class="droid-coverage-pills">${pills}</span></div>`;
      } else {
        droidSummaryHTML = `<div class="droid-coverage-row"><span class="droid-coverage-label">Droids used</span><span class="droid-coverage-none">None yet</span></div>`;
      }
    }

    div.innerHTML = `
      <div class="panel">
        <h2 class="section-heading">This Combination</h2>
        ${droidSummaryHTML}
        <div class="history-table-wrap">
          <table>
            <thead><tr><th>Date / Time</th><th>Result</th><th>Difficulty</th><th>Time</th><th><span class="sr-only">Actions</span></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
    restoreTableRoles(div);

    // Property assignment (not addEventListener): this runs on every render.
    div.onclick = e => {
      const deleteBtn = e.target.closest(".btn-delete-record");
      if (!deleteBtn) return;
      _deleteTrigger    = deleteBtn;
      _pendingDeleteIdx = parseInt(deleteBtn.dataset.idx, 10);
      _deleteCallback   = () => { displayCombination(currentCombination); displayComboHistory(currentCombination); };
      openDeleteModal();
    };
  }

  // Renders combinations that have never appeared in records[].
  // Virtual-scrolls in batches of 30 to avoid freezing the DOM for large lists
  // (up to ~11 000 combos with all packs enabled).
  function displayUnplayed() {
    unplayedDirty = false;
    const container = document.getElementById("unplayedContainer");

    const playedKeys = new Set(records.map(r => comboKey(r)));
    const unplayed = [];
    for (let i = 0; i < characters.length; i++) {
      for (let j = 0; j < characters.length; j++) {
        if (i === j) continue;
        for (const scenario of scenarios) {
          const comb = { characters: [characters[i], characters[j]], scenario };
          if (!playedKeys.has(comboKey(comb))) unplayed.push(comb);
        }
      }
    }

    if (!unplayed.length) {
      container.innerHTML = `<div class="empty-state"><p>You've played every combination. Incredible!</p></div>`;
      return;
    }

    const total  = characters.length * (characters.length - 1) * scenarios.length;
    const played = total - unplayed.length;

    container.innerHTML = `
      <p class="panel-intro">
        <strong class="text-teal">${played}</strong> of <strong>${total}</strong> combinations played
      </p>
      <p class="sr-only" id="unplayedHint">Up and down arrow keys move between combinations; Tab leaves the list.</p>
      <div class="unplayed-grid" id="unplayedGrid" role="list" aria-label="Unplayed combinations" aria-describedby="unplayedHint"></div>`;

    const grid   = document.getElementById("unplayedGrid");
    const BATCH  = 30;
    let   offset = 0;

    function appendBatch() {
      const slice = unplayed.slice(offset, offset + BATCH);
      if (!slice.length) return;
      const frag = document.createDocumentFragment();
      slice.forEach(comb => {
        const div = document.createElement("div");
        div.className = "unplayed-item";
        div.setAttribute("role", "listitem");
        div.innerHTML = `
          <div class="unplayed-item-text">
            <div>${esc(comb.characters.join(" & "))}</div>
            <div class="unplayed-item-scenario">${scenarioHTML(comb.scenario)}</div>
          </div>
          <button class="btn-load-unplayed"
            data-char0="${esc(comb.characters[0])}"
            data-char1="${esc(comb.characters[1])}"
            data-scenario="${esc(comb.scenario)}"
            tabindex="${offset === 0 && !frag.childNodes.length ? "0" : "-1"}"
            aria-label="Play ${esc(comb.characters.join(" & "))}, ${esc(scenarioText(comb.scenario))}">Play</button>`;
        frag.appendChild(div);
      });
      offset += slice.length;
      grid.appendChild(frag);
    }

    // One delegated listener instead of one per row
    grid.addEventListener("click", e => {
      const btn = e.target.closest(".btn-load-unplayed");
      if (!btn) return;
      const comb = { characters: [btn.dataset.char0, btn.dataset.char1], scenario: btn.dataset.scenario };
      guardUnsaved(() => {
        showTab("randomizer");
        loadCombination(comb, { focusCard: true });
        track("unplayed_play");
      });
    });

    // Thousands of Play buttons would make the list an endless run of Tab stops, so it is
    // one Tab stop (roving tabindex) and the arrow keys move inside it.
    grid.addEventListener("keydown", e => {
      const keys = { ArrowDown: 1, ArrowUp: -1, Home: "first", End: "last" };
      if (!(e.key in keys) || !e.target.classList.contains("btn-load-unplayed")) return;
      e.preventDefault();
      let btns = [...grid.querySelectorAll(".btn-load-unplayed")];
      let i = btns.indexOf(e.target);
      if (keys[e.key] === 1 && i === btns.length - 1) { appendBatch(); btns = [...grid.querySelectorAll(".btn-load-unplayed")]; }
      const next = keys[e.key] === "first" ? btns[0] : keys[e.key] === "last" ? btns[btns.length - 1] : btns[Math.max(0, Math.min(btns.length - 1, i + keys[e.key]))];
      if (!next || next === e.target) return;
      e.target.tabIndex = -1; next.tabIndex = 0; next.focus();
    });

    // Append more rows as the user scrolls toward the bottom
    grid.addEventListener("scroll", () => {
      if (offset < unplayed.length && grid.scrollTop + grid.clientHeight >= grid.scrollHeight - 100) {
        appendBatch();
      }
    }, { passive: true });

    appendBatch();
  }

  function displayHistory() {
    historyDirty = false;
    const container = document.getElementById("historyTableContainer");
    if (!records.length) {
      container.innerHTML = `<div class="empty-state"><p>No missions logged yet. Load a mission on the Randomizer tab, play it, then tap Save Record. You can also Import a backup.</p></div>`;
      document.getElementById("historyCount").textContent = "";
      return;
    }

    // Populate character and scenario filter options (preserve current selection)
    const charSel   = document.getElementById("historyFilterChar");
    const scSel     = document.getElementById("historyFilterScenario");
    const droidSel  = document.getElementById("historyFilterDroid");
    const prevChar  = charSel?.value  || "";
    const prevSc    = scSel?.value    || "";
    const prevDroid = droidSel?.value || "";
    if (charSel) {
      const chars = [...new Set(records.flatMap(r => r.characters))].sort();
      charSel.innerHTML = `<option value="">All characters</option>` +
        chars.map(c => `<option value="${esc(c)}"${c === prevChar ? " selected" : ""}>${esc(c)}</option>`).join("");
    }
    if (scSel) {
      const scs = [...new Set(records.map(r => r.scenario))].sort();
      scSel.innerHTML = `<option value="">All scenarios</option>` +
        scs.map(s => `<option value="${esc(s)}"${s === prevSc ? " selected" : ""}>${esc(scenarioText(s))}</option>`).join("");
    }
    if (droidSel) {
      const usedDroids = [...new Set(records.map(r => r.droid).filter(Boolean))].sort();
      droidSel.innerHTML = `<option value="">All droids</option><option value="__none__">No droid</option>` +
        usedDroids.map(d => `<option value="${esc(d)}"${d === prevDroid ? " selected" : ""}>${esc(d)}</option>`).join("");
      // Hide the droid filter entirely when no droid records exist and no droid packs are enabled
      droidSel.style.display = (usedDroids.length === 0 && droids.length === 0) ? "none" : "";
    }

    const sortBy     = document.getElementById("historySortBy")?.value     || "date-desc";
    const filterRes  = document.getElementById("historyFilterResult")?.value || "";
    const filterDiff = document.getElementById("historyFilterDifficulty")?.value || "";
    const filterChar = charSel?.value  || "";
    const filterSc   = scSel?.value    || "";
    const filterDroid = droidSel?.value || "";

    let displayed = records.map((rec, idx) => ({ rec, idx }));

    if (filterRes)  displayed = displayed.filter(({ rec }) => rec.result     === filterRes);
    if (filterDiff) displayed = displayed.filter(({ rec }) => rec.difficulty === filterDiff);
    if (filterChar) displayed = displayed.filter(({ rec }) => rec.characters.includes(filterChar));
    if (filterSc)   displayed = displayed.filter(({ rec }) => rec.scenario   === filterSc);
    if (filterDroid === "__none__") displayed = displayed.filter(({ rec }) => !rec.droid);
    else if (filterDroid)           displayed = displayed.filter(({ rec }) => rec.droid === filterDroid);

    const diffOrder = { Easy: 0, Medium: 1, Hard: 2 };
    displayed.sort((a, b) => {
      switch (sortBy) {
        case "date-asc":    return a.idx - b.idx;
        case "date-desc":   return b.idx - a.idx;
        case "result":      return a.rec.result.localeCompare(b.rec.result);
        case "difficulty":  return (diffOrder[a.rec.difficulty] ?? 1) - (diffOrder[b.rec.difficulty] ?? 1);
        case "characters":  return a.rec.characters.join(" & ").localeCompare(b.rec.characters.join(" & "));
        case "scenario":    return a.rec.scenario.localeCompare(b.rec.scenario);
        default:            return b.idx - a.idx;
      }
    });

    const filtering = !!(filterRes || filterDiff || filterChar || filterSc || filterDroid);
    document.getElementById("historyCount").textContent = filtering
      ? `Showing ${displayed.length} of ${records.length} records`
      : `${records.length} record${records.length !== 1 ? "s" : ""}`;

    if (!displayed.length) {
      container.innerHTML = `<div class="empty-state"><p>No records match these filters.</p><button type="button" class="btn btn-secondary" id="clearFiltersBtn">Clear Filters</button></div>`;
      document.getElementById("clearFiltersBtn").addEventListener("click", () => {
        ["historyFilterResult", "historyFilterDifficulty", "historyFilterChar", "historyFilterScenario", "historyFilterDroid"]
          .forEach(id => { document.getElementById(id).value = ""; });
        displayHistory();
        document.getElementById("historyFilterResult").focus();
      });
      return;
    }

    const rows = displayed.map(({ rec, idx }) => {
      const notesRow = rec.notes
        ? `<tr class="notes-row"><td colspan="7">${esc(rec.notes)}</td></tr>`
        : "";
      return `
        <tr>
          <td class="td-time">${esc(rec.timestamp)}</td>
          <td>${esc(rec.characters.join(" & "))}${rec.droid ? `<span class="droid-tag">${esc(rec.droid)}</span>` : ""}</td>
          <td class="td-scenario">${scenarioHTML(rec.scenario)}</td>
          <td><span class="result-pill ${rec.result === "Win" ? "win" : "loss"}">${esc(rec.result)}</span></td>
          <td><span class="diff-pill">${esc(rec.difficulty)}</span></td>
          <td class="td-time">${rec.playtime != null ? formatTime(rec.playtime) : "—"}</td>
          <td class="td-nowrap">
            <button class="btn-edit-record"   data-idx="${idx}" title="Edit"   aria-label="Edit ${esc(recordLabel(rec))}">✎</button>
            <button class="btn-delete-record" data-idx="${idx}" title="Delete" aria-label="Delete ${esc(recordLabel(rec))}">✕</button>
          </td>
        </tr>${notesRow}`;
    }).join("");

    container.innerHTML = `
      <div class="history-table-wrap">
        <table>
          <thead><tr><th>Date / Time</th><th>Characters</th><th>Scenario</th><th>Result</th><th>Difficulty</th><th>Time</th><th><span class="sr-only">Actions</span></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;

    restoreTableRoles(container);

    // One delegated listener handles all edit/delete clicks in the table
    // (assigned, not added, because this function runs on every re-render).
    container.onclick = e => {
      const editBtn = e.target.closest(".btn-edit-record");
      if (editBtn) { openEditModal(parseInt(editBtn.dataset.idx, 10)); return; }

      const deleteBtn = e.target.closest(".btn-delete-record");
      if (deleteBtn) {
        _deleteTrigger    = deleteBtn;
        _pendingDeleteIdx = parseInt(deleteBtn.dataset.idx, 10);
        _deleteCallback   = () => { displayHistory(); displayUnplayed(); displayStats(); if (currentCombination) { displayCombination(currentCombination); displayComboHistory(currentCombination); } };
        openDeleteModal();
      }
    };
  }

  // The phone layout turns table cells into blocks, which drops their native table
  // semantics; restate them so screen readers still announce rows and columns.
  function restoreTableRoles(root) {
    const roles = { TABLE: "table", THEAD: "rowgroup", TBODY: "rowgroup", TR: "row", TH: "columnheader", TD: "cell" };
    root.querySelectorAll("table, thead, tbody, tr, th, td").forEach(el => el.setAttribute("role", roles[el.tagName]));
  }

  function displayStats() {
    statsDirty = false;
    const el = document.getElementById("statsContent");
    if (!el) return;

    if (!records.length) {
      el.innerHTML = `<div class="empty-state"><p>No stats yet. Save a few games to see your win rate and playtimes.</p></div>`;
      return;
    }

    const total  = records.length;
    const wins   = records.filter(r => r.result === "Win").length;
    const winPct = Math.round(wins / total * 100);

    const totalPossible = characters.length * (characters.length - 1) * scenarios.length;
    // Only combos reachable with the currently enabled packs count towards completion,
    // matching the "N of M combinations played" line in Unplayed Combinations.
    const activeChars = new Set(characters), activeScenes = new Set(scenarios);
    const playedKeys  = new Set(records
      .filter(r => r.characters.every(c => activeChars.has(c)) && activeScenes.has(r.scenario))
      .map(r => comboKey(r)));
    const completedPct  = totalPossible > 0 ? Math.round(playedKeys.size / totalPossible * 100) : 0;

    // ── Summary row ──
    let html = `<div class="stats-summary">
      <div class="stats-summary-card">
        <div class="stats-summary-value">${total}</div>
        <div class="stats-summary-label">Games</div>
      </div>
      <div class="stats-summary-card">
        <div class="stats-summary-value">${winPct}%</div>
        <div class="stats-summary-label">Win Rate</div>
      </div>
      <div class="stats-summary-card">
        <div class="stats-summary-value">${completedPct}%</div>
        <div class="stats-summary-label">Combos Played</div>
      </div>
    </div>`;

    // ── Playtime ──
    const timed = records.filter(r => r.playtime != null && r.playtime > 0);
    if (timed.length) {
      const times    = timed.map(r => r.playtime);
      const avg      = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const longest  = Math.max(...times);
      const shortest = Math.min(...times);
      html += `<h3 class="section-heading">Playtime</h3>
      <div class="stats-playtime">
        <div class="stats-summary-card">
          <div class="stats-summary-value is-small">${formatTime(avg)}</div>
          <div class="stats-summary-label">Average</div>
        </div>
        <div class="stats-summary-card">
          <div class="stats-summary-value is-small">${formatTime(longest)}</div>
          <div class="stats-summary-label">Longest</div>
        </div>
        <div class="stats-summary-card">
          <div class="stats-summary-value is-small">${formatTime(shortest)}</div>
          <div class="stats-summary-label">Shortest</div>
        </div>
      </div>`;
    }

    // ── Droid coverage ──
    if (droids.length) {
      const droidRecs = records.filter(r => r.droid && playedKeys.has(comboKey(r)));
      const combosWithDroid = new Set(droidRecs.map(r => comboKey(r)));
      const totalPlayed = playedKeys.size;
      const coveragePct = totalPlayed > 0 ? Math.round(combosWithDroid.size / totalPlayed * 100) : 0;
      html += `<h3 class="section-heading">Droid Coverage</h3>
      <div class="stats-summary">
        <div class="stats-summary-card">
          <div class="stats-summary-value">${combosWithDroid.size}</div>
          <div class="stats-summary-label">Combos with Droid</div>
        </div>
        <div class="stats-summary-card">
          <div class="stats-summary-value">${totalPlayed > 0 ? coveragePct + "%" : "&#x2014;"}</div>
          <div class="stats-summary-label">of Played Combos</div>
        </div>
        <div class="stats-summary-card">
          <div class="stats-summary-value is-yellow">${droidRecs.length}</div>
          <div class="stats-summary-label">Droid Games</div>
        </div>
      </div>`;
    }

    el.innerHTML = html;
  }

  // ─── Content packs ──────────────────────────────────────────────────────────
  let enabledPacks;
  try {
    const raw = localStorage.getItem("enabledPacks");
    enabledPacks = raw ? new Set(JSON.parse(raw)) : new Set(["series1"]);
  } catch(e) {
    enabledPacks = new Set(["series1"]);
  }

  function saveEnabledPacks() {
    try { localStorage.setItem("enabledPacks", JSON.stringify([...enabledPacks])); } catch(e) {}
  }

  function buildActiveContent() {
    const active = CONTENT_PACKS.filter(p => enabledPacks.has(p.id));
    characters = [...new Set(active.flatMap(p => p.characters))];
    scenarios  = [...new Set(active.flatMap(p => p.scenarios))].sort(
      (a, b) => (parseInt(SCENARIO_NUMBER[a] || "99") - parseInt(SCENARIO_NUMBER[b] || "99"))
    );
    droids = [...new Set(active.flatMap(p => p.droids || []))];
    // Reset current droid if it's no longer available
    if (_currentDroid && !droids.includes(_currentDroid)) _currentDroid = null;
    // Update the label below the header so the user can always see what's active
    const label = document.getElementById("activePacksLabel");
    if (label) label.textContent = "Collection: " + active.map(p => p.shortName).join(" · ");
  }

  let _packsAtOpen = "";
  function openSettings() {
    _packsAtOpen = [...enabledPacks].sort().join();
    const list = document.getElementById("packList");
    list.innerHTML = "";
    CONTENT_PACKS.forEach(pack => {
      const item = document.createElement("label");
      item.className  = "pack-item";
      item.htmlFor    = "pack-" + pack.id;
      const cb = document.createElement("input");
      cb.type    = "checkbox";
      cb.id      = "pack-" + pack.id;
      cb.checked = enabledPacks.has(pack.id);
      cb.addEventListener("change", () => {
        if (cb.checked) {
          enabledPacks.add(pack.id);
        } else {
          enabledPacks.delete(pack.id);
        }
        // Require at least 2 characters and 1 scenario to play
        const testChars = CONTENT_PACKS.filter(p => enabledPacks.has(p.id)).flatMap(p => p.characters);
        const testScens = CONTENT_PACKS.filter(p => enabledPacks.has(p.id)).flatMap(p => p.scenarios);
        const warn = document.getElementById("settingsWarning");
        if (testChars.length < 2 || testScens.length === 0) {
          warn.textContent = "Keep at least one pack with characters and scenarios ticked (for example Series 1 or Series 2).";
          cb.checked = !cb.checked;
          if (cb.checked) enabledPacks.add(pack.id); else enabledPacks.delete(pack.id);
        } else {
          warn.textContent = "";
        }
      });
      const info = document.createElement("div");
      info.className = "pack-item-info";
      info.innerHTML = `<div class="pack-item-name">${esc(pack.name)}</div><div class="pack-item-desc">${esc(pack.desc)}</div>`;
      item.appendChild(cb);
      item.appendChild(info);
      list.appendChild(item);
    });
    document.getElementById("settingsWarning").textContent = "";
    // Focus the first interactive element inside the modal once it's visible.
    openModal("settingsModal", "pack-" + CONTENT_PACKS[0].id);
    setTimeout(() => {
      const first = document.querySelector("#settingsModal input, #settingsModal button");
      if (first) first.focus();
    }, 0);
  }

  function closeSettings() {
    // Re-derive active content from the new pack selection before closing.
    buildActiveContent();
    saveEnabledPacks();
    populateSelectors();
    if (currentCombination) {
      const valid =
        currentCombination.characters.every(c => characters.includes(c)) &&
        scenarios.includes(currentCombination.scenario);
      if (!valid) {
        currentCombination = null;
        stopTimer();
        showEmptyComboState();
        document.getElementById("annotationSection").classList.add("hidden");
        document.getElementById("comboHistory").innerHTML = "";
        toast("The loaded mission uses a pack you removed, so it was closed.", "error");
      } else {
        displayCombination(currentCombination);
        displayComboHistory(currentCombination);
      }
    }
    displayHistory();
    displayUnplayed();
    displayStats();
    closeModal("settingsModal");
    if (_packsAtOpen && _packsAtOpen !== [...enabledPacks].sort().join()) {
      announce(`Collection updated: ${characters.length} characters, ${scenarios.length} scenarios${droids.length ? `, ${droids.length} droids` : ""}.`);
    }
    _packsAtOpen = "";
  }

  // ─── Generic modal helpers ───────────────────────────────────────────────────
  // All modals share the same open/close pattern: add/remove the "open" class
  // and return focus to whichever element triggered the modal.
  // Modals that need extra teardown (clearing pending state, etc.) call these
  // helpers and then do their own cleanup — see closeDeleteModal, closeImportModal, etc.

  // Maps modal ID → the element that was focused when the modal opened,
  // so we can return focus there on close.
  const _modalTriggers = {};

  // While a dialog is open everything behind it is inert, so neither the keyboard
  // nor a screen reader's virtual cursor can wander into the page underneath.
  function syncInert() {
    const openOverlay = document.querySelector(".modal-overlay.open");
    const shell = document.querySelector(".app-shell");
    if (shell) shell.inert = !!openOverlay;
  }

  // A trigger re-rendered while its dialog was open (e.g. the Edit button of a table
  // row) is a new element; find its replacement so focus can still go back.
  function refindTrigger(el) {
    if (!el || el.isConnected) return el;
    if (el.id) return document.getElementById(el.id);
    if (el.dataset && el.dataset.idx != null && el.classList[0]) {
      return document.querySelector(`.${el.classList[0]}[data-idx="${el.dataset.idx}"]`);
    }
    return null;
  }

  function openModal(id, firstFocusId) {
    _modalTriggers[id] = document.activeElement;
    document.getElementById(id).classList.add("open");
    syncInert();
    if (firstFocusId) {
      // Move focus in straight away (the trigger is now inert), and again after
      // layout settles in case the dialog content was still being built.
      const el0 = document.getElementById(firstFocusId);
      if (el0) el0.focus();
      setTimeout(() => {
        const el = document.getElementById(firstFocusId);
        if (el && !el.closest(".modal-overlay.open")?.contains(document.activeElement)) el.focus();
      }, 50);
    }
  }

  function closeModal(id) {
    document.getElementById(id).classList.remove("open");
    syncInert();
    const trigger = refindTrigger(_modalTriggers[id]);
    delete _modalTriggers[id];
    if (trigger && !trigger.disabled && trigger.offsetParent !== null) trigger.focus();
  }

  // ─── Per-modal state ─────────────────────────────────────────────────────────
  // Some modals carry pending state that must be cleared when they close.
  let _deleteTrigger    = null; // element that opened the delete modal (for focus return via delegated handler)
  let _pendingDeleteIdx = null; // record index waiting to be confirmed for deletion
  let _deleteCallback   = null; // called after deletion to refresh whichever view triggered it
  let _editIdx          = null; // record index currently open in the edit modal

  function openDeleteModal() {
    const rec = records[_pendingDeleteIdx];
    document.getElementById("deleteRecordMsg").textContent = rec
      ? `Delete the record for ${rec.characters.join(" & ")} — ${scenarioText(rec.scenario)} (${rec.result}, ${rec.timestamp})?`
      : "Delete this mission record?";
    openModal("deleteRecordModal", "deleteRecordCancel");
  }

  function openEditModal(idx) {
    _editIdx = idx;
    const rec = records[idx];
    document.getElementById("editRecordSummary").textContent =
      `${rec.characters.join(" & ")} — ${scenarioText(rec.scenario)} · ${rec.timestamp}`;
    document.getElementById("editResult").value     = rec.result;
    document.getElementById("editDifficulty").value = rec.difficulty;
    document.getElementById("editNotes").value       = rec.notes || "";
    openModal("editRecordModal", "editResult");
  }

  function closeEditModal() {
    _editIdx = null;
    closeModal("editRecordModal");
  }

  function closeFaq() {
    closeModal("faqModal");
  }

  const RULEBOOK_TABS = [
    { packId: "series1",     label: "Series 1",  file: "rules/twinstars1.png" },
    { packId: "series1",     label: "SYZYGY I",  file: "rules/twinstars1-syzygy.png" },
    { packId: "series2",     label: "Series 2",  file: "rules/twinstars2.png" },
    { packId: "series2",     label: "SYZYGY II", file: "rules/twinstars2-syzygy.png" },
    { packId: "captaincrag", label: "Cpt. Crag", file: "rules/twinstars-crag.png" },
  ];

  function openRules() {
    const available = RULEBOOK_TABS.filter(t => enabledPacks.has(t.packId));
    if (!available.length) { toast("No rulebooks for your current packs."); return; }
    const tabsEl = document.getElementById("rulesTabs");
    tabsEl.innerHTML = "";
    tabsEl.setAttribute("role", "group");
    tabsEl.setAttribute("aria-label", "Choose a rulebook");
    available.forEach((tab, i) => {
      const btn = document.createElement("button");
      btn.className = "rules-tab" + (i === 0 ? " active" : "");
      btn.textContent = tab.label;
      btn.setAttribute("aria-pressed", String(i === 0));
      btn.addEventListener("click", () => {
        tabsEl.querySelectorAll(".rules-tab").forEach(t => { t.classList.remove("active"); t.setAttribute("aria-pressed", "false"); });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
        showRulebook(tab);
        document.querySelector(".rules-img-wrap").scrollTop = 0;
      });
      tabsEl.appendChild(btn);
    });
    showRulebook(available[0]);
    openModal("rulesModal", "rulesClose");
  }

  // Rulebook images are large (several MB); say so while they load, and if they fail.
  function showRulebook(tab) {
    const img    = document.getElementById("rulesImage");
    const status = document.getElementById("rulesStatus");
    img.alt = `${tab.label} rulebook`;
    status.textContent = `Loading the ${tab.label} rulebook…`;
    img.onload  = () => { status.textContent = ""; };
    img.onerror = () => { status.textContent = `Couldn't load the ${tab.label} rulebook. Check your connection and try again.`; };
    img.src = tab.file;
    if (img.complete && img.naturalWidth) status.textContent = "";
  }

  function closeRules() {
    closeModal("rulesModal");
  }

  function closeRestartModal() {
    closeModal("restartModal");
  }

  function closeConfirmModal() {
    closeModal("confirmModal");
  }

  function closeImportModal() {
    _pendingImport = null;
    closeModal("importConfirmModal");
  }

  function closeDeleteModal() {
    _pendingDeleteIdx = null;
    _deleteCallback   = null;
    // The delete button that triggered this modal was stored directly; return
    // focus to it rather than going through the _modalTriggers map.
    const trigger = _deleteTrigger;
    _deleteTrigger = null;
    delete _modalTriggers.deleteRecordModal;
    document.getElementById("deleteRecordModal").classList.remove("open");
    syncInert();
    if (trigger && trigger.isConnected) trigger.focus();
  }

  function openFaq(anchorId) {
    openModal("faqModal", "faqClose");
    track("faq_open", { anchor: /^[\w-]{1,60}$/.test(anchorId || "") ? anchorId : "" });
    if (anchorId) {
      const target = document.getElementById(anchorId);
      if (target) {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        setTimeout(() => {
          const container = document.querySelector(".faq-content");
          const stickyHeader = container.querySelector(".faq-section-header");
          // Offset by the sticky section header so the target isn't hidden under it.
          const clearance = (stickyHeader ? stickyHeader.offsetHeight : 0) + 8;
          const scrollTop = target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - clearance;
          container.scrollTo({ top: Math.max(0, scrollTop), behavior: reduced ? "auto" : "smooth" });
        }, 50);
      }
    }
  }

  // ─── Actions ────────────────────────────────────────────────────────────────
  function showEmptyComboState() {
    document.getElementById("combinationDisplay").innerHTML = `
      <div class="empty-state combo-empty">
        <p class="empty-state-title">No mission loaded</p>
        <p>Tap <strong>Randomize Combination</strong> for a random mission,
           or pick characters and a scenario under <strong>Manual Selection</strong> and tap <strong>Load Mission</strong>.</p>
      </div>`;
  }

  // True while a mission is loaded whose outcome hasn't been saved and that has
  // been going long enough (a minute) that losing it would hurt.
  function hasUnsavedGame() {
    return !!currentCombination && !document.getElementById("saveRecordBtn").disabled &&
      (timerInterval || timerPaused) && getCurrentElapsed() >= 60;
  }

  let _discardAction = null;
  // Runs fn now, or after the player confirms throwing away an unsaved game in progress.
  function guardUnsaved(fn) {
    if (!hasUnsavedGame()) { fn(); return; }
    _discardAction = fn;
    const c = currentCombination;
    document.getElementById("discardGameMsg").textContent =
      `${c.characters.join(" & ")} — ${scenarioText(c.scenario)} has been running for ${formatTime(getCurrentElapsed())} and isn't saved. Starting a new mission discards it.`;
    openModal("discardGameModal", "discardGameCancel");
  }

  function loadCombination(comb, opts) {
    currentCombination = comb;
    _currentDroid = null;
    startTimer();
    displayCombination(comb);
    displayComboHistory(comb);
    document.getElementById("annotationSection").classList.remove("hidden");
    document.getElementById("saveRecordBtn").disabled = false;
    document.getElementById("saveRecordBtn").textContent = "Save Record";
    document.getElementById("saveStatus").classList.add("hidden");
    announce(`Mission loaded: ${comb.characters[0]} and ${comb.characters[1]}, ${scenarioText(comb.scenario)}. Timer started.`);
    if (opts && opts.focusCard) document.getElementById("comboHeading").focus({ preventScroll: true });

    // Sync manual selectors — put locked character back in its original slot
    const c1 = document.getElementById("manualChar1");
    const c2 = document.getElementById("manualChar2");
    const sc = document.getElementById("manualScenario");
    let [a, b] = comb.characters;
    if      (locks.char1 && b === c1.value) { [a, b] = [b, a]; }
    else if (locks.char2 && a === c2.value) { [a, b] = [b, a]; }
    c1.value = a;
    syncDropdown("manualChar1", "manualChar2");
    c2.value = b;
    sc.value = comb.scenario;

    // Bring the new mission card into view — but not if it is already fully visible
    // (two-column desktop) or the user has started doing something else meanwhile:
    // moving the page under their pointer would make the next tap land elsewhere.
    let cancelled = false;
    const cancel = () => { cancelled = true; };
    document.addEventListener("pointerdown", cancel, { once: true, capture: true });
    document.addEventListener("keydown", cancel, { once: true, capture: true });
    setTimeout(() => {
      document.removeEventListener("pointerdown", cancel, { capture: true });
      document.removeEventListener("keydown", cancel, { capture: true });
      const el = document.getElementById("combinationDisplay");
      if (!el || cancelled) return;
      const r = el.getBoundingClientRect();
      if (r.top >= 0 && r.bottom <= window.innerHeight) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }, 80);
  }

  function handleGenerate() { guardUnsaved(doGenerate); }

  function doGenerate() {
    const c1El = document.getElementById("manualChar1");
    const c2El = document.getElementById("manualChar2");
    const scEl = document.getElementById("manualScenario");

    if (!locks.char1 && !locks.char2) {
      const shuffled = shuffle(characters);
      c1El.value = shuffled[0];
      syncDropdown("manualChar1", "manualChar2");
      c2El.value = shuffled[1];
    } else if (locks.char1 && !locks.char2) {
      const pool = characters.filter(c => c !== c1El.value);
      syncDropdown("manualChar1", "manualChar2");
      c2El.value = pool[Math.floor(Math.random() * pool.length)];
    } else if (!locks.char1 && locks.char2) {
      const pool = characters.filter(c => c !== c2El.value);
      c1El.value = pool[Math.floor(Math.random() * pool.length)];
      syncDropdown("manualChar1", "manualChar2");
    }

    if (!locks.scenario) {
      scEl.value = scenarios[Math.floor(Math.random() * scenarios.length)];
    }

    if (locks.char1 && locks.char2 && locks.scenario) {
      toast("All slots are locked — nothing to randomize.", "error");
      return;
    }
    if (locks.char1 && locks.char2) {
      toast("Characters locked — scenario re-rolled.");
    }
    loadCombination({ characters: [c1El.value, c2El.value], scenario: scEl.value });
    track("randomize", { locked: [locks.char1, locks.char2, locks.scenario].filter(Boolean).length });
  }

  function handleLoadManualCombo() {
    const char1    = document.getElementById("manualChar1").value;
    const char2    = document.getElementById("manualChar2").value;
    const scenario = document.getElementById("manualScenario").value;
    if (char1 === char2) { toast("Choose two different characters.", "error"); return; }
    guardUnsaved(() => { loadCombination({ characters: [char1, char2], scenario }); track("manual_pick"); });
  }

  function handleSaveRecord() {
    if (!currentCombination) return;
    const result     = document.getElementById("result").value;
    const difficulty = document.getElementById("difficulty").value;
    const playtime = getCurrentElapsed();
    const notesEl  = document.getElementById("recordNotes");
    const notes    = notesEl.value.trim().slice(0, 2000); // matches isValidRecord
    stopTimer();
    records.push({
      characters: currentCombination.characters,
      scenario:   currentCombination.scenario,
      result,
      difficulty,
      playtime,
      timestamp: new Date().toLocaleString(),
      ...(_currentDroid ? { droid: _currentDroid } : {}),
      ...(notes ? { notes } : {})
    });
    notesEl.value = "";
    try { localStorage.setItem("lastResult", result); localStorage.setItem("lastDifficulty", difficulty); } catch(e) {}
    saveRecords();
    const saveBtn = document.getElementById("saveRecordBtn");
    saveBtn.disabled = true;
    saveBtn.textContent = "Saved";
    displayCombination(currentCombination);
    displayComboHistory(currentCombination);
    // The Save button is now disabled, so give focus (and the next step) somewhere visible.
    const status = document.getElementById("saveStatus");
    const statusText = document.getElementById("saveStatusText");
    statusText.textContent = `✓ Saved to Mission Log: ${result}, ${difficulty}, ${formatTime(playtime)}.`;
    status.classList.remove("hidden");
    statusText.focus();
    toast("Record saved to Mission Log.");
    track("save_record", { result, difficulty });
  }

  function handleExport() {
    if (!records.length) { toast("No records to export.", "error"); return; }
    const now      = new Date();
    const date     = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const blob     = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
    const url      = URL.createObjectURL(blob);
    const a        = document.createElement("a");
    a.href         = url;
    a.download     = `twin_stars_records_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`Exported ${records.length} record${records.length !== 1 ? "s" : ""} to ${a.download}.`);
    track("export", { records: records.length });
  }

  let _pendingImport = null;

  document.getElementById("importBtn").addEventListener("click", () => document.getElementById("importFile").click());
  document.getElementById("importFile").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!Array.isArray(parsed)) { toast("Couldn't import: this file isn't a Mission Log backup.", "error"); return; }
        const valid   = parsed.filter(isValidRecord);
        const skipped = parsed.length - valid.length;
        if (valid.length === 0) { toast("Couldn't import: no valid records in this file.", "error"); return; }
        _pendingImport = { valid, skipped };
        const skipNote = skipped > 0 ? ` ${skipped} invalid record(s) will be skipped.` : "";
        const existing = records.length;
        document.getElementById("importConfirmMsg").textContent =
          `Found ${valid.length} valid record(s).${skipNote} Merge adds them to your ${existing} existing record(s). Replace overwrites them entirely.`;
        openModal("importConfirmModal", "importCancel");
      } catch (err) { toast("Couldn't import: the file couldn't be read.", "error"); }
    };
    reader.readAsText(file);
    this.value = "";
  });

  document.getElementById("importCancel").addEventListener("click", closeImportModal);

  document.getElementById("importReplace").addEventListener("click", () => {
    if (!_pendingImport) return;
    const { valid, skipped } = _pendingImport;
    closeImportModal();
    const before = records;
    records = valid;
    saveRecords();
    statsDirty = true;
    displayHistory();
    displayUnplayed();
    displayStats();
    if (currentCombination) { displayCombination(currentCombination); displayComboHistory(currentCombination); }
    const msg = skipped > 0
      ? `Replaced your records with ${valid.length} imported. ${skipped} invalid skipped.`
      : `Replaced your records with ${valid.length} imported.`;
    undoToast(msg, () => { records = before; refreshAfterRecordsChange(); toast("Import undone. Your previous records are back."); });
    track("import", { mode: "replace", imported: valid.length, skipped });
  });

  document.getElementById("importMerge").addEventListener("click", () => {
    if (!_pendingImport) return;
    const { valid, skipped } = _pendingImport;
    closeImportModal();
    const existingKeys = new Set(records.map(r => `${r.timestamp}|${r.characters.join("|")}|${r.scenario}`));
    const toAdd = valid.filter(r => !existingKeys.has(`${r.timestamp}|${r.characters.join("|")}|${r.scenario}`));
    const dupes = valid.length - toAdd.length;
    records = [...records, ...toAdd];
    saveRecords();
    statsDirty = true;
    displayHistory();
    displayUnplayed();
    displayStats();
    if (currentCombination) { displayCombination(currentCombination); displayComboHistory(currentCombination); }
    let msg = `Added ${toAdd.length} new record${toAdd.length !== 1 ? "s" : ""}.`;
    if (dupes   > 0) msg += ` ${dupes} already in your log.`;
    if (skipped > 0) msg += ` ${skipped} invalid skipped.`;
    toast(msg);
    track("import", { mode: "merge", imported: toAdd.length, duplicates: dupes, skipped });
  });

  document.getElementById("restartCancel").addEventListener("click", closeRestartModal);
  document.getElementById("restartConfirm").addEventListener("click", () => {
    closeRestartModal();
    startTimer();
  });

  // Re-render every view that depends on records[] (after undo, clear, import).
  function refreshAfterRecordsChange() {
    saveRecords();
    displayHistory();
    displayUnplayed();
    displayStats();
    if (currentCombination) { displayCombination(currentCombination); displayComboHistory(currentCombination); }
  }

  document.getElementById("clearDataBtn").addEventListener("click", () => {
    document.getElementById("confirmModalMsg").textContent =
      `This deletes all ${records.length} mission record${records.length !== 1 ? "s" : ""} in your log. Export a backup first if you might want them later.`;
    openModal("confirmModal", "modalCancel");
  });
  document.getElementById("modalCancel").addEventListener("click", closeConfirmModal);
  document.getElementById("modalConfirm").addEventListener("click", () => {
    const before = records;
    records = [];
    refreshAfterRecordsChange();
    closeConfirmModal();
    // Clear All is now disabled, so focus can't return to it.
    document.getElementById("missionLogHeading").focus();
    undoToast(`Cleared ${before.length} record${before.length !== 1 ? "s" : ""}.`, () => {
      records = before; refreshAfterRecordsChange(); toast("Records restored.");
    });
  });

  document.getElementById("szAbandonCancel").addEventListener("click", () => closeModal("szAbandonModal"));
  document.getElementById("szAbandonConfirm").addEventListener("click", () => { closeModal("szAbandonModal"); szAbandon(); });
  document.getElementById("szAbandonModal").addEventListener("click", e => { if (e.target === e.currentTarget) closeModal("szAbandonModal"); });

  document.getElementById("deleteRecordCancel").addEventListener("click", closeDeleteModal);
  document.getElementById("deleteRecordConfirm").addEventListener("click", () => {
    const idx = _pendingDeleteIdx;
    const cb  = _deleteCallback;
    const trigger = _deleteTrigger;
    const inLog   = !!(trigger && trigger.closest("#historyTableContainer"));
    // Remember where in the table the row was, so focus can land on its neighbour.
    let pos = -1;
    if (inLog) pos = [...document.querySelectorAll("#historyTableContainer .btn-delete-record")].indexOf(trigger);
    _deleteTrigger = null; // its row is about to disappear
    closeDeleteModal();
    if (idx == null) return;
    const [removed] = records.splice(idx, 1);
    saveRecords();
    if (cb) cb();
    const scope = inLog ? "#historyTableContainer" : "#comboHistory";
    const btns  = [...document.querySelectorAll(`${scope} .btn-delete-record`)];
    const next  = btns[Math.min(Math.max(pos, 0), btns.length - 1)];
    if (next) next.focus();
    else if (inLog) document.getElementById("missionLogHeading").focus();
    else if (document.getElementById("comboHeading")) document.getElementById("comboHeading").focus();
    undoToast("Record deleted.", () => {
      records.splice(Math.min(idx, records.length), 0, removed);
      saveRecords();
      displayHistory(); displayUnplayed(); displayStats();
      if (currentCombination) { displayCombination(currentCombination); displayComboHistory(currentCombination); }
      toast("Record restored.");
    });
  });

  document.getElementById("discardGameCancel").addEventListener("click", () => { _discardAction = null; closeModal("discardGameModal"); });
  document.getElementById("discardGameConfirm").addEventListener("click", () => {
    const fn = _discardAction;
    _discardAction = null;
    closeModal("discardGameModal");
    if (fn) fn();
  });
  document.getElementById("discardGameModal").addEventListener("click", e => { if (e.target === e.currentTarget) { _discardAction = null; closeModal("discardGameModal"); } });

  document.getElementById("editRecordCancel").addEventListener("click", closeEditModal);
  document.getElementById("editRecordSave").addEventListener("click", () => {
    if (_editIdx == null) return;
    const rec = records[_editIdx];
    rec.result     = document.getElementById("editResult").value;
    rec.difficulty = document.getElementById("editDifficulty").value;
    const notes    = document.getElementById("editNotes").value.trim().slice(0, 2000); // matches isValidRecord
    if (notes) rec.notes = notes; else delete rec.notes;
    saveRecords();
    statsDirty = true;
    const scrollY = window.scrollY;
    displayHistory();
    displayStats();
    window.scrollTo(0, scrollY);
    if (currentCombination) { displayCombination(currentCombination); displayComboHistory(currentCombination); }
    closeEditModal();
    toast("Record updated.");
  });

  function showTab(tab) {
    document.getElementById("randomizerPage")       .classList.toggle("hidden", tab !== "randomizer");
    document.getElementById("historyPage")          .classList.toggle("hidden", tab !== "history");
    document.getElementById("syzygyCampaignPage")   .classList.toggle("hidden", tab !== "syzygy");
    document.getElementById("randomizerTab")        .classList.toggle("active", tab === "randomizer");
    document.getElementById("historyTab")           .classList.toggle("active", tab === "history");
    document.getElementById("syzygyCampaignTab")    .classList.toggle("active", tab === "syzygy");
    document.getElementById("randomizerTab")        .setAttribute("aria-selected", String(tab === "randomizer"));
    document.getElementById("historyTab")           .setAttribute("aria-selected", String(tab === "history"));
    document.getElementById("syzygyCampaignTab")    .setAttribute("aria-selected", String(tab === "syzygy"));
    // Roving tabindex: only the selected tab is in the Tab order; arrows move between tabs.
    document.querySelectorAll(".tab-nav [role='tab']").forEach(t => {
      t.setAttribute("tabindex", t.getAttribute("aria-selected") === "true" ? "0" : "-1");
    });
    if (tab === "history") {
      if (statsDirty)    displayStats();
      if (historyDirty)  displayHistory();
      if (unplayedDirty) displayUnplayed();
    }
    if (tab === "syzygy") renderSz();
  }

  // ─── Onboarding tip: dismiss on outside click ───────────────────────────────
  document.addEventListener("click", e => {
    const tip = document.getElementById("onboardingTip");
    if (!tip || tip.classList.contains("hidden")) return;
    if (!tip.contains(e.target)) dismissTip();
  });

  // ─── Dice Roller ──────────────────────────────────────────────────────────────
  let _diceValues     = [1, 1];
  let _diceLocked     = [false, false];
  let _diceRolling    = false;
  let _diceMode       = "normal"; // "normal" | "skill"
  let _diceInterval   = null;
  let _savedDiceState = null;

  function _diceSetLock(i, locked) {
    _diceLocked[i] = locked;
    const die = document.getElementById(`die${i}`);
    die.classList.toggle("locked", locked);
    die.setAttribute("aria-pressed", String(locked));
    die.setAttribute("aria-label",
      `Die ${i + 1}, value ${_diceValues[i]}, ${locked ? "locked" : "unlocked"}`);
    document.getElementById("diceSwapBtn").disabled =
      _diceLocked[0] || _diceLocked[1];
  }

  function _diceUpdateFlipButtons() {
    const chars = (currentCombination && currentCombination.characters) || [];
    const hasHebolt = chars.some(c => c === "Hebolt Rom");
    [0, 1].forEach(i => {
      document.getElementById(`dieFlip${i}`).hidden = !hasHebolt;
    });
  }

  function _dicePopulateLabels() {
    const chars = (currentCombination && currentCombination.characters) || ["Character 1", "Character 2"];
    document.getElementById("dieLabel0").textContent = chars[0];
    document.getElementById("dieLabel1").textContent = chars[1];
  }

  function _diceApplyMode() {
    const isSkill = _diceMode === "skill";
    document.getElementById("diceModalTitle").textContent = isSkill ? "Skill Check" : "Dice Roller";
    document.getElementById("diceModalClose").setAttribute("aria-label", isSkill ? "Close Skill Check" : "Close Dice Roller");
    document.getElementById("normalDiceRow").classList.toggle("hidden", isSkill);
    document.getElementById("skillDoneRow").classList.toggle("hidden", !isSkill);
    document.getElementById("diceHint").hidden      = isSkill;
    document.getElementById("dieLabel0").hidden     = isSkill;
    document.getElementById("dieLabel1").hidden     = isSkill;
    document.getElementById("diceSwapBtn").classList.toggle("hidden", isSkill);
    document.getElementById("diceSwapBtn").disabled = _diceLocked[0] || _diceLocked[1];
    document.getElementById("diceModal").classList.toggle("dice-modal-skill", isSkill);
    [0, 1].forEach(i => {
      document.getElementById(`dieAdjRow${i}`).hidden = isSkill;
      if (isSkill) document.getElementById(`die${i}`).classList.remove("locked");
      document.getElementById(`die${i}`).setAttribute("aria-pressed", String(!isSkill && _diceLocked[i]));
    });
    if (!isSkill) _diceUpdateFlipButtons();
  }

  function _diceAdjust(i, delta) {
    if (_diceRolling) return;
    _diceValues[i] = (_diceValues[i] - 1 + delta + 6) % 6 + 1;
    const die = document.getElementById(`die${i}`);
    die.dataset.val = _diceValues[i];
    die.setAttribute("aria-label",
      `Die ${i + 1}, value ${_diceValues[i]}, ${_diceLocked[i] ? "locked" : "unlocked"}`);
    _diceSay(`Die ${i + 1}: ${_diceValues[i]}`);
  }

  function _diceSay(msg) {
    const live = document.getElementById("diceLive");
    if (!live) return;
    live.textContent = "";
    setTimeout(() => { live.textContent = msg; }, 30);
  }

  function _diceFlip(i) {
    if (_diceRolling) return;
    _diceValues[i] = 7 - _diceValues[i];
    const die = document.getElementById(`die${i}`);
    die.dataset.val = _diceValues[i];
    die.setAttribute("aria-label",
      `Die ${i + 1}, value ${_diceValues[i]}, ${_diceLocked[i] ? "locked" : "unlocked"}`);
    _diceSay(`Die ${i + 1} flipped to ${_diceValues[i]}`);
  }

  function rollDice(forceAll) {
    if (_diceRolling) return;
    const isSkill = _diceMode === "skill";
    const toRoll = forceAll
      ? [0, 1]
      : isSkill ? [0, 1] : [0, 1].filter(i => !_diceLocked[i]);
    if (toRoll.length === 0) return;
    _diceRolling = true;
    toRoll.forEach(i => document.getElementById(`die${i}`).classList.add("rolling"));
    const finalVals = toRoll.map(() => Math.ceil(Math.random() * 6));
    // Reduced motion: skip the flickering faces and show the result straight away.
    let frame = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 13 : 0;
    _diceInterval = setInterval(() => {
      toRoll.forEach(i => { document.getElementById(`die${i}`).dataset.val = Math.ceil(Math.random() * 6); });
      if (++frame >= 14) {
        clearInterval(_diceInterval);
        _diceInterval = null;
        toRoll.forEach((i, j) => {
          const die = document.getElementById(`die${i}`);
          die.classList.remove("rolling");
          die.dataset.val = finalVals[j];
          if (!isSkill) _diceValues[i] = finalVals[j];
          die.setAttribute("aria-label",
            `Die ${i + 1}, value ${finalVals[j]}, ${_diceLocked[i] ? "locked" : "unlocked"}`);
        });
        _diceRolling = false;
        const vals = [0, 1].map(i => toRoll.includes(i) ? finalVals[toRoll.indexOf(i)] : _diceValues[i]);
        _diceSay(`${isSkill ? "Skill check" : "Rolled"}: ${vals[0]} and ${vals[1]}${!isSkill && toRoll.length < 2 ? " (locked die kept)" : ""}`);
        if (!isSkill) track("dice_roll", { dice: toRoll.length });
      }
    }, 60);
  }

  function openDiceModal() {
    // Always reset to a clean normal-mode state when opening.
    if (_diceInterval) { clearInterval(_diceInterval); _diceInterval = null; _diceRolling = false; }
    _diceMode   = "normal";
    _diceLocked = [false, false];
    [0, 1].forEach(i => { const d = document.getElementById(`die${i}`); d.classList.remove("locked"); d.setAttribute("aria-pressed", "false"); });
    document.getElementById("diceModal").classList.remove("dice-modal-skill");
    _dicePopulateLabels();
    _diceApplyMode();
    openModal("diceModal", "rollBtn");
    rollDice(false);
  }

  function closeDiceModal() {
    // Stop any in-progress roll animation before closing.
    if (_diceInterval) { clearInterval(_diceInterval); _diceInterval = null; _diceRolling = false; }
    [0, 1].forEach(i => document.getElementById(`die${i}`).classList.remove("rolling"));
    document.getElementById("diceModal").classList.remove("dice-modal-skill");
    _diceMode = "normal";
    closeModal("diceModal");
  }

  function openTipsModal()  { openModal("tipsModal", "tipsModalClose"); }
  function closeTipsModal() { closeModal("tipsModal"); }

  // ─── Keyboard: Escape closes modals and tooltip, Tab traps focus ─────────────
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      const tip = document.getElementById("onboardingTip");
      if (tip && !tip.classList.contains("hidden")) { dismissTip(); return; }

      const popover = document.getElementById("volumePopover");
      if (popover && popover.classList.contains("open")) {
        popover.classList.remove("open");
        document.getElementById("volumeBtn").setAttribute("aria-expanded", "false");
        document.getElementById("volumeBtn").focus();
        return;
      }
    }

    const overlay = document.querySelector(".modal-overlay.open");
    if (!overlay) return;

    if (e.key === "Escape") {
      // Modals with extra teardown get their own close function; everything
      // else goes through the generic closeModal helper.
      const closers = {
        settingsModal:      closeSettings,
        faqModal:           closeFaq,
        rulesModal:         closeRules,
        restartModal:       closeRestartModal,
        confirmModal:       closeConfirmModal,
        importConfirmModal: closeImportModal,
        deleteRecordModal:  closeDeleteModal,
        editRecordModal:    closeEditModal,
        diceModal:          closeDiceModal,
        tipsModal:          closeTipsModal,
        discardGameModal:   () => { _discardAction = null; closeModal("discardGameModal"); },
      };
      (closers[overlay.id] || (() => closeModal(overlay.id)))();
      return;
    }

    if (e.key === "Tab") {
      const box = overlay.querySelector(".modal-box, .settings-box, .faq-box, .rules-box, .dice-box");
      if (!box) return;
      // Only elements that are actually rendered (hidden rows/buttons would otherwise
      // become the "last" stop and let Tab escape the dialog).
      const focusable = [...box.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, a[href], [tabindex]:not([tabindex="-1"])'
      )].filter(el => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden");
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (!box.contains(document.activeElement) || document.activeElement === first) {
          e.preventDefault(); last.focus();
        }
      } else {
        if (!box.contains(document.activeElement) || document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    }
  });

  // ─── Radio ──────────────────────────────────────────────────────────────────

  // Visual configuration for each radio state — drives setRadioState below.
  const RADIO_STATE_UI = {
    stopped: { cls: null,         text: "♫", label: "Play ambient radio",  showVol: false, showStatus: false, closePopover: true  },
    loading:  { cls: "is-loading", text: "…", label: "Connecting…",         showVol: false, showStatus: false, closePopover: false },
    playing:  { cls: "is-playing", text: "◼", label: "Stop ambient radio",  showVol: true,  showStatus: true,  closePopover: false },
    error:    { cls: "is-error",   text: "♫", label: "Stream unavailable",  showVol: false, showStatus: false, closePopover: true  },
  };

  function setRadioState(state) {
    if (_errorTimeout) { clearTimeout(_errorTimeout); _errorTimeout = null; }
    _radioState = state;
    const cfg     = RADIO_STATE_UI[state];
    const btn     = document.getElementById("radioBtn");
    const volBtn  = document.getElementById("volumeBtn");
    const label   = document.getElementById("radioStatusLabel");
    const popover = document.getElementById("volumePopover");

    btn.classList.remove("is-playing", "is-loading", "is-error");
    if (cfg.cls) btn.classList.add(cfg.cls);
    btn.textContent = cfg.text;
    btn.setAttribute("aria-label", cfg.label);
    volBtn.classList.toggle("visible", cfg.showVol);
    if (cfg.showVol) volBtn.setAttribute("aria-expanded", "false");
    label.hidden = !cfg.showStatus;
    if (cfg.closePopover) popover.classList.remove("open");
    if (state === "error") _errorTimeout = setTimeout(() => setRadioState("stopped"), 3000);
  }

  // Saved volume, tolerant of blocked storage and corrupted values.
  function getRadioVolume() {
    try {
      const v = parseFloat(localStorage.getItem("radioVolume"));
      if (v >= 0 && v <= 1) return v;
    } catch(e) {}
    return 0.3;
  }

  function startRadio() {
    if (!navigator.onLine) { toast("Ambient radio requires an internet connection."); return; }
    _radioIndex = 0;
    setRadioState("loading");
    const audio = document.getElementById("radioAudio");
    audio.volume = getRadioVolume();
    audio.src = RADIO_STREAMS[0];
    audio.play().catch(() => {});
    track("radio_play");
  }

  function stopRadio() {
    const audio = document.getElementById("radioAudio");
    audio.pause();
    audio.src = "";
    setRadioState("stopped");
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "none";
  }

  function tryNextStream() {
    _radioIndex++;
    if (_radioIndex >= RADIO_STREAMS.length) {
      setRadioState("error");
      toast("Stream unavailable — try again later.");
      return;
    }
    const audio = document.getElementById("radioAudio");
    audio.src = RADIO_STREAMS[_radioIndex];
    audio.play().catch(() => {});
  }

  // ─── SYZYGY Campaign ────────────────────────────────────────────────────────
  // Campaign model v2, following the two SYZYGY booklets (rules/twinstars1-syzygy.png and
  // rules/twinstars2-syzygy.png). szNewCampaign / szApply / szRank are pure (no DOM, no
  // storage) so tests can run every win/loss sequence through them.

  const SYZYGY1_RANKS = [
    { rank: "LEGENDS",   desc: "You pay off the Grosksh, and word of your adventures spreads across the galaxy. There's even a song about you." },
    { rank: "FREE",      desc: "Thanks to some skill and a lot of luck, your debt is paid off. Where will your next adventure take you?" },
    { rank: "ALIVE",     desc: "The Grosksh are proud of their ruthless reputation, but they aren't about to waste a perfectly good servant." },
    { rank: "GROSKSH'D", desc: "Your time is up. You have failed the mission." }
  ];
  const SYZYGY2_RANKS = [
    { rank: "LOADED",               desc: "The only thing that slowed you down at all was the extra loot you brought home." },
    { rank: "SAFE",                 desc: "Home safely, with one nifty new scar to talk about over a round of drinks." },
    { rank: "BACK TO SQUARE ONE",   desc: "Well, you're home. Broken, and broke, but home." },
    { rank: "LOST IN THE UNIVERSE", desc: "Way off point: you must accept your fate of being lost in the universe." }
  ];
  // SYZYGY I: the six cards are dealt 1-2-2-1 into sections A, B, C, D (indexes into cards[]).
  const SZ1_SECTIONS = [[0], [1, 2], [3, 4], [5]];
  const SZ1_LABELS   = ["A", "B", "C", "D"];
  // SYZYGY II "Waypoint": six cards in a right-aligned pyramid  S / a b / x y z.
  // Black arrows (win) and red arrows (loss) from the booklet's diagram.
  const SZ2 = { S: { W: "b", L: "a" }, a: { W: "b", L: "x" }, b: { W: "z", L: "y" },
                x: { W: "y", L: "LOST" }, y: { W: "z", L: "LOST" }, z: { W: "HOME", L: "LOST" } };
  const SZ2_NODES = ["S", "a", "b", "x", "y", "z"];   // cards[i] sits at node SZ2_NODES[i]
  const SZ_MODE_LABEL = { syzygy1: "SYZYGY Mode I", syzygy2: "SYZYGY Mode II: Waypoint" };

  let _sz       = null;     // active v2 campaign
  let _szLegacy = null;     // a v1 campaign found in storage (finished: shown; unfinished: migration prompt)
  let _szKept   = null;     // an unfinished v1 campaign the player chose to keep read-only
  let _szMode   = null;     // setup: "syzygy1" | "syzygy2"
  let _szSet    = null;     // setup (Mode II): which Adventure Series' six scenarios to use
  let _szChars  = [];       // setup: selected character names
  let _szLossPending = false; // the "who hit 0 health?" question is showing

  const szZero = () => [0, 1, 2].map(() => ({ health: 0, energy: 0 }));

  function szNewCampaign(mode, chars, cards, set) {
    return {
      v: 2, mode, set: set || (mode === "syzygy1" ? "series1" : "series2"),
      characters: [...chars], eliminated: [false, false, false], cards: [...cards],
      node: mode === "syzygy1" ? 0 : "S", card: 0,
      wins: 0, losses: 0, retry: false,
      playing: null, alloc: szZero(), carry: szZero(),
      results: [], started: new Date().toLocaleString(), completed: false, rank: null
    };
  }

  const szAlive   = c => [0, 1, 2].filter(i => !c.eliminated[i]);
  const szPool    = c => c.retry ? 3 : 5;
  const szPlaying = c => Array.isArray(c.playing) ? c.playing : [];
  const szNodeLabel = c => c.mode === "syzygy1" ? SZ1_LABELS[c.node] : c.node;

  function szRank(c) {
    if (c.mode === "syzygy1") {
      if (c.wins >= 4) return SYZYGY1_RANKS[c.losses === 0 ? 0 : 1];
      return SYZYGY1_RANKS[c.wins >= 3 ? 2 : 3];
    }
    return c.node === "HOME" ? SYZYGY2_RANKS[Math.min(c.losses, 2)] : SYZYGY2_RANKS[3];
  }

  // Apply one result to a campaign and return the new campaign (the input is not changed).
  // elim: indexes of playing characters whose 0 health caused a loss (they leave the campaign).
  function szApply(c0, result, elim) {
    const c = JSON.parse(JSON.stringify(c0));
    const win = result === "Win";
    const playing = szPlaying(c).length === 2 ? szPlaying(c) : szAlive(c).slice(0, 2);
    const out = win ? [] : [...new Set(elim || [])].filter(i => playing.includes(i) && !c.eliminated[i]);
    c.results.push({ node: szNodeLabel(c), scenario: c.cards[c.card], chars: playing, result: win ? "Win" : "Loss",
                     eliminated: out, retry: c.retry, ts: new Date().toLocaleString() });
    out.forEach(i => { c.eliminated[i] = true; c.carry[i] = { health: 0, energy: 0 }; });
    c.alloc = szZero();
    if (win) c.wins++; else c.losses++;
    const alive = szAlive(c);

    if (c.mode === "syzygy1") {
      if (win) {
        c.retry = false;
        c.node++;
        if (c.node >= SZ1_SECTIONS.length) c.completed = true;
        else c.card = SZ1_SECTIONS[c.node].length === 1 ? SZ1_SECTIONS[c.node][0] : null; // B, C: player picks a card
      } else if (c.losses >= 2 || alive.length < 2) {
        c.completed = true;          // a second loss ends the game (or too few characters are left to play)
      } else {
        c.retry = true;              // retry the section with 3 resources; in B or C the other card may be chosen
      }
    } else {
      const next = SZ2[c.node][win ? "W" : "L"];
      if (next === "HOME" || next === "LOST" || alive.length < 2) {
        c.node = next === "HOME" ? "HOME" : "LOST";   // a bottom-row loss or losing 2 characters: lost
        c.completed = true;
      } else {
        c.node = next;
        c.card = SZ2_NODES.indexOf(next);
      }
    }
    if (c.completed) { c.retry = false; c.rank = szRank(c); }
    c.playing = alive.length === 2 ? alive : null;   // the player chooses again who plays next
    return c;
  }

  // Only v2 campaigns are accepted; anything else is either a v1 campaign (see isLegacySz) or reset.
  function isValidSz(c) {
    const isInt = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
    const isCounts = a => Array.isArray(a) && a.length === 3 && a.every(x => x && isInt(x.energy, 0, 99) && isInt(x.health, 0, 99));
    if (!c || typeof c !== "object" || c.v !== 2) return false;
    if (c.mode !== "syzygy1" && c.mode !== "syzygy2") return false;
    if (!Array.isArray(c.characters) || c.characters.length !== 3 || !c.characters.every(s => typeof s === "string")) return false;
    if (!Array.isArray(c.eliminated) || c.eliminated.length !== 3 || !c.eliminated.every(b => typeof b === "boolean")) return false;
    if (!Array.isArray(c.cards) || c.cards.length !== 6 || !c.cards.every(s => typeof s === "string")) return false;
    if (!isInt(c.wins, 0, 4) || !isInt(c.losses, 0, 3) || typeof c.retry !== "boolean" || typeof c.completed !== "boolean") return false;
    if (!isCounts(c.alloc) || !isCounts(c.carry) || !Array.isArray(c.results)) return false;
    if (c.playing !== null && !(Array.isArray(c.playing) && c.playing.length === 2 && c.playing[0] !== c.playing[1] &&
        c.playing.every(i => isInt(i, 0, 2) && !c.eliminated[i]))) return false;
    if (c.mode === "syzygy1") {
      if (!isInt(c.node, 0, c.completed ? 4 : 3)) return false;
      if (!c.completed && !(c.card === null ? SZ1_SECTIONS[c.node].length === 2 : SZ1_SECTIONS[c.node].includes(c.card))) return false;
    } else {
      if (c.completed ? !(c.node === "HOME" || c.node === "LOST") : SZ2_NODES.indexOf(c.node) !== c.card) return false;
    }
    return true;
  }

  // The pre-rulebook (v1) campaign shape. Never converted: shown read-only or abandoned.
  function isLegacySz(c) {
    const isCounts = a => Array.isArray(a) && a.length === 3 && a.every(x => x && Number.isFinite(x.energy) && Number.isFinite(x.health));
    return !!c && typeof c === "object" && c.v === undefined &&
      (c.mode === "syzygy1" || c.mode === "syzygy2") &&
      Array.isArray(c.characters) && c.characters.length === 3 &&
      Array.isArray(c.removed) && c.removed.length === 3 &&
      isCounts(c.carryover) &&
      Array.isArray(c.scenarios) && c.scenarios.length >= 3 &&
      Array.isArray(c.stageResults) && c.stageResults.every(r => r && typeof r.scenario === "string" && Array.isArray(r.chars)) &&
      Number.isInteger(c.stage) && Number.isInteger(c.losses);
  }

  function loadSzCampaign(initial) {
    _sz = null; _szLegacy = null; _szKept = null;
    try {
      const raw = localStorage.getItem("syzygyCampaign");
      const obj = raw ? JSON.parse(raw) : null;
      if (isValidSz(obj))       _sz = obj;
      else if (isLegacySz(obj)) _szLegacy = obj;
      else if (obj && initial)  setTimeout(() => toast("A saved SYZYGY campaign could not be read and was reset.", "error"), 500);
    } catch(e) {}
    try {
      const kept = JSON.parse(localStorage.getItem("syzygyCampaignV1"));
      if (isLegacySz(kept)) _szKept = kept;
    } catch(e) {}
  }
  loadSzCampaign(true);

  function saveSz() {
    try {
      const obj = _sz || _szLegacy;
      if (obj) localStorage.setItem("syzygyCampaign", JSON.stringify(obj));
      else     localStorage.removeItem("syzygyCampaign");
      if (_szKept) localStorage.setItem("syzygyCampaignV1", JSON.stringify(_szKept));
      else         localStorage.removeItem("syzygyCampaignV1");
    } catch(e) {}
  }

  function szStart(mode, chars, set) {
    const useSet = mode === "syzygy1" ? "series1" : (set || "series2");
    const cards = shuffle([...CONTENT_PACKS.find(p => p.id === useSet).scenarios]);
    _sz = szNewCampaign(mode, chars, cards, useSet);
    _szLossPending = false;
    saveSz();
    track("sz_start", { mode });
    renderSz("szStageHeading");
    announce("Campaign started. Choose the two characters who play the first scenario.");
  }

  function szRecordOutcome(result, elim) {
    const before = JSON.stringify(_sz);
    _sz = szApply(_sz, result, elim);
    _szLossPending = false;
    const c = _sz;
    saveSz();
    renderSz("szStageHeading");
    if (c.completed) track("sz_complete", { mode: c.mode, rank: c.rank.rank });
    const word = result === "Win" ? "Victory" : "Defeat";
    const gone = (c.results[c.results.length - 1].eliminated || []).map(i => c.characters[i]);
    const msg = [`${word} recorded.`,
      gone.length ? `${gone.join(" and ")} ${gone.length > 1 ? "are" : "is"} out of the campaign.` : "",
      c.completed ? `Campaign complete: ${c.rank.rank}.` : (c.retry ? "Retry with 3 resources." : "")].filter(Boolean).join(" ");
    undoToast(msg, () => {
      _sz = JSON.parse(before);
      saveSz();
      renderSz("szStageHeading");
      toast(`${word} undone.`);
    });
  }

  function szAbandon() {
    const before = JSON.stringify(_sz);
    _sz = null; _szLossPending = false;
    saveSz();
    renderSz();
    const h = document.querySelector("#syzygyCampaignContent .panel-title");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
    undoToast("Campaign abandoned.", () => { _sz = JSON.parse(before); saveSz(); renderSz("szStageHeading"); toast("Campaign restored."); });
  }

  // ─── SYZYGY Render ──────────────────────────────────────────────────────────

  // The SYZYGY screens re-render with innerHTML on every change. Remember which control
  // had focus (by a stable key) and put focus back on its replacement afterwards, so
  // keyboard and screen-reader users aren't thrown back to the top of the page.
  // focusTarget: optional element id to focus instead (e.g. a heading after a stage ends).
  function szFocusKey(el) {
    if (!el || !el.closest || !el.closest("#syzygyCampaignContent")) return null;
    if (el.id) return "#" + el.id;
    for (const attr of ["data-char", "data-player", "data-ai", "data-ci"]) {
      if (el.hasAttribute(attr)) {
        const extra = attr === "data-ai" ? `[data-t="${el.dataset.t}"][data-d="${el.dataset.d}"]`
                    : attr === "data-ci" ? `[data-ct="${el.dataset.ct}"][data-cd="${el.dataset.cd}"]` : "";
        return `[${attr}="${CSS.escape(el.getAttribute(attr))}"]${extra}`;
      }
    }
    return null;
  }

  function renderSz(focusTarget) {
    const el = document.getElementById("syzygyCampaignContent");
    if (!el) return;
    const key = focusTarget ? "#" + focusTarget : szFocusKey(document.activeElement);
    if (_szLegacy && !_sz)  szRenderLegacy(el);
    else if (!_sz)          szRenderSetup(el);
    else if (_sz.completed) szRenderComplete(el);
    else                    szRenderActive(el);
    if (!key) return;
    let target = el.querySelector(key);
    // A stepper that just hit its limit is disabled; fall back to its partner.
    if (target && target.disabled && target.dataset.d)  target = el.querySelector(key.replace(/data-d="-?1"/, `data-d="${-target.dataset.d}"`));
    if (target && target.disabled && target.dataset.cd) target = el.querySelector(key.replace(/data-cd="-?1"/, `data-cd="${-target.dataset.cd}"`));
    if (target && !target.disabled) target.focus({ preventScroll: !focusTarget });
  }

  const szShort = name => String(name).replace(/!$/, "");

  // The campaign map: Mode I as its four sections, Mode II as the Waypoint pyramid.
  // Every node says its state in text (and a ✓/✗ mark), not by colour alone.
  function szMapHTML(c) {
    const node = (cls, mark, title, name, state) =>
      `<li class="sz-node ${cls}">${mark ? `<span class="sz-node-mark" aria-hidden="true">${mark}</span>` : ""}` +
      `<span class="sz-node-title">${esc(title)}</span>` +
      (name ? `<span class="sz-node-name">${esc(szShort(name))}</span>` : "") +
      `<span class="sz-node-state">${esc(state)}</span></li>`;
    const played = k => c.results.filter(r => r.scenario === c.cards[k]);
    const history = rs => rs.map(r => r.result === "Win" ? "Won" : "Lost").join(", then ");
    const marks   = rs => rs.map(r => r.result === "Win" ? "✓" : "✗").join("");

    if (c.mode === "syzygy1") {
      let html = `<ol class="sz-map sz-map-1" aria-label="Campaign map: sections A to D">`;
      SZ1_SECTIONS.forEach((cardsIn, s) => {
        html += `<li class="sz-map-row"><span class="sz-map-sec" aria-hidden="true">${SZ1_LABELS[s]}</span><ul class="sz-map-cards" aria-label="Section ${SZ1_LABELS[s]}">`;
        cardsIn.forEach(k => {
          const rs = played(k);
          const last = rs[rs.length - 1];
          const live = !c.completed && s === c.node;
          let cls = "", state;
          if (live && c.card === k)                      { cls = "is-current"; state = rs.length ? `${history(rs)} · retry now` : "Playing now"; }
          else if (live && c.card === null)              { cls = "is-next"; state = "Choose this or the other card"; }
          else if (live && c.retry && cardsIn.length > 1) { cls = "is-next"; state = "Can switch to this card"; }
          else if (last)                                 { cls = last.result === "Win" ? "is-win" : "is-loss"; state = history(rs); }
          else if (!c.completed && s === c.node + 1 && c.card !== null) { cls = "is-next"; state = cardsIn.length > 1 ? "Next if you win (choose one)" : "Next if you win"; }
          else if (s < c.node || c.completed)           { cls = "is-skipped"; state = "Not played"; }
          else                                           { state = "Ahead"; }
          html += node(cls, marks(rs), `${SZ1_LABELS[s]}${cardsIn.length > 1 ? (k === cardsIn[0] ? " left" : " right") : ""}`, c.cards[k], state);
        });
        html += `</ul></li>`;
      });
      return html + `</ol>`;
    }

    const visited = new Set(c.results.map(r => r.node));
    const nextW = !c.completed ? SZ2[c.node].W : null;
    const nextL = !c.completed ? SZ2[c.node].L : null;
    let html = `<ol class="sz-map sz-map-2" aria-label="Campaign map: Waypoint pyramid">`;
    SZ2_NODES.forEach((n, k) => {
      const rs = played(k);
      const last = rs[rs.length - 1];
      let cls = "", state;
      if (!c.completed && c.node === n) { cls = "is-current"; state = "Playing now"; }
      else if (last)                    { cls = last.result === "Win" ? "is-win" : "is-loss"; state = history(rs); }
      else if (n === nextW)             { cls = "is-next"; state = "Next if you win"; }
      else if (n === nextL)             { cls = "is-next is-next-loss"; state = "Next if you lose"; }
      else                              { state = visited.size && (c.completed || !szReachable(c.node).has(n)) ? "Off your path" : "Ahead"; }
      html += node(`sz-pos-${n} ${cls}`, marks(rs), n === "S" ? "Start" : `Waypoint ${n}`, c.cards[k], state);
    });
    // The three exits under the bottom row: x and y lose to the LOST under them, z loses to the middle one.
    const lostCol = c.node === "x" ? 1 : 2;
    [["LOST", 1], ["LOST", 2], ["HOME", 3]].forEach(([end, col]) => {
      let cls = "", state = end === "HOME" ? "3 wins" : "Bottom-row loss";
      if (c.completed && c.node === end && (end === "HOME" || col === szLostCol(c))) { cls = end === "HOME" ? "is-win" : "is-loss"; state = end === "HOME" ? "You made it" : "You ended here"; }
      else if (!c.completed && end === "HOME" && nextW === "HOME")              { cls = "is-next"; state = "Next if you win"; }
      else if (!c.completed && end === "LOST" && nextL === "LOST" && col === lostCol) { cls = "is-next is-next-loss"; state = "Next if you lose"; }
      html += node(`sz-end sz-end-${col} ${cls}`, cls === "is-win" ? "✓" : cls === "is-loss" ? "✗" : "", end, "", state);
    });
    return html + `</ol>`;
  }

  function szReachable(from) {
    const seen = new Set(), stack = [from];
    while (stack.length) { const n = stack.pop(); if (!SZ2[n] || seen.has(n)) continue; seen.add(n); stack.push(SZ2[n].W, SZ2[n].L); }
    return seen;
  }
  // Which LOST exit a finished Mode II campaign took (2 = middle, the default for z and for losing 2 characters).
  function szLostCol(c) {
    const last = c.results[c.results.length - 1];
    return last && last.node === "x" && last.result === "Loss" ? 1 : 2;
  }

  function szRenderSetup(el) {
    const hasSeries1 = enabledPacks.has("series1");
    const hasSeries2 = enabledPacks.has("series2");
    const canMode2   = hasSeries1 || hasSeries2;
    if (_szMode === "syzygy1" && !hasSeries1) _szMode = null;
    if (_szMode === "syzygy2" && !canMode2)   _szMode = null;
    if (!_szSet || !enabledPacks.has(_szSet)) _szSet = hasSeries2 ? "series2" : "series1";
    const allChars = characters;

    const modeCard = (id, mode, title, desc, req, ok) => `
        <div class="syzygy-mode-card${!ok ? " disabled" : ""}${_szMode === mode ? " selected" : ""}" id="${id}" role="button" aria-pressed="${_szMode === mode}" aria-disabled="${!ok}" tabindex="${ok ? "0" : "-1"}">
          <div class="syzygy-mode-card-title">${title}</div>
          <div class="syzygy-mode-card-desc">${desc}</div>
          <div class="sz-mode-req">Requires the SYZYGY booklet<br>${req}</div>
          ${_szMode === mode ? `<span class="syzygy-mode-card-check" aria-hidden="true">✓ Selected</span>` : ""}
        </div>`;
    const modeHTML = `
      <div class="syzygy-mode-cards">
        ${modeCard("szSel1", "syzygy1", "SYZYGY I", "Pay off your debt to the Grosksh. Four scenarios: A, then one card in B, one in C, then D. Lose once and you retry with 3 resources; lose twice and it's over.",
          hasSeries1 ? "Uses the 6 Series 1 scenarios" : "<em>Needs Series 1 (turn it on in My Collection)</em>", hasSeries1)}
        ${modeCard("szSel2", "syzygy2", "SYZYGY II: Waypoint", "Stranded across the universe. Six scenarios in a pyramid: win 3 to get home, a loss sends you down the red arrows. No retries.",
          canMode2 ? "Uses the 6 scenarios of one Adventure Series" : "<em>Needs an Adventure Series (turn on Series 1 or 2 in My Collection)</em>", canMode2)}
      </div>`;

    let setHTML = "";
    if (_szMode === "syzygy2" && hasSeries1 && hasSeries2) {
      setHTML = `
        <h3 class="section-heading" id="szSetHeading">Scenario Cards</h3>
        <div class="sz-set-choice" role="group" aria-labelledby="szSetHeading">
          <button type="button" class="syzygy-char-btn${_szSet === "series2" ? " sel-1" : ""}" id="szSetS2" aria-pressed="${_szSet === "series2"}">Series 2 (as in the booklet)</button>
          <button type="button" class="syzygy-char-btn${_szSet === "series1" ? " sel-1" : ""}" id="szSetS1" aria-pressed="${_szSet === "series1"}">Series 1</button>
        </div>`;
    }

    let charHTML = "";
    if (_szMode) {
      const selClasses = ["", "sel-1", "sel-2", "sel-3"];
      charHTML = `
        ${setHTML}
        <h3 class="section-heading" id="szCharHeading">Choose 3 Characters</h3>
        <p class="sz-hint">All three start at half health, rounded up. Before each scenario you choose which two play; the third sits out and heals to full.</p>
        <div class="syzygy-char-grid">
          ${allChars.map(c => {
            const si = _szChars.indexOf(c);
            const cls = si >= 0 ? " " + selClasses[si + 1] : "";
            const num = si >= 0 ? `<span class="sz-sel-num"><span class="sr-only">, pick </span>${si + 1}</span>` : "";
            return `<button class="syzygy-char-btn${cls}" data-char="${esc(c)}" aria-pressed="${si >= 0}">${esc(c)}${num}</button>`;
          }).join("")}
        </div>
        <p class="sz-hint">${_szChars.length} of 3 selected</p>`;
    }

    const canStart = _szMode && _szChars.length === 3;
    const startHint = !_szMode ? "Choose a mode to continue." : (_szChars.length < 3 ? `Choose ${3 - _szChars.length} more character${3 - _szChars.length !== 1 ? "s" : ""} to begin.` : "");
    el.innerHTML = `
      <div class="panel">
        <h2 class="panel-title">SYZYGY Mode</h2>
        <p class="panel-intro">A solo campaign from the SYZYGY booklets. Guide three characters through linked scenarios; left-over health and energy carry over from one to the next.</p>
        ${modeHTML}
        ${charHTML}
        ${startHint ? `<p class="sz-hint" id="szStartHint">${startHint}</p>` : ""}
        <button class="btn btn-primary" id="szStartBtn"${canStart ? "" : " disabled"}${startHint ? ` aria-describedby="szStartHint"` : ""}>Begin Campaign</button>
      </div>
      ${_szKept ? szLegacyPanelHTML(_szKept, true) : ""}`;

    const sel1 = document.getElementById("szSel1");
    const sel2 = document.getElementById("szSel2");
    function pickMode(m) {
      const changed = _szMode !== m;
      _szMode = m; _szChars = [];
      renderSz();
      if (changed) announce(`${m === "syzygy1" ? "SYZYGY I" : "SYZYGY II"} selected. Now choose 3 characters.`);
    }
    if (sel1 && hasSeries1) { sel1.addEventListener("click", () => pickMode("syzygy1")); sel1.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); sel1.click(); } }); }
    if (sel2 && canMode2)   { sel2.addEventListener("click", () => pickMode("syzygy2")); sel2.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); sel2.click(); } }); }
    [["szSetS1", "series1"], ["szSetS2", "series2"]].forEach(([id, set]) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener("click", () => { _szSet = set; renderSz(); announce(`${set === "series1" ? "Series 1" : "Series 2"} scenario cards.`); });
    });

    el.querySelectorAll(".syzygy-char-btn[data-char]").forEach(btn => {
      btn.addEventListener("click", () => {
        const ch  = btn.dataset.char;
        const idx = _szChars.indexOf(ch);
        if (idx >= 0) { _szChars.splice(idx, 1); }
        else if (_szChars.length < 3) { _szChars.push(ch); }
        else { toast("You already have 3 characters. Tap one of them to remove it first.", "error"); return; }
        renderSz();
        announce(idx >= 0 ? `${ch} removed. ${_szChars.length} of 3 selected.` : `${ch} added. ${_szChars.length} of 3 selected.`);
      });
    });

    const startBtn = document.getElementById("szStartBtn");
    if (startBtn && canStart) startBtn.addEventListener("click", () => { szStart(_szMode, [..._szChars], _szSet); });
    szBindLegacyKept();
  }

  function szRosterHTML(c) {
    const playing = szPlaying(c);
    let html = `<div class="panel"><h3 class="panel-title">Roster</h3><div class="syzygy-roster">`;
    c.characters.forEach((name, i) => {
      const out = c.eliminated[i];
      const isPlaying = playing.includes(i);
      const cardClass = out ? "removed" : (isPlaying ? "playing" : (playing.length === 2 ? "benched" : ""));
      const roleClass = out ? "role-removed" : (isPlaying ? "role-playing" : "role-benched");
      const roleText  = c.completed ? (out ? "Eliminated" : "Made it through")
                      : out ? "Eliminated" : isPlaying ? "Playing" : playing.length === 2 ? "Sitting out · heals to full" : "Waiting to be chosen";
      const co = c.carry[i];
      const coText = !out && (co.energy > 0 || co.health > 0) ? `Carrying ${co.health} health, ${co.energy} energy` : "";
      html += `<div class="syzygy-char-card ${cardClass}"><div class="syzygy-char-name">${esc(name)}</div><div class="syzygy-char-role ${roleClass}">${esc(roleText)}</div>${coText ? `<div class="syzygy-char-carryover">${esc(coText)}</div>` : ""}</div>`;
    });
    return html + `</div></div>`;
  }

  // Where the campaign goes from here, in words, for the current scenario.
  function szNextText(c) {
    if (c.mode === "syzygy1") {
      const win = c.node === 3 ? "you complete the campaign" : `you go on to section ${SZ1_LABELS[c.node + 1]}`;
      const loss = c.losses ? "the campaign ends (second loss)" : `you retry with 3 resources${SZ1_SECTIONS[c.node].length > 1 ? " and may switch to the other card" : ""}`;
      return `If you win, ${win}. If you lose, ${loss}.`;
    }
    const name = n => n === "HOME" ? "you reach HOME" : n === "LOST" ? "you are LOST IN THE UNIVERSE" : `you go to waypoint ${n}: ${szShort(c.cards[SZ2_NODES.indexOf(n)])}`;
    return `If you win, ${name(SZ2[c.node].W)}. If you lose, ${name(SZ2[c.node].L)}.`;
  }

  function szRenderActive(el) {
    const c = _sz;
    const pool    = szPool(c);
    const alive   = szAlive(c);
    if (szPlaying(c).length !== 2 && alive.length === 2) c.playing = alive;
    const playing = szPlaying(c);
    const ready   = playing.length === 2;
    const totalAlloced = playing.reduce((s, i) => s + c.alloc[i].energy + c.alloc[i].health, 0);
    const remaining    = pool - totalAlloced;

    let html = `
      <div class="syzygy-campaign-header">
        <div>
          <h2 class="syzygy-campaign-title">${SZ_MODE_LABEL[c.mode]}</h2>
          <div class="syzygy-campaign-meta">Started ${esc(c.started)} · ${c.wins} win${c.wins !== 1 ? "s" : ""} · ${c.losses} loss${c.losses !== 1 ? "es" : ""}</div>
        </div>
        <button class="btn btn-danger btn-sm btn-compact" id="szAbandonBtn">Abandon Campaign</button>
      </div>`;

    html += `<div class="sz-layout"><div class="sz-layout-status">`;
    html += `<div class="panel"><h3 class="panel-title">Campaign Map</h3>${szMapHTML(c)}</div>`;
    html += szRosterHTML(c);
    html += `</div><div class="sz-layout-stage">`;

    if (c.mode === "syzygy1" && c.card === null) {
      const [l, r] = SZ1_SECTIONS[c.node];
      const sec = SZ1_LABELS[c.node];
      html += `
        <div class="panel">
          <h3 class="panel-title syzygy-heading-focus" id="szStageHeading" tabindex="-1">Section ${sec}: Choose a Card</h3>
          <p class="panel-intro">Section ${SZ1_LABELS[c.node - 1]} won. Pick the left or right scenario of section ${sec}. You only need to complete one.</p>
          <div class="syzygy-branch-cards">
            <button type="button" class="syzygy-branch-card" id="szBranchL">
              <span class="syzygy-branch-tag" style="display:block;">${sec} left</span>
              <span class="syzygy-branch-name" style="display:block;">${scenarioHTML(c.cards[l])}</span>
            </button>
            <button type="button" class="syzygy-branch-card" id="szBranchR">
              <span class="syzygy-branch-tag" style="display:block;">${sec} right</span>
              <span class="syzygy-branch-name" style="display:block;">${scenarioHTML(c.cards[r])}</span>
            </button>
          </div>
        </div>`;
    } else {
      const sc = c.cards[c.card];
      const stageLabel = c.mode === "syzygy1"
        ? `Section ${SZ1_LABELS[c.node]}${c.retry ? " · Retry" : ""}${c.node === 0 ? " · Starting scenario" : c.node === 3 ? " · Final scenario" : ""}`
        : (c.node === "S" ? "Start" : `Waypoint ${c.node}`) + ` · ${c.wins} of 3 wins`;
      const other = c.mode === "syzygy1" && c.retry && SZ1_SECTIONS[c.node].length > 1 ? SZ1_SECTIONS[c.node].find(k => k !== c.card) : null;
      const benched = ready ? alive.filter(i => !playing.includes(i)) : [];

      html += `
        <div class="syzygy-scenario-card">
          <h3 class="syzygy-heading-focus" id="szStageHeading" tabindex="-1" style="font:inherit;">
            <span class="syzygy-stage-label" style="display:block;">${esc(stageLabel)}</span>
            <span class="syzygy-stage-scenario" style="display:block;">${scenarioHTML(sc)}</span>
          </h3>
          <div class="syzygy-playing">${ready ? `Playing: <strong>${playing.map(i => esc(c.characters[i])).join(" &amp; ")}</strong>${benched.length ? ` · Sitting out: ${esc(c.characters[benched[0]])} (heals to full)` : ""}` : "Choose who plays below."}</div>
          <p class="syzygy-playing sz-next-text">${esc(szNextText(c))}</p>
          ${c.retry ? `<div class="notice notice-danger syzygy-retry-notice">Retry after a defeat: only 3 resources this attempt.</div>` : ""}
          ${other !== null ? `<button type="button" class="btn btn-secondary btn-sm sz-switch-btn" id="szSwitchBtn">Switch to the other ${SZ1_LABELS[c.node]} card: ${esc(szShort(c.cards[other]))}</button>` : ""}
        </div>`;

      // Who plays
      html += `
        <div class="panel">
          <h3 class="panel-title" id="szPlayersHeading">Who Plays?</h3>
          ${alive.length > 2
            ? `<p class="panel-intro">Choose two characters. The third sits out this scenario and heals to full health.</p>
               <div class="sz-player-choice" role="group" aria-labelledby="szPlayersHeading">
                 ${alive.map(i => `<button type="button" class="syzygy-char-btn${playing.includes(i) ? " sel-1" : ""}" data-player="${i}" aria-pressed="${playing.includes(i)}">${esc(c.characters[i])}${playing.includes(i) ? `<span class="sz-sel-num" aria-hidden="true">Plays</span>` : ""}</button>`).join("")}
               </div>`
            : `<p class="panel-intro">Only two characters are left, so both play.</p>`}
        </div>`;

      if (ready) {
        const resRows = playing.map(ci => {
          const name = c.characters[ci];
          const a    = c.alloc[ci];
          const co   = c.carry[ci];
          return `
          <div class="syzygy-resource-row">
            <div class="syzygy-resource-char">
              <div class="syzygy-resource-name">${esc(name)}</div>
              ${co.energy > 0 || co.health > 0 ? `<div class="syzygy-carryover-note">Carried over: <span aria-hidden="true">❤️</span><span class="sr-only">health</span> ${co.health} <span aria-hidden="true">⚡</span><span class="sr-only">energy</span> ${co.energy}</div>` : ""}
            </div>
            <div class="syzygy-resource-controls">
              <span class="sz-step-group"><span class="syzygy-resource-label" aria-hidden="true">❤️</span>
              <div class="syzygy-stepper" role="group" aria-label="${esc(name)} health">
                <button class="btn-sz-step" data-ai="${ci}" data-t="health" data-d="-1" aria-label="Remove 1 health from ${esc(name)}"${a.health <= 0 ? " disabled" : ""}>−</button>
                <span class="sz-step-val"><span class="sr-only">Health </span>${a.health}</span>
                <button class="btn-sz-step" data-ai="${ci}" data-t="health" data-d="1" aria-label="Add 1 health to ${esc(name)}"${remaining <= 0 ? " disabled" : ""}>+</button>
              </div></span>
              <span class="sz-step-group"><span class="syzygy-resource-label" aria-hidden="true">⚡</span>
              <div class="syzygy-stepper" role="group" aria-label="${esc(name)} energy">
                <button class="btn-sz-step" data-ai="${ci}" data-t="energy" data-d="-1" aria-label="Remove 1 energy from ${esc(name)}"${a.energy <= 0 ? " disabled" : ""}>−</button>
                <span class="sz-step-val"><span class="sr-only">Energy </span>${a.energy}</span>
                <button class="btn-sz-step" data-ai="${ci}" data-t="energy" data-d="1" aria-label="Add 1 energy to ${esc(name)}"${remaining <= 0 ? " disabled" : ""}>+</button>
              </div></span>
            </div>
          </div>`;
        }).join("");

        html += `
        <div class="panel">
          <h3 class="panel-title">Before the Scenario: Resources</h3>
          <p class="panel-intro">Share <strong>${pool}</strong> resources between the playing characters as <span aria-hidden="true">❤️</span> health or <span aria-hidden="true">⚡</span> energy. A character's energy can't go above the maximum shown on the scenario card.</p>
          ${resRows}
          <div class="syzygy-pool-bar">${remaining} resource${remaining !== 1 ? "s" : ""} left to share</div>
        </div>`;
      }

      if (ready && _szLossPending) {
        html += `
        <div class="panel">
          <h3 class="panel-title syzygy-heading-focus" id="szLossHeading" tabindex="-1">Record a Defeat</h3>
          <fieldset class="sz-elim">
            <legend class="panel-intro">Did a character's 0 health cause the loss? That character is removed from the campaign. Leave both unticked if you lost another way.</legend>
            ${playing.map(i => `<label class="sz-elim-option"><input type="checkbox" id="szElim${i}" value="${i}"> ${esc(c.characters[i])} reached 0 health</label>`).join("")}
          </fieldset>
          <div class="syzygy-outcome-btns">
            <button class="btn btn-secondary" id="szLossCancel">Cancel</button>
            <button class="btn-sz-loss" id="szLossConfirm"><span aria-hidden="true">✗</span> Record Defeat</button>
          </div>
        </div>`;
      } else {
        const coRows = ready ? playing.map(ci => {
          const name = c.characters[ci];
          const co   = c.carry[ci];
          return `
          <div class="syzygy-carryover-row">
            <span class="syzygy-carryover-name">${esc(name)}</span>
            <span class="sz-step-group"><span aria-hidden="true">❤️</span>
            <div class="syzygy-stepper is-compact" role="group" aria-label="${esc(name)} health left over">
              <button class="btn-sz-step" data-ci="${ci}" data-ct="health" data-cd="-1" aria-label="Remove 1 left-over health from ${esc(name)}"${co.health <= 0 ? " disabled" : ""}>−</button>
              <span class="sz-step-val"><span class="sr-only">Health </span>${co.health}</span>
              <button class="btn-sz-step" data-ci="${ci}" data-ct="health" data-cd="1" aria-label="Add 1 left-over health to ${esc(name)}">+</button>
            </div></span>
            <span class="sz-step-group"><span aria-hidden="true">⚡</span>
            <div class="syzygy-stepper is-compact" role="group" aria-label="${esc(name)} energy left over">
              <button class="btn-sz-step" data-ci="${ci}" data-ct="energy" data-cd="-1" aria-label="Remove 1 left-over energy from ${esc(name)}"${co.energy <= 0 ? " disabled" : ""}>−</button>
              <span class="sz-step-val"><span class="sr-only">Energy </span>${co.energy}</span>
              <button class="btn-sz-step" data-ci="${ci}" data-ct="energy" data-cd="1" aria-label="Add 1 left-over energy to ${esc(name)}">+</button>
            </div></span>
          </div>`;
        }).join("") : "";

        html += `
        <div class="panel">
          <h3 class="panel-title">After the Scenario: Outcome</h3>
          ${ready ? `<p class="panel-intro">When the scenario ends, enter each character's unused <span aria-hidden="true">❤️</span> health and <span aria-hidden="true">⚡</span> energy (they carry over to the next stage), then record the result.</p>` : `<p class="sz-hint" id="szOutcomeHint">Choose the two characters who play first.</p>`}
          ${coRows}
          <div class="syzygy-outcome-btns">
            <button class="btn-sz-win"  id="szWinBtn"${ready ? "" : ` disabled aria-describedby="szOutcomeHint"`}><span aria-hidden="true">✓</span> Victory</button>
            <button class="btn-sz-loss" id="szLossBtn"${ready ? "" : ` disabled aria-describedby="szOutcomeHint"`}><span aria-hidden="true">✗</span> Defeat</button>
          </div>
        </div>`;
      }
    }

    html += `</div></div>`;
    el.innerHTML = html;

    // Events
    document.getElementById("szAbandonBtn").addEventListener("click", () => {
      openModal("szAbandonModal", "szAbandonCancel");
    });

    const pickCard = k => { c.card = k; saveSz(); renderSz("szStageHeading"); announce(`${szShort(c.cards[k])} chosen.`); };
    const branchL = document.getElementById("szBranchL");
    const branchR = document.getElementById("szBranchR");
    if (branchL) branchL.addEventListener("click", () => pickCard(SZ1_SECTIONS[c.node][0]));
    if (branchR) branchR.addEventListener("click", () => pickCard(SZ1_SECTIONS[c.node][1]));
    const sw = document.getElementById("szSwitchBtn");
    if (sw) sw.addEventListener("click", () => pickCard(SZ1_SECTIONS[c.node].find(k => k !== c.card)));

    el.querySelectorAll("[data-player]").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.player, 10);
        let p = szPlaying(c).slice();
        if (p.includes(i)) { p = p.filter(x => x !== i); c.alloc[i] = { health: 0, energy: 0 }; }
        else if (p.length < 2) p.push(i);
        else { toast("Two characters already play. Tap one of them to sit them out first.", "error"); return; }
        c.playing = p.length ? p.sort((a, b) => a - b) : null;
        _szLossPending = false;
        saveSz(); renderSz();
        announce(p.length === 2 ? `${p.map(x => c.characters[x]).join(" and ")} play. ${c.characters[alive.find(x => !p.includes(x))]} sits out and heals.` : `${c.characters[i]} ${p.includes(i) ? "plays" : "sits out"}. Choose ${2 - p.length} more.`);
      });
    });

    // Allocation steppers (data-ai = character index, data-t, data-d)
    el.querySelectorAll("[data-ai]").forEach(btn => {
      btn.addEventListener("click", () => {
        const ci  = parseInt(btn.dataset.ai, 10);
        const t   = btn.dataset.t;
        const dir = parseInt(btn.dataset.d, 10);
        const tot = () => szPlaying(c).reduce((s, i) => s + c.alloc[i].energy + c.alloc[i].health, 0);
        if (dir > 0 && (pool - tot()) <= 0) return;
        if (dir < 0 && c.alloc[ci][t] <= 0) return;
        c.alloc[ci][t] += dir;
        saveSz(); renderSz();
        const left = pool - tot();
        announce(`${c.characters[ci]} ${t} ${c.alloc[ci][t]}. ${left} resource${left !== 1 ? "s" : ""} left.`);
      });
    });

    // Carryover steppers (data-ci, data-ct, data-cd)
    el.querySelectorAll("[data-ci]").forEach(btn => {
      btn.addEventListener("click", () => {
        const ci  = parseInt(btn.dataset.ci, 10);
        const t   = btn.dataset.ct;
        const dir = parseInt(btn.dataset.cd, 10);
        if (dir < 0 && c.carry[ci][t] <= 0) return;
        c.carry[ci][t] = Math.min(99, Math.max(0, c.carry[ci][t] + dir));
        saveSz(); renderSz();
        announce(`${c.characters[ci]} left-over ${t} ${c.carry[ci][t]}.`);
      });
    });

    const winBtn  = document.getElementById("szWinBtn");
    const lossBtn = document.getElementById("szLossBtn");
    if (winBtn)  winBtn .addEventListener("click", () => szRecordOutcome("Win", []));
    if (lossBtn) lossBtn.addEventListener("click", () => { _szLossPending = true; renderSz("szLossHeading"); });
    const lossOk = document.getElementById("szLossConfirm");
    const lossNo = document.getElementById("szLossCancel");
    if (lossOk) lossOk.addEventListener("click", () => {
      const elim = [...el.querySelectorAll(".sz-elim input:checked")].map(x => parseInt(x.value, 10));
      szRecordOutcome("Loss", elim);
    });
    if (lossNo) lossNo.addEventListener("click", () => { _szLossPending = false; renderSz("szLossBtn"); });
  }

  function szRankColor(rank) {
    if (rank === "LEGENDS" || rank === "LOADED") return "var(--accent-yellow)";
    if (rank === "FREE" || rank === "SAFE")      return "var(--accent-teal)";
    return "var(--loss-color)";
  }

  function szRenderComplete(el) {
    const c    = _sz;
    const rank = c.rank || szRank(c);
    const histRows = c.results.map(r => {
      const gone = (r.eliminated || []).map(i => c.characters[i]);
      return `<tr>
        <td class="cell-meta">${esc(c.mode === "syzygy1" ? `Section ${r.node}` : r.node === "S" ? "Start" : `Waypoint ${r.node}`)}${r.retry ? " (retry)" : ""}: ${esc(r.scenario)}</td>
        <td class="cell-meta">${r.chars.map(i => esc(c.characters[i])).join(" &amp; ")}${gone.length ? `<br>Eliminated: ${gone.map(esc).join(", ")}` : ""}</td>
        <td><span class="result-pill ${r.result === "Win" ? "win" : "loss"}"><span aria-hidden="true">${r.result === "Win" ? "✓" : "✗"}</span> ${esc(r.result)}</span></td>
      </tr>`;
    }).join("");

    el.innerHTML = `
      <div class="panel">
        <h2 class="panel-title syzygy-heading-focus" id="szStageHeading" tabindex="-1">${SZ_MODE_LABEL[c.mode]} — Complete</h2>
        <div class="syzygy-rank-card">
          <div class="syzygy-rank-eyebrow">Final Rank</div>
          <div class="syzygy-rank-value" style="color:${szRankColor(rank.rank)};">${esc(rank.rank)}</div>
          <div class="syzygy-rank-desc">${esc(rank.desc)}</div>
          <div class="syzygy-rank-stats">
            <div><div class="syzygy-rank-stat-val">${c.wins}</div><div class="syzygy-rank-stat-label">${c.wins === 1 ? "Win" : "Wins"}</div></div>
            <div><div class="syzygy-rank-stat-val">${c.losses}</div><div class="syzygy-rank-stat-label">${c.losses === 1 ? "Loss" : "Losses"}</div></div>
            <div><div class="syzygy-rank-stat-val">${c.results.length}</div><div class="syzygy-rank-stat-label">Scenarios</div></div>
          </div>
        </div>
        <h3 class="panel-title">Campaign Map</h3>
        ${szMapHTML(c)}
        ${szRosterHTML(c)}
        ${histRows ? `
        <h3 class="section-heading" id="szLogHeading">Campaign Log</h3>
        <div class="history-table-wrap" tabindex="0" role="region" aria-labelledby="szLogHeading">
          <table>
            <thead><tr><th>Scenario</th><th>Characters</th><th>Result</th></tr></thead>
            <tbody>${histRows}</tbody>
          </table>
        </div>` : ""}
        <button class="btn btn-primary" id="szNewCampaignBtn" style="margin-top:16px;">Start New Campaign</button>
      </div>`;
    restoreTableRoles(el);
    szBindNewCampaign();
  }

  function szBindNewCampaign() {
    document.getElementById("szNewCampaignBtn").addEventListener("click", () => {
      _sz = null; _szLegacy = null; _szMode = null; _szChars = [];
      saveSz(); renderSz();
      const h = document.querySelector("#syzygyCampaignContent .panel-title");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
    });
  }

  // ─── SYZYGY v1 (pre-rulebook) campaigns ─────────────────────────────────────
  // Earlier versions saved a different campaign shape that didn't follow the booklets.
  // It is never converted: a finished one keeps showing its result; an unfinished one is
  // offered "Abandon" or "Keep read-only" (moved to syzygyCampaignV1 so a new one can start).

  function szLegacyLogHTML(c, idPrefix) {
    const rows = c.stageResults.map(r => `<tr>
        <td class="cell-meta">${esc(r.scenario)}</td>
        <td class="cell-meta">${r.chars.map(i => esc(c.characters[i] || "")).join(" &amp; ")}</td>
        <td><span class="result-pill ${r.result === "Win" ? "win" : "loss"}"><span aria-hidden="true">${r.result === "Win" ? "✓" : "✗"}</span> ${esc(r.result)}</span></td>
      </tr>`).join("");
    if (!rows) return `<p class="panel-intro">No scenarios were recorded.</p>`;
    return `
        <h3 class="section-heading" id="${idPrefix}LogHeading">Campaign Log</h3>
        <div class="history-table-wrap" tabindex="0" role="region" aria-labelledby="${idPrefix}LogHeading">
          <table>
            <thead><tr><th>Scenario</th><th>Characters</th><th>Result</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
  }

  function szLegacyPanelHTML(c, kept) {
    const wins = c.stageResults.filter(r => r.result === "Win").length;
    return `
      <div class="panel" id="${kept ? "szKeptPanel" : "szLegacyPanel"}">
        <h3 class="panel-title">${kept ? "Old Campaign (read-only)" : "Old Campaign Found"}</h3>
        <p class="panel-intro">${esc(SZ_MODE_LABEL[c.mode])} with ${esc(c.characters.join(", "))}. Started ${esc(c.started || "earlier")} · ${wins} win${wins !== 1 ? "s" : ""} · ${c.losses} loss${c.losses !== 1 ? "es" : ""}.</p>
        ${szLegacyLogHTML(c, kept ? "szKept" : "szLegacy")}
        ${kept ? `<button class="btn btn-danger btn-sm btn-compact sz-legacy-actions" id="szKeptDelete">Delete Old Campaign</button>` : ""}
      </div>`;
  }

  function szRenderLegacy(el) {
    const c = _szLegacy;
    if (c.completed) {
      const rank = c.finalRank && typeof c.finalRank.rank === "string" ? c.finalRank : { rank: "Finished", desc: "" };
      const wins = c.stageResults.filter(r => r.result === "Win").length;
      el.innerHTML = `
      <div class="panel">
        <h2 class="panel-title syzygy-heading-focus" id="szStageHeading" tabindex="-1">${SZ_MODE_LABEL[c.mode]} — Complete</h2>
        <div class="syzygy-rank-card">
          <div class="syzygy-rank-eyebrow">Final Rank</div>
          <div class="syzygy-rank-value" style="color:${szRankColor(rank.rank)};">${esc(rank.rank)}</div>
          <div class="syzygy-rank-desc">${esc(rank.desc || "")}</div>
          <div class="syzygy-rank-stats">
            <div><div class="syzygy-rank-stat-val">${wins}</div><div class="syzygy-rank-stat-label">${wins === 1 ? "Win" : "Wins"}</div></div>
            <div><div class="syzygy-rank-stat-val">${c.losses}</div><div class="syzygy-rank-stat-label">${c.losses === 1 ? "Loss" : "Losses"}</div></div>
            <div><div class="syzygy-rank-stat-val">${c.stageResults.length}</div><div class="syzygy-rank-stat-label">Scenarios</div></div>
          </div>
        </div>
        <p class="sz-hint">Played with an earlier version of this app, before SYZYGY followed the booklet's rules.</p>
        <h3 class="panel-title">Characters</h3>
        <p class="panel-intro">${esc(c.characters.join(" · "))}</p>
        ${szLegacyLogHTML(c, "sz")}
        <button class="btn btn-primary" id="szNewCampaignBtn" style="margin-top:16px;">Start New Campaign</button>
      </div>`;
      restoreTableRoles(el);
      szBindNewCampaign();
      return;
    }
    el.innerHTML = `
      <div class="panel">
        <h2 class="panel-title syzygy-heading-focus" id="szStageHeading" tabindex="-1">SYZYGY Has Changed</h2>
        <p class="panel-intro">SYZYGY now follows the booklets: four sections in Mode I, the six-card Waypoint pyramid in Mode II, and you choose who plays each scenario. Your unfinished campaign was started with the old rules and can't be continued.</p>
        <div class="modal-actions sz-legacy-actions">
          <button class="btn btn-secondary" id="szLegacyKeep">Keep Read-only</button>
          <button class="btn btn-danger" id="szLegacyAbandon">Abandon</button>
        </div>
      </div>
      ${szLegacyPanelHTML(c, false)}`;
    restoreTableRoles(el);
    document.getElementById("szLegacyKeep").addEventListener("click", () => {
      _szKept = _szLegacy; _szLegacy = null;
      saveSz(); renderSz();
      const h = document.querySelector("#syzygyCampaignContent .panel-title");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
      toast("Old campaign kept read-only. You can start a new campaign.");
    });
    document.getElementById("szLegacyAbandon").addEventListener("click", () => {
      const before = _szLegacy;
      _szLegacy = null;
      saveSz(); renderSz();
      const h = document.querySelector("#syzygyCampaignContent .panel-title");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
      undoToast("Old campaign abandoned.", () => { _szLegacy = before; saveSz(); renderSz("szStageHeading"); toast("Old campaign restored."); });
    });
  }

  function szBindLegacyKept() {
    const del = document.getElementById("szKeptDelete");
    if (!del) return;
    del.addEventListener("click", () => {
      const before = _szKept;
      _szKept = null;
      saveSz(); renderSz();
      const h = document.querySelector("#syzygyCampaignContent .panel-title");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
      undoToast("Old campaign deleted.", () => { _szKept = before; saveSz(); renderSz(); toast("Old campaign restored."); });
    });
  }

  // ─── Init ───────────────────────────────────────────────────────────────────
  document.getElementById("generateBtn")    .addEventListener("click", handleGenerate);
  document.getElementById("lockChar1")      .addEventListener("click", () => { locks.char1    = !locks.char1;    updateLockButtons(); track("lock_toggle", { slot: "char1", locked: locks.char1 }); });
  document.getElementById("lockChar2")      .addEventListener("click", () => { locks.char2    = !locks.char2;    updateLockButtons(); track("lock_toggle", { slot: "char2", locked: locks.char2 }); });
  document.getElementById("lockScenario")   .addEventListener("click", () => { locks.scenario = !locks.scenario; updateLockButtons(); track("lock_toggle", { slot: "scenario", locked: locks.scenario }); });
  document.getElementById("loadManualCombo").addEventListener("click", handleLoadManualCombo);
  document.getElementById("saveRecordBtn")  .addEventListener("click", handleSaveRecord);
  document.getElementById("exportBtn")      .addEventListener("click", handleExport);
  document.getElementById("randomizerTab")     .addEventListener("click", () => showTab("randomizer"));
  document.getElementById("historyTab")        .addEventListener("click", () => showTab("history"));
  document.getElementById("syzygyCampaignTab") .addEventListener("click", () => showTab("syzygy"));

  // Arrow key navigation between tabs (ARIA tablist pattern)
  document.querySelector(".tab-nav[role='tablist']").addEventListener("keydown", e => {
    const tabs = [...e.currentTarget.querySelectorAll("[role='tab']")];
    const idx  = tabs.indexOf(document.activeElement);
    if (idx === -1) return;
    const TAB_NAMES = { randomizerTab: "randomizer", historyTab: "history", syzygyCampaignTab: "syzygy" };
    const target =
      e.key === "ArrowRight" ? tabs[(idx + 1) % tabs.length] :
      e.key === "ArrowLeft"  ? tabs[(idx - 1 + tabs.length) % tabs.length] :
      e.key === "Home"       ? tabs[0] :
      e.key === "End"        ? tabs[tabs.length - 1] : null;
    if (!target) return;
    e.preventDefault();
    showTab(TAB_NAMES[target.id] || target.id);
    target.focus();
  });
  document.getElementById("viewLogBtn").addEventListener("click", () => {
    showTab("history");
    document.getElementById("missionLogHeading").focus();
    document.getElementById("missionLogHeading").scrollIntoView({ block: "start" });
  });
  document.getElementById("historySortBy").addEventListener("change", () => { historyDirty = true; displayHistory(); });
  document.getElementById("historyFilterResult").addEventListener("change", () => { historyDirty = true; displayHistory(); });
  document.getElementById("historyFilterDifficulty").addEventListener("change", () => { historyDirty = true; displayHistory(); });
  document.getElementById("historyFilterChar").addEventListener("change", () => { historyDirty = true; displayHistory(); });
  document.getElementById("historyFilterScenario").addEventListener("change", () => { historyDirty = true; displayHistory(); });
  document.getElementById("historyFilterDroid").addEventListener("change", () => { historyDirty = true; displayHistory(); });
  document.getElementById("faqClose")       .addEventListener("click", closeFaq);
  document.getElementById("faqModal")       .addEventListener("click", e => { if (e.target === e.currentTarget) closeFaq(); });
  document.getElementById("rulesBtn")       .addEventListener("click", openRules);
  document.getElementById("rulesClose")     .addEventListener("click", closeRules);
  document.getElementById("rulesModal")     .addEventListener("click", e => { if (e.target === e.currentTarget) closeRules(); });
  document.getElementById("settingsBtn")    .addEventListener("click", openSettings);
  document.getElementById("settingsClose")  .addEventListener("click", closeSettings);
  document.getElementById("settingsDismiss").addEventListener("click", closeSettings);
  document.getElementById("settingsModal")      .addEventListener("click", e => { if (e.target === e.currentTarget) closeSettings(); });
  document.getElementById("restartModal")      .addEventListener("click", e => { if (e.target === e.currentTarget) closeRestartModal(); });
  document.getElementById("confirmModal")      .addEventListener("click", e => { if (e.target === e.currentTarget) closeConfirmModal(); });
  document.getElementById("importConfirmModal").addEventListener("click", e => { if (e.target === e.currentTarget) closeImportModal(); });
  document.getElementById("deleteRecordModal") .addEventListener("click", e => { if (e.target === e.currentTarget) closeDeleteModal(); });
  document.getElementById("editRecordModal")   .addEventListener("click", e => { if (e.target === e.currentTarget) closeEditModal(); });
  document.getElementById("diceModal")         .addEventListener("click", e => { if (e.target === e.currentTarget) closeDiceModal(); });
  document.getElementById("diceModalClose")    .addEventListener("click", closeDiceModal);
  document.getElementById("tipsTriggerBtn")    .addEventListener("click", openTipsModal);
  document.getElementById("tipsModalClose")    .addEventListener("click", closeTipsModal);
  document.getElementById("tipsModal")         .addEventListener("click", e => { if (e.target === e.currentTarget) closeTipsModal(); });
  document.getElementById("rollBtn")           .addEventListener("click", () => rollDice(false));
  document.getElementById("diceSwapBtn")       .addEventListener("click", () => {
    if (_diceRolling || _diceLocked[0] || _diceLocked[1]) return;
    [_diceValues[0], _diceValues[1]] = [_diceValues[1], _diceValues[0]];
    [0, 1].forEach(i => {
      const die = document.getElementById(`die${i}`);
      die.dataset.val = _diceValues[i];
      die.setAttribute("aria-label", `Die ${i + 1}, value ${_diceValues[i]}, ${_diceLocked[i] ? "locked" : "unlocked"}`);
    });
    _diceSay(`Swapped: ${_diceValues[0]} and ${_diceValues[1]}`);
  });
  document.getElementById("skillCheckBtn")     .addEventListener("click", () => {
    _savedDiceState = { values: [..._diceValues], locked: [..._diceLocked] };
    _diceMode = "skill";
    _diceApplyMode();
    rollDice(false);
    track("skill_check");
    // The Skill Check button is now hidden; keep focus in the dialog.
    document.getElementById("skillDoneBtn").focus();
  });
  document.getElementById("skillDoneBtn")      .addEventListener("click", () => {
    _diceMode = "normal";
    if (_savedDiceState) {
      _diceValues = _savedDiceState.values;
      _diceLocked = _savedDiceState.locked;
      _savedDiceState = null;
      [0, 1].forEach(i => {
        const die = document.getElementById(`die${i}`);
        die.dataset.val = _diceValues[i];
        die.classList.toggle("locked", _diceLocked[i]);
        die.setAttribute("aria-pressed", String(_diceLocked[i]));
        die.setAttribute("aria-label",
          `Die ${i + 1}, value ${_diceValues[i]}, ${_diceLocked[i] ? "locked" : "unlocked"}`);
      });
    }
    _diceApplyMode();
    setTimeout(() => document.getElementById("rollBtn").focus(), 50);
  });
  [0, 1].forEach(i => {
    const dieEl = document.getElementById(`die${i}`);
    const toggleDieLock = () => {
      if (_diceRolling || _diceMode === "skill") return;
      _diceSetLock(i, !_diceLocked[i]);
    };
    dieEl.addEventListener("click", toggleDieLock);
    dieEl.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleDieLock(); }
    });
    document.getElementById(`dieMinus${i}`).addEventListener("click", () => _diceAdjust(i, -1));
    document.getElementById(`diePlus${i}`) .addEventListener("click", () => _diceAdjust(i, +1));
    document.getElementById(`dieFlip${i}`) .addEventListener("click", () => _diceFlip(i));
  });
  document.getElementById("manualChar1")    .addEventListener("change", () => syncDropdown("manualChar1", "manualChar2"));
  document.getElementById("manualChar2")    .addEventListener("change", function() {
    if (this.value === document.getElementById("manualChar1").value) {
      toast("Select two different characters.", "error");
      const fallback = Array.from(this.options).find(o => o.value !== document.getElementById("manualChar1").value);
      if (fallback) this.value = fallback.value;
      return;
    }
    syncDropdown("manualChar2", "manualChar1");
  });
  document.getElementById("themeBtn")       .addEventListener("click", toggleTheme);
  document.getElementById("tipDismiss")     .addEventListener("click", dismissTip);
  document.getElementById("radioBtn")       .addEventListener("click", () => {
    if (_radioState === "stopped" || _radioState === "error") startRadio();
    else stopRadio();
  });
  document.getElementById("volumeBtn")      .addEventListener("click", () => {
    const popover = document.getElementById("volumePopover");
    const isOpen  = popover.classList.toggle("open");
    document.getElementById("volumeBtn").setAttribute("aria-expanded", String(isOpen));
  });
  document.getElementById("volumePopover").addEventListener("focusout", e => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      e.currentTarget.classList.remove("open");
      document.getElementById("volumeBtn").setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("click", e => {
    const popover = document.getElementById("volumePopover");
    if (!popover.classList.contains("open")) return;
    if (!document.getElementById("volumeBtn").contains(e.target) &&
        !popover.contains(e.target)) {
      popover.classList.remove("open");
      document.getElementById("volumeBtn").setAttribute("aria-expanded", "false");
    }
  });
  document.getElementById("radioVolume")    .addEventListener("input", e => {
    document.getElementById("radioAudio").volume = parseFloat(e.target.value);
    try { localStorage.setItem("radioVolume", e.target.value); } catch(_) {}
  });
  const _radioAudio = document.getElementById("radioAudio");
  _radioAudio.addEventListener("playing", () => {
    setRadioState("playing");
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: "Mission Control", artist: "SomaFM", album: "Twin Stars Radio"
      });
      navigator.mediaSession.playbackState = "playing";
      navigator.mediaSession.setActionHandler("pause", stopRadio);
      navigator.mediaSession.setActionHandler("stop",  stopRadio);
    }
  });
  _radioAudio.addEventListener("error", () => {
    if (_radioState === "loading" || _radioState === "playing") tryNextStream();
  });
  window.addEventListener("offline", () => {
    if (_radioState !== "stopped") { stopRadio(); toast("Stream stopped — you're offline."); }
    document.getElementById("radioBtn").disabled = true;
  });
  window.addEventListener("online", () => {
    document.getElementById("radioBtn").disabled = false;
  });

  // ─── Privacy dialog + rulebook analytics ─────────────────────────────────────
  // Kept apart from the rulebook viewer code: reads the active tab after it is shown and
  // only ever sends a label that appears in RULEBOOK_TABS (never arbitrary text).
  document.getElementById("privacyBtn")       .addEventListener("click", () => openModal("privacyModal", "privacyModalClose"));
  document.getElementById("privacyModalClose").addEventListener("click", () => closeModal("privacyModal"));
  document.getElementById("privacyModal")     .addEventListener("click", e => { if (e.target === e.currentTarget) closeModal("privacyModal"); });
  function trackRulesTab() {
    const active = document.querySelector('#rulesTabs .active, #rulesTabs [aria-pressed="true"], #rulesTabs [aria-selected="true"]');
    const label = active ? active.textContent.trim() : "";
    const known = RULEBOOK_TABS.find(t => t.label === label);
    if (known && document.getElementById("rulesModal").classList.contains("open")) {
      track("rules_open", { tab: known.file.split("/").pop().replace(/\.\w+$/, "") });
    }
  }
  document.getElementById("rulesBtn") .addEventListener("click", trackRulesTab);
  document.getElementById("rulesTabs").addEventListener("click", e => { if (e.target.closest("button")) trackRulesTab(); });

  try {
    const lastResult     = localStorage.getItem("lastResult");
    const lastDifficulty = localStorage.getItem("lastDifficulty");
    if (lastResult)     document.getElementById("result").value     = lastResult;
    if (lastDifficulty) document.getElementById("difficulty").value = lastDifficulty;
  } catch(e) {}

  document.getElementById("radioVolume").value = getRadioVolume();
  if (!navigator.onLine) document.getElementById("radioBtn").disabled = true;

  buildActiveContent();
  populateSelectors();
  showEmptyComboState();
  initOnboardingTip();
  syncExportBtn();

  if ("serviceWorker" in navigator) {
    // controllerchange also fires on the very first install (the worker claims the page),
    // which used to reload brand-new visitors a moment after load. Only treat it as an
    // update when the page was already controlled by an earlier worker.
    const hadController = !!navigator.serviceWorker.controller;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!hadController) return;
        const busy = currentCombination || timerInterval || document.querySelector(".modal-overlay.open") || _szMode;
        if (!busy) {
          window.location.reload();
        } else {
          toast("App updated — reload for the latest version.");
        }
      });
    });
  }

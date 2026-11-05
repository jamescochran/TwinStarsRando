// Twin Stars Randomizer — application script (moved out of index.html so the CSP
// can drop 'unsafe-inline' from script-src). Loaded at the end of <body>.
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
    return `<span style="color:var(--text-dim)">Scenario ${num}:</span> ${esc(name)}`;
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
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    applyTheme(current === "dark" ? "light" : "dark");
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

  function toast(msg, type) {
    const live = document.getElementById("ariaLive");
    if (live) live.textContent = msg;
    // One toast at a time (they share a position), shown long enough to read.
    document.querySelectorAll(".toast").forEach(el => el.remove());
    const t = document.createElement("div");
    t.className = "toast " + (type || "info");
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), Math.max(2600, 1500 + msg.length * 45));
  }

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
  timerInterval   = setInterval(updateDisplay, 1000);
  const el = document.getElementById("timerDisplay");
  if (el) { el.textContent = "00:00"; el.classList.remove("stopped"); el.setAttribute("aria-label", "Timer running: 0 minutes 0 seconds"); }
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerPaused = false;
  startTime   = null;
  const el = document.getElementById("timerDisplay");
  if (el) { el.classList.add("stopped"); el.setAttribute("aria-label", "Timer stopped"); }
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
    display.classList.toggle("paused", timerPaused);
    display.setAttribute("aria-label", timerPaused ? "Timer paused" : "Timer running");
  }
}


function updateDisplay() {
  if (timerPaused) return;
  const elapsedMs = accumulatedTime + (Date.now() - startTime);
  const el = document.getElementById("timerDisplay");
  if (el) {
    el.textContent = formatTime(Math.floor(elapsedMs / 1000));
  }
}

function getCurrentElapsed() {
  if (timerPaused) return Math.floor(accumulatedTime / 1000);
  if (!startTime) return 0;
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

  function renderDiffBadges(comb) {
    return getDifficultyStatus(comb).map(({ diff, state }) =>
      `<div class="diff-badge ${state}"><div class="diff-dot"></div>${esc(diff)}</div>`
    ).join("");
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
    const allLocked = locks.char1 && locks.char2 && locks.scenario;
    const genBtn = document.getElementById("generateBtn");
    genBtn.disabled = allLocked;
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
        <div class="combo-characters">
          <span class="combo-char-wrap"><span class="char-role primary-role">Primary</span>${esc(comb.characters[0])}${CHAR_FAQ_ANCHOR[comb.characters[0]] ? faqHelpBtn(CHAR_FAQ_ANCHOR[comb.characters[0]], comb.characters[0]) : ""}</span><span class="combo-vs">&amp;</span><span class="combo-char-wrap"><span class="char-role secondary-role">Secondary</span>${esc(comb.characters[1])}${CHAR_FAQ_ANCHOR[comb.characters[1]] ? faqHelpBtn(CHAR_FAQ_ANCHOR[comb.characters[1]], comb.characters[1]) : ""}</span>
        </div>
        <div class="combo-scenario">${scenarioHTML(comb.scenario)}${SCENARIO_NUMBER[comb.scenario] && parseInt(SCENARIO_NUMBER[comb.scenario]) <= 12 ? faqHelpBtn("faq-sc-" + SCENARIO_NUMBER[comb.scenario], scenarioText(comb.scenario)) : ""}</div>
        <div class="combo-play-count"><span>${esc(countText)}</span></div>
        ${droids.length ? `
        <div class="droid-row">
          <span class="droid-row-label">Droid</span>
          <select class="droid-select" id="droidSelect" aria-label="Droid assistant">${droidOptions}</select>
          <button class="btn-droid-rand" id="droidRandBtn">Random</button>
        </div>` : ""}
        <div class="difficulty-row">${renderDiffBadges(comb)}</div>
        <div class="timer-row">
          <div>
            <div class="timer-label">Elapsed Time</div>
            <div class="timer-display" id="timerDisplay" aria-live="off" aria-label="Timer stopped">00:00</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn-pause" id="restartBtn" aria-label="Restart timer">Restart</button>
            <button class="btn-pause" id="pauseBtn" aria-label="Pause timer">Pause</button>
          </div>
        </div>
        <div class="dice-row">
          <button class="btn btn-secondary btn-dice" id="diceRollerBtn">🎲 Roll Dice</button>
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
        <td><button class="btn-delete-record" data-idx="${globalIdx}" title="Delete" aria-label="Delete record">✕</button></td>
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
        <p class="section-heading">This Combination</p>
        ${droidSummaryHTML}
        <div class="history-table-wrap">
          <table>
            <thead><tr><th>Date / Time</th><th>Result</th><th>Difficulty</th><th>Time</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;

    // Property assignment (not addEventListener): this runs on every render.
    div.onclick = e => {
      const deleteBtn = e.target.closest(".btn-delete-record");
      if (!deleteBtn) return;
      _deleteTrigger    = deleteBtn;
      _pendingDeleteIdx = parseInt(deleteBtn.dataset.idx, 10);
      _deleteCallback   = () => { displayCombination(currentCombination); displayComboHistory(currentCombination); };
      openModal("deleteRecordModal", "deleteRecordCancel");
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
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:14px;">
        <span style="color:var(--accent-teal);font-weight:700;">${played}</span> of <span style="font-weight:700;">${total}</span> combinations played
      </p>
      <div class="unplayed-grid" id="unplayedGrid"></div>`;

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
        div.innerHTML = `
          <div class="unplayed-item-text">
            <div>${esc(comb.characters.join(" & "))}</div>
            <div class="unplayed-item-scenario">${scenarioHTML(comb.scenario)}</div>
          </div>
          <button class="btn-load-unplayed"
            data-char0="${esc(comb.characters[0])}"
            data-char1="${esc(comb.characters[1])}"
            data-scenario="${esc(comb.scenario)}">Play</button>`;
        frag.appendChild(div);
      });
      offset += slice.length;
      grid.appendChild(frag);
    }

    // One delegated listener instead of one per row
    grid.addEventListener("click", e => {
      const btn = e.target.closest(".btn-load-unplayed");
      if (!btn) return;
      showTab("randomizer");
      loadCombination({ characters: [btn.dataset.char0, btn.dataset.char1], scenario: btn.dataset.scenario });
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
      container.innerHTML = `<div class="empty-state"><p>No mission records yet. Start playing!</p></div>`;
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

    if (!displayed.length) {
      container.innerHTML = `<div class="empty-state"><p>No records match the current filter.</p></div>`;
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
            <button class="btn-edit-record"   data-idx="${idx}" title="Edit"   aria-label="Edit record">✎</button>
            <button class="btn-delete-record" data-idx="${idx}" title="Delete" aria-label="Delete record">✕</button>
          </td>
        </tr>${notesRow}`;
    }).join("");

    container.innerHTML = `
      <div class="history-table-wrap">
        <table>
          <thead><tr><th>Date / Time</th><th>Characters</th><th>Scenario</th><th>Result</th><th>Difficulty</th><th>Time</th><th></th></tr></thead>
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
        _deleteCallback   = () => { displayHistory(); displayUnplayed(); if (currentCombination) { displayCombination(currentCombination); displayComboHistory(currentCombination); } };
        openModal("deleteRecordModal", "deleteRecordCancel");
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
      el.innerHTML = `<div class="empty-state"><p>No mission records yet — save some games to see stats!</p></div>`;
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
        <div class="stats-summary-label">Completed</div>
      </div>
    </div>`;

    // ── Playtime ──
    const timed = records.filter(r => r.playtime != null && r.playtime > 0);
    if (timed.length) {
      const times    = timed.map(r => r.playtime);
      const avg      = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const longest  = Math.max(...times);
      const shortest = Math.min(...times);
      html += `<p class="section-heading">Playtime</p>
      <div class="stats-playtime">
        <div class="stats-summary-card">
          <div class="stats-summary-value" style="font-size:14px;">${formatTime(avg)}</div>
          <div class="stats-summary-label">Average</div>
        </div>
        <div class="stats-summary-card">
          <div class="stats-summary-value" style="font-size:14px;">${formatTime(longest)}</div>
          <div class="stats-summary-label">Longest</div>
        </div>
        <div class="stats-summary-card">
          <div class="stats-summary-value" style="font-size:14px;">${formatTime(shortest)}</div>
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
      html += `<p class="section-heading">Droid Coverage</p>
      <div class="stats-summary">
        <div class="stats-summary-card">
          <div class="stats-summary-value" style="color:var(--accent-teal);">${combosWithDroid.size}</div>
          <div class="stats-summary-label">Combos w/ Droid</div>
        </div>
        <div class="stats-summary-card">
          <div class="stats-summary-value" style="color:var(--accent-teal);">${totalPlayed > 0 ? coveragePct + "%" : "&#x2014;"}</div>
          <div class="stats-summary-label">of Played Combos</div>
        </div>
        <div class="stats-summary-card">
          <div class="stats-summary-value" style="color:var(--accent-yellow);">${droidRecs.length}</div>
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
    if (label) label.textContent = active.map(p => p.shortName).join(" · ");
  }

  function openSettings() {
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
          warn.textContent = "At least 2 characters and 1 scenario required.";
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
    openModal("settingsModal", null);
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
        toast("Active combination removed — pack disabled.", "error");
      } else {
        displayCombination(currentCombination);
        displayComboHistory(currentCombination);
      }
    }
    displayHistory();
    displayUnplayed();
    displayStats();
    closeModal("settingsModal");
  }

  // ─── Generic modal helpers ───────────────────────────────────────────────────
  // All modals share the same open/close pattern: add/remove the "open" class
  // and return focus to whichever element triggered the modal.
  // Modals that need extra teardown (clearing pending state, etc.) call these
  // helpers and then do their own cleanup — see closeDeleteModal, closeImportModal, etc.

  // Maps modal ID → the element that was focused when the modal opened,
  // so we can return focus there on close.
  const _modalTriggers = {};

  function openModal(id, firstFocusId) {
    _modalTriggers[id] = document.activeElement;
    document.getElementById(id).classList.add("open");
    if (firstFocusId) {
      setTimeout(() => {
        const el = document.getElementById(firstFocusId);
        if (el) el.focus();
      }, 50);
    }
  }

  function closeModal(id) {
    document.getElementById(id).classList.remove("open");
    const trigger = _modalTriggers[id];
    if (trigger) { trigger.focus(); delete _modalTriggers[id]; }
  }

  // ─── Per-modal state ─────────────────────────────────────────────────────────
  // Some modals carry pending state that must be cleared when they close.
  let _deleteTrigger    = null; // element that opened the delete modal (for focus return via delegated handler)
  let _pendingDeleteIdx = null; // record index waiting to be confirmed for deletion
  let _deleteCallback   = null; // called after deletion to refresh whichever view triggered it
  let _editIdx          = null; // record index currently open in the edit modal

  function openEditModal(idx) {
    _editIdx = idx;
    const rec = records[idx];
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
    available.forEach((tab, i) => {
      const btn = document.createElement("button");
      btn.className = "rules-tab" + (i === 0 ? " active" : "");
      btn.textContent = tab.label;
      btn.addEventListener("click", () => {
        tabsEl.querySelectorAll(".rules-tab").forEach(t => t.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById("rulesImage").src = tab.file;
        document.querySelector(".rules-img-wrap").scrollTop = 0;
      });
      tabsEl.appendChild(btn);
    });
    document.getElementById("rulesImage").src = available[0].file;
    openModal("rulesModal", "rulesClose");
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
    document.getElementById("deleteRecordModal").classList.remove("open");
    if (trigger) trigger.focus();
  }

  function openFaq(anchorId) {
    openModal("faqModal", "faqClose");
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
      <div class="empty-state" style="padding:28px 20px;">
        <p style="font-size:14px;margin-bottom:8px;">No mission loaded</p>
        <p>Click <strong>Randomize Combination</strong> above to get started,<br>
           or pick characters and a scenario manually.</p>
      </div>`;
  }

  function loadCombination(comb) {
    currentCombination = comb;
    _currentDroid = null;
    startTimer();
    displayCombination(comb);
    displayComboHistory(comb);
    document.getElementById("annotationSection").classList.remove("hidden");
    document.getElementById("saveRecordBtn").disabled = false;

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

    setTimeout(() => {
      const el = document.getElementById("combinationDisplay");
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (el) el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }, 80);
  }

  function handleGenerate() {
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
  }

  function handleLoadManualCombo() {
    const char1    = document.getElementById("manualChar1").value;
    const char2    = document.getElementById("manualChar2").value;
    const scenario = document.getElementById("manualScenario").value;
    if (char1 === char2) { toast("Select two different characters.", "error"); return; }
    loadCombination({ characters: [char1, char2], scenario });
  }

  function handleSaveRecord() {
    if (!currentCombination) return;
    const result     = document.getElementById("result").value;
    const difficulty = document.getElementById("difficulty").value;
    const playtime = getCurrentElapsed();
    stopTimer();
    records.push({
      characters: currentCombination.characters,
      scenario:   currentCombination.scenario,
      result,
      difficulty,
      playtime,
      timestamp: new Date().toLocaleString(),
      ...(_currentDroid ? { droid: _currentDroid } : {})
    });
    try { localStorage.setItem("lastResult", result); localStorage.setItem("lastDifficulty", difficulty); } catch(e) {}
    saveRecords();
    document.getElementById("saveRecordBtn").disabled = true;
    displayCombination(currentCombination);
    displayComboHistory(currentCombination);
    toast("Record saved!");
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
    toast("Exported successfully!");
  }

  let _pendingImport = null;

  document.getElementById("importFile").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!Array.isArray(parsed)) { toast("Invalid file format.", "error"); return; }
        const valid   = parsed.filter(isValidRecord);
        const skipped = parsed.length - valid.length;
        if (valid.length === 0) { toast("No valid records found in file.", "error"); return; }
        _pendingImport = { valid, skipped };
        const skipNote = skipped > 0 ? ` ${skipped} invalid record(s) will be skipped.` : "";
        const existing = records.length;
        document.getElementById("importConfirmMsg").textContent =
          `Found ${valid.length} valid record(s).${skipNote} Merge adds them to your ${existing} existing record(s). Replace overwrites them entirely.`;
        openModal("importConfirmModal", "importCancel");
      } catch (err) { toast("Could not read file.", "error"); }
    };
    reader.readAsText(file);
    this.value = "";
  });

  document.getElementById("importCancel").addEventListener("click", closeImportModal);

  document.getElementById("importReplace").addEventListener("click", () => {
    if (!_pendingImport) return;
    const { valid, skipped } = _pendingImport;
    closeImportModal();
    records = valid;
    saveRecords();
    statsDirty = true;
    displayHistory();
    displayUnplayed();
    displayStats();
    if (currentCombination) { displayCombination(currentCombination); displayComboHistory(currentCombination); }
    const msg = skipped > 0
      ? `Replaced records with ${valid.length} imported. ${skipped} skipped (invalid).`
      : `Replaced records with ${valid.length} imported.`;
    toast(msg);
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
    let msg = `Merged ${toAdd.length} new record(s).`;
    if (dupes   > 0) msg += ` ${dupes} duplicate(s) skipped.`;
    if (skipped > 0) msg += ` ${skipped} invalid skipped.`;
    toast(msg);
  });

  document.getElementById("restartCancel").addEventListener("click", closeRestartModal);
  document.getElementById("restartConfirm").addEventListener("click", () => {
    closeRestartModal();
    startTimer();
  });

  document.getElementById("clearDataBtn").addEventListener("click", () => openModal("confirmModal", "modalCancel"));
  document.getElementById("modalCancel").addEventListener("click", closeConfirmModal);
  document.getElementById("modalConfirm").addEventListener("click", () => {
    records = [];
    saveRecords();
    displayHistory();
    displayUnplayed();
    displayStats();
    if (currentCombination) { displayCombination(currentCombination); displayComboHistory(currentCombination); }
    closeConfirmModal();
    toast("All records cleared.");
  });

  document.getElementById("szAbandonCancel").addEventListener("click", () => closeModal("szAbandonModal"));
  document.getElementById("szAbandonConfirm").addEventListener("click", () => { closeModal("szAbandonModal"); szAbandon(); });
  document.getElementById("szAbandonModal").addEventListener("click", e => { if (e.target === e.currentTarget) closeModal("szAbandonModal"); });

  document.getElementById("deleteRecordCancel").addEventListener("click", closeDeleteModal);
  document.getElementById("deleteRecordConfirm").addEventListener("click", () => {
    const idx = _pendingDeleteIdx;
    const cb  = _deleteCallback;
    closeDeleteModal();
    if (idx == null) return;
    records.splice(idx, 1);
    saveRecords();
    if (cb) cb();
  });

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
  }

  function _diceFlip(i) {
    if (_diceRolling) return;
    _diceValues[i] = 7 - _diceValues[i];
    const die = document.getElementById(`die${i}`);
    die.dataset.val = _diceValues[i];
    die.setAttribute("aria-label",
      `Die ${i + 1}, value ${_diceValues[i]}, ${_diceLocked[i] ? "locked" : "unlocked"}`);
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
    let frame = 0;
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
      }
    }, 60);
  }

  function openDiceModal() {
    // Always reset to a clean normal-mode state when opening.
    if (_diceInterval) { clearInterval(_diceInterval); _diceInterval = null; _diceRolling = false; }
    _diceMode   = "normal";
    _diceLocked = [false, false];
    [0, 1].forEach(i => document.getElementById(`die${i}`).classList.remove("locked"));
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
      };
      (closers[overlay.id] || (() => closeModal(overlay.id)))();
      return;
    }

    if (e.key === "Tab") {
      const box = overlay.querySelector(".modal-box, .settings-box, .faq-box, .rules-box, .dice-box");
      if (!box) return;
      const focusable = [...box.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, a[href], [tabindex]:not([tabindex="-1"])'
      )];
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

  const SYZYGY1_RANKS = [
    { rank: "LEGENDS",   desc: "Word spreads across the galaxy. There's apparently a song.",        wins: 3, maxLosses: 0 },
    { rank: "FREE",      desc: "Debt paid off. Where's your next adventure?",                       wins: 3, maxLosses: 1 },
    { rank: "ALIVE",     desc: "The Grosksh aren't about to waste a perfectly good servant.",        wins: 2 },
    { rank: "GROSKSH'D", desc: "Not the best outcome, all things considered." }
  ];
  const SYZYGY2_RANKS = [
    { rank: "LOADED",            desc: "The only thing that slowed you down was all the loot you brought home.", wins: 3, maxLosses: 0 },
    { rank: "SAFE",              desc: "Home with one nifty new scar.",                                          wins: 3, maxLosses: 1 },
    { rank: "BACK TO SQUARE ONE",desc: "Home, broken, and broke, but home.",                                     wins: 1, maxLosses: 2 },
    { rank: "LOST IN THE UNIVERSE", desc: "The universe is a big place. Someone will find you eventually." }
  ];

  let _sz = null;           // active campaign object
  let _szMode   = null;     // setup: "syzygy1" | "syzygy2"
  let _szChars  = [];       // setup: selected character names

  // Guards against an old or hand-edited saved campaign crashing the SYZYGY tab on every visit.
  function isValidSz(c) {
    const isCounts = a => Array.isArray(a) && a.length === 3 && a.every(x => x && Number.isFinite(x.energy) && Number.isFinite(x.health));
    return !!c && typeof c === "object" &&
      (c.mode === "syzygy1" || c.mode === "syzygy2") &&
      Array.isArray(c.characters) && c.characters.length === 3 &&
      Array.isArray(c.removed) && c.removed.length === 3 &&
      isCounts(c.carryover) &&
      Array.isArray(c.scenarios) && c.scenarios.length >= 3 &&
      Array.isArray(c.stageResults) &&
      Number.isInteger(c.stage) && Number.isInteger(c.losses);
  }

  (function loadSzCampaign() {
    try {
      const raw = localStorage.getItem("syzygyCampaign");
      _sz = raw ? JSON.parse(raw) : null;
      if (_sz && !isValidSz(_sz)) {
        _sz = null;
        setTimeout(() => toast("A saved SYZYGY campaign could not be read and was reset.", "error"), 500);
      }
    } catch(e) { _sz = null; }
  })();

  function saveSz() {
    try {
      if (_sz) localStorage.setItem("syzygyCampaign", JSON.stringify(_sz));
      else     localStorage.removeItem("syzygyCampaign");
    } catch(e) {}
  }

  function szActivePlayers() {
    const alive = [0,1,2].filter(i => !_sz.removed[i]);
    if (alive.length < 2) return alive;
    const benchSlot = _sz.stage % alive.length;
    return alive.filter((_, i) => i !== benchSlot);
  }

  function szBenchedPlayer() {
    const alive = [0,1,2].filter(i => !_sz.removed[i]);
    if (alive.length < 2) return null;
    return alive[_sz.stage % alive.length];
  }

  function szCurrentScenario() {
    if (!_sz) return null;
    const { mode, stage, branchChosen, scenarios } = _sz;
    if (mode === "syzygy1") {
      if (stage === 0) return scenarios[0];
      if (stage === 1) return branchChosen === null ? null : (branchChosen === 0 ? scenarios[1] : scenarios[2]);
      if (stage === 2) return scenarios[3];
    }
    return scenarios[stage] || null;
  }

  function szCalcRank() {
    const c = _sz;
    const wins   = c.stageResults.filter(r => r.result === "Win").length;
    const losses = c.losses;
    const table  = c.mode === "syzygy1" ? SYZYGY1_RANKS : SYZYGY2_RANKS;
    for (const entry of table) {
      if (entry.wins    !== undefined && wins < entry.wins)          continue;
      if (entry.maxLosses !== undefined && losses > entry.maxLosses) continue;
      return { rank: entry.rank, desc: entry.desc };
    }
    return table[table.length - 1];
  }

  function szStart(mode, chars) {
    const s1Scenarios = shuffle([...CONTENT_PACKS.find(p => p.id === "series1").scenarios]);
    let picked;
    if (mode === "syzygy1") {
      picked = s1Scenarios.slice(0, 4); // A, B, C, D
    } else {
      picked = shuffle([...scenarios]).slice(0, 3);
    }
    _sz = {
      mode,
      characters: chars,
      removed:   [false, false, false],
      stage:      0,
      branchChosen: null,
      scenarios:  picked,
      carryover:  [{energy:0,health:0},{energy:0,health:0},{energy:0,health:0}],
      alloc:      null,
      stageResults: [],
      losses:     0,
      retrying:   false,
      started:    new Date().toLocaleString(),
      completed:  false,
      finalRank:  null
    };
    saveSz();
    renderSz();
  }

  function szRecordOutcome(result) {
    const c   = _sz;
    const sc  = szCurrentScenario();
    const playing = szActivePlayers();
    c.stageResults.push({ stage: c.stage, scenario: sc, chars: playing, result, ts: new Date().toLocaleString() });

    if (result === "Win") {
      c.retrying = false;
      if (c.mode === "syzygy1") {
        c.stage = c.stage === 1 ? 2 : c.stage + 1;
      } else {
        c.stage++;
      }
    } else {
      c.losses++;
      if (c.mode === "syzygy2") c.stage++; // red-arrow path still advances
      c.retrying = true;
    }

    c.alloc = null;

    const totalStages = c.mode === "syzygy1" ? 3 : 3;
    const tooManyLosses = c.losses >= 2;
    if (c.stage >= totalStages || tooManyLosses) {
      c.completed  = true;
      c.finalRank  = szCalcRank();
      c.retrying   = false;
    }
    saveSz();
    renderSz();
  }

  function szAbandon() {
    _sz = null;
    saveSz();
    renderSz();
  }

  // ─── SYZYGY Render ──────────────────────────────────────────────────────────

  function renderSz() {
    const el = document.getElementById("syzygyCampaignContent");
    if (!el) return;
    if (!_sz)             szRenderSetup(el);
    else if (_sz.completed) szRenderComplete(el);
    else                  szRenderActive(el);
  }

  function szRenderSetup(el) {
    const hasSeries1 = enabledPacks.has("series1");
    const hasSeries2 = enabledPacks.has("series1") || enabledPacks.has("series2");
    const allChars   = characters;

    const modeHTML = `
      <div class="syzygy-mode-cards">
        <div class="syzygy-mode-card${!hasSeries1 ? " disabled" : ""}${_szMode === "syzygy1" ? " selected" : ""}" id="szSel1" role="button" aria-pressed="${_szMode === "syzygy1"}" aria-disabled="${!hasSeries1}" tabindex="${hasSeries1 ? "0" : "-1"}">
          <div class="syzygy-mode-card-title">SYZYGY I</div>
          <div class="syzygy-mode-card-desc">4-scenario campaign. Pay off your debt to the Grosksh.${!hasSeries1 ? "<br><em>Requires Series 1</em>" : ""}</div>
        </div>
        <div class="syzygy-mode-card${!hasSeries2 ? " disabled" : ""}${_szMode === "syzygy2" ? " selected" : ""}" id="szSel2" role="button" aria-pressed="${_szMode === "syzygy2"}" aria-disabled="${!hasSeries2}" tabindex="${hasSeries2 ? "0" : "-1"}">
          <div class="syzygy-mode-card-title">SYZYGY II</div>
          <div class="syzygy-mode-card-desc">3-scenario campaign. Stranded across the universe — find your way home.</div>
        </div>
      </div>`;

    let charHTML = "";
    if (_szMode) {
      const selClasses = ["", "sel-1", "sel-2", "sel-3"];
      charHTML = `
        <p class="section-heading">Choose 3 Characters</p>
        <div class="syzygy-char-grid">
          ${allChars.map(c => {
            const si = _szChars.indexOf(c);
            const cls = si >= 0 ? " " + selClasses[si + 1] : "";
            const num = si >= 0 ? `<span style="display:block;font-size:9px;color:var(--accent-orange);margin-top:2px;">${si + 1}</span>` : "";
            return `<button class="syzygy-char-btn${cls}" data-char="${esc(c)}" aria-pressed="${si >= 0}">${esc(c)}${num}</button>`;
          }).join("")}
        </div>
        <p style="font-size:12px;color:var(--text-muted);text-align:center;margin-bottom:16px;">${_szChars.length}/3 selected</p>`;
    }

    const canStart = _szMode && _szChars.length === 3;
    el.innerHTML = `
      <div class="panel">
        <p class="panel-title">SYZYGY Mode</p>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;line-height:1.6;">A multi-scenario cooperative campaign. Three characters work together across linked missions with health and resources carrying over between scenarios.</p>
        ${modeHTML}
        ${charHTML}
        <button class="btn btn-primary" id="szStartBtn"${canStart ? "" : " disabled"} style="${canStart ? "" : "opacity:0.4;"}">Begin Campaign</button>
      </div>`;

    const sel1 = document.getElementById("szSel1");
    const sel2 = document.getElementById("szSel2");
    function pickMode(m) { _szMode = m; _szChars = []; renderSz(); }
    if (sel1 && hasSeries1) { sel1.addEventListener("click", () => pickMode("syzygy1")); sel1.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); sel1.click(); } }); }
    if (sel2 && hasSeries2) { sel2.addEventListener("click", () => pickMode("syzygy2")); sel2.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); sel2.click(); } }); }

    el.querySelectorAll(".syzygy-char-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const ch  = btn.dataset.char;
        const idx = _szChars.indexOf(ch);
        if (idx >= 0) { _szChars.splice(idx, 1); }
        else if (_szChars.length < 3) { _szChars.push(ch); }
        else { toast("3 characters already selected — tap one to remove it.", "error"); return; }
        renderSz();
      });
    });

    const startBtn = document.getElementById("szStartBtn");
    if (startBtn && canStart) startBtn.addEventListener("click", () => szStart(_szMode, [..._szChars]));
  }

  function szRenderActive(el) {
    const c = _sz;
    const pool  = c.retrying ? 3 : 5;
    const alloc = c.alloc || { chars: szActivePlayers().map(() => ({energy:0, health:0})) };
    if (!c.alloc) c.alloc = alloc;
    const totalAlloced = alloc.chars.reduce((s, a) => s + a.energy + a.health, 0);
    const remaining    = pool - totalAlloced;
    const playing      = szActivePlayers();
    const benched      = szBenchedPlayer();
    const sc           = szCurrentScenario();
    const modeLabel    = c.mode === "syzygy1" ? "SYZYGY Mode I" : "SYZYGY Mode II: Waypoint";

    // Campaign header
    let html = `
      <div class="syzygy-campaign-header">
        <div>
          <div class="syzygy-campaign-title">${modeLabel}</div>
          <div class="syzygy-campaign-meta">Started ${esc(c.started)} · ${c.losses} loss${c.losses !== 1 ? "es" : ""}</div>
        </div>
        <button class="btn btn-danger" id="szAbandonBtn" style="min-height:36px;padding:8px 14px;font-size:9px;">Abandon</button>
      </div>`;

    // Path
    html += `<div class="panel"><p class="panel-title">Campaign Path</p><div class="syzygy-path">`;
    if (c.mode === "syzygy1") {
      const stageDefs = [
        { key: 0, label: "A",   sc: c.scenarios[0] },
        { key: 1, label: "B/C", sc: c.branchChosen === null ? "Choose…" : (c.branchChosen === 0 ? c.scenarios[1] : c.scenarios[2]) },
        { key: 2, label: "D",   sc: c.scenarios[3] }
      ];
      stageDefs.forEach((s, i) => {
        const res        = c.stageResults.filter(r => r.stage === s.key).slice(-1)[0];
        const stateClass = !res ? (c.stage === s.key ? "current" : "") : (res.result === "Win" ? "win" : "loss");
        const arrow      = i < stageDefs.length - 1 ? `<div class="syzygy-path-arrow">→</div>` : "";
        html += `<div class="syzygy-path-node"><div class="syzygy-path-stage ${stateClass}">${esc(s.label)}</div><div class="syzygy-path-label">${esc(s.sc.replace(/!$/,""))}</div></div>${arrow}`;
      });
    } else {
      c.scenarios.forEach((scenName, i) => {
        const res        = c.stageResults.filter(r => r.stage === i).slice(-1)[0];
        const stateClass = !res ? (c.stage === i ? "current" : "") : (res.result === "Win" ? "win" : "loss");
        const arrow      = i < c.scenarios.length - 1 ? `<div class="syzygy-path-arrow">→</div>` : "";
        html += `<div class="syzygy-path-node"><div class="syzygy-path-stage ${stateClass}">${i+1}</div><div class="syzygy-path-label">${esc(scenName.replace(/!$/,""))}</div></div>${arrow}`;
      });
    }
    html += `</div></div>`;

    // Roster
    html += `<div class="panel"><p class="panel-title">Roster</p><div class="syzygy-roster">`;
    c.characters.forEach((name, i) => {
      const isPlaying = playing.includes(i);
      const isBenched = benched === i;
      const isRemoved = c.removed[i];
      const cardClass  = isRemoved ? "removed" : (isPlaying ? "playing" : "benched");
      const roleClass  = isRemoved ? "role-removed" : (isPlaying ? "role-playing" : "role-benched");
      const roleText   = isRemoved ? "Eliminated" : (isPlaying ? "Playing" : "Benched · heals");
      const co = c.carryover[i];
      const coText = (co.energy > 0 || co.health > 0) ? `❤️ ${co.health} ⚡ ${co.energy} carry` : "";
      html += `<div class="syzygy-char-card ${cardClass}"><div class="syzygy-char-name">${esc(name)}</div><div class="syzygy-char-role ${roleClass}">${esc(roleText)}</div>${coText ? `<div class="syzygy-char-carryover">${esc(coText)}</div>` : ""}</div>`;
    });
    html += `</div></div>`;

    // Branch choice (SYZYGY I stage 1 only, before branch is picked)
    if (c.mode === "syzygy1" && c.stage === 1 && c.branchChosen === null) {
      html += `
        <div class="panel">
          <p class="panel-title">Choose Your Path</p>
          <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">Pick one scenario for Stage B/C. You play only the one you choose.</p>
          <div class="syzygy-branch-cards">
            <div class="syzygy-branch-card" id="szBranchL">
              <div class="syzygy-branch-tag">Option B</div>
              <div class="syzygy-branch-name">${scenarioHTML(c.scenarios[1])}</div>
            </div>
            <div class="syzygy-branch-card" id="szBranchR">
              <div class="syzygy-branch-tag">Option C</div>
              <div class="syzygy-branch-name">${scenarioHTML(c.scenarios[2])}</div>
            </div>
          </div>
        </div>`;
    } else if (sc) {
      // Stage label
      const stageLabel = c.mode === "syzygy1"
        ? ["Stage A — First Mission", "Stage B/C — Branch", "Stage D — Final"][c.stage] || "Stage"
        : `Scenario ${c.stage + 1} of 3`;

      const playingNames  = playing.map(i => c.characters[i]);
      const benchedName   = benched !== null ? c.characters[benched] : null;

      // Scenario card
      html += `
        <div class="syzygy-scenario-card">
          <div class="syzygy-stage-label">${esc(stageLabel)}</div>
          <div class="syzygy-stage-scenario">${scenarioHTML(sc)}</div>
          <div style="font-size:12px;color:var(--text-muted);">Playing: <strong>${playingNames.map(esc).join(" &amp; ")}</strong>${benchedName ? ` · Benched: ${esc(benchedName)} (heals)` : ""}</div>
          ${c.retrying ? `<div class="notice" style="margin-top:10px;color:var(--loss-color);border-color:rgba(255,68,85,0.3);">Retry — only 3 resource points this attempt</div>` : ""}
        </div>`;

      // Pre-scenario resources
      const resRows = playing.map((ci, i) => {
        const name = c.characters[ci];
        const a    = alloc.chars[i];
        const co   = c.carryover[ci];
        return `
          <div class="syzygy-resource-row">
            <div class="syzygy-resource-char">
              <div style="font-weight:600;">${esc(name)}</div>
              ${co.energy > 0 || co.health > 0 ? `<div style="font-size:11px;color:var(--text-dim);">Carryover: ❤️ ${co.health} ⚡ ${co.energy}</div>` : ""}
            </div>
            <div class="syzygy-resource-controls">
              <span class="syzygy-resource-label">❤️</span>
              <div class="syzygy-stepper">
                <button class="btn-sz-step" data-ai="${i}" data-t="health" data-d="-1"${a.health <= 0 ? " disabled" : ""}>−</button>
                <span class="sz-step-val">${a.health}</span>
                <button class="btn-sz-step" data-ai="${i}" data-t="health" data-d="1"${remaining <= 0 ? " disabled" : ""}>+</button>
              </div>
              <span class="syzygy-resource-label">⚡</span>
              <div class="syzygy-stepper">
                <button class="btn-sz-step" data-ai="${i}" data-t="energy" data-d="-1"${a.energy <= 0 ? " disabled" : ""}>−</button>
                <span class="sz-step-val">${a.energy}</span>
                <button class="btn-sz-step" data-ai="${i}" data-t="energy" data-d="1"${remaining <= 0 ? " disabled" : ""}>+</button>
              </div>
            </div>
          </div>`;
      }).join("");

      html += `
        <div class="panel">
          <p class="panel-title">Pre-Scenario Resources</p>
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">Distribute <strong>${pool}</strong> points as ❤️ Health or ⚡ Energy. Cannot exceed the max ⚡ shown on the scenario card.</p>
          ${resRows}
          <div class="syzygy-pool-bar">${remaining} point${remaining !== 1 ? "s" : ""} remaining</div>
        </div>`;

      // Carryover tracking
      const coRows = playing.map(ci => {
        const name = c.characters[ci];
        const co   = c.carryover[ci];
        return `
          <div class="syzygy-carryover-row">
            <span class="syzygy-carryover-name">${esc(name)}</span>
            <span>❤️</span>
            <div class="syzygy-stepper" style="gap:3px;">
              <button class="btn-sz-step" data-ci="${ci}" data-ct="health" data-cd="-1" style="width:24px;height:24px;font-size:13px;"${co.health <= 0 ? " disabled" : ""}>−</button>
              <span class="sz-step-val" style="font-size:13px;min-width:18px;">${co.health}</span>
              <button class="btn-sz-step" data-ci="${ci}" data-ct="health" data-cd="1" style="width:24px;height:24px;font-size:13px;">+</button>
            </div>
            <span>⚡</span>
            <div class="syzygy-stepper" style="gap:3px;">
              <button class="btn-sz-step" data-ci="${ci}" data-ct="energy" data-cd="-1" style="width:24px;height:24px;font-size:13px;"${co.energy <= 0 ? " disabled" : ""}>−</button>
              <span class="sz-step-val" style="font-size:13px;min-width:18px;">${co.energy}</span>
              <button class="btn-sz-step" data-ci="${ci}" data-ct="energy" data-cd="1" style="width:24px;height:24px;font-size:13px;">+</button>
            </div>
          </div>`;
      }).join("");

      html += `
        <div class="panel">
          <p class="panel-title">Outcome</p>
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">After the scenario, note any unused ❤️ and ⚡ — both carry over to the next stage.</p>
          ${coRows}
          <div class="syzygy-outcome-btns">
            <button class="btn-sz-win"  id="szWinBtn">✓ Victory</button>
            <button class="btn-sz-loss" id="szLossBtn">✗ Defeat</button>
          </div>
        </div>`;
    }

    el.innerHTML = html;

    // Events
    document.getElementById("szAbandonBtn").addEventListener("click", () => {
      openModal("szAbandonModal", "szAbandonCancel");
    });

    const branchL = document.getElementById("szBranchL");
    const branchR = document.getElementById("szBranchR");
    if (branchL) branchL.addEventListener("click", () => { c.branchChosen = 0; saveSz(); renderSz(); });
    if (branchR) branchR.addEventListener("click", () => { c.branchChosen = 1; saveSz(); renderSz(); });

    // Allocation steppers (data-ai, data-t, data-d)
    el.querySelectorAll("[data-ai]").forEach(btn => {
      btn.addEventListener("click", () => {
        const ai  = parseInt(btn.dataset.ai);
        const t   = btn.dataset.t;
        const dir = parseInt(btn.dataset.d);
        const tot = c.alloc.chars.reduce((s, a) => s + a.energy + a.health, 0);
        if (dir > 0 && (pool - tot) <= 0) return;
        if (dir < 0 && c.alloc.chars[ai][t] <= 0) return;
        c.alloc.chars[ai][t] += dir;
        saveSz(); renderSz();
      });
    });

    // Carryover steppers (data-ci, data-ct, data-cd)
    el.querySelectorAll("[data-ci]").forEach(btn => {
      btn.addEventListener("click", () => {
        const ci  = parseInt(btn.dataset.ci);
        const t   = btn.dataset.ct;
        const dir = parseInt(btn.dataset.cd);
        if (dir < 0 && c.carryover[ci][t] <= 0) return;
        c.carryover[ci][t] = Math.max(0, c.carryover[ci][t] + dir);
        saveSz(); renderSz();
      });
    });

    const winBtn  = document.getElementById("szWinBtn");
    const lossBtn = document.getElementById("szLossBtn");
    if (winBtn)  winBtn .addEventListener("click", () => szRecordOutcome("Win"));
    if (lossBtn) lossBtn.addEventListener("click", () => szRecordOutcome("Loss"));
  }

  function szRenderComplete(el) {
    const c     = _sz;
    const rank  = c.finalRank || szCalcRank();
    const wins  = c.stageResults.filter(r => r.result === "Win").length;
    const modeLabel = c.mode === "syzygy1" ? "SYZYGY Mode I" : "SYZYGY Mode II: Waypoint";
    const goodRanks = new Set(["LEGENDS","FREE","LOADED","SAFE"]);
    const rankColor = goodRanks.has(rank.rank) ? (rank.rank === "LEGENDS" || rank.rank === "LOADED" ? "var(--accent-yellow)" : "var(--accent-teal)") : "var(--loss-color)";

    const histRows = c.stageResults.map(r =>
      `<tr>
        <td style="font-size:12px;color:var(--text-muted);">${esc(r.scenario)}</td>
        <td style="font-size:12px;color:var(--text-muted);">${r.chars.map(i => c.characters[i]).map(esc).join(" &amp; ")}</td>
        <td><span class="result-pill ${r.result === "Win" ? "win" : "loss"}">${esc(r.result)}</span></td>
      </tr>`
    ).join("");

    el.innerHTML = `
      <div class="panel">
        <p class="panel-title">${modeLabel} — Complete</p>
        <div class="syzygy-rank-card">
          <div class="syzygy-rank-eyebrow">Final Rank</div>
          <div class="syzygy-rank-value" style="color:${rankColor};">${esc(rank.rank)}</div>
          <div class="syzygy-rank-desc">${esc(rank.desc)}</div>
          <div class="syzygy-rank-stats">
            <div><div class="syzygy-rank-stat-val">${wins}</div><div class="syzygy-rank-stat-label">Wins</div></div>
            <div><div class="syzygy-rank-stat-val">${c.losses}</div><div class="syzygy-rank-stat-label">Losses</div></div>
            <div><div class="syzygy-rank-stat-val">${c.stageResults.length}</div><div class="syzygy-rank-stat-label">Scenarios</div></div>
          </div>
        </div>
        <p class="panel-title" style="margin-bottom:10px;">Characters</p>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">${esc(c.characters.join(" · "))}</p>
        ${histRows ? `
        <p class="section-heading">Campaign Log</p>
        <div class="history-table-wrap">
          <table>
            <thead><tr><th>Scenario</th><th>Characters</th><th>Result</th></tr></thead>
            <tbody>${histRows}</tbody>
          </table>
        </div>` : ""}
        <button class="btn btn-primary" id="szNewCampaignBtn" style="margin-top:16px;">Start New Campaign</button>
      </div>`;

    document.getElementById("szNewCampaignBtn").addEventListener("click", () => {
      _sz = null; _szMode = null; _szChars = [];
      saveSz(); renderSz();
    });
  }

  // ─── Init ───────────────────────────────────────────────────────────────────
  document.getElementById("generateBtn")    .addEventListener("click", handleGenerate);
  document.getElementById("lockChar1")      .addEventListener("click", () => { locks.char1    = !locks.char1;    updateLockButtons(); });
  document.getElementById("lockChar2")      .addEventListener("click", () => { locks.char2    = !locks.char2;    updateLockButtons(); });
  document.getElementById("lockScenario")   .addEventListener("click", () => { locks.scenario = !locks.scenario; updateLockButtons(); });
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
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = tabs[(idx + 1) % tabs.length];
      showTab(TAB_NAMES[next.id] || next.id);
      next.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
      showTab(TAB_NAMES[prev.id] || prev.id);
      prev.focus();
    }
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
    [0, 1].forEach(i => { document.getElementById(`die${i}`).dataset.val = _diceValues[i]; });
  });
  document.getElementById("skillCheckBtn")     .addEventListener("click", () => {
    _savedDiceState = { values: [..._diceValues], locked: [..._diceLocked] };
    _diceMode = "skill";
    _diceApplyMode();
    rollDice(false);
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

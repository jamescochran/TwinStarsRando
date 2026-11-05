// Twin Stars Randomizer: Teach Mode, setup checklist and turn-step rail.
// Plain classic script loaded after app.js; uses its globals (track, toast, openModal,
// closeModal, loadCombination, guardUnsaved, characters, scenarios, ...).
// Rules are described in our own words; no card text, art or per-card values. Illustrations
// use only text, CSS boxes and standard Unicode symbols (no image or SVG graphics).
(function () {
  "use strict";

  const TEACH_KEY = "tsr:teach";
  const RAIL_KEY  = "tsr:rail";
  const NOTES_KEY = "tsr:setupNotes";
  const FIRST_SCENARIO = "Escape The Brig!";
  const PNP_BRIG   = "https://boardgamegeek.com/filepage/171071/official-pnp-of-escape-the-brig-scenario";
  const PNP_TRIALS = "https://boardgamegeek.com/filepage/171067/official-pnp-of-master-the-trials-scenario";

  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  const $ = id => document.getElementById(id);

  // ─── Die faces: standard Unicode (U+2680–U+2685), coloured with CSS ───────────
  const DIE_CHARS = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  function die(n, cls) {
    return `<span class="tdie${cls ? " " + cls : ""}" aria-hidden="true">${DIE_CHARS[n - 1] || ""}</span>`;
  }
  const card = (label, cls) => `<span class="tcard${cls ? " " + cls : ""}" aria-hidden="true">${label}</span>`;
  const arrow = sym => `<span class="tarrow" aria-hidden="true">${sym}</span>`;

  // ─── Teach Mode ────────────────────────────────────────────────────────────
  function readTeach() {
    try {
      const v = JSON.parse(lsGet(TEACH_KEY) || "null");
      if (v && ["started", "done", "dismissed"].includes(v.status)) {
        return { status: v.status, step: Number.isInteger(v.step) ? v.step : 0 };
      }
    } catch (e) { /* fall through */ }
    return { status: "new", step: 0 };
  }
  function writeTeach(st) { lsSet(TEACH_KEY, JSON.stringify({ status: st.status, step: st.step })); }

  function firstMissionPair() {
    const owned = Array.isArray(characters) ? characters : [];
    return owned.length >= 2 ? [owned[0], owned[1]] : ["Bood", "Stag Solar"];
  }

  const STEPS = [
    {
      title: "What you need",
      art: () => `${die(3, "c1")}${die(5, "c2")}${die(2, "skill")}${die(6, "skill")}`,
      body: () => `
        <ul class="teach-list">
          <li><strong>One scenario card and two character cards.</strong> A mission is always one scenario and a pair of characters.</li>
          <li><strong>Four six-sided dice</strong> (not in the wallet): two <em>character dice</em> in colour and two <em>skill dice</em>, ideally white.</li>
          <li><strong>Something to track health and energy</strong>, plus a few markers the scenario asks for: coins, tokens or paper clips. You can also count them in the app's Mission Board.</li>
          <li>About 15 minutes and a small table space.</li>
        </ul>`
    },
    {
      title: "Set up",
      art: () => `${card("Primary", "pri")}${card("Scenario", "sc")}${card("Secondary", "sec")}`,
      body: () => `
        <ul class="teach-list">
          <li>Put the scenario card down and read its goal and its combos.</li>
          <li>Place your two characters: the one on the <strong>left is Primary</strong>, the other is Secondary. A few scenarios treat them differently.</li>
          <li>Set health and <strong>energy for your difficulty</strong> (Easy, Medium or Hard) as the scenario card shows, and lay out its markers.</li>
          <li>New to the game? Start with <strong>Escape the Brig</strong>: it is the tutorial scenario. Master the Trials is the Series II one.</li>
        </ul>
        <p class="teach-tip">Every mission card in this app has an optional <strong>Setup checklist</strong> to walk you through this.</p>`
    },
    {
      title: "Roll, then place one at a time",
      art: () => `${die(3, "c1")}${die(5, "c2")}${arrow("→")}${card("Primary", "pri")}${card("Secondary", "sec")}`,
      body: () => `
        <ul class="teach-list">
          <li>Roll both character dice. Then decide which die goes on which character: each character gets exactly one, on the spot matching its number.</li>
          <li>Place them <strong>one at a time</strong>; the order matters. As each die lands, the ability on that spot happens: an <strong>instant</strong> is optional, an <strong>effect</strong> is required.</li>
        </ul>`
    },
    {
      title: "Check for a combo",
      art: () => `${die(3, "c1")}<span class="tplus" aria-hidden="true">+</span>${die(5, "c2")}${arrow("=")}<span class="tbadge" aria-hidden="true">Combo!</span>`,
      body: () => `
        <ul class="teach-list">
          <li>With both dice placed, look at the icons they sit on. If they match a combo listed on the scenario card, you <strong>must</strong> take that action (if two are possible, you choose one).</li>
          <li>Then pick up both dice and roll again. Only one combo per roll.</li>
        </ul>`
    },
    {
      title: "No combo? Reduce, then re-roll",
      art: () => `${die(4, "c1")}${arrow("↓")}${die(3, "c1")}<span class="tgap" aria-hidden="true"></span>${die(5, "c2 faded")}${arrow("↻")}`,
      body: () => `
        <ul class="teach-list">
          <li>Move one die <strong>down by one</strong> on its character. Landing there by reduction does not trigger instants or effects; instead a <strong>reaction</strong> (optional) or <strong>fatigue</strong> (required) on that spot happens.</li>
          <li>Then take the other die back, roll it and place it (its instant or effect does happen), and check for a combo again. Repeat until a combo comes up.</li>
        </ul>`
    },
    {
      title: "Easy to forget",
      art: () => `${die(1, "c1")}${arrow("↓")}<span class="tbadge warn" aria-hidden="true">⚠⚠</span><span class="tgap" aria-hidden="true"></span>${die(2, "skill")}${die(6, "skill")}`,
      body: () => `
        <ul class="teach-list">
          <li><strong>Below 1 means ⚠⚠.</strong> If anything would push a die below 1, you take the scenario's ⚠⚠ combo instead.</li>
          <li><strong>Spend 1 energy to re-roll one die</strong>, at any time: a character die, a skill die or a scenario die.</li>
          <li><strong>Skill checks:</strong> when told to, roll the two skill dice and give one to each character. Both must land in that character's range, or you take the penalty shown.</li>
          <li>Keep going until you reach the scenario's goal, hit its loss condition, or a character drops to 0 health.</li>
        </ul>`
    },
    {
      title: "Your first mission",
      art: () => `${card("Escape the Brig", "sc wide")}`,
      body: () => {
        const [a, b] = firstMissionPair();
        const owned = Array.isArray(scenarios) && scenarios.includes(FIRST_SCENARIO);
        return `
        <p class="teach-lead">Ready? Load <strong>Escape the Brig</strong> with <strong>${esc(a)}</strong> (Primary) and <strong>${esc(b)}</strong> (Secondary) from your collection, on Easy. The timer starts and the Dice Roller is under the timer.</p>
        ${owned ? "" : `<p class="teach-note">Escape the Brig isn't in your collection. You can print the free official version below and still log the game here.</p>`}
        <button type="button" class="btn btn-primary" id="teachStartMission">Start your first mission</button>
        <h3 class="tips-section-heading">Free official print-and-play</h3>
        <ul class="teach-links">
          <li><a class="link-inline link-teal" href="${PNP_BRIG}" target="_blank" rel="noopener noreferrer">Escape the Brig (BoardGameGeek)</a></li>
          <li><a class="link-inline link-teal" href="${PNP_TRIALS}" target="_blank" rel="noopener noreferrer">Master the Trials (BoardGameGeek)</a></li>
        </ul>
        <h3 class="tips-section-heading">Rules</h3>
        <ul class="teach-links">
          <li><button type="button" class="teach-linkbtn" id="teachOpenRules">Open the rulebooks in the app</button></li>
          <li><button type="button" class="teach-linkbtn" id="teachOpenFaq">Rules FAQ: common questions</button></li>
          <li><a class="link-inline link-teal" href="https://buttonshygames.com/pages/twin-stars" target="_blank" rel="noopener noreferrer">Official rules and game page (Button Shy)</a></li>
        </ul>`;
      }
    }
  ];

  let _step = 0;

  function buildTeachModal() {
    if ($("teachModal")) return;
    const ov = document.createElement("div");
    ov.className = "modal-overlay";
    ov.id = "teachModal";
    ov.innerHTML = `
      <div class="modal-box teach-box" role="dialog" aria-modal="true" aria-labelledby="teachModalTitle">
        <div class="dialog-header">
          <h2 id="teachModalTitle">Learn to play</h2>
          <button type="button" class="dialog-close" id="teachClose" aria-label="Close tutorial (you can resume it later)">✕</button>
        </div>
        <div class="teach-progress-row">
          <p class="teach-progress" id="teachProgress"></p>
          <button type="button" class="teach-skip" id="teachSkip">Skip tutorial</button>
        </div>
        <div class="teach-dots" id="teachDots" aria-hidden="true"></div>
        <div class="teach-body" id="teachBody"></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="teachBack">Back</button>
          <button type="button" class="btn btn-secondary teach-next" id="teachNext">Next</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    $("teachClose").addEventListener("click", closeTeach);
    ov.addEventListener("click", e => { if (e.target === ov) closeTeach(); });
    $("teachSkip").addEventListener("click", skipTeach);
    $("teachBack").addEventListener("click", () => goStep(_step - 1));
    $("teachNext").addEventListener("click", () => {
      if (_step >= STEPS.length - 1) finishTeach();
      else goStep(_step + 1);
    });
    // Escape goes through app.js's generic closeModal; keep the resume prompt in sync.
    new MutationObserver(renderResume).observe(ov, { attributes: true, attributeFilter: ["class"] });
  }

  function renderStep(focus) {
    const s = STEPS[_step];
    $("teachProgress").textContent = `Step ${_step + 1} of ${STEPS.length}`;
    $("teachDots").innerHTML = STEPS.map((_, i) => `<span class="${i === _step ? "on" : i < _step ? "done" : ""}"></span>`).join("");
    $("teachBody").innerHTML = `
      <h3 class="teach-step-title" id="teachStepTitle" tabindex="-1">${esc(s.title)}</h3>
      <div class="teach-art">${s.art()}</div>
      ${s.body()}`;
    $("teachBack").disabled = _step === 0;
    const last = _step === STEPS.length - 1;
    $("teachNext").textContent = last ? "Finish" : "Next";
    const start = $("teachStartMission");
    if (start) start.addEventListener("click", startFirstMission);
    const rules = $("teachOpenRules");
    if (rules) rules.addEventListener("click", () => { closeModal("teachModal"); openRules(); });
    const faq = $("teachOpenFaq");
    if (faq) faq.addEventListener("click", () => { closeModal("teachModal"); openFaq("faq-sc-01"); });
    $("teachBody").scrollTop = 0;
    if (focus) $("teachStepTitle").focus({ preventScroll: true });
  }

  function goStep(n) {
    _step = Math.max(0, Math.min(STEPS.length - 1, n));
    const st = readTeach();
    if (st.status === "started") writeTeach({ status: "started", step: _step });
    renderStep(true);
  }

  function openTeach(source) {
    buildTeachModal();
    const st = readTeach();
    if (st.status === "started") {
      _step = Math.min(st.step, STEPS.length - 1);
    } else {
      _step = 0;
      // Re-opening a finished/dismissed tutorial from Tips is fine, but it never re-arms the prompts.
      if (st.status === "new") writeTeach({ status: "started", step: 0 });
      track("teach_start", { source: source === "tip" || source === "tips" || source === "resume" ? source : "other" });
    }
    openModal("teachModal", "teachStepTitle");
    renderStep(false);
    $("teachStepTitle").focus({ preventScroll: true });
    renderResume();
  }

  function closeTeach() { closeModal("teachModal"); renderResume(); }

  function skipTeach() {
    const st = readTeach();
    if (st.status !== "done") writeTeach({ status: "dismissed", step: _step });
    closeModal("teachModal");
    renderResume();
    toast("Tutorial skipped. It's always in Tips (?) if you want it later.");
  }

  function markDone() {
    const st = readTeach();
    if (st.status !== "done") track("teach_complete", { step: _step + 1 });
    writeTeach({ status: "done", step: STEPS.length - 1 });
  }

  function finishTeach() {
    markDone();
    closeModal("teachModal");
    renderResume();
  }

  function startFirstMission() {
    const [a, b] = firstMissionPair();
    markDone();
    closeModal("teachModal");
    renderResume();
    guardUnsaved(() => {
      showTab("randomizer");
      const diff = $("difficulty");
      if (diff) diff.value = "Easy";
      loadCombination({ characters: [a, b], scenario: FIRST_SCENARIO }, { focusCard: true });
    });
  }

  // Paused tutorial: a small resume prompt at the top of the Randomizer tab.
  function renderResume() {
    const host = document.querySelector("#randomizerPage .rand-col-setup");
    if (!host) return;
    let el = $("teachResume");
    const st = readTeach();
    const modalOpen = $("teachModal") && $("teachModal").classList.contains("open");
    if (st.status !== "started" || modalOpen) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement("div");
      el.id = "teachResume";
      el.className = "teach-resume";
      el.setAttribute("role", "region");
      el.setAttribute("aria-label", "Tutorial");
      host.insertBefore(el, host.firstChild);
    }
    el.innerHTML = `
      <p>Tutorial paused at step ${Math.min(st.step, STEPS.length - 1) + 1} of ${STEPS.length}.</p>
      <button type="button" class="btn btn-secondary btn-compact" id="teachResumeBtn">Resume</button>
      <button type="button" class="teach-resume-x" id="teachResumeDismiss" aria-label="Dismiss tutorial">✕</button>`;
    $("teachResumeBtn").addEventListener("click", () => openTeach("resume"));
    $("teachResumeDismiss").addEventListener("click", () => {
      writeTeach({ status: "dismissed", step: st.step });
      renderResume();
      const gen = $("generateBtn");
      if (gen) gen.focus();
      toast("Tutorial dismissed. It's always in Tips (?) if you want it later.");
    });
  }

  // ─── Setup checklist on the mission card ───────────────────────────────────
  function readNotes() {
    try { const v = JSON.parse(lsGet(NOTES_KEY) || "{}"); return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
    catch (e) { return {}; }
  }
  function saveNote(scenario, text) {
    const notes = readNotes();
    const t = String(text).slice(0, 500);
    if (t.trim()) notes[scenario] = t; else delete notes[scenario];
    return lsSet(NOTES_KEY, JSON.stringify(notes));
  }

  let _setupOpenFor = null; // scenario whose checklist is expanded (survives card re-renders)

  function renderSetup(comb) {
    const box = document.querySelector("#combinationDisplay .combo-display");
    if (!box || !comb) return;
    const [pri, sec] = comb.characters;
    const num = SCENARIO_NUMBER[comb.scenario];
    const note = readNotes()[comb.scenario] || "";
    const diffEl = $("difficulty");
    const diff = diffEl ? diffEl.value : "Medium";
    const d = document.createElement("details");
    d.className = "setup-checklist";
    d.id = "setupChecklist";
    if (_setupOpenFor === comb.scenario) d.open = true;
    d.innerHTML = `
      <summary><span class="setup-summary-title">Setup checklist</span>${note ? `<span class="setup-summary-note"><span class="sr-only">Your note: </span>${esc(note)}</span>` : ""}</summary>
      <ol class="setup-steps">
        <li>Scenario card in the middle: <strong>${esc(pri)}</strong> (Primary) on the left, <strong>${esc(sec)}</strong> (Secondary) on the right.</li>
        <li>Set health, and energy for <strong id="setupDiff">${esc(diff)}</strong>, as the scenario card shows.</li>
        <li>Place the scenario's markers where its card shows.</li>
        <li>Check whether this scenario treats Primary and Secondary differently.</li>
        <li>Take 4 dice: 2 character dice and 2 skill dice.</li>
      </ol>
      <label class="setup-note-label" for="setupNote">My setup note for this scenario <span class="label-optional">(saved on this device)</span></label>
      <textarea id="setupNote" class="notes-input" rows="2" maxlength="500" placeholder="e.g. what trips me up when setting this one up"></textarea>
      <p class="setup-note-status" id="setupNoteStatus" role="status"></p>
      ${num ? `<button type="button" class="teach-linkbtn" id="setupFaqBtn">Commonly asked about Scenario ${num}</button>` : ""}`;
    box.appendChild(d);
    const ta = d.querySelector("#setupNote");
    ta.value = note;
    d.addEventListener("toggle", () => {
      if (d.open) { if (_setupOpenFor !== comb.scenario) track("setup_open"); _setupOpenFor = comb.scenario; }
      else _setupOpenFor = null;
    });
    let timer = null;
    const persist = () => {
      clearTimeout(timer); timer = null;
      const ok = saveNote(comb.scenario, ta.value);
      $("setupNoteStatus").textContent = ok ? (ta.value.trim() ? "Note saved." : "Note cleared.") : "Couldn't save the note (storage unavailable).";
      const sumNote = d.querySelector(".setup-summary-note");
      const v = ta.value.trim();
      if (v && sumNote) sumNote.lastChild.textContent = ta.value;
      else if (v) d.querySelector("summary").insertAdjacentHTML("beforeend", `<span class="setup-summary-note"><span class="sr-only">Your note: </span>${esc(ta.value)}</span>`);
      else if (sumNote) sumNote.remove();
    };
    ta.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(persist, 400); });
    ta.addEventListener("change", persist);
    ta.addEventListener("blur", () => { if (timer) persist(); });
    const fb = d.querySelector("#setupFaqBtn");
    if (fb) fb.addEventListener("click", () => openFaq("faq-sc-" + num));
  }

  document.addEventListener("tsr:combo-rendered", e => renderSetup(e.detail));
  document.addEventListener("tsr:mission-loaded", e => { if (!e.detail || e.detail.scenario !== _setupOpenFor) _setupOpenFor = null; });

  // ─── Turn-step rail (Dice Roller) ──────────────────────────────────────────
  const RAIL_STEPS = [
    { label: "Roll", text: "Roll both character dice (or the one you picked back up)." },
    { label: "Place", text: "Place them one at a time, one per character. As each lands: instant (optional), effect (required)." },
    { label: "Combo?", text: "Both placed: a combo on the scenario card must be taken. Then pick up both dice and roll again." },
    { label: "No combo", text: "Reduce one die by 1: its reaction (optional) or fatigue (required) happens. Then re-roll and place the other die." }
  ];
  let _railStep = 0;

  function railOn() {
    const v = lsGet(RAIL_KEY);
    if (v === "on") return true;
    if (v === "off") return false;
    // Not chosen yet: on for newer players, off for anyone with a long Mission Log.
    return !(Array.isArray(records) && records.length >= 10);
  }

  function setRail(on, opts) {
    lsSet(RAIL_KEY, on ? "on" : "off");
    syncRail();
    track("rail_toggle", { on: !!on });
    if (opts && opts.focus) {
      const t = on ? $("turnRailHide") : $("turnRailShow");
      if (t) t.focus();
    }
  }

  function buildRail() {
    const box = document.querySelector("#diceModal .dice-box");
    if (!box || $("turnRail")) return;
    const sec = document.createElement("section");
    sec.className = "turn-rail";
    sec.id = "turnRail";
    sec.setAttribute("aria-labelledby", "turnRailTitle");
    sec.innerHTML = `
      <div class="turn-rail-head">
        <h3 id="turnRailTitle">Turn steps</h3>
        <button type="button" class="turn-rail-toggle" id="turnRailHide" aria-label="Hide turn steps">Hide</button>
      </div>
      <ol class="turn-rail-steps">
        ${RAIL_STEPS.map((s, i) => `<li><button type="button" class="turn-rail-step" data-rail-step="${i}" aria-describedby="turnRailDetail"><span class="turn-rail-num" aria-hidden="true">${i + 1}</span>${esc(s.label)}</button></li>`).join("")}
      </ol>
      <p class="turn-rail-detail" id="turnRailDetail"></p>
      <ul class="turn-rail-chips">
        <li class="turn-rail-chip warn">Reducing below 1 forces <span aria-hidden="true">⚠⚠</span><span class="sr-only">the double alert combo</span></li>
        <li class="turn-rail-chip">1 energy: re-roll one die</li>
        <li class="turn-rail-chip">Skill check? Both dice must fit</li>
      </ul>`;
    box.appendChild(sec);
    const show = document.createElement("button");
    show.type = "button";
    show.className = "turn-rail-show";
    show.id = "turnRailShow";
    show.textContent = "Show turn steps";
    box.appendChild(show);
    $("turnRailHide").addEventListener("click", () => setRail(false, { focus: true }));
    show.addEventListener("click", () => setRail(true, { focus: true }));
    sec.querySelectorAll("[data-rail-step]").forEach(b => b.addEventListener("click", () => setRailStep(+b.dataset.railStep)));
    syncRail();
  }

  function setRailStep(i) {
    _railStep = i;
    document.querySelectorAll("#turnRail [data-rail-step]").forEach(b => {
      const on = +b.dataset.railStep === i;
      b.classList.toggle("current", on);
      if (on) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
    });
    const d = $("turnRailDetail");
    if (d) d.textContent = RAIL_STEPS[i].text;
  }

  function syncRail() {
    const on = railOn();
    const rail = $("turnRail"), show = $("turnRailShow");
    if (rail) rail.hidden = !on;
    if (show) show.hidden = on;
    const cb = $("railSetting");
    if (cb) cb.checked = on;
    setRailStep(_railStep);
  }

  // A roll (opening the roller rolls too) means the next thing to do is place the dice.
  document.addEventListener("click", e => {
    if (e.target.closest && e.target.closest("#rollBtn, #diceRollerBtn")) setRailStep(1);
  });

  // ─── Wiring ─────────────────────────────────────────────────────────────────
  function init() {
    buildRail();
    renderResume();
    const offer = $("teachOfferBtn");
    if (offer) offer.addEventListener("click", () => { dismissTip(); openTeach("tip"); });
    const fromTips = $("teachTipsBtn");
    if (fromTips) fromTips.addEventListener("click", () => { closeTipsModal(); openTeach("tips"); });
    const cb = $("railSetting");
    if (cb) cb.addEventListener("change", () => setRail(cb.checked));
    const diff = $("difficulty");
    if (diff) diff.addEventListener("change", () => { const s = $("setupDiff"); if (s) s.textContent = diff.value; });
    // A mission card already on screen (none at boot today, but keep it robust).
    if (typeof currentCombination !== "undefined" && currentCombination && !$("setupChecklist")) renderSetup(currentCombination);
    syncRail();
  }
  window.addEventListener("storage", e => { if (e.key === RAIL_KEY) syncRail(); if (e.key === TEACH_KEY) renderResume(); });

  window.tsrTeach = { open: openTeach, state: readTeach };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

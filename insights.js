// Twin Stars Randomizer: Pairing Lab + Gauntlet (insights.js).
// Classic script loaded after app.js; uses its globals (records, characters, scenarios,
// esc, scenarioText, track, toast, loadCombination, locks, ...). Every number shown here
// comes from a pure function in TSInsights (exposed on window for tests).
(function () {
  "use strict";

  // ─── Pure computations ─────────────────────────────────────────────────────
  const SEP = "\x1F";
  const MIN_GAMES = 3;          // pairs with fewer games are marked "few games"
  const LAB_MIN_RECORDS = 3;    // below this the Lab shows an explanation instead

  // Wilson score interval for a win rate (95%). The lower bound is a cautious estimate:
  // 1 win in 1 game gives ~0.21, 8 of 10 gives ~0.49, so small samples don't rank first.
  function wilson(wins, games, z) {
    z = z || 1.96;
    if (!games) return { lower: 0, upper: 0 };
    const p = wins / games, z2 = z * z;
    const centre = p + z2 / (2 * games);
    const margin = z * Math.sqrt(p * (1 - p) / games + z2 / (4 * games * games));
    const d = 1 + z2 / games;
    return { lower: Math.max(0, (centre - margin) / d), upper: Math.min(1, (centre + margin) / d) };
  }
  const wilsonLower = (w, n, z) => wilson(w, n, z).lower;

  function filterByDifficulty(recs, difficulty) {
    return difficulty ? recs.filter(r => r.difficulty === difficulty) : recs.slice();
  }

  // Ordered: [Primary, Secondary] as saved. Unordered: alphabetical.
  function pairOf(r, ordered) {
    const c = [r.characters[0], r.characters[1]];
    return ordered ? c : c.sort((a, b) => a.localeCompare(b));
  }
  const pairKey = pair => pair.join(SEP);

  function tally(map, key, extra, win) {
    let t = map.get(key);
    if (!t) { t = Object.assign({ wins: 0, games: 0 }, extra); map.set(key, t); }
    t.games++; if (win) t.wins++;
    return t;
  }
  function finish(t) {
    const w = wilson(t.wins, t.games);
    return Object.assign(t, { rate: t.games ? t.wins / t.games : 0, lower: w.lower, upper: w.upper, few: t.games < MIN_GAMES });
  }
  // Cautious estimate first; among equals, the one with less evidence against it; then name.
  function byConfidence(a, b) {
    return (b.lower - a.lower) || (b.upper - a.upper) || (b.games - a.games) || String(a.label).localeCompare(String(b.label));
  }

  function pairStats(recs, opts) {
    const ordered = !!(opts && opts.ordered);
    const m = new Map();
    for (const r of recs) {
      const pair = pairOf(r, ordered);
      tally(m, pairKey(pair), { key: pairKey(pair), pair, label: pair.join(" & ") }, r.result === "Win");
    }
    return [...m.values()].map(finish).sort(byConfidence);
  }

  function characterStats(recs) {
    const m = new Map();
    for (const r of recs) for (const c of r.characters) tally(m, c, { character: c, label: c }, r.result === "Win");
    return [...m.values()].map(finish).sort(byConfidence);
  }

  function droidStats(recs) {
    if (!recs.some(r => r.droid)) return [];
    const m = new Map();
    for (const r of recs) {
      const d = r.droid || "";
      tally(m, d, { droid: d || null, label: d || "No droid" }, r.result === "Win");
    }
    return [...m.values()].map(finish).sort(byConfidence);
  }

  // cells[pairKey][scenario] = { wins, games }
  function heatMap(recs, opts) {
    const ordered = !!(opts && opts.ordered);
    const cells = {};
    for (const r of recs) {
      const k = pairKey(pairOf(r, ordered));
      const row = cells[k] || (cells[k] = {});
      const c = row[r.scenario] || (row[r.scenario] = { wins: 0, games: 0 });
      c.games++; if (r.result === "Win") c.wins++;
    }
    return cells;
  }

  function neverBeaten(recs, opts) {
    return pairStats(recs, opts).filter(p => p.wins === 0)
      .sort((a, b) => (b.games - a.games) || a.label.localeCompare(b.label));
  }

  function bestTeamFor(recs, scenario, opts) {
    return pairStats(recs.filter(r => r.scenario === scenario), opts);
  }

  // Unordered pairs played both ways: how each order did.
  function orderEffect(recs) {
    const m = new Map();
    for (const r of recs) {
      const pair = pairOf(r, false), k = pairKey(pair);
      let e = m.get(k);
      if (!e) { e = { pair, ways: {} }; m.set(k, e); }
      const lead = r.characters[0];
      const w = e.ways[lead] || (e.ways[lead] = { primary: lead, secondary: r.characters[1], wins: 0, games: 0 });
      w.games++; if (r.result === "Win") w.wins++;
    }
    return [...m.values()].filter(e => Object.keys(e.ways).length === 2).map(e => {
      const [a, b] = e.pair.map(c => finish(e.ways[c]));
      return { pair: e.pair, a, b, diff: a.rate - b.rate, games: a.games + b.games };
    }).sort((x, y) => (y.games - x.games) || pairKey(x.pair).localeCompare(pairKey(y.pair)));
  }

  // Scenario order for a new gauntlet. "numeric" keeps scenario-number order; "unplayed"
  // puts scenarios this exact team (same Primary/Secondary) has never played first.
  const scNum = s => parseInt((typeof SCENARIO_NUMBER !== "undefined" && SCENARIO_NUMBER[s]) || "99", 10);
  function gauntletOrder(scenarioList, recs, pair, mode) {
    const list = scenarioList.slice().sort((a, b) => scNum(a) - scNum(b));
    if (mode !== "unplayed") return list;
    const played = new Set(recs.filter(r => r.characters[0] === pair[0] && r.characters[1] === pair[1]).map(r => r.scenario));
    return [...list.filter(s => !played.has(s)), ...list.filter(s => played.has(s))];
  }

  // Each scenario's result is the first record of this exact team on that scenario saved
  // after the gauntlet started (one attempt per scenario). Existing links win while their
  // record still exists; a deleted record frees its scenario again.
  function gauntletProgress(g, recs) {
    const byId = new Map(recs.map(r => [r.id, r]));
    const startedAt = g.startedAt || "";
    const links = {};
    const used = new Set();
    for (const s of g.scenarios) {
      const id = g.links && g.links[s];
      const r = id && byId.get(id);
      if (r && r.scenario === s) { links[s] = id; used.add(id); }
    }
    const candidates = recs.filter(r => (r.createdAt || "") >= startedAt &&
      r.characters[0] === g.pair[0] && r.characters[1] === g.pair[1] && !used.has(r.id))
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
    for (const r of candidates) {
      if (g.scenarios.includes(r.scenario) && !links[r.scenario]) { links[r.scenario] = r.id; used.add(r.id); }
    }
    const steps = g.scenarios.map(s => {
      const r = links[s] ? byId.get(links[s]) : null;
      return { scenario: s, state: r ? (r.result === "Win" ? "win" : "loss") : "todo", record: r || null };
    });
    const done = steps.filter(x => x.record);
    const next = steps.find(x => !x.record);
    const diffs = [...new Set(done.map(x => x.record.difficulty))];
    return {
      links, steps,
      played: done.length,
      wins: done.filter(x => x.state === "win").length,
      losses: done.filter(x => x.state === "loss").length,
      total: g.scenarios.length,
      seconds: done.reduce((t, x) => t + (x.record.playtime || 0), 0),
      difficulty: diffs.length === 1 ? diffs[0] : diffs.length ? "Mixed" : null,
      next: next ? next.scenario : null,
      complete: !next,
    };
  }

  function formatDuration(secs) {
    const m = Math.round((secs || 0) / 60);
    if (m < 60) return m < 1 ? "under 1m" : `${m}m`;
    return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
  }

  function gauntletShareText(g, p) {
    const head = ["Twin Stars Gauntlet", g.pair.join(" & "), `${p.wins}/${p.total}`];
    if (p.difficulty && p.difficulty !== "Mixed") head.push(p.difficulty);
    if (p.seconds > 0) head.push(formatDuration(p.seconds));
    const strip = p.steps.map(x => {
      const n = (typeof SCENARIO_NUMBER !== "undefined" && SCENARIO_NUMBER[x.scenario]) || "";
      return `${n || x.scenario}${x.state === "win" ? "✓" : x.state === "loss" ? "✗" : "·"}`;
    }).join(" ");
    return head.join(" · ") + "\n" + strip;
  }

  const pct = r => `${Math.round(r * 100)}%`;
  const ofText = t => `${t.wins} of ${t.games}`;

  window.TSInsights = {
    wilson, wilsonLower, filterByDifficulty, pairStats, characterStats, droidStats, heatMap,
    neverBeaten, bestTeamFor, orderEffect, gauntletOrder, gauntletProgress, gauntletShareText,
    formatDuration, MIN_GAMES, LAB_MIN_RECORDS,
  };

  // ─── UI: shared helpers ─────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const root = $("insightsRoot");
  const bar  = $("gauntletBar");
  if (!root) return;

  const LAB_OPEN_KEY = "tsr:labOpen";
  const G_KEY = "tsr:gauntlet";
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };

  const lab = { open: store.get(LAB_OPEN_KEY) === "1", ordered: false, difficulty: "", bestFor: "", allPairs: false, allRows: false };
  let labDirty = true;

  function pairHTML(pair, ordered) {
    if (!ordered) return `${esc(pair[0])} &amp; ${esc(pair[1])}`;
    return `<span class="sr-only">Primary </span>${esc(pair[0])} <span aria-hidden="true">→</span><span class="sr-only">, Secondary</span> ${esc(pair[1])}`;
  }
  const scNumText = s => (SCENARIO_NUMBER[s] || "");
  function rateClass(t) {
    if (!t || !t.games) return "";
    const r = t.wins / t.games;
    return r >= 2 / 3 ? "ins-hi" : r > 1 / 3 ? "ins-mid" : "ins-lo";
  }
  const fewTag = t => t.few ? ` <span class="ins-few">few games</span>` : "";

  // ─── Pairing Lab ────────────────────────────────────────────────────────────
  function labShell() {
    return `
      <div class="panel" id="pairingLabPanel">
        <h2 class="panel-title" id="pairingLabHeading">Pairing Lab</h2>
        <p class="ins-lede">Which teams work for you: win rates per pair, per scenario and per character.</p>
        <button type="button" class="btn btn-secondary btn-sm ins-toggle" id="labToggle" aria-expanded="${lab.open}" aria-controls="labBody">${lab.open ? "Hide Pairing Lab" : "Open Pairing Lab"}</button>
        <div id="labBody"${lab.open ? "" : " hidden"}></div>
      </div>
      <div class="panel" id="gauntletPanel">
        <h2 class="panel-title" id="gauntletHeading" tabindex="-1">Gauntlet</h2>
        <div id="gauntletBody"></div>
      </div>`;
  }

  function statRowsHTML(list, ordered, opts) {
    return list.map((t, i) => `
      <tr>
        ${opts && opts.rank ? `<td class="ins-num">${i + 1}</td>` : ""}
        <th scope="row">${opts && opts.pair ? pairHTML(t.pair, ordered) : esc(t.label)}${fewTag(t)}</th>
        <td class="ins-num">${ofText(t)}</td>
        <td class="ins-num"><span class="ins-rate ${rateClass(t)}">${pct(t.rate)}</span></td>
      </tr>`).join("");
  }

  function renderLab() {
    labDirty = false;
    const body = $("labBody");
    if (!body || !lab.open) return;
    const all = records;
    const recs = filterByDifficulty(all, lab.difficulty);
    const ordered = lab.ordered;
    const diffName = lab.difficulty ? `${lab.difficulty} ` : "";

    const controls = `
      <div class="ins-controls">
        <label class="ins-control">
          <span class="ins-control-label">Difficulty</span>
          <select class="history-select" id="labDifficulty">
            ${["", "Easy", "Medium", "Hard"].map(d => `<option value="${d}"${d === lab.difficulty ? " selected" : ""}>${d || "All difficulties"}</option>`).join("")}
          </select>
        </label>
        <div class="ins-control">
          <span class="ins-control-label" id="labViewLabel">Pairs</span>
          <div class="ins-seg" role="group" aria-labelledby="labViewLabel">
            <button type="button" class="ins-seg-btn" data-view="unordered" aria-pressed="${!ordered}">Either order</button>
            <button type="button" class="ins-seg-btn" data-view="ordered" aria-pressed="${ordered}">Primary → Secondary</button>
          </div>
        </div>
      </div>`;

    if (recs.length < LAB_MIN_RECORDS) {
      const need = LAB_MIN_RECORDS - recs.length;
      body.innerHTML = controls + `
        <div class="empty-state ins-empty">
          <p class="empty-state-title">Not enough games yet</p>
          <p>The Pairing Lab needs at least ${LAB_MIN_RECORDS} saved ${esc(diffName)}games; you have ${recs.length}. Save ${need} more to see your first numbers. Win rates start to mean something at about ${MIN_GAMES} games per pair.</p>
        </div>`;
      return;
    }

    const pairs = pairStats(recs, { ordered });
    const shownPairs = lab.allPairs ? pairs : pairs.slice(0, 8);
    const confident = pairs.filter(p => !p.few).length;
    let html = controls;

    html += `
      <h3 class="section-heading">Best pairs</h3>
      <p class="ins-note">Ranked by a cautious estimate, not the raw percentage: one win in one game proves little, so a pair that won 8 of 10 ranks above a pair that won 1 of 1. (The estimate is the low end of the likely win rate, a Wilson lower bound.) Pairs with fewer than ${MIN_GAMES} games are marked <span class="ins-few">few games</span>.</p>
      ${confident === 0 ? `<p class="ins-note ins-note-warn">No pair has ${MIN_GAMES} or more games yet, so this ranking is only a first guess.</p>` : ""}
      <div class="ins-table-wrap">
        <table class="ins-table" id="labPairsTable">
          <caption class="sr-only">Win rate per pair${ordered ? ", by Primary and Secondary" : ""}${lab.difficulty ? ", " + esc(lab.difficulty) : ""}</caption>
          <thead><tr><th scope="col">#</th><th scope="col">Pair</th><th scope="col">Won</th><th scope="col">Rate</th></tr></thead>
          <tbody>${statRowsHTML(shownPairs, ordered, { rank: true, pair: true })}</tbody>
        </table>
      </div>
      ${pairs.length > 8 ? `<button type="button" class="btn btn-secondary btn-sm ins-more" id="labMorePairs" aria-expanded="${lab.allPairs}" aria-controls="labPairsTable">${lab.allPairs ? "Show top 8" : `Show all ${pairs.length} pairs`}</button>` : ""}`;

    // Never beaten
    const nb = neverBeaten(recs, { ordered });
    html += `<h3 class="section-heading">Pairs you've never beaten</h3>`;
    html += nb.length
      ? `<ul class="ins-list" id="labNeverBeaten">${nb.map(t => `<li><span>${pairHTML(t.pair, ordered)}</span> <span class="ins-dim">0 of ${t.games}</span></li>`).join("")}</ul>`
      : `<p class="ins-note" id="labNeverBeaten">Every pair you've played has at least one win.</p>`;

    // Best team for a scenario
    const scenOpts = [...new Set([...scenarios, ...recs.map(r => r.scenario)])].sort((a, b) => scNum(a) - scNum(b));
    if (!scenOpts.includes(lab.bestFor)) {
      lab.bestFor = scenOpts.find(s => recs.some(r => r.scenario === s)) || scenOpts[0] || "";
    }
    const best = lab.bestFor ? bestTeamFor(recs, lab.bestFor, { ordered }) : [];
    html += `
      <h3 class="section-heading">Your best team for a scenario</h3>
      <label class="ins-control ins-control-wide">
        <span class="ins-control-label">Scenario</span>
        <select class="history-select" id="labBestFor">${scenOpts.map(s => `<option value="${esc(s)}"${s === lab.bestFor ? " selected" : ""}>${esc(scenarioText(s))}</option>`).join("")}</select>
      </label>
      <div id="labBestResult" class="ins-best">${best.length ? `
        <p class="ins-best-line">Your best team for ${esc(scenarioText(lab.bestFor))}: <strong>${pairHTML(best[0].pair, ordered)}</strong>, won ${ofText(best[0])} (${pct(best[0].rate)})${best[0].few ? ". Only a few games, so treat it as a hint" : ""}.</p>
        ${best.length > 1 ? `<p class="ins-note">Next: ${best.slice(1, 3).map(t => `${pairHTML(t.pair, ordered)} (${ofText(t)})`).join("; ")}.</p>` : ""}`
      : `<p class="ins-note">No ${esc(diffName)}games on ${esc(scenarioText(lab.bestFor))} yet.</p>`}</div>`;

    // Heat map: pair × scenario
    const cells = heatMap(recs, { ordered });
    const rowsAll = pairs.slice().sort((a, b) => (b.games - a.games) || a.label.localeCompare(b.label));
    const rows = lab.allRows ? rowsAll : rowsAll.slice(0, 10);
    const cols = scenOpts.filter(s => recs.some(r => r.scenario === s));
    html += `
      <h3 class="section-heading">Pair × scenario</h3>
      <p class="ins-note">Each cell is games won of games played. Shading is a guide only: <span class="ins-key ins-hi">mostly won</span> <span class="ins-key ins-mid">mixed</span> <span class="ins-key ins-lo">mostly lost</span>. Scroll sideways for more scenarios.</p>
      <div class="ins-table-wrap ins-heat-wrap" tabindex="0" role="region" aria-labelledby="labHeatCaption">
        <table class="ins-table ins-heat" id="labHeat">
          <caption id="labHeatCaption" class="sr-only">Games won of games played, per pair and scenario</caption>
          <thead><tr><th scope="col">Pair</th>${cols.map(s => `<th scope="col" class="ins-num" title="${esc(scenarioText(s))}"><span aria-hidden="true">${esc(scNumText(s) || s)}</span><span class="sr-only">${esc(scenarioText(s))}</span></th>`).join("")}</tr></thead>
          <tbody>${rows.map(p => `<tr><th scope="row">${pairHTML(p.pair, ordered)}</th>${cols.map(s => {
            const c = cells[p.key] && cells[p.key][s];
            return c ? `<td class="ins-num ins-cell ${rateClass(c)}" data-scenario="${esc(s)}"><span aria-hidden="true">${c.wins}/${c.games}</span><span class="sr-only">won ${c.wins} of ${c.games}</span></td>`
                     : `<td class="ins-num ins-cell" data-scenario="${esc(s)}"><span aria-hidden="true">—</span><span class="sr-only">not played</span></td>`;
          }).join("")}</tr>`).join("")}</tbody>
        </table>
      </div>
      ${rowsAll.length > 10 ? `<button type="button" class="btn btn-secondary btn-sm ins-more" id="labMoreRows" aria-expanded="${lab.allRows}" aria-controls="labHeat">${lab.allRows ? "Show 10 most played" : `Show all ${rowsAll.length} pairs`}</button>` : ""}`;

    // Order effect
    const oe = orderEffect(recs);
    html += `<h3 class="section-heading">Who leads? Primary vs Secondary</h3>`;
    html += oe.length ? `
      <p class="ins-note">Pairs you've played both ways round, with each character as Primary.</p>
      <ul class="ins-list" id="labOrder">${oe.map(e => {
        const line = t => `${esc(t.primary)} leading: ${ofText(t)} (${pct(t.rate)})`;
        const d = Math.round(Math.abs(e.diff) * 100);
        const better = e.diff > 0 ? e.a.primary : e.b.primary;
        const verdict = d === 0 ? "No difference so far." : `${esc(better)} leading wins ${d} points more often${(e.a.few || e.b.few) ? " (few games, so not settled)" : ""}.`;
        return `<li class="ins-order"><strong>${esc(e.pair[0])} &amp; ${esc(e.pair[1])}</strong><span>${line(e.a)}</span><span>${line(e.b)}</span><span class="ins-dim">${verdict}</span></li>`;
      }).join("")}</ul>`
      : `<p class="ins-note" id="labOrder">Play a pair both ways round (swap Primary and Secondary) to compare.</p>`;

    // Per character
    const chars = characterStats(recs);
    html += `
      <h3 class="section-heading">Characters</h3>
      <p class="ins-note">Every game a character played, as Primary or Secondary.</p>
      <div class="ins-table-wrap">
        <table class="ins-table" id="labChars">
          <caption class="sr-only">Win rate per character</caption>
          <thead><tr><th scope="col">Character</th><th scope="col">Won</th><th scope="col">Rate</th></tr></thead>
          <tbody>${statRowsHTML(chars, ordered)}</tbody>
        </table>
      </div>`;

    // Droids
    const ds = droidStats(recs);
    if (ds.length) {
      html += `
        <h3 class="section-heading">Droids</h3>
        <div class="ins-table-wrap">
          <table class="ins-table" id="labDroids">
            <caption class="sr-only">Win rate per droid</caption>
            <thead><tr><th scope="col">Droid</th><th scope="col">Won</th><th scope="col">Rate</th></tr></thead>
            <tbody>${statRowsHTML(ds, ordered)}</tbody>
          </table>
        </div>`;
    }

    body.innerHTML = html;
  }

  // ─── Gauntlet state ─────────────────────────────────────────────────────────
  const G_ORDERS = ["unplayed", "numeric"];
  function isValidGauntlet(g) {
    return g && typeof g === "object" && typeof g.id === "string" &&
      Array.isArray(g.pair) && g.pair.length === 2 && g.pair[0] !== g.pair[1] &&
      g.pair.every(c => ALL_CHARACTERS_SET.has(c)) &&
      Array.isArray(g.scenarios) && g.scenarios.length > 0 && g.scenarios.every(s => ALL_SCENARIOS_SET.has(s)) &&
      new Set(g.scenarios).size === g.scenarios.length &&
      typeof g.startedAt === "string" && G_ORDERS.includes(g.order) &&
      (g.links == null || typeof g.links === "object");
  }
  function loadGauntlet() {
    try {
      const raw = store.get(G_KEY);
      if (!raw) return null;
      const g = JSON.parse(raw);
      return isValidGauntlet(g) ? g : null;
    } catch (e) { return null; }
  }
  let gauntlet = loadGauntlet();
  const setup = { a: "", b: "", order: "unplayed" };

  function saveGauntlet() {
    if (!gauntlet) { store.del(G_KEY); return true; }
    if (!store.set(G_KEY, JSON.stringify(gauntlet))) {
      toast("Couldn't save the Gauntlet: your browser's storage is full or blocked.", "error");
      return false;
    }
    return true;
  }

  // Bring the stored links up to date with the log; returns the progress.
  function syncGauntlet() {
    if (!gauntlet) return null;
    const p = gauntletProgress(gauntlet, records);
    const before = JSON.stringify(gauntlet.links || {});
    gauntlet.links = p.links;
    let changed = before !== JSON.stringify(p.links);
    if (p.complete && !gauntlet.completeTracked) {
      gauntlet.completeTracked = true;
      gauntlet.finishedAt = new Date().toISOString();
      changed = true;
      track("gauntlet_complete", { wins: p.wins, total: p.total });
    }
    if (changed) saveGauntlet();
    return p;
  }

  function startGauntlet(pair, order) {
    if (pair[0] === pair[1]) { toast("Choose two different characters.", "error"); return; }
    if (!scenarios.length) { toast("Your collection has no scenarios.", "error"); return; }
    gauntlet = {
      v: 1, id: newId(), pair: pair.slice(), order,
      scenarios: gauntletOrder(scenarios, records, pair, order),
      startedAt: new Date().toISOString(), links: {}, completeTracked: false,
    };
    if (!saveGauntlet()) { gauntlet = null; return; }
    track("gauntlet_start", { scenarios: gauntlet.scenarios.length });
    renderGauntlet();
    const h = $("gauntletHeading"); if (h) h.focus();
    announce(`Gauntlet started: ${pair.join(" and ")}, ${gauntlet.scenarios.length} scenarios.`);
  }

  function abandonGauntlet(msg) {
    const before = gauntlet;
    gauntlet = null;
    saveGauntlet();
    renderGauntlet();
    const h = $("gauntletHeading"); if (h && root.offsetParent !== null) h.focus();
    undoToast(msg || "Gauntlet abandoned.", () => {
      if (loadGauntlet()) { toast("Another Gauntlet is already running.", "error"); return; }
      gauntlet = before; saveGauntlet(); renderGauntlet(); toast("Gauntlet restored.");
    });
  }

  // Load the next scenario into the Randomizer with the pair locked.
  function playNext() {
    const p = syncGauntlet();
    if (!p || !p.next) return;
    const [a, b] = gauntlet.pair;
    const missing = [a, b].filter(c => !characters.includes(c));
    if (missing.length || !scenarios.includes(p.next)) {
      toast(`${missing.length ? missing.join(" and ") : scenarioText(p.next)} isn't in your collection right now. Turn its pack back on in My Collection to continue.`, "error");
      return;
    }
    const scenario = p.next;
    guardUnsaved(() => {
      showTab("randomizer");
      const c1 = $("manualChar1"), c2 = $("manualChar2"), sc = $("manualScenario");
      c1.value = a; syncDropdown("manualChar1", "manualChar2"); c2.value = b; sc.value = scenario;
      locks.char1 = true; locks.char2 = true;
      updateLockButtons();
      loadCombination({ characters: [a, b], scenario }, { focusCard: true });
      renderBar();
    });
  }

  function stepText(st) { return st === "win" ? "Won" : st === "loss" ? "Lost" : "To play"; }
  function stripHTML(p, compact) {
    return `<ol class="g-strip${compact ? " g-strip-compact" : ""}" aria-label="Gauntlet progress">${p.steps.map(x => {
      const isNext = x.scenario === p.next;
      const label = isNext ? "Next" : stepText(x.state);
      const mark = x.state === "win" ? "✓" : x.state === "loss" ? "✗" : isNext ? "▸" : "○";
      return `<li class="g-step g-${x.state}${isNext ? " g-next" : ""}" title="${esc(scenarioText(x.scenario))}: ${label}">
        <span class="g-mark" aria-hidden="true">${mark}</span>
        ${compact
          ? `<span aria-hidden="true">${esc(scNumText(x.scenario) || x.scenario)}</span><span class="sr-only">${esc(scenarioText(x.scenario))}: ${label}</span>`
          : `<span class="g-name">${esc(scenarioText(x.scenario))}</span><span class="g-state">${label}</span>`}
      </li>`;
    }).join("")}</ol>`;
  }

  function nowPlayingNext(p) {
    const c = currentCombination;
    return !!(c && p.next && c.scenario === p.next && c.characters[0] === gauntlet.pair[0] && c.characters[1] === gauntlet.pair[1] &&
      !$("saveRecordBtn").disabled);
  }

  function renderGauntlet() {
    const body = $("gauntletBody");
    if (!body) return;
    const p = syncGauntlet();
    renderBar(p);
    if (!gauntlet) {
      const cur = currentCombination;
      if (!setup.a || !characters.includes(setup.a)) setup.a = cur ? cur.characters[0] : characters[0] || "";
      if (!setup.b || !characters.includes(setup.b) || setup.b === setup.a) setup.b = cur && cur.characters[1] !== setup.a ? cur.characters[1] : characters.find(c => c !== setup.a) || "";
      const opt = (sel, skip) => characters.filter(c => c !== skip).map(c => `<option value="${esc(c)}"${c === sel ? " selected" : ""}>${esc(c)}</option>`).join("");
      body.innerHTML = `
        <p class="ins-lede">One team against every scenario you own (${scenarios.length}). Play them one by one; each first result counts.</p>
        <div class="ins-controls">
          <label class="ins-control"><span class="ins-control-label">Primary</span>
            <select class="history-select" id="gPickA">${opt(setup.a)}</select></label>
          <label class="ins-control"><span class="ins-control-label">Secondary</span>
            <select class="history-select" id="gPickB">${opt(setup.b, setup.a)}</select></label>
        </div>
        ${cur ? `<button type="button" class="btn btn-secondary btn-sm ins-more" id="gUseCurrent">Use current mission's pair (${esc(cur.characters.join(" & "))})</button>` : ""}
        <fieldset class="ins-fieldset">
          <legend class="ins-control-label">Order</legend>
          <label class="ins-radio"><input type="radio" name="gOrder" value="unplayed"${setup.order === "unplayed" ? " checked" : ""}> Scenarios this team hasn't played first</label>
          <label class="ins-radio"><input type="radio" name="gOrder" value="numeric"${setup.order === "numeric" ? " checked" : ""}> Scenario number order</label>
        </fieldset>
        <button type="button" class="btn btn-load" id="gStart"${characters.length < 2 || !scenarios.length ? " disabled" : ""}>Start Gauntlet</button>`;
      return;
    }
    const team = esc(gauntlet.pair.join(" & "));
    if (p.complete) {
      const text = gauntletShareText(gauntlet, p);
      body.innerHTML = `
        <p class="g-summary-title">Gauntlet complete: <strong>${team}</strong></p>
        <div class="stats-summary">
          <div class="stats-summary-card"><div class="stats-summary-value">${p.wins}</div><div class="stats-summary-label">Wins</div></div>
          <div class="stats-summary-card"><div class="stats-summary-value">${p.losses}</div><div class="stats-summary-label">Losses</div></div>
          <div class="stats-summary-card"><div class="stats-summary-value is-small">${p.seconds > 0 ? esc(formatDuration(p.seconds)) : "—"}</div><div class="stats-summary-label">Time</div></div>
        </div>
        ${stripHTML(p, false)}
        <label class="ins-control ins-control-wide" for="gShareText"><span class="ins-control-label">Share your result</span></label>
        <textarea id="gShareText" class="notes-input g-share" rows="3" readonly>${esc(text)}</textarea>
        <div class="g-actions">
          <button type="button" class="btn btn-load" id="gCopy">Copy result</button>
          <button type="button" class="btn btn-secondary" id="gDone">Start a new Gauntlet</button>
        </div>`;
      return;
    }
    const nowPlaying = nowPlayingNext(p);
    body.innerHTML = `
      <p class="g-head"><strong>${team}</strong> <span class="ins-dim">· ${p.played} of ${p.total} played · ${p.wins} won${p.seconds > 0 ? ` · ${esc(formatDuration(p.seconds))}` : ""}</span></p>
      ${stripHTML(p, false)}
      ${nowPlaying ? `<p class="ins-note">Now playing ${esc(scenarioText(p.next))} on the Randomizer. Save the result there to record it.</p>` : ""}
      <div class="g-actions">
        <button type="button" class="btn btn-load" id="gPlayNext">Play next: ${esc(scenarioText(p.next))}</button>
        <button type="button" class="btn btn-danger" id="gAbandon">Abandon</button>
      </div>`;
  }

  // Compact progress on the Randomizer while a gauntlet runs.
  function renderBar(p) {
    if (!bar) return;
    if (p === undefined) p = gauntlet ? gauntletProgress(gauntlet, records) : null;
    if (!gauntlet || !p) { bar.innerHTML = ""; bar.hidden = true; return; }
    bar.hidden = false;
    const team = esc(gauntlet.pair.join(" & "));
    const nowPlaying = nowPlayingNext(p);
    bar.innerHTML = `
      <section class="panel g-bar" aria-labelledby="gBarTitle">
        <h2 class="panel-title" id="gBarTitle">Gauntlet</h2>
        <p class="g-head"><strong>${team}</strong> <span class="ins-dim">· ${p.complete ? `complete · ${p.wins} of ${p.total} won` : `${p.played} of ${p.total} played · ${p.wins} won`}</span></p>
        ${stripHTML(p, true)}
        ${p.complete
          ? `<button type="button" class="btn btn-secondary btn-sm" id="gBarSummary">See summary</button>`
          : nowPlaying
            ? `<p class="ins-note">Playing ${esc(scenarioText(p.next))}. Save the result below to record it.</p>`
            : `<button type="button" class="btn btn-load" id="gBarPlayNext">Play next: ${esc(scenarioText(p.next))}</button>`}
      </section>`;
  }

  function copyShare() {
    const ta = $("gShareText");
    if (!ta) return;
    track("gauntlet_share");
    const fallback = () => {
      ta.focus(); ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (e) {}
      toast(ok ? "Result copied." : "Text selected. Copy it with your device's copy command.", ok ? "info" : undefined);
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ta.value).then(() => toast("Result copied."), fallback);
        return;
      }
    } catch (e) {}
    fallback();
  }

  // ─── Wiring ─────────────────────────────────────────────────────────────────
  root.innerHTML = labShell();
  const historyPage = $("historyPage");
  const logVisible = () => historyPage && !historyPage.classList.contains("hidden");

  root.addEventListener("click", e => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.id === "labToggle") {
      lab.open = !lab.open;
      store.set(LAB_OPEN_KEY, lab.open ? "1" : "0");
      t.setAttribute("aria-expanded", String(lab.open));
      t.textContent = lab.open ? "Hide Pairing Lab" : "Open Pairing Lab";
      $("labBody").hidden = !lab.open;
      if (lab.open) { track("lab_open"); renderLab(); }
    } else if (t.dataset.view) {
      lab.ordered = t.dataset.view === "ordered";
      renderLab();
      const again = root.querySelector(`.ins-seg-btn[data-view="${t.dataset.view}"]`); if (again) again.focus();
    } else if (t.id === "labMorePairs" || t.id === "labMoreRows") {
      if (t.id === "labMorePairs") lab.allPairs = !lab.allPairs; else lab.allRows = !lab.allRows;
      renderLab();
      const again = $(t.id); if (again) again.focus();
    } else if (t.id === "gUseCurrent" && currentCombination) {
      [setup.a, setup.b] = currentCombination.characters;
      renderGauntlet();
      const s = $("gPickA"); if (s) s.focus();
    } else if (t.id === "gStart") {
      startGauntlet([$("gPickA").value, $("gPickB").value], setup.order);
    } else if (t.id === "gPlayNext") {
      playNext();
    } else if (t.id === "gAbandon") {
      abandonGauntlet();
    } else if (t.id === "gCopy") {
      copyShare();
    } else if (t.id === "gDone") {
      abandonGauntlet("Gauntlet closed.");
    }
  });
  root.addEventListener("change", e => {
    const t = e.target;
    if (t.id === "labDifficulty") { lab.difficulty = t.value; renderLab(); $("labDifficulty").focus(); }
    else if (t.id === "labBestFor") { lab.bestFor = t.value; renderLab(); $("labBestFor").focus(); }
    else if (t.id === "gPickA") { setup.a = t.value; renderGauntlet(); $("gPickA").focus(); }
    else if (t.id === "gPickB") { setup.b = t.value; }
    else if (t.name === "gOrder") { setup.order = t.value; }
  });
  if (bar) bar.addEventListener("click", e => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.id === "gBarPlayNext") playNext();
    else if (t.id === "gBarSummary") {
      showTab("history");
      const h = $("gauntletHeading");
      if (h) { h.focus(); h.scrollIntoView({ block: "start" }); }
    }
  });

  // Records changed (any save, edit, delete, undo, import or another tab): refresh.
  let _lastPlayed = gauntlet ? gauntletProgress(gauntlet, records).played : 0;
  document.addEventListener("tsr:records-changed", () => {
    labDirty = true;
    if (logVisible()) renderLab();
    const p = gauntlet ? syncGauntlet() : null;
    renderGauntlet();
    if (p && p.played > _lastPlayed) {
      const last = p.steps.filter(x => x.record).sort((a, b) => (a.record.createdAt < b.record.createdAt ? 1 : -1))[0];
      // After the save toast has been read out.
      setTimeout(() => announce(p.complete
        ? `Gauntlet complete: ${p.wins} of ${p.total} won.`
        : `Gauntlet: ${last ? `${stepText(last.state).toLowerCase()} ${scenarioText(last.scenario)}. ` : ""}${p.played} of ${p.total} played. Next: ${scenarioText(p.next)}.`), 1500);
    }
    _lastPlayed = p ? p.played : 0;
  });
  // My Collection changed (this tab or another): the Gauntlet's pair pickers use the owned pools.
  document.addEventListener("tsr:collection-changed", () => { labDirty = true; if (logVisible()) renderLab(); renderGauntlet(); });
  // The loaded mission changes what the bar says ("Play next" vs "now playing").
  ["generateBtn", "loadManualCombo"].forEach(id => { const el = $(id); if (el) el.addEventListener("click", () => setTimeout(() => renderBar(), 0)); });
  document.addEventListener("click", e => { if (e.target.closest && e.target.closest("#discardGameConfirm, #unplayedContainer")) setTimeout(() => renderBar(), 0); });

  if (historyPage) {
    new MutationObserver(() => {
      if (!logVisible()) return;
      if (labDirty) renderLab();
      renderGauntlet();
    }).observe(historyPage, { attributes: true, attributeFilter: ["class"] });
  }
  window.addEventListener("storage", e => {
    if (e.storageArea && e.storageArea !== localStorage) return;
    if (e.key === null || e.key === G_KEY) { gauntlet = loadGauntlet(); renderGauntlet(); }
  });

  renderLab();
  renderGauntlet();
})();

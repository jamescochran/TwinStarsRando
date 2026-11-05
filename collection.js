// Twin Stars Randomizer: My Collection by item, presets and the Collection Shelf.
// Plain classic script loaded after app.js; uses its globals (CONTENT_PACKS, ownedItems,
// packItemIds, isPlayableItems, itemCounts, MIN_CONTENT_MSG, SCENARIO_NUMBER, esc, track).
// The ownership model and its storage live in app.js because the randomizer needs them at
// start-up; this file draws the dialog. Changes are committed when the dialog closes
// (closeSettings in app.js saves, rebuilds the pools and reports collection_change).

  // ─── Presets ───────────────────────────────────────────────────────────────
  const PNP_BRIG   = ["s:Escape The Brig!", "c:Inzill Mey", "c:Strezelsior"];
  const PNP_TRIALS = ["s:Master the Trials!", "c:Grulexon", "c:Dain Taubo"];
  const packIds = id => packItemIds(CONTENT_PACKS.find(p => p.id === id));
  const COLLECTION_PRESETS = [
    { id: "pnp-brig",   label: "Free print-and-play: Escape the Brig",   items: () => PNP_BRIG },
    { id: "pnp-trials", label: "Free print-and-play: Master the Trials", items: () => PNP_TRIALS },
    { id: "pnp-both",   label: "Both free print-and-play starters",     items: () => [...PNP_BRIG, ...PNP_TRIALS] },
    { id: "series1",    label: "Series 1 wallet (the base game)",       items: () => packIds("series1") },
    { id: "series12",   label: "Series 1 and Series 2 wallets",         items: () => [...packIds("series1"), ...packIds("series2")] },
    { id: "everything", label: "Everything published",                  items: () => CONTENT_PACKS.flatMap(packItemIds) },
  ];
  // Standalone scenario wallets (Sc.01–06 and Sc.07). Each holds one scenario and two
  // characters; which two isn't recorded here, so the player picks them.
  const WALLET_SCENARIOS = [
    ["Escape The Brig!", "series1"], ["Confine The Quarks!", "series1"], ["Rule The World!", "series1"],
    ["Stop The Virus!", "series1"], ["Steal The Plans!", "series1"], ["Hunt The Bounty!", "series1"],
    ["Master the Trials!", "series2"],
  ];

  // ─── Collection Shelf data ───────────────────────────────────────────────────
  // Every published item in BoardGameGeek family 38655, with how it was released (from each
  // item's BGG page). Links go only to official sources: Button Shy and BoardGameGeek.
  const BS_TWIN_STARS = "https://buttonshygames.com/pages/twin-stars";
  const bgg = (id, slug) => `https://boardgamegeek.com/boardgame/${id}/${slug}`;
  const SHELF = [
    { group: "Adventure Series I" },
    { name: "Series I wallet", kind: "Wallet", how: "Wallet (2017), also a deluxe edition and print-and-play. 12 characters, 6 scenarios.", items: () => packIds("series1"), url: bgg(231854, "twin-stars-adventure-series-i") },
    { name: "Scenario 01: Escape the Brig!", kind: "Kickstarter stretch goal", how: "Stretch goal (Pod-X, 2016), then a standalone wallet: 1 scenario, 2 characters.", items: () => ["s:Escape The Brig!"], url: bgg(212097, "twin-stars-adventure-series-i-scenario-01-escape-t") },
    { name: "Free print-and-play: Escape the Brig", kind: "Free print-and-play", how: "Official free print-and-play starter: Escape the Brig! with Inzill Mey and Strezelsior (files on its BGG page).", items: () => PNP_BRIG, url: bgg(212097, "twin-stars-adventure-series-i-scenario-01-escape-t") },
    { name: "Scenario 02: Confine the Quarks!", kind: "Kickstarter stretch goal", how: "Stretch goal (Pentaquark, 2016), then a standalone wallet. BGG lists it as “The Quark Star”.", items: () => ["s:Confine The Quarks!"], url: bgg(212098, "twin-stars-adventure-series-i-scenario-02-the-quar") },
    { name: "Scenario 03: Rule the World!", kind: "Kickstarter stretch goal", how: "Stretch goal (Universal Rule, 2017), then a standalone wallet.", items: () => ["s:Rule The World!"], url: bgg(212971, "twin-stars-adventure-series-i-scenario-03-rule-the") },
    { name: "Scenario 04: Stop the Virus!", kind: "Wallet", how: "Standalone scenario wallet (2017).", items: () => ["s:Stop The Virus!"], url: bgg(224505, "twin-stars-adventure-series-i-scenario-04-stop-the") },
    { name: "Scenario 05: Steal the Plans!", kind: "Wallet", how: "Standalone scenario wallet (2017).", items: () => ["s:Steal The Plans!"], url: bgg(229275, "twin-stars-adventure-series-i-scenario-05-steal-th") },
    { name: "Scenario 06: Hunt the Bounty!", kind: "Wallet", how: "Standalone scenario wallet (2017). BGG lists it as “Bounty Hunt”.", items: () => ["s:Hunt The Bounty!"], url: bgg(235441, "twin-stars-adventure-series-i-scenario-06-bounty-h") },
    { name: "SYZYGY Mode booklet", kind: "Booklet", how: "Campaign booklet for Series I (Kickstarter extra, later a download). Used by the SYZYGY tab.", booklet: "b:syzygy1", url: bgg(307088, "twin-stars-adventure-series-i-syzygy-mode") },
    { name: "Series I Droid Assistants", kind: "Kickstarter stretch goal", how: "Three half-size droid cards unlocked as stretch goals (2017), later sold as an add-on.", items: () => packIds("droids1"), url: bgg(322525, "twin-stars-adventure-series-series-i-droid-assista") },
    { group: "Adventure Series II" },
    { name: "Series II wallet", kind: "Wallet", how: "Wallet (2019), also print-and-play. 12 characters, 6 scenarios.", items: () => packIds("series2"), url: bgg(262770, "twin-stars-adventure-series-ii") },
    { name: "Scenario 07: Master the Trials!", kind: "Club and print-and-play", how: "Released alone (Board Game of the Month Club, September 2017, and print-and-play) before Series II.", items: () => ["s:Master the Trials!"], url: bgg(324775, "twin-stars-adventure-series-ii-scenario-07-master") },
    { name: "Free print-and-play: Master the Trials", kind: "Free print-and-play", how: "Official free print-and-play starter: Master the Trials! with Grulexon and Dain Taubo (files on its BGG page).", items: () => PNP_TRIALS, url: bgg(324775, "twin-stars-adventure-series-ii-scenario-07-master") },
    { name: "SYZYGY Mode II: Waypoint booklet", kind: "Booklet", how: "Campaign booklet, a free expansion in the Series II Kickstarter (2019). Used by the SYZYGY tab.", booklet: "b:syzygy2", url: bgg(322527, "twin-stars-adventure-series-ii-syzygy-mode-ii-waypoint") },
    { name: "Series II Droid Assistants", kind: "Kickstarter stretch goal", how: "Three droid cards, free in the Series II Kickstarter (2019), later sold as an add-on.", items: () => packIds("droids2"), url: bgg(322526, "twin-stars-adventure-series-series-ii-droid-assist") },
    { name: "Captain Crag", kind: "Print-and-play exclusive", how: "One character, a PNP Arcade exclusive, later in the Board Game of the Month Club (May 2019).", items: () => packIds("captaincrag"), url: bgg(276844, "twin-stars-adventure-series-captain-crag") },
    { group: "Adventure Series III" },
    { name: "Scenario 13: Topple the Giant!", kind: "ShyCon exclusive", how: "ShyCon Nashville 2022 only (prototype edition): 1 scenario, 2 characters.", items: () => packIds("scenario13"), url: bgg(372403, "twin-stars-adventure-series-iii-scenario-13-topple") },
    { name: "Scenario 14: Save the Spacewhales!", kind: "Wallet", how: "Kickstarter and Board Game of the Month Club wallet (2022–23), also print-and-play: 1 scenario, 2 characters.", items: () => packIds("scenario14"), url: bgg(376110, "twin-stars-adventure-series-iii-scenario-14-save-t") },
    { group: "Twin Stars: Moonset" },
    { name: "Moonset #1: Destroy the Artifact", kind: "Not supported", how: "A reimplementation with different rules, so this app does not support it.", unsupported: true, url: bgg(371921, "twin-stars-moonset-scenario-1-destroy-the-artifact") },
    { name: "Moonset #2: Protect the Village", kind: "Not supported", how: "A reimplementation with different rules, so this app does not support it.", unsupported: true, url: bgg(377398, "twin-stars-moonset-scenario-2-protect-the-village") },
    { name: "Moonset #3: Catch the Slayer", kind: "Not supported", how: "A reimplementation with different rules, so this app does not support it.", unsupported: true, url: bgg(379634, "twin-stars-moonset-scenario-3-catch-the-slayer") },
  ];

  const itemDomId = id => "own-" + id.replace(/[^a-z0-9]+/gi, "-").toLowerCase().replace(/-+$/, "");
  const itemLabel = id => {
    const name = id.slice(2);
    return id[0] === "s" && SCENARIO_NUMBER[name] ? `${SCENARIO_NUMBER[name]} ${name}` : name;
  };

  function collectionStatus(msg) {
    const el = document.getElementById("collectionStatus");
    if (el) { el.textContent = ""; setTimeout(() => { el.textContent = msg; }, 30); }
  }
  function describeItems(items) {
    const n = itemCounts(items);
    const part = (k, one, many) => `${n[k]} ${n[k] === 1 ? one : many}`;
    return [part("scenarios", "scenario", "scenarios"), part("characters", "character", "characters"),
      n.droids ? part("droids", "droid", "droids") : ""].filter(Boolean).join(", ");
  }

  // Commits a proposed ownership set if it is playable; otherwise keeps the old one and says why.
  function setOwnedItems(next) {
    const warn = document.getElementById("settingsWarning");
    if (!isPlayableItems(next)) {
      warn.textContent = MIN_CONTENT_MSG;
      refreshCollection();
      return false;
    }
    warn.textContent = "";
    ownedItems = next;
    refreshCollection();
    return true;
  }

  // Updates checkbox states and counts in place, so focus never jumps.
  function refreshCollection() {
    CONTENT_PACKS.forEach(pack => {
      const ids = packItemIds(pack);
      const n = ids.filter(i => ownedItems.has(i)).length;
      const cb = document.getElementById("pack-" + pack.id);
      if (!cb) return;
      cb.checked = n === ids.length;
      cb.indeterminate = n > 0 && n < ids.length;
      const count = document.getElementById("packCount-" + pack.id);
      if (count) {
        count.textContent = n === ids.length ? "All owned" : n ? `${n} of ${ids.length} owned` : "Not owned";
        count.dataset.state = n === ids.length ? "all" : n ? "some" : "none";
      }
      ids.forEach(id => { const c = document.getElementById(itemDomId(id)); if (c) c.checked = ownedItems.has(id); });
    });
    document.querySelectorAll("#collectionShelf [data-booklet]").forEach(c => { c.checked = ownedItems.has(c.dataset.booklet); });
    renderShelfStatus();
  }

  function renderCollection() {
    renderPresets();
    const list = document.getElementById("packList");
    list.innerHTML = "";
    CONTENT_PACKS.forEach(pack => {
      const row = document.createElement("div");
      row.className = "pack-row";
      const ids = packItemIds(pack);
      const byNumber = (a, b) => parseInt(SCENARIO_NUMBER[a.slice(2)] || "99") - parseInt(SCENARIO_NUMBER[b.slice(2)] || "99");
      const groups = [["Scenarios", ids.filter(i => i[0] === "s").sort(byNumber)], ["Characters", ids.filter(i => i[0] === "c")], ["Droids", ids.filter(i => i[0] === "d")]]
        .filter(([, g]) => g.length);
      row.innerHTML = `
        <label class="pack-item" for="pack-${pack.id}">
          <input type="checkbox" id="pack-${pack.id}">
          <div class="pack-item-info">
            <div class="pack-item-name">${esc(pack.name)}</div>
            <div class="pack-item-desc">${esc(pack.desc)}</div>
            <div class="pack-item-count" id="packCount-${pack.id}"></div>
          </div>
        </label>
        ${ids.length > 1 ? `<button type="button" class="pack-expand" id="packExpand-${pack.id}" aria-expanded="false" aria-controls="packItems-${pack.id}">Choose items<span class="sr-only"> in ${esc(pack.name)}</span></button>
        <div class="pack-items" id="packItems-${pack.id}" hidden>
          ${groups.map(([title, g]) => `
            <fieldset class="pack-item-group">
              <legend>${title}</legend>
              ${g.map(id => `<label class="own-item" for="${itemDomId(id)}"><input type="checkbox" id="${itemDomId(id)}" data-item="${esc(id)}"> <span>${esc(itemLabel(id))}</span></label>`).join("")}
            </fieldset>`).join("")}
        </div>` : ""}`;
      list.appendChild(row);

      const cb = row.querySelector("#pack-" + pack.id);
      cb.addEventListener("change", () => {
        const next = new Set(ownedItems);
        ids.forEach(id => cb.checked ? next.add(id) : next.delete(id));
        setOwnedItems(next);
      });
      row.querySelectorAll("[data-item]").forEach(c => c.addEventListener("change", () => {
        const next = new Set(ownedItems);
        if (c.checked) next.add(c.dataset.item); else next.delete(c.dataset.item);
        setOwnedItems(next);
      }));
      const exp = row.querySelector(".pack-expand");
      if (exp) exp.addEventListener("click", () => {
        const open = exp.getAttribute("aria-expanded") !== "true";
        exp.setAttribute("aria-expanded", String(open));
        row.querySelector(".pack-items").hidden = !open;
      });
    });
    renderShelf();
    refreshCollection();
  }

  function renderPresets() {
    const box = document.getElementById("collectionPresets");
    if (!box) return;
    const walletOpts = WALLET_SCENARIOS.map(([s]) => `<option value="${esc(s)}">${esc(SCENARIO_NUMBER[s] + " " + s)}</option>`).join("");
    box.innerHTML = `
      <fieldset class="collection-presets">
        <legend>Quick setup</legend>
        <div class="preset-mode" role="radiogroup" aria-label="How a preset changes your collection">
          <label><input type="radio" name="presetMode" value="replace" id="presetModeReplace" checked> Replace my collection</label>
          <label><input type="radio" name="presetMode" value="add" id="presetModeAdd"> Add to it</label>
        </div>
        <label class="preset-label" for="collectionPreset">Preset</label>
        <div class="preset-row">
          <select id="collectionPreset">
            <option value="">Choose a preset…</option>
            ${COLLECTION_PRESETS.map(p => `<option value="${p.id}">${esc(p.label)}</option>`).join("")}
          </select>
          <button type="button" class="btn btn-secondary btn-sm" id="collectionPresetApply">Apply</button>
        </div>
        <div class="wallet-pick" role="group" aria-labelledby="walletPickLabel">
          <div class="preset-label" id="walletPickLabel">Single scenario wallet</div>
          <label class="sr-only" for="walletScenario">Wallet scenario</label>
          <select id="walletScenario"><option value="">Scenario…</option>${walletOpts}</select>
          <div class="wallet-chars">
            <label class="sr-only" for="walletChar1">First character in the wallet</label>
            <select id="walletChar1" disabled><option value="">Character…</option></select>
            <label class="sr-only" for="walletChar2">Second character in the wallet</label>
            <select id="walletChar2" disabled><option value="">Character…</option></select>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" id="walletApply">Apply wallet</button>
        </div>
      </fieldset>
      <p class="sr-only" id="collectionStatus" role="status"></p>`;

    const mode = () => box.querySelector("input[name=presetMode]:checked").value;
    const applySet = (items, label) => {
      const base = mode() === "add" ? new Set(ownedItems) : new Set([...ownedItems].filter(i => i[0] === "b"));
      items.forEach(i => base.add(i));
      if (setOwnedItems(base)) collectionStatus(`${label} applied. You now own ${describeItems(ownedItems)}.`);
    };
    box.querySelector("#collectionPresetApply").addEventListener("click", () => {
      const p = COLLECTION_PRESETS.find(x => x.id === box.querySelector("#collectionPreset").value);
      if (!p) { document.getElementById("settingsWarning").textContent = "Choose a preset first."; return; }
      applySet(p.items(), p.label);
    });
    const scen = box.querySelector("#walletScenario"), c1 = box.querySelector("#walletChar1"), c2 = box.querySelector("#walletChar2");
    scen.addEventListener("change", () => {
      const entry = WALLET_SCENARIOS.find(([s]) => s === scen.value);
      const chars = entry ? CONTENT_PACKS.find(p => p.id === entry[1]).characters : [];
      const opts = `<option value="">Character…</option>` + chars.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
      c1.innerHTML = opts; c2.innerHTML = opts;
      c1.disabled = c2.disabled = !entry;
    });
    box.querySelector("#walletApply").addEventListener("click", () => {
      const warn = document.getElementById("settingsWarning");
      if (!scen.value) { warn.textContent = "Choose the wallet's scenario first."; return; }
      if (!c1.value || !c2.value || c1.value === c2.value) { warn.textContent = "Choose the two different characters that came in your wallet."; return; }
      applySet(["s:" + scen.value, "c:" + c1.value, "c:" + c2.value], `Scenario ${SCENARIO_NUMBER[scen.value]} wallet`);
    });
  }

  // ─── Collection Shelf ───────────────────────────────────────────────────────
  function shelfState(entry) {
    if (entry.unsupported) return ["unsupported", "Not supported (different rules)"];
    if (entry.booklet) return ownedItems.has(entry.booklet) ? ["owned", "Owned"] : ["missing", "Not owned"];
    const ids = entry.items();
    const n = ids.filter(i => ownedItems.has(i)).length;
    if (n === ids.length) return ["owned", "Owned"];
    if (n === 0) return ["missing", "Not owned"];
    return ["partial", `Partly owned: ${n} of ${ids.length}`];
  }
  function renderShelfStatus() {
    document.querySelectorAll("#collectionShelf .shelf-item").forEach(li => {
      const entry = SHELF[+li.dataset.index];
      const [state, text] = shelfState(entry);
      li.dataset.state = state;
      li.querySelector(".shelf-status").textContent = text;
    });
    const sum = document.getElementById("shelfSummary");
    if (sum) {
      const real = SHELF.filter(e => e.name && !e.unsupported);
      const owned = real.filter(e => shelfState(e)[0] === "owned").length;
      sum.textContent = `You own ${owned} of ${real.length} published items in full.`;
    }
  }
  function renderShelf() {
    const toggle = document.getElementById("shelfToggle");
    const shelf = document.getElementById("collectionShelf");
    if (!toggle || !shelf) return;
    let html = `<p class="shelf-intro">Everything published for Twin Stars: Adventure Series and how it came out. Official sources:
      <a href="${BS_TWIN_STARS}" target="_blank" rel="noopener noreferrer" class="link-inline link-teal">Button Shy's Twin Stars page<span class="sr-only"> (opens in a new tab)</span></a>
      and BoardGameGeek.</p>
      <p class="shelf-summary" id="shelfSummary"></p>`;
    let open = false;
    SHELF.forEach((e, i) => {
      if (e.group) {
        if (open) html += `</ul>`;
        html += `<h3 class="shelf-group">${esc(e.group)}</h3><ul class="shelf-list">`;
        open = true;
        return;
      }
      html += `<li class="shelf-item" data-index="${i}">
        <div class="shelf-item-head">
          <span class="shelf-name">${esc(e.name)}</span>
          <span class="shelf-kind">${esc(e.kind)}</span>
        </div>
        <p class="shelf-how">${esc(e.how)}</p>
        <div class="shelf-item-foot">
          <span class="shelf-status"></span>
          ${e.booklet ? `<label class="shelf-own" for="shelfOwn-${i}"><input type="checkbox" id="shelfOwn-${i}" data-booklet="${e.booklet}"> I own this booklet</label>` : ""}
          <a class="shelf-link" href="${e.url}" target="_blank" rel="noopener noreferrer">BoardGameGeek<span class="sr-only">: ${esc(e.name)} (opens in a new tab)</span></a>
        </div>
      </li>`;
    });
    if (open) html += `</ul>`;
    shelf.innerHTML = html;
    shelf.querySelectorAll("[data-booklet]").forEach(c => c.addEventListener("change", () => {
      const next = new Set(ownedItems);
      if (c.checked) next.add(c.dataset.booklet); else next.delete(c.dataset.booklet);
      setOwnedItems(next);
    }));
    toggle.setAttribute("aria-expanded", "false");
    shelf.hidden = true;
    if (!toggle.dataset.wired) {
      toggle.dataset.wired = "1";
      toggle.addEventListener("click", () => {
        const show = toggle.getAttribute("aria-expanded") !== "true";
        toggle.setAttribute("aria-expanded", String(show));
        document.getElementById("collectionShelf").hidden = !show;
        if (show) track("shelf_open");
      });
    }
  }

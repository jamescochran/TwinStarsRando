const CACHE = "twin-stars-dev";
// Rulebook images live in their own cache that survives releases: they are large and rarely
// change, and players rely on them offline. Bump this only when the rulebook files change.
const RULES_CACHE = "twin-stars-rules-v1";
const BASE = self.registration.scope;
const ASSETS = [
  BASE,
  BASE + "index.html",
  BASE + "head.js",
  BASE + "app.js",
  BASE + "manifest.json",
  BASE + "icon-192.png",
  BASE + "icon-512.png",
  // Self-hosted fonts, precached so the first offline visit renders in the real typefaces.
  // fonts/exo2-latin-ext.woff2 is left out: browsers fetch it only for non-latin characters.
  BASE + "fonts/orbitron-latin.woff2",
  BASE + "fonts/exo2-latin.woff2"
];

// Install — cache all assets
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      // cache:"reload" skips the browser's HTTP cache. GitHub Pages sends max-age=600, so a
      // plain addAll() could precache the *previous* deploy's files under the new cache name
      // and leave users stuck on the old version.
      Promise.all(ASSETS.map(url => cache.add(new Request(url, { cache: "reload" }))))
    )
  );
  self.skipWaiting();
});

// Activate — delete old caches, preserve the persistent fonts and rulebook caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE && k !== RULES_CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — cache-first for app assets; persistent cache for rules images; fonts are self-hosted and precached
self.addEventListener("fetch", e => {
  const url = e.request.url;
  if (e.request.method === "GET" && isRulesUrl(url)) {
    e.respondWith(rulesResponse(e));
    return;
  }
  // Non-GET requests (e.g. analytics POSTs) go straight to the network, never the cache.
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// ---- Rulebook images -------------------------------------------------------------------------

// Only same-origin requests under this SW's scope + "rules/" — a bare includes("/rules/")
// would also match (and cache) cross-origin URLs.
function isRulesUrl(url) {
  const parsed = new URL(url, BASE);
  return parsed.origin === self.location.origin &&
    parsed.pathname.startsWith(new URL(BASE).pathname + "rules/");
}
function rulesKey(url) {
  const u = new URL(url, BASE);
  return u.origin + u.pathname;
}

// True when the bytes hold a whole PNG / WebP / AVIF file. A cut-off download still fires the
// image's "load" event and draws the top part, so a truncated file must never be cached (it would
// be served offline forever) and the page needs a way to tell.
function imageIsComplete(buf) {
  const b = new Uint8Array(buf), n = b.length, dv = new DataView(buf);
  const ascii = (o, l) => o + l <= n ? String.fromCharCode(...b.subarray(o, o + l)) : "";
  if (ascii(1, 3) === "PNG") {                       // chunks run until IEND
    let o = 8;
    while (o + 12 <= n) {
      const len = dv.getUint32(o), type = ascii(o + 4, 4);
      o += 12 + len;
      if (type === "IEND") return o <= n;
    }
    return false;
  }
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return dv.getUint32(4, true) + 8 <= n;
  if (ascii(4, 4) === "ftyp") {                      // AVIF: top-level boxes must add up exactly
    let o = 0;
    while (o + 8 <= n) {
      let size = dv.getUint32(o);
      if (size === 1) size = o + 16 <= n ? Number(dv.getBigUint64(o + 8)) : 0;
      else if (size === 0) size = n - o;
      if (size < 8) return false;
      o += size;
    }
    return o === n;
  }
  return n > 0;
}

const rulesInFlight = new Map();      // key -> promise of a state, so concurrent asks share one fetch
const rulesIncomplete = new Set();    // keys whose network copy is known to be truncated

// Fetch one rulebook file and keep it only if it is complete. Resolves to "ok", "incomplete",
// "missing" (HTTP error) or "offline".
function storeRule(key, response) {
  if (rulesInFlight.has(key)) return rulesInFlight.get(key);
  const job = (async () => {
    try {
      const res = response || await fetch(key, { cache: "no-cache" });
      if (!res.ok) return "missing";
      const copy = res.clone();
      const buf = await res.arrayBuffer();
      if (!imageIsComplete(buf)) { rulesIncomplete.add(key); return "incomplete"; }
      rulesIncomplete.delete(key);
      await (await caches.open(RULES_CACHE)).put(key, copy);
      return "ok";
    } catch (err) {
      return "offline";
    }
  })();
  rulesInFlight.set(key, job);
  job.finally(() => rulesInFlight.delete(key));
  return job;
}

async function rulesResponse(e) {
  const key = rulesKey(e.request.url);
  const cache = await caches.open(RULES_CACHE);
  const cached = await cache.match(key);
  if (cached) return cached;
  const response = await fetch(e.request);
  // Store a copy in the background; the image streams to the page meanwhile.
  if (response.ok) e.waitUntil(storeRule(key, response.clone()));
  return response;
}

async function ruleState(url) {
  const key = rulesKey(url);
  if (rulesInFlight.has(key)) return rulesInFlight.get(key);
  if (await (await caches.open(RULES_CACHE)).match(key)) return "ok";
  if (rulesIncomplete.has(key)) return "incomplete";
  return storeRule(key);
}

// The Rulebooks dialog talks to the worker over a MessageChannel port:
//   {type:"rules-status", urls}  -> {saved:[url…]}           which files are stored for offline use
//   {type:"rules-check",  url}   -> {state}                  is this file whole? (stores it if so)
//   {type:"rules-save",   urls}  -> {progress:{done,total,url,state}}… then {done:true, results}
self.addEventListener("message", e => {
  const data = e.data || {}, port = e.ports && e.ports[0];
  if (!port || typeof data.type !== "string" || !data.type.startsWith("rules-")) return;
  const urls = (Array.isArray(data.urls) ? data.urls : [data.url]).filter(u => typeof u === "string" && isRulesUrl(u));
  e.waitUntil((async () => {
    if (data.type === "rules-status") {
      const cache = await caches.open(RULES_CACHE);
      const saved = [];
      for (const u of urls) if (await cache.match(rulesKey(u))) saved.push(u);
      port.postMessage({ saved });
    } else if (data.type === "rules-check") {
      port.postMessage({ state: urls.length ? await ruleState(urls[0]) : "missing" });
    } else if (data.type === "rules-save") {
      const results = {};
      let done = 0;
      for (const u of urls) {
        results[u] = await ruleState(u);
        port.postMessage({ progress: { done: ++done, total: urls.length, url: u, state: results[u] } });
      }
      port.postMessage({ done: true, results });
    }
  })());
});

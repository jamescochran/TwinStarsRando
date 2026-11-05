const CACHE = "twin-stars-2026-10-14-1927";
const FONTS_CACHE = "twin-stars-fonts-v1";
const BASE = self.registration.scope;
const ASSETS = [
  BASE,
  BASE + "index.html",
  BASE + "head.js",
  BASE + "app.js",
  BASE + "manifest.json",
  BASE + "icon-192.png",
  BASE + "icon-512.png"
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

// Activate — delete old caches, preserve the persistent fonts cache
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE && k !== FONTS_CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — cache-first for app assets; cache-first with network fallback for fonts and rules images
self.addEventListener("fetch", e => {
  const url = e.request.url;
  const parsed = new URL(url);
  // Only same-origin requests under this SW's scope + "rules/" — a bare includes("/rules/")
  // would also match (and cache) cross-origin URLs.
  const scopePath = new URL(BASE).pathname;
  if (e.request.method === "GET" && parsed.origin === self.location.origin &&
      parsed.pathname.startsWith(scopePath + "rules/")) {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(response => {
            if (response.ok) cache.put(e.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }
  if (url.startsWith("https://fonts.googleapis.com") || url.startsWith("https://fonts.gstatic.com")) {
    e.respondWith(
      caches.open(FONTS_CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(response => {
            if (response.ok) cache.put(e.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }
  // Non-GET requests (e.g. analytics POSTs) go straight to the network, never the cache.
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

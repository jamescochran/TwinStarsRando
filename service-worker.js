const CACHE = "twin-stars-2026-05-20-2306";
const FONTS_CACHE = "twin-stars-fonts-v1";
const ASSETS = [
  "/TwinStarsRando/",
  "/TwinStarsRando/index.html",
  "/TwinStarsRando/manifest.json",
  "/TwinStarsRando/icon-192.png",
  "/TwinStarsRando/icon-512.png"
];

// Install — cache all assets
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
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

// Fetch — cache-first for app assets; cache-first with network fallback for fonts
self.addEventListener("fetch", e => {
  const url = e.request.url;
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
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

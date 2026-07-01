const CACHE_NAME = "defiende-nucleo-pc-v6";
const ASSETS = [
  "./",
  "./index.html",
  "./help.html",
  "./privacy.html",
  "./manifest.webmanifest",
  "./src/styles.css",
  "./src/main.js",
  "./src/audio.js",
  "./src/config/difficulty.js",
  "./src/config/balance.js",
  "./src/gameLogic.js",
  "./src/maps.js",
  "./src/campaign.js",
  "./src/progression.js",
  "./src/renderer.js",
  "./src/storage.js",
  "./src/ui.js",
  "./assets/icon.svg",
  "./assets/screenshot-home.svg",
  "./assets/screenshot-game.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});

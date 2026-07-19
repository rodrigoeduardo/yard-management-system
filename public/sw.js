/**
 * Minimal PWA service worker (issue #143): installability + an offline
 * fallback page. No data/API caching, no background sync — that is
 * explicitly out of scope, see the issue.
 *
 * Registered only in production builds, from
 * components/pwa/service-worker-register.tsx.
 */
const CACHE_NAME = "patio-offline-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") {
    // No API/data caching: only navigation requests fall back offline.
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.open(CACHE_NAME).then((cache) => cache.match(OFFLINE_URL)),
    ),
  );
});

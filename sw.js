// Auto-Updater Service Worker (Cache Buster)
// This completely disables aggressive PWA caching so users NEVER have to manually clear cache again.
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Automatically install without waiting
});

self.addEventListener('activate', (e) => {
  // Completely wipe out any old caches on the user's device
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      self.clients.claim(); // Take control immediately
    })
  );
});

// Pass all network requests straight through (Network Only)
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request));
});

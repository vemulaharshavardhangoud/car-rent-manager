const CACHE_NAME = 'carrent-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png'
];

// Force updating of all clients when a new service worker is installed
self.addEventListener('install', (e) => {
  self.skipWaiting(); 
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Network First strategy for important assets
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  // For index.html and root, try network first, then cache.
  // We check for both '/' (local) and '/car-rent-manager/' (GitHub Pages)
  if (url.origin === self.location.origin && (
      url.pathname === '/' || 
      url.pathname === '/index.html' || 
      url.pathname === '/car-rent-manager/' || 
      url.pathname === '/car-rent-manager/index.html'
  )) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // For other assets, use Cache First (standard PWA)
    e.respondWith(
      caches.match(e.request).then((res) => res || fetch(e.request))
    );
  }
});

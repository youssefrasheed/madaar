const CACHE_NAME = 'madaar-pwa-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/pwa-192.png',
  '/pwa-512.png',
  '/apple-touch-icon.png',
  '/Logo.svg',
  '/logo-01.svg',
  '/Icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Network-First for HTML/navigation and JS, Cache-Fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept API requests
  if (url.pathname.startsWith('/api') || url.hostname === 'api.jooart.uk') {
    return;
  }

  // Network-First Strategy: Always fetch fresh code when online
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          event.request.method === 'GET' &&
          event.request.url.startsWith('http')
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

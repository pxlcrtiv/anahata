/**
 * Anahata offline shell.
 *
 * Strategy: navigations are network-first (a fresh shell whenever online,
 * with the cached index.html as the offline fallback); same-origin assets
 * are cache-first (Vite emits content-hashed, immutable asset filenames,
 * so a cached hit is always correct). Everything cached lands in one
 * versioned cache so future deploys can wipe it wholesale.
 */

const CACHE = 'anahata-v1';

self.addEventListener('install', (event) => {
  // Precache the whole shell up front, from the build-generated precache
  // list. The first visit's own navigation runs before this worker takes
  // control, so runtime caching alone would leave the app unbootable
  // offline on a first-visit install.
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch('/sw-precache.json', { cache: 'reload' });
        const urls = await response.json();
        for (const url of urls) {
          await cache.add(new Request(url, { cache: 'reload' }));
        }
      } catch {
        // Fallback: at least the document, so offline launch isn't blank.
        await cache.add(new Request('/index.html', { cache: 'reload' }));
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from previous deploys; claim existing clients.
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: fresh shell when online, cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  // Content-hashed assets: a cache hit is always the correct version.
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});

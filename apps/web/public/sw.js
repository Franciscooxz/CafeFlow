// CafeFlow Service Worker — PWA offline-ready
const CACHE_NAME = 'cafeflow-v1';

// Assets estáticos a pre-cachear
const PRECACHE = [
  '/',
  '/manifest.json',
  '/icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Las peticiones a la API siempre van a la red (no cachear datos)
  if (url.pathname.startsWith('/api/')) return;

  // Para todo lo demás: cache-first, fallback a red
  event.respondWith(
    caches.match(request).then(
      (cached) => cached || fetch(request).catch(() => cached),
    ),
  );
});

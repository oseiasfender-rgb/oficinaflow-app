const OFICINAOS_CACHE = 'oficinaos-layout-oficial-rc1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/operational-ui-fusion.css',
  './assets/icon-192.svg',
  './assets/icon-512.svg',
  './core/storage-adapter.js',
  './core/clean-start.js',
  './core/oficinaos-zero-real.js',
  './core/autosave-smart-backup.js',
  './core/operational-ui-fusion.js',
  './wizard/index.html',
  './ia/consultor.html',
  './pdf/index.html'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(OFICINAOS_CACHE);
    await Promise.all(CORE_ASSETS.map(asset =>
      cache.add(asset).catch(err => console.warn('Falha ao cachear', asset, err))
    ));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== OFICINAOS_CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response && response.ok) {
        const cache = await caches.open(OFICINAOS_CACHE);
        cache.put(event.request, response.clone()).catch(() => {});
      }
      return response;
    } catch (err) {
      return caches.match('./index.html');
    }
  })());
});

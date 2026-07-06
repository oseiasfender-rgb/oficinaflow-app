const OFICINAOS_CACHE = 'oficinaos-v550-60';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icon-192.svg',
  './assets/icon-512.svg',
  './core/state-manager.js',
  './core/final-merge.js',
  './core/operational-flow.js',
  './core/backup-core.js',
  './core/pwa-readiness.js',
  './modules/orcamento/orcamento-core.js',
  './modules/financeiro/financeiro-core.js',
  './modules/agenda/agenda-core.js',
  './modules/clientes/clientes-core.js',
  './modules/metas/metas-core.js',
  './modules/relatorios/relatorios-core.js',
  './modules/ia/ia-core.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(OFICINAOS_CACHE)
      .then(cache => cache.addAll(CORE_ASSETS.filter(Boolean)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== OFICINAOS_CACHE).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(OFICINAOS_CACHE).then(cache => cache.put(event.request, copy)).catch(()=>{});
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

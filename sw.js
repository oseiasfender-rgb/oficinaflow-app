const CACHE_NAME='oficinaos-v546-21-2';
const CORE_ASSETS=['./','./index.html','./orcamento.html','./financeiro.html','./agenda.html','./relatorios.html','./metas.html','./clientes.html','./ia.html','./manifest.webmanifest','./icons/icon-192.svg','./icons/icon-512.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(CORE_ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE_NAME).then(cache=>cache.put(e.request,copy));return r}).catch(()=>caches.match('./index.html'))))});

const CACHE='oficinaos-v54727-testes-finais-1';
const ASSETS=[
 './','./index.html','./orcamento.html','./financeiro.html','./agenda.html','./clientes.html',
 './relatorios.html','./metas.html','./ia.html','./busca.html','./alertas.html',
 './configuracoes.html','./auditoria.html','./preferencias.html','./dashboard-operacional.html',
 './fotos-os.html','./manifest.webmanifest'
];
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS).catch(()=>null)));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
});


(function(g){
'use strict';
function arr(v){return Array.isArray(v)?v:[]}
function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function now(){return new Date().toISOString()}
function st(){return g.StateManager?g.StateManager.load():(g.STATE=g.STATE||{})}
function sv(s){return g.StateManager?g.StateManager.save(s):(g.STATE=s,localStorage.setItem('OficinaOS',JSON.stringify(s)),s)}
function ensure(){
  let s=st();
  s.pwa=obj(s.pwa);
  s.pwa.version='550.60';
  s.pwa.githubReady=true;
  s.pwa.checkedAt=now();
  s.version='550.60';
  s.releaseStage='PWA_GITHUB_READINESS';
  sv(s);
  return s.pwa;
}
function capability(){
  return {
    version:'550.60',
    serviceWorker: typeof navigator!=='undefined' && 'serviceWorker' in navigator,
    caches: typeof caches!=='undefined',
    standalone: typeof window!=='undefined' && (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true),
    localStorage: (function(){try{localStorage.setItem('__oficinaos_test','1');localStorage.removeItem('__oficinaos_test');return true}catch(e){return false}})(),
    manifest:'manifest.webmanifest',
    startUrl:'./index.html'
  };
}
function readiness(){
  let c=capability();
  let required=['serviceWorker','caches','localStorage'];
  let missing=required.filter(k=>!c[k]);
  let report={ok:missing.length===0,missing,capability:c,checkedAt:now()};
  let s=st(); s.pwa=obj(s.pwa); s.pwa.readiness=report; sv(s);
  return report;
}
function githubChecklist(){
  return [
    'Usar index.html na raiz do repositório',
    'Manter manifest.webmanifest na raiz',
    'Manter service-worker.js na raiz',
    'Manter assets/icon-192.svg e assets/icon-512.svg',
    'Publicar no GitHub Pages a partir da branch main e pasta root',
    'Testar instalação no Android/Chrome',
    'Rodar PWAReadinessTest.run() no console',
    'Rodar BackupCoreTest.run() antes de publicação real'
  ];
}
function boot(){ensure();readiness()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
g.PWAReadiness={version:'550.60',ensure,capability,readiness,githubChecklist,boot};
})(window);

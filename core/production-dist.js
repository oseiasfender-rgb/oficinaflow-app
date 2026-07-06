
(function(g){
'use strict';
const VERSION='551.35';
function now(){return new Date().toISOString()}
function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function arr(v){return Array.isArray(v)?v:[]}
function st(){return g.StateManager?g.StateManager.load():(g.STATE=g.STATE||{})}
function sv(s){if(g.StateManager&&g.StateManager.save)return g.StateManager.save(s);g.STATE=s;try{localStorage.setItem('OficinaOS',JSON.stringify(s))}catch(e){}return s}

function ensure(){
  let s=st();
  s.version=VERSION;
  s.releaseStage='PRODUCTION_DIST_CLEAN';
  s.production=obj(s.production);
  s.production.version=VERSION;
  s.production.dist='clean';
  s.production.generatedAt=s.production.generatedAt||now();
  s.production.testsAutoloaded=false;
  s.production.readyForDeploy=true;
  s.updatedAt=now();
  sv(s);
  return s;
}

function readiness(){
  const s=ensure();
  return {
    version:VERSION,
    status:'PRODUCTION_DIST_READY',
    cleanStart:!!g.CleanStart,
    storageAdapter:!!g.StorageAdapter,
    autoSave:!!g.AutoSaveSmartBackup,
    firstRunWizard:!!g.FirstRunWizard,
    tabFusion:!!g.TabFusionExcellence,
    adminShell:!!g.AdminShell,
    stateVersion:s.version,
    releaseStage:s.releaseStage,
    checkedAt:now()
  };
}

function deployChecklist(){
  return [
    'Publicar somente o conteúdo deste pacote na raiz do GitHub Pages',
    'Confirmar index.html na raiz',
    'Confirmar manifest.webmanifest na raiz',
    'Confirmar service-worker.js na raiz',
    'Confirmar .nojekyll na raiz',
    'Abrir wizard/index.html no primeiro uso',
    'Rodar CleanStart.verifyZero()',
    'Rodar await StorageAdapter.status()',
    'Rodar AutoSaveSmartBackup.status()',
    'Configurar empresa no First Run Wizard',
    'Gerar primeiro backup antes da primeira ação real'
  ];
}

function boot(){ensure()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();

g.ProductionDist={
  version:VERSION,
  ensure,
  readiness,
  deployChecklist
};
})(window);

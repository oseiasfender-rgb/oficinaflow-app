
(function(g){
'use strict';

const VERSION='551.36';

function now(){return new Date().toISOString()}
function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function arr(v){return Array.isArray(v)?v:[]}
function st(){return g.StateManager?g.StateManager.load():(g.STATE=g.STATE||{})}
function sv(s){if(g.StateManager&&g.StateManager.save)return g.StateManager.save(s);g.STATE=s;try{localStorage.setItem('OficinaOS',JSON.stringify(s))}catch(e){}return s}

function ensure(){
  let s=st();
  s.version=VERSION;
  s.releaseStage='BROWSER_RUNTIME_QA';
  s.browserQA=obj(s.browserQA);
  s.browserQA.version=VERSION;
  s.browserQA.lastRun=s.browserQA.lastRun||'';
  s.updatedAt=now();
  sv(s);
  return s;
}

function pass(name, ok, detail, severity){
  return {name, pass:!!ok, detail:detail||'', severity:severity||'normal', time:now()};
}

async function checkIndexedDB(){
  let checks=[];
  checks.push(pass('IndexedDB disponível', typeof indexedDB !== 'undefined', 'API indexedDB no navegador', 'critico'));
  checks.push(pass('StorageAdapter carregado', !!g.StorageAdapter, 'core/storage-adapter.js', 'critico'));
  if(g.StorageAdapter && g.StorageAdapter.status){
    try{
      const status=await g.StorageAdapter.status();
      checks.push(pass('StorageAdapter.status()', !!status && status.version, JSON.stringify(status), 'critico'));
      checks.push(pass('Engine IndexedDB/fallback', !!status.engine, status.engine||'', 'critico'));
    }catch(e){
      checks.push(pass('StorageAdapter.status()', false, e.message, 'critico'));
    }
  }
  return checks;
}

async function checkCleanStart(){
  let checks=[];
  checks.push(pass('CleanStart carregado', !!g.CleanStart, 'core/clean-start.js', 'critico'));
  if(g.CleanStart && g.CleanStart.verifyZero){
    try{
      const z=g.CleanStart.verifyZero();
      checks.push(pass('CleanStart.verifyZero()', !!z && typeof z.zero==='boolean', JSON.stringify({zero:z.zero,total:z.total,counts:z.counts}), 'critico'));
    }catch(e){
      checks.push(pass('CleanStart.verifyZero()', false, e.message, 'critico'));
    }
  }
  return checks;
}

async function checkAutoSave(){
  let checks=[];
  checks.push(pass('AutoSaveSmartBackup carregado', !!g.AutoSaveSmartBackup, 'core/autosave-smart-backup.js', 'critico'));
  if(g.AutoSaveSmartBackup){
    try{
      const st=g.AutoSaveSmartBackup.status();
      checks.push(pass('AutoSave status', !!st && st.version, JSON.stringify(st), 'critico'));
      checks.push(pass('AutoSave 4 segundos', st && st.delayMs===4000, 'delayMs='+ (st&&st.delayMs), 'critico'));
      g.AutoSaveSmartBackup.markDirty('browser_qa_test');
      await g.AutoSaveSmartBackup.flush('browser_qa_flush');
      const st2=g.AutoSaveSmartBackup.status();
      checks.push(pass('AutoSave flush', st2 && st2.dirty===false, 'dirty='+ (st2&&st2.dirty), 'normal'));
    }catch(e){
      checks.push(pass('AutoSave runtime', false, e.message, 'critico'));
    }
  }
  return checks;
}

async function checkBackup(){
  let checks=[];
  if(g.StorageAdapter && g.StorageAdapter.backup){
    try{
      const b=await g.StorageAdapter.backup('browser_qa_backup');
      checks.push(pass('Backup IndexedDB', !!b && !!b.id, b&&b.id?b.id:'', 'critico'));
      const list=await g.StorageAdapter.listBackups();
      checks.push(pass('Listagem de backups', Array.isArray(list), 'total='+(list?list.length:0), 'normal'));
    }catch(e){
      checks.push(pass('Backup IndexedDB', false, e.message, 'critico'));
    }
  } else {
    checks.push(pass('Backup IndexedDB', false, 'StorageAdapter.backup ausente', 'critico'));
  }
  if(g.AutoSaveSmartBackup && g.AutoSaveSmartBackup.dailyBackup){
    try{
      const d=await g.AutoSaveSmartBackup.dailyBackup();
      checks.push(pass('Smart Backup diário', !!d, JSON.stringify(d), 'normal'));
    }catch(e){
      checks.push(pass('Smart Backup diário', false, e.message, 'normal'));
    }
  }
  return checks;
}

async function checkFirstRunWizard(){
  let checks=[];
  checks.push(pass('FirstRunWizard carregado', !!g.FirstRunWizard, 'core/first-run-wizard.js', 'critico'));
  if(g.FirstRunWizard){
    try{
      const s=g.FirstRunWizard.status();
      checks.push(pass('FirstRunWizard.status()', !!s && s.version, JSON.stringify(s), 'critico'));
      const rec=g.FirstRunWizard.nextRecommendation();
      checks.push(pass('FirstRunWizard.nextRecommendation()', typeof rec==='string' && rec.length>0, rec, 'normal'));
    }catch(e){
      checks.push(pass('FirstRunWizard runtime', false, e.message, 'critico'));
    }
  }
  return checks;
}

async function checkPWA(){
  let checks=[];
  checks.push(pass('Service Worker API', 'serviceWorker' in navigator, 'navigator.serviceWorker', 'critico'));
  checks.push(pass('Manifest link', !!document.querySelector('link[rel="manifest"]'), 'link rel manifest', 'critico'));
  checks.push(pass('Standalone display possível', window.matchMedia ? true : false, 'matchMedia disponível', 'normal'));
  if('serviceWorker' in navigator){
    try{
      const regs=await navigator.serviceWorker.getRegistrations();
      checks.push(pass('Service Worker registrations', Array.isArray(regs), 'total='+(regs?regs.length:0), 'normal'));
    }catch(e){
      checks.push(pass('Service Worker registrations', false, e.message, 'normal'));
    }
  }
  return checks;
}

async function checkCache(){
  let checks=[];
  checks.push(pass('Cache API disponível', typeof caches !== 'undefined', 'window.caches', 'normal'));
  if(typeof caches !== 'undefined'){
    try{
      const keys=await caches.keys();
      checks.push(pass('Cache keys legíveis', Array.isArray(keys), keys.join(', '), 'normal'));
    }catch(e){
      checks.push(pass('Cache keys legíveis', false, e.message, 'normal'));
    }
  }
  return checks;
}

async function checkAdminAndFusion(){
  let checks=[];
  checks.push(pass('AdminShell carregado', !!g.AdminShell, 'Contas/Auditoria/Alertas/Busca/Configurações', 'critico'));
  checks.push(pass('TabFusionExcellence carregado', !!g.TabFusionExcellence, 'Fusão oficial das abas', 'critico'));
  if(g.TabFusionExcellence){
    try{
      const score=g.TabFusionExcellence.excellenceScore();
      checks.push(pass('TabFusion Excellence Score', !!score && typeof score.score==='number', JSON.stringify(score), 'normal'));
    }catch(e){checks.push(pass('TabFusion Excellence Score', false, e.message, 'normal'))}
  }
  return checks;
}

function checkEnvironment(){
  return [
    pass('Protocolo seguro/local', location.protocol==='https:' || location.hostname==='localhost' || location.protocol==='file:', location.href, 'critico'),
    pass('UserAgent disponível', !!navigator.userAgent, navigator.userAgent, 'normal'),
    pass('Online status', typeof navigator.onLine==='boolean', 'online='+navigator.onLine, 'normal'),
    pass('Viewport mobile/desktop', !!window.innerWidth, window.innerWidth+'x'+window.innerHeight, 'normal')
  ];
}

async function run(){
  ensure();
  let sections=[];
  async function section(name, fn){
    try{
      const checks=await fn();
      sections.push({name, checks});
    }catch(e){
      sections.push({name, checks:[pass(name, false, e.message, 'critico')]});
    }
  }
  await section('Ambiente', async()=>checkEnvironment());
  await section('IndexedDB', checkIndexedDB);
  await section('Clean Start', checkCleanStart);
  await section('AutoSave', checkAutoSave);
  await section('Backup', checkBackup);
  await section('First Run Wizard', checkFirstRunWizard);
  await section('PWA', checkPWA);
  await section('Cache', checkCache);
  await section('Administração e Fusão', checkAdminAndFusion);

  const all=sections.flatMap(s=>s.checks.map(c=>Object.assign({section:s.name},c)));
  const failed=all.filter(c=>!c.pass);
  const criticalFailed=failed.filter(c=>c.severity==='critico');
  const report={
    version:VERSION,
    status:criticalFailed.length===0?'BROWSER_QA_OK':'BROWSER_QA_FAIL',
    generatedAt:now(),
    total:all.length,
    passed:all.filter(c=>c.pass).length,
    failed:failed.length,
    criticalFailed:criticalFailed.length,
    sections,
    next: criticalFailed.length===0 ? 'Pode avançar para PDF Premium Final Verification' : 'Corrigir falhas críticas antes de publicar/usar'
  };
  let s=ensure();
  s.browserQA.lastRun=now();
  s.browserQA.lastReport=report;
  sv(s);
  return report;
}

function summary(){
  const s=ensure();
  return s.browserQA.lastReport || {version:VERSION,status:'NOT_RUN',message:'Execute await BrowserRuntimeQA.run()'};
}

function checklist(){
  return [
    'Abrir o sistema publicado no Chrome Desktop',
    'Abrir o sistema publicado no Chrome Android',
    'Executar await BrowserRuntimeQA.run()',
    'Confirmar IndexedDB OK',
    'Confirmar CleanStart OK',
    'Confirmar AutoSave OK',
    'Confirmar backup local OK',
    'Confirmar FirstRunWizard OK',
    'Confirmar Service Worker/Manifest',
    'Confirmar AdminShell/TabFusion',
    'Testar recarregar página e persistir estado',
    'Testar instalar como PWA',
    'Testar uso offline básico após instalação'
  ];
}

function renderHTML(){
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OficinaOS V551.36 — Browser Runtime QA</title><style>body{font-family:Arial,sans-serif;background:#f8f6f3;color:#23180f;margin:0;padding:24px}.wrap{max-width:1100px;margin:auto}.card{background:white;border:1px solid #e8dccf;border-radius:18px;padding:18px;box-shadow:0 8px 22px rgba(0,0,0,.06);margin-bottom:16px}button{padding:12px 16px;border-radius:12px;border:0;background:#111827;color:white;cursor:pointer}pre{background:#111827;color:#f8f6f3;padding:16px;border-radius:14px;white-space:pre-wrap;overflow:auto;max-height:620px}.ok{color:#166534}.fail{color:#991b1b}</style></head><body><div class="wrap"><h1>OficinaOS V551.36 — Browser Runtime QA</h1><div class="card"><p>Validação real no navegador: IndexedDB, AutoSave, Backup, First Run Wizard, PWA, Cache e Administração.</p><button onclick="runQA()">Rodar QA do Navegador</button> <button onclick="show(BrowserRuntimeQA.summary())">Resumo</button> <button onclick="show(BrowserRuntimeQA.checklist())">Checklist</button></div><pre id="out">Aguardando...</pre></div><script src="../core/storage-adapter.js"></script><script src="../core/clean-start.js"></script><script src="../core/autosave-smart-backup.js"></script><script src="../core/admin-shell.js"></script><script src="../core/tab-fusion-excellence.js"></script><script src="../core/first-run-wizard.js"></script><script src="../core/browser-runtime-qa.js"></script><script>async function runQA(){try{show(await BrowserRuntimeQA.run())}catch(e){show({error:e.message})}}function show(x){document.getElementById("out").textContent=typeof x==="string"?x:JSON.stringify(x,null,2)}</script></body></html>';
}

function boot(){ensure()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();

g.BrowserRuntimeQA={
  version:VERSION,
  ensure,
  run,
  summary,
  checklist,
  renderHTML,
  checkIndexedDB,
  checkCleanStart,
  checkAutoSave,
  checkBackup,
  checkFirstRunWizard,
  checkPWA,
  checkCache,
  checkAdminAndFusion,
  checkEnvironment
};
})(window);

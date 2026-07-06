
(function(g){
'use strict';

const VERSION='551.34';

function now(){return new Date().toISOString()}
function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function arr(v){return Array.isArray(v)?v:[]}
function clean(v){return String(v??'').trim()}
function uid(p){return(p||'wizard')+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}
function st(){return g.StateManager?g.StateManager.load():(g.STATE=g.STATE||{})}
function sv(s){if(g.StateManager&&g.StateManager.save)return g.StateManager.save(s);g.STATE=s;try{localStorage.setItem('OficinaOS',JSON.stringify(s))}catch(e){}return s}

const STEPS=[
  {key:'storage',label:'Verificar armazenamento'},
  {key:'mode',label:'Escolher início'},
  {key:'empresa',label:'Configurar empresa'},
  {key:'importacao',label:'Importar backup ou confirmar zero'},
  {key:'backup',label:'Gerar primeiro backup'},
  {key:'concluir',label:'Concluir primeira inicialização'}
];

function ensure(){
  let s=st();
  s.version=VERSION;
  s.releaseStage='FIRST_RUN_WIZARD';
  s.firstRun=obj(s.firstRun);
  s.firstRun.version=VERSION;
  s.firstRun.startedAt=s.firstRun.startedAt||now();
  s.firstRun.completed=!!s.firstRun.completed;
  s.firstRun.currentStep=s.firstRun.currentStep||'storage';
  s.firstRun.mode=s.firstRun.mode||'undecided';
  s.firstRun.steps=STEPS;
  s.historico=obj(s.historico);
  s.historico.eventos=arr(s.historico.eventos);
  s.configuracoes=obj(s.configuracoes);
  g.STATE=s;
  sv(s);
  return s;
}

function historico(tipo,descricao,extra){
  let s=ensure();
  const rec=Object.assign({id:uid('hist'),tipo,descricao,data:now()},extra||{});
  s.historico.eventos.push(rec);
  sv(s);
  return rec;
}

function zeroCounts(){
  const s=ensure();
  return {
    clientes:arr(s.clientes).length,
    veiculos:arr(s.veiculos).length,
    orcamentos:arr(s.orcamentos).length,
    agenda:arr(s.agenda).length,
    fluxos:arr(s.fluxos).length,
    lancamentos:arr(obj(s.financeiro).lancamentos).length,
    contas:arr(obj(s.financeiro).contas).length,
    recibos:arr(obj(s.financeiro).recibos).length,
    documentos:arr(obj(s.historico).documentos).length
  };
}

function isZero(){
  const c=zeroCounts();
  return Object.keys(c).reduce((a,k)=>a+c[k],0)===0;
}

async function checkStorage(){
  let storage={indexedDB:false,adapter:false,autosave:false,status:null};
  try{
    storage.indexedDB=typeof indexedDB!=='undefined';
    storage.adapter=!!g.StorageAdapter;
    if(g.StorageAdapter&&g.StorageAdapter.status) storage.status=await g.StorageAdapter.status();
    storage.autosave=!!g.AutoSaveSmartBackup;
  }catch(e){storage.error=e.message}
  let s=ensure();
  s.firstRun.storage=storage;
  s.firstRun.currentStep='mode';
  sv(s);
  historico('first_run_storage','Verificação inicial de armazenamento executada',storage);
  return storage;
}

function chooseMode(mode){
  if(!['zero','import','restore'].includes(mode)) throw new Error('Modo inválido: use zero, import ou restore');
  let s=ensure();
  s.firstRun.mode=mode;
  s.firstRun.currentStep=mode==='zero'?'empresa':'importacao';
  sv(s);
  historico('first_run_mode','Modo de primeira inicialização escolhido',{mode});
  return s.firstRun;
}

async function startZero(confirmText){
  if(confirmText!=='COMEÇAR DO ZERO') throw new Error('Confirmação inválida. Use: COMEÇAR DO ZERO');
  if(g.AutoSaveSmartBackup&&g.AutoSaveSmartBackup.beforeReset) await g.AutoSaveSmartBackup.beforeReset().catch(()=>{});
  if(g.StorageAdapter&&g.StorageAdapter.reset) await g.StorageAdapter.reset('ZERAR OFICINAOS');
  else if(g.CleanStart&&g.CleanStart.forceZero) g.CleanStart.forceZero('ZERAR OFICINAOS');
  let s=st();
  s.version=VERSION;
  s.releaseStage='FIRST_RUN_WIZARD_ZERO';
  s.firstRun=obj(s.firstRun);
  s.firstRun.version=VERSION;
  s.firstRun.mode='zero';
  s.firstRun.currentStep='empresa';
  s.firstRun.zeroConfirmedAt=now();
  g.STATE=s;
  sv(s);
  historico('first_run_zero','Sistema iniciado do zero absoluto',{counts:zeroCounts()});
  return s;
}

function empresaPatchDefaults(patch){
  patch=obj(patch);
  return {
    nome: clean(patch.nome),
    responsavel: clean(patch.responsavel),
    telefone: clean(patch.telefone),
    cnpj: clean(patch.cnpj),
    endereco: clean(patch.endereco),
    cidade: clean(patch.cidade || 'Leme/SP'),
    email: clean(patch.email),
    whatsapp: clean(patch.whatsapp || patch.telefone)
  };
}

async function saveEmpresa(patch){
  let s=ensure();
  const empresa=empresaPatchDefaults(patch);
  s.empresa=Object.assign({},obj(s.empresa),empresa);
  s.configuracoes=obj(s.configuracoes);
  s.configuracoes.empresa=Object.assign({},obj(s.configuracoes.empresa),empresa);
  s.firstRun.empresaConfigured=true;
  s.firstRun.currentStep='backup';
  g.STATE=s;
  sv(s);
  if(g.AutoSaveSmartBackup) {
    g.AutoSaveSmartBackup.markDirty('first_run_empresa');
    await g.AutoSaveSmartBackup.flush('first_run_empresa').catch(()=>{});
  }
  historico('first_run_empresa','Dados da empresa configurados',{empresa});
  return empresa;
}

async function importBackup(raw){
  if(g.AutoSaveSmartBackup&&g.AutoSaveSmartBackup.beforeImport) await g.AutoSaveSmartBackup.beforeImport().catch(()=>{});
  let data=raw;
  if(typeof raw==='string') data=JSON.parse(raw);
  data=obj(data);
  data.version=VERSION;
  data.releaseStage='FIRST_RUN_IMPORTED';
  data.importedAt=now();
  data.firstRun=obj(data.firstRun);
  data.firstRun.version=VERSION;
  data.firstRun.mode='import';
  data.firstRun.importedAt=now();
  data.firstRun.currentStep='empresa';
  if(g.StorageAdapter&&g.StorageAdapter.save) await g.StorageAdapter.save(data);
  else sv(data);
  g.STATE=data;
  historico('first_run_import','Backup real importado no primeiro uso',{counts:zeroCounts()});
  return data;
}

async function createInitialBackup(){
  let result=null;
  if(g.AutoSaveSmartBackup&&g.AutoSaveSmartBackup.criticalBackup) result=await g.AutoSaveSmartBackup.criticalBackup('first_run_initial_backup');
  else if(g.StorageAdapter&&g.StorageAdapter.backup) result=await g.StorageAdapter.backup('first_run_initial_backup');
  let s=ensure();
  s.firstRun.initialBackup=true;
  s.firstRun.initialBackupAt=now();
  s.firstRun.currentStep='concluir';
  sv(s);
  historico('first_run_backup','Primeiro backup real criado',{backup:result&&result.id?result.id:null});
  return result || {created:true,createdAt:now()};
}

async function complete(){
  let s=ensure();
  s.firstRun.completed=true;
  s.firstRun.completedAt=now();
  s.firstRun.currentStep='done';
  s.releaseStage='FIRST_RUN_COMPLETED';
  sv(s);
  if(g.AutoSaveSmartBackup) await g.AutoSaveSmartBackup.flush('first_run_completed').catch(()=>{});
  historico('first_run_completed','Assistente de primeira inicialização concluído',{mode:s.firstRun.mode});
  return s.firstRun;
}

function status(){
  const s=ensure();
  return {
    version:VERSION,
    completed:!!s.firstRun.completed,
    currentStep:s.firstRun.currentStep,
    mode:s.firstRun.mode,
    zero:isZero(),
    counts:zeroCounts(),
    empresaConfigured:!!s.firstRun.empresaConfigured || !!clean(obj(s.empresa).nome),
    initialBackup:!!s.firstRun.initialBackup,
    storage:s.firstRun.storage||null,
    steps:STEPS,
    checkedAt:now()
  };
}

function nextRecommendation(){
  const st=status();
  if(!st.storage) return 'Verificar armazenamento';
  if(st.mode==='undecided') return 'Escolher começar do zero ou importar backup';
  if(!st.empresaConfigured) return 'Configurar dados reais da empresa';
  if(!st.initialBackup) return 'Gerar primeiro backup';
  if(!st.completed) return 'Concluir assistente';
  return 'Pronto para primeira ação real';
}

function renderHTML(){
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OficinaOS V551.34 — Primeiro Uso</title><style>body{font-family:Arial,sans-serif;background:#f8f6f3;color:#23180f;margin:0;padding:24px}.wrap{max-width:980px;margin:auto}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}.card{background:white;border:1px solid #e8dccf;border-radius:18px;padding:18px;box-shadow:0 8px 22px rgba(0,0,0,.06)}button,input,textarea{padding:12px;border-radius:12px;border:1px solid #d6c8b8;margin:4px 0;width:100%;box-sizing:border-box}button{background:#111827;color:white;cursor:pointer}pre{background:#111827;color:#f8f6f3;padding:16px;border-radius:14px;white-space:pre-wrap;overflow:auto;max-height:420px}.danger{background:#7f1d1d}.ok{background:#166534}</style></head><body><div class="wrap"><h1>OficinaOS — Primeiro Uso V551.34</h1><p>Comece do zero absoluto, importe backup real ou configure a empresa antes da primeira ação.</p><div class="grid"><div class="card"><h2>1. Verificar armazenamento</h2><button onclick="run(FirstRunWizard.checkStorage())">Verificar IndexedDB</button></div><div class="card"><h2>2. Começar do zero</h2><button class="danger" onclick="run(FirstRunWizard.startZero(\\'COMEÇAR DO ZERO\\'))">Começar do zero absoluto</button></div><div class="card"><h2>3. Empresa</h2><input id="nome" placeholder="Nome da empresa"><input id="resp" placeholder="Responsável"><input id="tel" placeholder="Telefone/WhatsApp"><input id="cnpj" placeholder="CNPJ"><input id="end" placeholder="Endereço"><button onclick="run(FirstRunWizard.saveEmpresa({nome:nome.value,responsavel:resp.value,telefone:tel.value,cnpj:cnpj.value,endereco:end.value,cidade:\\'Leme/SP\\'}))">Salvar empresa</button></div><div class="card"><h2>4. Importar JSON</h2><textarea id="json" rows="5" placeholder="Cole aqui o backup JSON real"></textarea><button onclick="run(FirstRunWizard.importBackup(json.value))">Importar backup real</button></div><div class="card"><h2>5. Backup inicial</h2><button onclick="run(FirstRunWizard.createInitialBackup())">Gerar primeiro backup</button></div><div class="card"><h2>6. Concluir</h2><button class="ok" onclick="run(FirstRunWizard.complete())">Concluir primeiro uso</button></div></div><h2>Status</h2><button onclick="show(FirstRunWizard.status())">Atualizar status</button><button onclick="show(FirstRunWizard.nextRecommendation())">Próxima recomendação</button><pre id="out">Aguardando...</pre></div><script src="../core/storage-adapter.js"></script><script src="../core/clean-start.js"></script><script src="../core/autosave-smart-backup.js"></script><script src="../core/first-run-wizard.js"></script><script>async function run(p){try{show(await p)}catch(e){show({error:e.message})}}function show(x){document.getElementById("out").textContent=typeof x==="string"?x:JSON.stringify(x,null,2)}</script></body></html>';
}

function boot(){ensure()}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();

g.FirstRunWizard={
  version:VERSION,
  STEPS,
  ensure,
  checkStorage,
  chooseMode,
  startZero,
  saveEmpresa,
  importBackup,
  createInitialBackup,
  complete,
  status,
  zeroCounts,
  isZero,
  nextRecommendation,
  renderHTML,
  boot
};
})(window);

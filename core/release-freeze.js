
(function(g){
'use strict';

function arr(v){return Array.isArray(v)?v:[]}
function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function now(){return new Date().toISOString()}
function st(){return g.StateManager?g.StateManager.load():(g.STATE=g.STATE||{})}
function sv(s){return g.StateManager?g.StateManager.save(s):(g.STATE=s,localStorage.setItem('OficinaOS',JSON.stringify(s)),s)}
function uid(p){return(p||'freeze')+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}

function ensure(){
  let s=st();
  s.version='550.90';
  s.releaseStage='RELEASE_FREEZE';
  s.releaseFreeze=obj(s.releaseFreeze);
  s.releaseFreeze.version='550.90';
  s.releaseFreeze.frozenAt=s.releaseFreeze.frozenAt||now();
  s.releaseFreeze.status='FROZEN_CANDIDATE';
  s.releaseFreeze.base='Abas CLEAN';
  s.updatedAt=now();
  s.historico=obj(s.historico);
  s.historico.eventos=arr(s.historico.eventos);
  sv(s);
  return s;
}

function historico(tipo,descricao,extra){
  let s=ensure();
  let rec=Object.assign({id:uid('hist'),tipo,descricao,data:now()},extra||{});
  s.historico.eventos.push(rec);
  sv(s);
  return rec;
}

function requiredModules(){
  return [
    'StateManager',
    'OrcamentoCore',
    'FinanceiroCore',
    'AgendaCore',
    'ClientesCore',
    'MetasCore',
    'RelatoriosCore',
    'IACore',
    'OperationalFlow',
    'BackupCore',
    'PWAReadiness',
    'FullSystemQA',
    'BugFixFinal'
  ];
}

function moduleAudit(){
  return requiredModules().map(function(name){
    return {
      name:name,
      present:!!g[name],
      version:g[name]&&g[name].version?g[name].version:null
    };
  });
}

function stateAudit(){
  let s=ensure();
  let checks=[
    ['clientes',Array.isArray(s.clientes)],
    ['veiculos',Array.isArray(s.veiculos)],
    ['orcamentos',Array.isArray(s.orcamentos)],
    ['agenda',Array.isArray(s.agenda)],
    ['fluxos',Array.isArray(s.fluxos)],
    ['financeiro',!!obj(s.financeiro)],
    ['financeiro.lancamentos',Array.isArray(obj(s.financeiro).lancamentos)],
    ['financeiro.contas',Array.isArray(obj(s.financeiro).contas)],
    ['financeiro.recibos',Array.isArray(obj(s.financeiro).recibos)],
    ['metas',!!obj(s.metas)],
    ['relatorios',!!obj(s.relatorios)],
    ['ia',!!obj(s.ia)],
    ['historico.eventos',Array.isArray(obj(s.historico).eventos)],
    ['documentos',!!obj(s.documentos)],
    ['backup',!!obj(s.backup)]
  ];
  return checks.map(function(c){return{name:c[0],pass:!!c[1]}});
}

function qaAudit(){
  let out={};
  try{
    if(g.BugFixFinal && typeof g.BugFixFinal.regressionReport==='function') out.bugfix=g.BugFixFinal.regressionReport();
  }catch(e){out.bugfix={error:e.message||String(e)}}
  try{
    if(g.FullSystemQA && typeof g.FullSystemQA.fullQA==='function') out.fullQA=g.FullSystemQA.fullQA();
  }catch(e){out.fullQA={error:e.message||String(e)}}
  try{
    if(g.PWAReadiness && typeof g.PWAReadiness.readiness==='function') out.pwa=g.PWAReadiness.readiness();
  }catch(e){out.pwa={error:e.message||String(e)}}
  try{
    if(g.BackupCore && typeof g.BackupCore.validateState==='function') out.backup=g.BackupCore.validateState(ensure());
  }catch(e){out.backup={error:e.message||String(e)}}
  return out;
}

function freeze(){
  let modules=moduleAudit();
  let state=stateAudit();
  let qa=qaAudit();
  let missingModules=modules.filter(m=>!m.present).map(m=>m.name);
  let failedState=state.filter(s=>!s.pass).map(s=>s.name);
  let ok=missingModules.length===0 && failedState.length===0;
  let release={
    id:uid('release'),
    version:'550.90',
    status: ok ? 'RELEASE_FREEZE_OK' : 'RELEASE_FREEZE_WITH_WARNINGS',
    frozenAt:now(),
    officialBase:'Abas CLEAN',
    missingModules,
    failedState,
    modules,
    state,
    qa,
    next:'V551.00 — OficinaOS V1 Operational Release'
  };
  let s=ensure();
  s.releaseFreeze=release;
  sv(s);
  historico('release_freeze','Release Freeze V550.90 executado',{status:release.status,missingModules,failedState});
  return release;
}

function releaseNotes(){
  let s=ensure();
  let rf=s.releaseFreeze&&s.releaseFreeze.version?s.releaseFreeze:freeze();
  return [
    '# OficinaOS V550.90 — Release Freeze',
    '',
    'Status: '+rf.status,
    'Base oficial: Abas CLEAN',
    'Congelado em: '+rf.frozenAt,
    '',
    '## Módulos congelados',
    '- Orçamento Core',
    '- Financeiro Core',
    '- Agenda Core',
    '- Clientes Core',
    '- Metas Core',
    '- Relatórios Core',
    '- IA Core',
    '- Operational Flow',
    '- Backup / Import / Export',
    '- PWA / GitHub Readiness',
    '- Full System QA',
    '- Bug Fix Final',
    '',
    '## Próxima etapa',
    'V551.00 — OficinaOS V1 Operational Release'
  ].join('\n');
}

function exportFreezeJSON(){
  return JSON.stringify(freeze(),null,2);
}

function boot(){ensure()}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();

g.ReleaseFreeze={
  version:'550.90',
  ensure,
  requiredModules,
  moduleAudit,
  stateAudit,
  qaAudit,
  freeze,
  releaseNotes,
  exportFreezeJSON,
  boot
};
})(window);

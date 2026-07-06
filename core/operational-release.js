
(function(g){
'use strict';

function arr(v){return Array.isArray(v)?v:[]}
function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function now(){return new Date().toISOString()}
function st(){return g.StateManager?g.StateManager.load():(g.STATE=g.STATE||{})}
function sv(s){return g.StateManager?g.StateManager.save(s):(g.STATE=s,localStorage.setItem('OficinaOS',JSON.stringify(s)),s)}
function uid(p){return(p||'v1')+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}

function ensure(){
  let s=st();
  s.version='551.00';
  s.releaseStage='V1_OPERATIONAL_RELEASE';
  s.operationalRelease=obj(s.operationalRelease);
  s.operationalRelease.version='551.00';
  s.operationalRelease.status='V1_RELEASED';
  s.operationalRelease.releasedAt=s.operationalRelease.releasedAt||now();
  s.operationalRelease.base='Abas CLEAN';
  s.operationalRelease.name='OficinaOS V1 Operational Release';
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

function requiredRuntime(){
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
    'BugFixFinal',
    'ReleaseFreeze'
  ];
}

function runtimeAudit(){
  return requiredRuntime().map(function(name){
    return {name:name,present:!!g[name],version:g[name]&&g[name].version?g[name].version:null};
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
    ['financeiro.lancamentos',Array.isArray(obj(s.financeiro).lancamentos)],
    ['financeiro.contas',Array.isArray(obj(s.financeiro).contas)],
    ['financeiro.recibos',Array.isArray(obj(s.financeiro).recibos)],
    ['metas',!!obj(s.metas)],
    ['relatorios',!!obj(s.relatorios)],
    ['ia',!!obj(s.ia)],
    ['historico.eventos',Array.isArray(obj(s.historico).eventos)],
    ['backup',!!obj(s.backup)],
    ['documentos',!!obj(s.documentos)]
  ];
  return checks.map(function(c){return{name:c[0],pass:!!c[1]}});
}

function releaseValidation(){
  let runtime=runtimeAudit();
  let state=stateAudit();
  let missingRuntime=runtime.filter(x=>!x.present).map(x=>x.name);
  let failedState=state.filter(x=>!x.pass).map(x=>x.name);
  let qa=null, freeze=null, pwa=null, backup=null;
  try{ if(g.FullSystemQA) qa=g.FullSystemQA.summary ? g.FullSystemQA.summary() : g.FullSystemQA.fullQA(); }catch(e){ qa={error:e.message||String(e)} }
  try{ if(g.ReleaseFreeze) freeze=g.ReleaseFreeze.freeze(); }catch(e){ freeze={error:e.message||String(e)} }
  try{ if(g.PWAReadiness) pwa=g.PWAReadiness.readiness(); }catch(e){ pwa={error:e.message||String(e)} }
  try{ if(g.BackupCore) backup=g.BackupCore.validateState(ensure()); }catch(e){ backup={error:e.message||String(e)} }
  return {
    version:'551.00',
    status:(missingRuntime.length===0 && failedState.length===0)?'V1_OPERATIONAL_READY':'V1_RELEASE_WITH_WARNINGS',
    validatedAt:now(),
    missingRuntime,
    failedState,
    runtime,
    state,
    qa,
    freeze,
    pwa,
    backup
  };
}

function release(){
  let validation=releaseValidation();
  let s=ensure();
  s.operationalRelease.validation=validation;
  s.operationalRelease.status=validation.status;
  s.operationalRelease.releasedAt=now();
  s.operationalRelease.next='Produção real / publicação / monitoramento';
  sv(s);
  historico('v1_operational_release','OficinaOS V1 Operational Release gerado',{status:validation.status});
  return s.operationalRelease;
}

function launchChecklist(){
  return [
    'Abrir index.html localmente e verificar navegação',
    'Rodar OperationalReleaseTest.run()',
    'Rodar OficinaOSV1.releaseValidation()',
    'Rodar FullSystemQA.fullQA()',
    'Rodar BackupCoreTest.run()',
    'Exportar backup antes de uso real',
    'Publicar no GitHub Pages pela raiz',
    'Testar instalação PWA no Android/Chrome',
    'Inserir dados reais em pequena escala antes do uso definitivo',
    'Não alterar Abas CLEAN sem nova versão controlada'
  ];
}

function releaseNotes(){
  return [
    '# OficinaOS V1 Operational Release',
    '',
    'Versão: V551.00',
    'Status: '+(ensure().operationalRelease.status||'V1_RELEASED'),
    'Base oficial: Abas CLEAN',
    'Data: '+now(),
    '',
    '## Escopo entregue',
    '- Orçamento',
    '- Financeiro',
    '- Agenda',
    '- Clientes',
    '- Metas',
    '- Relatórios',
    '- IA operacional local',
    '- Document Engine',
    '- Fluxo operacional',
    '- Backup / Import / Export',
    '- PWA / GitHub Pages',
    '- QA geral',
    '- Bug Fix Final',
    '- Release Freeze',
    '',
    '## Uso inicial recomendado',
    'Começar com dados reais em pequena escala, gerar backup diário e validar recibos, orçamento e agenda antes de usar como única fonte operacional.'
  ].join('\n');
}

function exportReleaseJSON(){
  return JSON.stringify({release:release(),notes:releaseNotes(),checklist:launchChecklist()},null,2);
}

function boot(){ensure()}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();

g.OficinaOSV1={
  version:'551.00',
  ensure,
  requiredRuntime,
  runtimeAudit,
  stateAudit,
  releaseValidation,
  release,
  launchChecklist,
  releaseNotes,
  exportReleaseJSON,
  boot
};
})(window);


(function(g){
'use strict';

function arr(v){return Array.isArray(v)?v:[]}
function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function now(){return new Date().toISOString()}
function st(){return g.StateManager?g.StateManager.load():(g.STATE=g.STATE||{})}
function sv(s){return g.StateManager?g.StateManager.save(s):(g.STATE=s,localStorage.setItem('OficinaOS',JSON.stringify(s)),s)}
function uid(p){return(p||'qa')+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}

function result(name,pass,detail,level){
  return {name:name,pass:!!pass,detail:detail||'',level:level||'required',time:now()};
}

function ensure(){
  let s=st();
  s.qa=obj(s.qa);
  s.qa.version='550.70';
  s.version='550.70';
  s.releaseStage='FULL_SYSTEM_QA';
  s.updatedAt=now();
  sv(s);
  return s;
}

function saveRun(run){
  let s=ensure();
  s.qa.runs=arr(s.qa.runs);
  s.qa.runs.push(run);
  s.qa.lastRun=run;
  sv(s);
  return run;
}

function checkModules(){
  let modules=['StateManager','OrcamentoCore','FinanceiroCore','AgendaCore','ClientesCore','MetasCore','RelatoriosCore','IACore','OficinaOSFinalMerge','OperationalFlow','BackupCore','PWAReadiness'];
  return modules.map(function(name){
    return result('Módulo '+name, !!g[name], g[name] ? 'Disponível' : 'Ausente');
  });
}

function checkState(){
  let s=ensure();
  let checks=[];
  checks.push(result('STATE.clientes[]', Array.isArray(s.clientes), 'Clientes'));
  checks.push(result('STATE.veiculos[]', Array.isArray(s.veiculos), 'Veículos'));
  checks.push(result('STATE.orcamentos[]', Array.isArray(s.orcamentos), 'Orçamentos'));
  checks.push(result('STATE.agenda[]', Array.isArray(s.agenda), 'Agenda'));
  checks.push(result('STATE.financeiro', !!obj(s.financeiro), 'Financeiro'));
  checks.push(result('STATE.financeiro.lancamentos[]', Array.isArray(obj(s.financeiro).lancamentos), 'Lançamentos'));
  checks.push(result('STATE.financeiro.contas[]', Array.isArray(obj(s.financeiro).contas), 'Contas'));
  checks.push(result('STATE.financeiro.recibos[]', Array.isArray(obj(s.financeiro).recibos), 'Recibos'));
  checks.push(result('STATE.metas', !!obj(s.metas), 'Metas'));
  checks.push(result('STATE.ia', !!obj(s.ia), 'IA'));
  checks.push(result('STATE.historico.eventos[]', Array.isArray(obj(s.historico).eventos), 'Histórico'));
  checks.push(result('STATE.fluxos[]', Array.isArray(s.fluxos), 'Fluxos'));
  return checks;
}

function runCoreTests(){
  let tests=['FinalMergeTest','OperationalFlowTest','BackupCoreTest','PWAReadinessTest','IACoreTest','MetasRelatoriosCoreTest','ClientesCoreTest','AgendaCoreTest','FinanceiroCoreTest','OrcamentoCoreTest'];
  let out=[];
  tests.forEach(function(name){
    let t=g[name];
    if(!t||typeof t.run!=='function'){
      out.push(result('Teste '+name,false,'Teste ausente','recommended'));
      return;
    }
    try{
      let r=t.run();
      let ok=!r.failed || r.failed===0;
      out.push(result('Teste '+name,ok,JSON.stringify({total:r.total,passed:r.passed,failed:r.failed})));
    }catch(e){
      out.push(result('Teste '+name,false,e.message||String(e)));
    }
  });
  return out;
}

function checkOperationalFlow(){
  let checks=[];
  if(!g.OperationalFlow){
    return [result('Fluxo operacional',false,'OperationalFlow ausente')];
  }
  try{
    let dash=g.OperationalFlow.dashboard();
    checks.push(result('OperationalFlow.dashboard()', !!dash && dash.version==='550.40', JSON.stringify(dash)));
  }catch(e){
    checks.push(result('OperationalFlow.dashboard()', false, e.message||String(e)));
  }
  return checks;
}

function checkBackup(){
  let checks=[];
  if(!g.BackupCore) return [result('BackupCore',false,'BackupCore ausente')];
  try{
    let full=g.BackupCore.exportFullJSON();
    checks.push(result('Backup exportFullJSON()', typeof full==='string' && full.includes('OFICINAOS_FULL_BACKUP'), 'JSON completo exportado'));
    let parsed=JSON.parse(full);
    let val=g.BackupCore.validateState(parsed.state);
    checks.push(result('Backup validateState()', !!val && typeof val.valid==='boolean', JSON.stringify(val.counts||{})));
    let dry=g.BackupCore.importFullJSON(full,{dryRun:true});
    checks.push(result('Backup import dry-run', !!dry && dry.ok && dry.dryRun, 'Dry-run OK'));
  }catch(e){
    checks.push(result('Backup QA',false,e.message||String(e)));
  }
  return checks;
}

function checkPWA(){
  let checks=[];
  if(!g.PWAReadiness) return [result('PWAReadiness',false,'PWAReadiness ausente')];
  try{
    let cap=g.PWAReadiness.capability();
    checks.push(result('PWA capability()', !!cap && cap.version==='550.60', JSON.stringify(cap)));
    let ready=g.PWAReadiness.readiness();
    checks.push(result('PWA readiness()', !!ready && Array.isArray(ready.missing), JSON.stringify(ready.missing)));
  }catch(e){
    checks.push(result('PWA QA',false,e.message||String(e)));
  }
  return checks;
}

function checkDocumentEngine(){
  let checks=[];
  checks.push(result('Document Engine interface', !!g.OficinaOSCoreIntegration || !!g.OrcamentoCore, 'OficinaOSCoreIntegration ou OrcamentoCore documental'));
  if(g.OrcamentoCore && typeof g.OrcamentoCore.documentPreview==='function'){
    checks.push(result('OrcamentoCore.documentPreview()', true, 'Função disponível'));
  }else{
    checks.push(result('OrcamentoCore.documentPreview()', false, 'Função ausente', 'recommended'));
  }
  return checks;
}

function fullQA(){
  let sections={
    modules:checkModules(),
    state:checkState(),
    tests:runCoreTests(),
    operationalFlow:checkOperationalFlow(),
    backup:checkBackup(),
    pwa:checkPWA(),
    documentEngine:checkDocumentEngine()
  };
  let all=[];
  Object.keys(sections).forEach(k=>all=all.concat(sections[k]));
  let required=all.filter(x=>x.level!=='recommended');
  let passed=all.filter(x=>x.pass).length;
  let failed=all.filter(x=>!x.pass).length;
  let requiredFailed=required.filter(x=>!x.pass).length;
  let run={
    id:uid('qa_run'),
    version:'550.70',
    data:now(),
    total:all.length,
    passed:passed,
    failed:failed,
    requiredFailed:requiredFailed,
    status: requiredFailed===0 ? 'QA_REQUIRED_PASS' : 'QA_REQUIRED_FAIL',
    sections:sections
  };
  saveRun(run);
  return run;
}

function summary(){
  let s=ensure();
  let last=s.qa&&s.qa.lastRun;
  if(!last) last=fullQA();
  return {
    version:'550.70',
    status:last.status,
    total:last.total,
    passed:last.passed,
    failed:last.failed,
    requiredFailed:last.requiredFailed,
    next:last.requiredFailed===0?'V550.80 — Bug Fix Final':'corrigir falhas obrigatórias antes da V550.80'
  };
}

function exportQAJSON(){
  return JSON.stringify(fullQA(),null,2);
}

function boot(){ensure()}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();

g.FullSystemQA={
  version:'550.70',
  ensure:ensure,
  checkModules:checkModules,
  checkState:checkState,
  runCoreTests:runCoreTests,
  checkOperationalFlow:checkOperationalFlow,
  checkBackup:checkBackup,
  checkPWA:checkPWA,
  checkDocumentEngine:checkDocumentEngine,
  fullQA:fullQA,
  summary:summary,
  exportQAJSON:exportQAJSON,
  boot:boot
};
})(window);

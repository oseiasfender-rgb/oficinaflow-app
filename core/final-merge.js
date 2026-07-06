
(function(g){
'use strict';

function arr(v){return Array.isArray(v)?v:[]}
function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function now(){return new Date().toISOString()}
function st(){return g.StateManager?g.StateManager.load():(g.STATE=g.STATE||{})}
function sv(s){return g.StateManager?g.StateManager.save(s):(g.STATE=s,localStorage.setItem('OficinaOS',JSON.stringify(s)),s)}
function uid(p){return(p||'merge')+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}

function historico(tipo,descricao,extra){
  let s=st();
  s.historico=s.historico||{};
  s.historico.eventos=arr(s.historico.eventos);
  let r=Object.assign({id:uid('hist'),tipo,descricao,data:now()},extra||{});
  s.historico.eventos.push(r);
  sv(s);
  return r;
}

function ensureState(){
  let s=st();
  s.empresa=obj(s.empresa);
  s.usuarios=arr(s.usuarios);
  s.clientes=arr(s.clientes);
  s.veiculos=arr(s.veiculos);
  s.orcamentos=arr(s.orcamentos);
  s.agenda=arr(s.agenda);
  s.fotos=arr(s.fotos);
  s.financeiro=obj(s.financeiro);
  s.financeiro.lancamentos=arr(s.financeiro.lancamentos);
  s.financeiro.contas=arr(s.financeiro.contas);
  s.financeiro.recibos=arr(s.financeiro.recibos);
  s.metas=obj(s.metas);
  s.metas.categorias=arr(s.metas.categorias);
  s.metas.historico=arr(s.metas.historico);
  s.relatorios=obj(s.relatorios);
  s.ia=obj(s.ia);
  s.ia.memoria=arr(s.ia.memoria);
  s.ia.consultas=arr(s.ia.consultas);
  s.ia.alertas=arr(s.ia.alertas);
  s.ia.insights=arr(s.ia.insights);
  s.historico=obj(s.historico);
  s.historico.eventos=arr(s.historico.eventos);
  s.historico.documentos=arr(s.historico.documentos);
  s.documentos=obj(s.documentos);
  s.configuracoes=obj(s.configuracoes);
  s.backup=obj(s.backup);
  s.version='550.37';
  s.releaseStage='MODULE_RECOVERY_FINAL_MERGED';
  s.updatedAt=now();
  sv(s);
  return s;
}

function bootModules(){
  let modules=[
    'OrcamentoCore',
    'FinanceiroCore',
    'AgendaCore',
    'ClientesCore',
    'MetasCore',
    'RelatoriosCore',
    'IACore'
  ];
  let status={};
  modules.forEach(function(name){
    let mod=g[name];
    status[name]={available:!!mod,version:mod&&mod.version?mod.version:null,boot:false,error:null};
    if(mod&&typeof mod.boot==='function'){
      try{mod.boot();status[name].boot=true}catch(e){status[name].error=e.message||String(e)}
    }
  });
  return status;
}

function runTests(){
  let tests=[
    'OrcamentoCoreTest',
    'FinanceiroCoreTest',
    'AgendaCoreTest',
    'ClientesCoreTest',
    'MetasRelatoriosCoreTest',
    'IACoreTest'
  ];
  let results=[];
  tests.forEach(function(name){
    let t=g[name];
    if(t&&typeof t.run==='function'){
      try{results.push({name,available:true,result:t.run()})}
      catch(e){results.push({name,available:true,error:e.message||String(e)})}
    }else{
      results.push({name,available:false})
    }
  });
  return results;
}

function validate(){
  let s=ensureState();
  let modules=bootModules();
  let required=[
    'OrcamentoCore',
    'FinanceiroCore',
    'AgendaCore',
    'ClientesCore',
    'MetasCore',
    'RelatoriosCore',
    'IACore'
  ];
  let missing=required.filter(k=>!modules[k].available);
  let warnings=[];
  if(!g.StateManager) warnings.push('StateManager não encontrado.');
  if(missing.length) warnings.push('Módulos ausentes: '+missing.join(', '));
  let summary={
    version:'550.37',
    valid:missing.length===0 && !!g.StateManager,
    missing,
    warnings,
    modules,
    counts:{
      clientes:arr(s.clientes).length,
      veiculos:arr(s.veiculos).length,
      orcamentos:arr(s.orcamentos).length,
      agenda:arr(s.agenda).length,
      lancamentos:arr(s.financeiro&&s.financeiro.lancamentos).length,
      contas:arr(s.financeiro&&s.financeiro.contas).length,
      metas:arr(s.metas&&s.metas.categorias).length,
      eventosHistorico:arr(s.historico&&s.historico.eventos).length,
      documentos:arr(s.historico&&s.historico.documentos).length
    },
    data:now()
  };
  s.finalMerge=summary;
  sv(s);
  historico('final_merge_validado','Final Merge V550.37 executado',{valid:summary.valid,missing});
  return summary;
}

function dashboard(){
  let s=ensureState();
  let rel=g.RelatoriosCore&&typeof g.RelatoriosCore.dashboard==='function'?g.RelatoriosCore.dashboard():null;
  let ia=g.IACore&&typeof g.IACore.snapshot==='function'?g.IACore.snapshot():null;
  return {
    version:'550.37',
    estado:s.releaseStage,
    relatorios:rel,
    iaSnapshot:ia,
    validacao:s.finalMerge||validate()
  };
}

function exportReleaseJSON(){
  return JSON.stringify({
    version:'550.37',
    geradoEm:now(),
    cronograma:'V550.30 Module Recovery Final concluído',
    dashboard:dashboard()
  },null,2);
}

function boot(){
  ensureState();
  let status=bootModules();
  let s=st();
  s.finalMergeBoot={data:now(),modules:status};
  sv(s);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();

g.OficinaOSFinalMerge={
  version:'550.37',
  ensureState,
  bootModules,
  runTests,
  validate,
  dashboard,
  exportReleaseJSON,
  boot
};
})(window);

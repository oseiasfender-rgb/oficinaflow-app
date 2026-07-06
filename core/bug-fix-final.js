
(function(g){
'use strict';

function arr(v){return Array.isArray(v)?v:[]}
function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function now(){return new Date().toISOString()}
function uid(p){return(p||'fix')+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}
function st(){return g.StateManager?g.StateManager.load():(g.STATE=g.STATE||{})}
function sv(s){return g.StateManager?g.StateManager.save(s):(g.STATE=s,localStorage.setItem('OficinaOS',JSON.stringify(s)),s)}

function parseBR(value){
  if(typeof value==='number') return isFinite(value)?value:0;
  let raw=String(value??'').trim();
  if(!raw) return 0;
  raw=raw.replace(/[^\d,.-]/g,'');
  if(raw.includes(',') && raw.includes('.')) raw=raw.replace(/\./g,'').replace(',','.');
  else if(raw.includes(',')) raw=raw.replace(',','.');
  return Number(raw)||0;
}

function ensure(){
  let s=st();
  s.version='550.80';
  s.releaseStage='BUG_FIX_FINAL';
  s.updatedAt=now();
  s.bugfix=obj(s.bugfix);
  s.bugfix.version='550.80';
  s.bugfix.appliedAt=s.bugfix.appliedAt||now();
  s.bugfix.items=arr(s.bugfix.items);
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

function markFix(code,description){
  let s=ensure();
  if(!s.bugfix.items.some(x=>x.code===code)){
    s.bugfix.items.push({id:uid('fix'),code,description,data:now()});
    sv(s);
  }
}

function normalizeFinanceiro(){
  let s=ensure();
  s.financeiro=obj(s.financeiro);
  s.financeiro.lancamentos=arr(s.financeiro.lancamentos).map(l=>{
    l=obj(l);
    l.valor=parseBR(l.valor);
    l.tipo=l.tipo==='despesa'?'despesa':'receita';
    l.data=l.data||new Date().toISOString().slice(0,10);
    l.id=l.id||uid('lan');
    return l;
  });
  s.financeiro.contas=arr(s.financeiro.contas).map(c=>{
    c=obj(c);
    c.valor=parseBR(c.valor);
    c.valorPago=parseBR(c.valorPago);
    c.status=c.status||'pendente';
    c.data=c.data||c.vencimento||new Date().toISOString().slice(0,10);
    c.id=c.id||uid('conta');
    return c;
  });
  s.financeiro.recibos=arr(s.financeiro.recibos).map(r=>{
    r=obj(r);
    r.valor=parseBR(r.valor);
    r.id=r.id||uid('recibo');
    return r;
  });
  sv(s);
  markFix('FIN_PARSE_BR','Parser financeiro BR aplicado a lançamentos, contas e recibos.');
  return s.financeiro;
}

function normalizeOrcamentos(){
  let s=ensure();
  s.orcamentos=arr(s.orcamentos).map(o=>{
    o=obj(o);
    o.id=o.id||uid('orc');
    o.maoObra=parseBR(o.maoObra);
    o.valorMaoObra=parseBR(o.valorMaoObra);
    o.total=parseBR(o.total);
    o.subtotal=parseBR(o.subtotal);
    o.desconto=parseBR(o.desconto);
    o.acrescimo=parseBR(o.acrescimo);
    o.materiais=arr(o.materiais).map(m=>Object.assign({},obj(m),{valor:parseBR(obj(m).valor),qtd:parseBR(obj(m).qtd)||1}));
    o.pecas=arr(o.pecas).map(p=>Object.assign({},obj(p),{valor:parseBR(obj(p).valor),qtd:parseBR(obj(p).qtd)||1}));
    o.terceiros=arr(o.terceiros).map(t=>Object.assign({},obj(t),{valor:parseBR(obj(t).valor),qtd:parseBR(obj(t).qtd)||1}));
    o.status=o.status||'rascunho';
    return o;
  });
  sv(s);
  markFix('ORC_NUMERIC_NORMALIZE','Normalização numérica aplicada a orçamentos.');
  return s.orcamentos;
}

function dedupeById(list,prefix){
  let seen={};
  return arr(list).map(x=>obj(x)).filter(x=>{
    if(!x.id) x.id=uid(prefix);
    if(seen[x.id]) return false;
    seen[x.id]=true;
    return true;
  });
}

function removeDuplicates(){
  let s=ensure();
  s.clientes=dedupeById(s.clientes,'cli');
  s.veiculos=dedupeById(s.veiculos,'vei');
  s.orcamentos=dedupeById(s.orcamentos,'orc');
  s.agenda=dedupeById(s.agenda,'ag');
  s.fluxos=dedupeById(s.fluxos,'fluxo');
  s.fotos=dedupeById(s.fotos,'foto');
  s.financeiro=obj(s.financeiro);
  s.financeiro.lancamentos=dedupeById(s.financeiro.lancamentos,'lan');
  s.financeiro.contas=dedupeById(s.financeiro.contas,'conta');
  s.financeiro.recibos=dedupeById(s.financeiro.recibos,'recibo');
  s.historico=obj(s.historico);
  s.historico.eventos=dedupeById(s.historico.eventos,'hist');
  s.historico.documentos=dedupeById(s.historico.documentos,'doc');
  sv(s);
  markFix('DEDUP_IDS','Remoção preventiva de duplicidades por ID aplicada.');
  return s;
}

function protectLegacyStorage(){
  let keys=['ALL_TX','user_tx','fp_tx','tx','transacoes','contasPagar','orcamentosAntigos'];
  let found=[];
  try{
    keys.forEach(k=>{
      if(localStorage.getItem(k)!==null){
        found.push(k);
        localStorage.setItem('legacy_'+k, localStorage.getItem(k));
        localStorage.removeItem(k);
      }
    });
  }catch(e){}
  markFix('LEGACY_STORAGE_PROTECTION','Storage legado isolado para evitar estados paralelos.');
  return found;
}

function safeBootModules(){
  let modules=['OrcamentoCore','FinanceiroCore','AgendaCore','ClientesCore','MetasCore','RelatoriosCore','IACore','OperationalFlow','BackupCore','PWAReadiness','FullSystemQA'];
  let results=[];
  modules.forEach(name=>{
    let m=g[name];
    if(m&&typeof m.boot==='function'){
      try{m.boot();results.push({module:name,ok:true})}
      catch(e){results.push({module:name,ok:false,error:e.message||String(e)})}
    }else{
      results.push({module:name,ok:!!m,skipped:true});
    }
  });
  markFix('SAFE_BOOT_MODULES','Boot seguro dos módulos executado.');
  return results;
}

function runQAAfterFix(){
  if(g.FullSystemQA && typeof g.FullSystemQA.fullQA==='function'){
    return g.FullSystemQA.fullQA();
  }
  return {status:'FullSystemQA ausente'};
}

function applyAll(){
  ensure();
  let report={
    version:'550.80',
    data:now(),
    financeiro:normalizeFinanceiro(),
    orcamentos:normalizeOrcamentos(),
    dedupe:removeDuplicates(),
    legacyStorage:protectLegacyStorage(),
    boot:safeBootModules()
  };
  report.qa=runQAAfterFix();
  let s=ensure();
  s.bugfix.lastReport={
    data:now(),
    qaStatus:report.qa&&report.qa.status,
    boot:report.boot
  };
  sv(s);
  historico('bugfix_final','Bug Fix Final V550.80 aplicado',{qaStatus:report.qa&&report.qa.status});
  return report;
}

function regressionReport(){
  let s=ensure();
  let required=['clientes','veiculos','orcamentos','agenda','financeiro','metas','ia','historico','fluxos'];
  let missing=required.filter(k=>s[k]===undefined || s[k]===null);
  let modules=['StateManager','OrcamentoCore','FinanceiroCore','AgendaCore','ClientesCore','MetasCore','RelatoriosCore','IACore','OperationalFlow','BackupCore','PWAReadiness','FullSystemQA'];
  let missingModules=modules.filter(k=>!g[k]);
  return{
    version:'550.80',
    ok:missing.length===0 && missingModules.length===0,
    missingState:missing,
    missingModules,
    bugfixItems:arr(s.bugfix&&s.bugfix.items),
    data:now()
  };
}

function exportBugFixJSON(){
  return JSON.stringify({apply:applyAll(),regression:regressionReport()},null,2);
}

function boot(){
  ensure();
  normalizeFinanceiro();
  normalizeOrcamentos();
  removeDuplicates();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();

g.BugFixFinal={
  version:'550.80',
  parseBR,
  ensure,
  normalizeFinanceiro,
  normalizeOrcamentos,
  removeDuplicates,
  protectLegacyStorage,
  safeBootModules,
  runQAAfterFix,
  applyAll,
  regressionReport,
  exportBugFixJSON,
  boot
};
})(window);

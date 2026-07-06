
(function(global){
'use strict';
const KEY='OficinaOS';
const VERSION='550.20';

const DEFAULT_STATE={
  version:VERSION,
  empresa:{},
  usuarios:[],
  clientes:[],
  veiculos:[],
  orcamentos:[],
  financeiro:{lancamentos:[],contas:[],recibos:[]},
  agenda:[],
  metas:{principal:0,categorias:[],historico:[]},
  relatorios:{},
  historico:{documentos:[],eventos:[],orcamentos:[]},
  fotos:[],
  documentos:{config:{templatePadrao:'limaprata_premium',historico:true,whatsapp:true,qr:true}},
  configuracoes:{},
  ia:{memoria:[],consultas:[]},
  backup:{ultimaGravacao:null,origem:'V550.20'}
};

function isObj(v){return v&&typeof v==='object'&&!Array.isArray(v)}
function arr(v){return Array.isArray(v)?v:[]}
function clone(v){try{return JSON.parse(JSON.stringify(v))}catch(e){return v}}
function merge(base,defs){
  const out=clone(defs);
  Object.keys(base||{}).forEach(k=>{
    out[k]=(isObj(base[k])&&isObj(out[k]))?merge(base[k],out[k]):base[k];
  });
  return out;
}
function raw(){
  if(global.STATE&&isObj(global.STATE))return clone(global.STATE);
  try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}
}
function normalize(s){
  s=merge(isObj(s)?s:{},DEFAULT_STATE);
  s.version=VERSION;
  s.usuarios=arr(s.usuarios);
  s.clientes=arr(s.clientes);
  s.veiculos=arr(s.veiculos);
  s.orcamentos=arr(s.orcamentos);
  s.financeiro=isObj(s.financeiro)?s.financeiro:{};
  s.financeiro.lancamentos=arr(s.financeiro.lancamentos||s.financeiro.transacoes||s.lancamentos);
  s.financeiro.contas=arr(s.financeiro.contas||s.contas||s.contasPagar);
  s.financeiro.recibos=arr(s.financeiro.recibos);
  s.agenda=arr(s.agenda||s.ordensServico||s.os);
  s.fotos=arr(s.fotos);
  s.metas=isObj(s.metas)?s.metas:DEFAULT_STATE.metas;
  s.metas.categorias=arr(s.metas.categorias);
  s.metas.historico=arr(s.metas.historico);
  s.historico=isObj(s.historico)?s.historico:{};
  s.historico.documentos=arr(s.historico.documentos||s.pdfHistorico);
  s.historico.eventos=arr(s.historico.eventos);
  s.historico.orcamentos=arr(s.historico.orcamentos||s.historicoOrcamentos);
  s.documentos=isObj(s.documentos)?s.documentos:DEFAULT_STATE.documentos;
  s.documentos.config=isObj(s.documentos.config)?s.documentos.config:DEFAULT_STATE.documentos.config;
  s.configuracoes=isObj(s.configuracoes)?s.configuracoes:(isObj(s.config)?s.config:{});
  s.ia=isObj(s.ia)?s.ia:{memoria:[],consultas:[]};
  s.ia.memoria=arr(s.ia.memoria);
  s.ia.consultas=arr(s.ia.consultas);
  s.backup=isObj(s.backup)?s.backup:{};
  s.backup.origem='V550.20';
  return s;
}
function migrate(old){
  const s=normalize(old||{});
  const leg=[old&&old.ALL_TX,old&&old.user_tx,old&&old.fp_tx,old&&old.tx,old&&old.transacoes];
  leg.forEach(src=>{
    if(Array.isArray(src)){
      src.forEach(item=>{
        const id=item&&(item.id||item.uid);
        const exists=id&&s.financeiro.lancamentos.some(x=>String(x.id)===String(id));
        if(!exists)s.financeiro.lancamentos.push(item);
      });
    }
  });
  s._migration={version:VERSION,migratedAt:new Date().toISOString(),legacyDetected:leg.some(Array.isArray)};
  return s;
}
function save(state){
  const s=normalize(state||{});
  s.backup.ultimaGravacao=new Date().toISOString();
  localStorage.setItem(KEY,JSON.stringify(s));
  global.STATE=s;
  try{window.dispatchEvent(new CustomEvent('oficinaos:state-saved',{detail:{version:VERSION,state:s}}))}catch(e){}
  return s;
}
function load(){return save(migrate(raw()))}
function get(path,fallback){
  const s=global.STATE||load();
  if(!path)return s;
  return String(path).split('.').reduce((a,p)=>a&&Object.prototype.hasOwnProperty.call(a,p)?a[p]:fallback,s);
}
function set(path,value){
  const s=global.STATE||load();
  const parts=String(path).split('.');
  let cur=s;
  for(let i=0;i<parts.length-1;i++){
    if(!isObj(cur[parts[i]]))cur[parts[i]]={};
    cur=cur[parts[i]];
  }
  cur[parts[parts.length-1]]=value;
  return save(s);
}
function push(path,item){
  const list=arr(get(path,[]));
  list.push(item);
  set(path,list);
  return item;
}
function validate(){
  const s=global.STATE||load();
  const checks={
    version:s.version===VERSION,
    clientes:Array.isArray(s.clientes),
    veiculos:Array.isArray(s.veiculos),
    orcamentos:Array.isArray(s.orcamentos),
    financeiro:isObj(s.financeiro)&&Array.isArray(s.financeiro.lancamentos)&&Array.isArray(s.financeiro.contas),
    agenda:Array.isArray(s.agenda),
    historico:isObj(s.historico)&&Array.isArray(s.historico.documentos),
    fotos:Array.isArray(s.fotos),
    documentos:isObj(s.documentos)
  };
  const failed=Object.keys(checks).filter(k=>!checks[k]);
  return {version:VERSION,ok:failed.length===0,failed,checks,counts:{
    clientes:s.clientes.length,veiculos:s.veiculos.length,orcamentos:s.orcamentos.length,
    lancamentos:s.financeiro.lancamentos.length,contas:s.financeiro.contas.length,
    agenda:s.agenda.length,documentos:s.historico.documentos.length,fotos:s.fotos.length
  }};
}
function exportJSON(){return JSON.stringify(global.STATE||load(),null,2)}
function importJSON(json){return save(migrate(typeof json==='string'?JSON.parse(json):json))}
function reset(confirmText){if(confirmText!=='LIMPAR OFICINAOS')throw new Error('Confirmação inválida');return save(clone(DEFAULT_STATE))}

global.STATE=load();
global.StateManager={version:VERSION,load,save,get,set,push,validate,exportJSON,importJSON,reset,normalize,migrateLegacy:migrate};
})(window);

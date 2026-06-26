
(function(){
'use strict';
const VERSION='V547.05 CLEAN DATA BUILD';
const K={state:'oficinaos_clean_v546_30_state',financeiro:'oficinaos_clean_v546_30_financeiro',orcamento:'oficinaos_clean_v546_30_orcamento',clientes:'oficinaos_clean_v546_30_clientes',ia:'oficinaos_clean_v546_30_ia',meta:'OFICINAOS_V547_META'};
const n=v=>{if(v==null||v==='')return 0;let s=String(v).replace(/R\$/g,'').replace(/\s/g,'');if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');let x=Number(s);return Number.isFinite(x)?x:0};
const money=v=>n(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const uid=p=>p+'_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const parse=(v,f)=>{try{return JSON.parse(v||'')}catch(e){return f}};
const today=()=>new Date().toISOString().slice(0,10);
function blankState(){return {clientes:[],veiculos:[],orcamentos:[],agenda:{os:[]},financeiro:{lancamentos:[]},metas:{faturamento:0,margemObjetivo:0,os:0,ticket:0,atrasoMax:0,categorias:[]},ia:{history:[],memory:[]}}}
function load(){return parse(localStorage.getItem(K.state),blankState())||blankState()}
function normalizeImport(o){
  o=o||{};
  const s=blankState();
  s.clientes=Array.isArray(o.clientes)?o.clientes:[];
  s.veiculos=Array.isArray(o.veiculos)?o.veiculos:[];
  s.orcamentos=Array.isArray(o.orcamentos)?o.orcamentos:[];
  if(Array.isArray(o.agenda)) s.agenda={os:o.agenda};
  else if(o.agenda&&Array.isArray(o.agenda.os)) s.agenda={os:o.agenda.os};
  if(o.financeiro&&Array.isArray(o.financeiro.lancamentos)) s.financeiro={lancamentos:o.financeiro.lancamentos};
  else if(Array.isArray(o.lancamentos)) s.financeiro={lancamentos:o.lancamentos};
  if(o.metas) s.metas=o.metas;
  if(o.ia) s.ia=o.ia;
  return s;
}
function save(s){
  s=s||blankState();
  localStorage.setItem(K.state,JSON.stringify(s));
  localStorage.setItem(K.financeiro,JSON.stringify({competencia:new Date().toISOString().slice(0,7),metaReceita:n(s.metas&&s.metas.faturamento),fechados:[],lancamentos:(s.financeiro&&s.financeiro.lancamentos)||[],recibos:[],nfse:[],pix:[]}));
  localStorage.setItem(K.clientes,JSON.stringify({clientes:(s.clientes||[]).map(c=>({...c,tel:c.tel||c.telefone||c.whatsapp||'',veiculos:(c.veiculos||[]).concat((s.veiculos||[]).filter(v=>String(v.clienteId)===String(c.id)))})),selected:null,filter:'todos'}));
  localStorage.setItem(K.orcamento,JSON.stringify({orcamento:null,historico:s.orcamentos||[],financeiro:{pendentes:((s.financeiro&&s.financeiro.lancamentos)||[]).filter(x=>String(x.status||'').toLowerCase()!=='pago')},clientes:s.clientes||[],estoque:[],pecasCatalogo:[]}));
  localStorage.setItem(K.ia,JSON.stringify({history:[],memory:[]}));
  localStorage.setItem(K.meta,JSON.stringify({version:VERSION,updatedAt:new Date().toISOString()}));
}
function clearAll(){
  Object.values(K).forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});
  try{localStorage.removeItem('OFICINAOS_V54705_CLEAN_PURGED')}catch(e){}
  save(blankState());
}
function exportBackup(){
  const s=load();
  return {version:VERSION,exportedAt:new Date().toISOString(),...s};
}
function importBackup(obj){const s=normalizeImport(obj);save(s);return s}
function download(name,data,type='application/json'){const a=document.createElement('a');const b=new Blob([data],{type});a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function wire(){
  document.querySelectorAll('button,.btn').forEach(b=>{const t=(b.textContent||'').toLowerCase();if(t.includes('simulação')||t.includes('validar')||t.includes('demo'))b.classList.add('v547-hide')});
  const backup=document.getElementById('v547Backup'), imp=document.getElementById('v547Import');
  if(backup)backup.onclick=()=>download('oficinaos-backup-'+today()+'.json',JSON.stringify(exportBackup(),null,2));
  if(imp)imp.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{importBackup(JSON.parse(ev.target.result));alert('Backup importado.');location.reload()}catch(err){alert('Erro ao importar JSON: '+err.message)}};r.readAsText(f)};
}
window.OficinaOS={VERSION,load,save,clearAll,exportBackup,importBackup,download,money,n,blankState};
document.addEventListener('DOMContentLoaded',wire);
})();

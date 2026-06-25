
/* OficinaOS V547.00 — MASTER CORE / GitHub Pages */
(function(){
'use strict';
if(window.OFICINAOS_V547_CORE)return; window.OFICINAOS_V547_CORE=true;
const VERSION='V547.00 MASTER GITHUB';
const KEYS={
 clientes:'OFICINAOS_CLIENTES', veiculos:'OFICINAOS_VEICULOS', financeiro:'OFICINAOS_FINANCEIRO_MIN',
 orcamentos:'OFICINAOS_ORCAMENTOS_MIN', agenda:'OFICINAOS_AGENDA_MIN', metas:'OFICINAOS_METAS_MIN',
 config:'OFICINAOS_CONFIG', backup:'OFICINAOS_LAST_BACKUP'
};
function parse(v,f){try{return JSON.parse(v||'')}catch(e){return f}}
function get(k,f){return parse(localStorage.getItem(k),f)}
function set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){console.warn('OficinaOS storage:',k,e);return false}}
function n(v){if(v==null||v==='')return 0;if(typeof v==='string')v=v.replace(/R\$/g,'').replace(/\s/g,'').replace(/\./g,'').replace(',','.');v=Number(v);return Number.isFinite(v)?v:0}
function money(v){return n(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function normalizeState(){
 const financeiro=get(KEYS.financeiro,{lancamentos:[]}); financeiro.lancamentos=Array.isArray(financeiro.lancamentos)?financeiro.lancamentos:[];
 const agenda=get(KEYS.agenda,[]); const orc=get(KEYS.orcamentos,[]); const clientes=get(KEYS.clientes,[]); const veiculos=get(KEYS.veiculos,[]); const metas=get(KEYS.metas,{});
 const tx=financeiro.lancamentos.map(t=>({
  id:t.id||('tx_'+Date.now()+Math.random()), tipo:(t.tipo||t.type==='dep'?'despesa':'receita'), type:t.type||((t.tipo||'receita').includes('desp')?'dep':'rec'),
  descricao:t.descricao||t.desc||'', categoria:t.categoria||t.cat||'Geral', data:t.data||t.date||new Date().toISOString().slice(0,10),
  valor:n(t.valor??t.val), status:String(t.status||t.paid||'pendente').toLowerCase().includes('pago')?'pago':'pendente',
  clienteId:t.clienteId||'', veiculoId:t.veiculoId||'', orcamentoId:t.orcamentoId||'', agendaId:t.agendaId||'', origem:t.origem||'v547'
 }));
 financeiro.lancamentos=tx; financeiro.receitas=tx.filter(t=>t.tipo==='receita'||t.type==='rec'); financeiro.despesas=tx.filter(t=>t.tipo==='despesa'||t.type==='dep'); financeiro.receber=financeiro.receitas.filter(t=>t.status!=='pago'); financeiro.pagar=financeiro.despesas.filter(t=>t.status!=='pago');
 const receitasPagas=financeiro.receitas.filter(t=>t.status==='pago').reduce((s,t)=>s+n(t.valor),0);
 const despesasPagas=financeiro.despesas.filter(t=>t.status==='pago').reduce((s,t)=>s+n(t.valor),0);
 const osEntregues=agenda.filter(a=>/entreg/i.test(a.status||a.etapa||'')).length;
 const ticket=osEntregues?receitasPagas/osEntregues:0;
 return {version:VERSION, clientes:Array.isArray(clientes)?clientes:[], veiculos:Array.isArray(veiculos)?veiculos:[], financeiro, orcamentos:Array.isArray(orc)?orc:[], agenda:Array.isArray(agenda)?agenda:[], metas, relatorios:{receitasPagas,despesasPagas,resultado:receitasPagas-despesasPagas,ticketMedio:ticket,osEntregues}, ia:{modo:'consultivo'}};
}
function save(s){s=s||normalizeState(); set(KEYS.clientes,s.clientes||[]); set(KEYS.veiculos,s.veiculos||[]); set(KEYS.financeiro,{lancamentos:(s.financeiro&&s.financeiro.lancamentos)||[]}); set(KEYS.orcamentos,s.orcamentos||[]); set(KEYS.agenda,s.agenda||[]); set(KEYS.metas,s.metas||{}); set(KEYS.config,Object.assign(get(KEYS.config,{}),{version:VERSION,updatedAt:new Date().toISOString()})); return normalizeState();}
function exportBackup(){const s=normalizeState(); const backup={version:VERSION,exportedAt:new Date().toISOString(),clientes:s.clientes,veiculos:s.veiculos,financeiro:{lancamentos:s.financeiro.lancamentos},orcamentos:s.orcamentos,agenda:s.agenda,metas:s.metas,config:get(KEYS.config,{})}; set(KEYS.backup,{version:VERSION,exportedAt:backup.exportedAt,clientes:s.clientes.length,veiculos:s.veiculos.length,lancamentos:s.financeiro.lancamentos.length,orcamentos:s.orcamentos.length,agenda:s.agenda.length}); return backup;}
function downloadBackup(){const b=exportBackup(); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(b,null,2)],{type:'application/json'})); a.download='oficinaos_v547_backup_'+new Date().toISOString().slice(0,10)+'.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500);}
function importBackup(obj){obj=obj||{}; let s=normalizeState(); if(obj.clientes) s.clientes=obj.clientes; if(obj.veiculos) s.veiculos=obj.veiculos; if(obj.financeiro) s.financeiro=obj.financeiro; if(obj.financeiro&&obj.financeiro.lancamentos) s.financeiro.lancamentos=obj.financeiro.lancamentos; if(obj.orcamentos) s.orcamentos=obj.orcamentos; if(obj.agenda) s.agenda=Array.isArray(obj.agenda)?obj.agenda:(obj.agenda.os||[]); if(obj.metas) s.metas=obj.metas; return save(s);}
function importFromFile(file, cb){const r=new FileReader(); r.onload=e=>{try{importBackup(JSON.parse(e.target.result)); cb&&cb(true)}catch(err){alert('Erro ao importar JSON: '+err.message); cb&&cb(false)}}; r.readAsText(file);}
function clearAll(){ if(prompt('Digite LIMPAR para apagar os dados locais do OficinaOS')!=='LIMPAR')return false; Object.values(KEYS).forEach(k=>localStorage.removeItem(k)); ['OFICINAOS_V549_STATE','OFICINAOS_STATE','STATE','oficinaos_state','ALL_TX'].forEach(k=>localStorage.removeItem(k)); location.reload(); return true;}
function installNav(){
 const map=[['Financeiro','financeiro.html'],['Orçamento','orcamento.html'],['Contas','financeiro.html'],['Agenda','agenda.html'],['Metas','metas.html'],['Clientes','clientes.html'],['Relatórios','relatorios.html'],['IA','ia.html'],['Painel','index.html']];
 document.querySelectorAll('.nav button,.nav-tab,.tab').forEach(btn=>{const t=btn.textContent||''; const found=map.find(([k])=>t.includes(k)); if(found){btn.style.cursor='pointer'; btn.onclick=()=>{location.href=found[1]}}});
 const bar=document.createElement('div'); bar.id='v547MasterBar'; bar.innerHTML=`<style>#v547MasterBar{position:fixed;left:8px;bottom:8px;z-index:99999;background:#fffaf4;border:1px solid #ead7c4;border-radius:999px;box-shadow:0 2px 10px #0002;padding:6px 8px;font:12px Arial;display:flex;gap:5px;align-items:center;flex-wrap:wrap}#v547MasterBar a,#v547MasterBar button{border:1px solid #dcb990;background:#fff;border-radius:999px;padding:5px 8px;text-decoration:none;color:#24160d;cursor:pointer;font-weight:700}</style><a href="index.html">Painel</a><a href="clientes.html">Clientes</a><a href="orcamento.html">Orçamento</a><a href="agenda.html">Agenda</a><a href="financeiro.html">Financeiro</a><a href="relatorios.html">Relatórios</a><a href="metas.html">Metas</a><a href="ia.html">IA</a><button id="v547Backup">Backup</button>`;
 document.body.appendChild(bar); document.getElementById('v547Backup').onclick=downloadBackup;
}
function status(){const s=normalizeState(); return {version:VERSION,clientes:s.clientes.length,veiculos:s.veiculos.length,orcamentos:s.orcamentos.length,agenda:s.agenda.length,lancamentos:s.financeiro.lancamentos.length,resultado:s.relatorios.resultado};}
window.OFICINAOS_V547={VERSION,KEYS,load:normalizeState,save,exportBackup,downloadBackup,importBackup,importFromFile,clearAll,status,money,n};
window.OFICINAOS_STORAGE=window.OFICINAOS_STORAGE||{load:normalizeState,save,exportBackup,importBackup,clearAll};
window.OSCORE=Object.assign(window.OSCORE||{},{load:normalizeState,save,money,n,status:(t)=>console.log(t)});
document.addEventListener('DOMContentLoaded',()=>{save(normalizeState()); installNav();});
})();

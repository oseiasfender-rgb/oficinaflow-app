
(function(){
'use strict';
const VERSION='V546.22 RC1 STATE UNICO';
const KEY='OFIX_STATE_V546_22';
const LEGACY_KEYS=['oficinaos_state','OFICINAOS_STATE','STATE'];
const TX_KEYS=['ALL_TX','oficinaos_ALL_TX','oficinaos_financeiro_lancamentos'];

function uid(prefix){return prefix+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}
function n(v){if(v===null||v===undefined||v==='')return 0;if(typeof v==='string')v=v.replace(/\\./g,'').replace(',','.');v=Number(v);return Number.isFinite(v)?v:0}
function money(v){return n(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function today(){return new Date().toISOString().slice(0,10)}
function text(el){return el ? String(el.value||el.textContent||'').trim() : ''}
function q(sel){return document.querySelector(sel)}
function getJson(k,fallback){try{return JSON.parse(localStorage.getItem(k)||'')}catch(e){return fallback}}

function emptyState(){
  return {
    meta:{versao:VERSION, criadoEm:new Date().toISOString(), atualizadoEm:new Date().toISOString()},
    config:getJson('oficinaos_config',{}),
    clientes:[], veiculos:[], orcamentos:[], agenda:[],
    financeiro:{lancamentos:[],receitas:[],despesas:[],receber:[],pagar:[]},
    metas:{}, relatorios:{}, materiais:[], ia:{historico:[],contexto:[]}
  };
}
function dedupe(arr,key){
  const seen=new Set();
  return (arr||[]).filter(x=>{const v=x&&x[key];if(!v)return true;if(seen.has(v))return false;seen.add(v);return true;});
}
function normTx(t){
  const tipo=t.tipo||(t.type==='rec'?'receita':(t.type==='dep'?'despesa':''));
  const valor=n(t.valor!==undefined?t.valor:t.val);
  const raw=String(t.status||t.paid||'').toLowerCase();
  const status=raw.includes('pago')&&!raw.includes('não')?'pago':'pendente';
  return {id:String(t.id||uid('tx')),tipo,type:tipo==='receita'?'rec':'dep',categoria:t.categoria||t.cat||'Outros',cat:t.categoria||t.cat||'Outros',descricao:t.descricao||t.desc||'',desc:t.descricao||t.desc||'',data:t.data||t.date||today(),date:t.data||t.date||today(),valor,val:valor,status,paid:status==='pago'?'Pago':'Não pago',origem:t.origem||'state',clienteId:t.clienteId||'',orcamentoId:t.orcamentoId||'',agendaId:t.agendaId||''};
}
function denormTx(t){return {id:t.id,type:t.tipo==='receita'?'rec':'dep',cat:t.categoria,desc:t.descricao,date:t.data,val:t.valor,paid:t.status==='pago'?'Pago':'Não pago',origem:t.origem,clienteId:t.clienteId,orcamentoId:t.orcamentoId,agendaId:t.agendaId};}
function rebuildFinanceiro(s){
  s.financeiro.lancamentos=(s.financeiro.lancamentos||[]).map(normTx);
  s.financeiro.receitas=s.financeiro.lancamentos.filter(t=>t.tipo==='receita');
  s.financeiro.despesas=s.financeiro.lancamentos.filter(t=>t.tipo==='despesa');
  s.financeiro.receber=s.financeiro.receitas.filter(t=>t.status!=='pago');
  s.financeiro.pagar=s.financeiro.despesas.filter(t=>t.status!=='pago');
}
function loadState(){
  let s=getJson(KEY,null);
  if(!s){for(const k of LEGACY_KEYS){s=getJson(k,null);if(s)break;}}
  if(!s)s=emptyState();
  s.meta=s.meta||{};s.config=s.config||getJson('oficinaos_config',{});
  s.clientes=s.clientes||[];s.veiculos=s.veiculos||[];s.orcamentos=s.orcamentos||[];s.agenda=s.agenda||[];
  s.financeiro=s.financeiro||{};s.financeiro.lancamentos=s.financeiro.lancamentos||[];
  s.metas=s.metas||{};s.relatorios=s.relatorios||{};s.materiais=s.materiais||[];s.ia=s.ia||{historico:[],contexto:[]};
  let tx=[];
  for(const k of TX_KEYS){const a=getJson(k,[]);if(Array.isArray(a)&&a.length)tx=tx.concat(a);}
  if(tx.length){
    tx=tx.map(normTx);
    const ids=new Set(s.financeiro.lancamentos.map(x=>x.id));
    tx.forEach(t=>{if(!ids.has(t.id)){s.financeiro.lancamentos.push(t);ids.add(t.id);}});
  }
  rebuildFinanceiro(s);
  return s;
}
function saveState(s){
  s.meta=s.meta||{};s.meta.versao=VERSION;s.meta.atualizadoEm=new Date().toISOString();
  s.clientes=dedupe(s.clientes,'id');s.veiculos=dedupe(s.veiculos,'id');s.orcamentos=dedupe(s.orcamentos,'id');s.agenda=dedupe(s.agenda,'id');
  s.financeiro.lancamentos=dedupe(s.financeiro.lancamentos,'id');rebuildFinanceiro(s);
  localStorage.setItem(KEY,JSON.stringify(s));localStorage.setItem('oficinaos_state',JSON.stringify(s));localStorage.setItem('OFICINAOS_STATE',JSON.stringify(s));localStorage.setItem('STATE',JSON.stringify(s));
  localStorage.setItem('oficinaos_financeiro_lancamentos',JSON.stringify(s.financeiro.lancamentos));
  localStorage.setItem('ALL_TX',JSON.stringify(s.financeiro.lancamentos.map(denormTx)));
  localStorage.setItem('oficinaos_ALL_TX',JSON.stringify(s.financeiro.lancamentos.map(denormTx)));
  window.dispatchEvent(new CustomEvent('ofix:state-saved',{detail:s}));
  return s;
}
function upsertCliente(s,nome,telefone,documento){
  let c=s.clientes.find(x=>(documento&&x.documento===documento)||(telefone&&x.telefone===telefone)||(nome&&x.nome===nome));
  if(!c){c={id:uid('cli'),nome:nome||'Cliente',telefone:telefone||'',documento:documento||'',criadoEm:new Date().toISOString()};s.clientes.push(c);}
  return c;
}
function readClienteFromPage(){
  const cliente=text(q('input[placeholder*="cliente" i],input[name*="cliente" i],#cliente,#nome,#nomeCliente'))||text(q('.cliente,.client,.selected,.active'))||'Cliente não informado';
  const tel=text(q('input[placeholder*="telefone" i],input[placeholder*="whatsapp" i],input[name*="telefone" i],input[name*="whatsapp" i],#telefone,#whatsapp'));
  const doc=text(q('input[placeholder*="CPF" i],input[placeholder*="CNPJ" i],input[name*="cpf" i],input[name*="cnpj" i],#cpf,#cnpj,#documento'));
  return {id:uid('cli'),nome:cliente,telefone:tel,documento:doc,origem:'clientes',criadoEm:new Date().toISOString()};
}
function readVeiculoFromPage(clienteId){
  const modelo=text(q('input[placeholder*="modelo" i],input[placeholder*="veículo" i],input[placeholder*="veiculo" i],input[name*="veiculo" i],#veiculo,#modelo'));
  const placa=text(q('input[placeholder*="placa" i],input[name*="placa" i],#placa'));
  const cor=text(q('input[placeholder*="cor" i],input[name*="cor" i],#cor'));
  const ano=text(q('input[placeholder*="ano" i],input[name*="ano" i],#ano'));
  return {id:uid('vei'),clienteId,modelo,placa,cor,ano,origem:'clientes',criadoEm:new Date().toISOString()};
}
function readOrcamentoFromPage(){
  const cliente=text(q('input[placeholder*="cliente" i],input[name*="cliente" i],#cliente,#orcCliente'))||'Cliente do orçamento';
  const veiculo=text(q('input[placeholder*="veículo" i],input[placeholder*="veiculo" i],input[name*="veiculo" i],#veiculo,#orcVeiculo'))||'';
  const servico=text(q('textarea,#descricao,#servico,input[placeholder*="serviço" i],input[placeholder*="servico" i]'))||'Serviço aprovado';
  const body=document.body?document.body.innerText:'';
  const valores=[...body.matchAll(/R\$\s*([\d\.\,]+)/g)].map(m=>n(m[1])).filter(v=>v>0);
  const valor=valores.length?valores[valores.length-1]:0;
  const prazo=text(q('input[type="date"],#dataPrevista,#prazo'))||today();
  return {id:uid('orc'),cliente,veiculo,servico,valor,prazo,status:'aprovado',origem:'orcamento',criadoEm:new Date().toISOString()};
}
function clientesParaOrcamento(){
  const s=loadState(), c0=readClienteFromPage();
  const cliente=upsertCliente(s,c0.nome,c0.telefone,c0.documento);
  const v=readVeiculoFromPage(cliente.id);
  if(v.modelo||v.placa)s.veiculos.push(v);
  localStorage.setItem('OFIX_DRAFT_ORCAMENTO',JSON.stringify({cliente,veiculo:v,criadoEm:new Date().toISOString()}));
  saveState(s);alert('Cliente/veículo enviados para Orçamento.');location.href='orcamento.html';
}
function preencherOrcamento(){
  const d=getJson('OFIX_DRAFT_ORCAMENTO',null);if(!d)return;
  const pairs=[
    ['input[placeholder*="cliente" i],input[name*="cliente" i],#cliente,#orcCliente',d.cliente&&d.cliente.nome],
    ['input[placeholder*="telefone" i],input[placeholder*="whatsapp" i],#telefone,#whatsapp',d.cliente&&d.cliente.telefone],
    ['input[placeholder*="CPF" i],input[placeholder*="CNPJ" i],#documento,#cpf,#cnpj',d.cliente&&d.cliente.documento],
    ['input[placeholder*="veículo" i],input[placeholder*="veiculo" i],input[name*="veiculo" i],#veiculo,#orcVeiculo',d.veiculo&&d.veiculo.modelo],
    ['input[placeholder*="placa" i],input[name*="placa" i],#placa',d.veiculo&&d.veiculo.placa],
    ['input[placeholder*="cor" i],input[name*="cor" i],#cor',d.veiculo&&d.veiculo.cor],
    ['input[placeholder*="ano" i],input[name*="ano" i],#ano',d.veiculo&&d.veiculo.ano]
  ];
  pairs.forEach(([sel,val])=>{if(!val)return;const el=q(sel);if(el&&'value'in el){el.value=val;el.dispatchEvent(new Event('input',{bubbles:true}));}});
  addNotice('Dados do cliente carregados no orçamento.');
}
function aprovarOrcamento(){
  const s=loadState(), o=readOrcamentoFromPage();
  const c=upsertCliente(s,o.cliente,'','');
  let v=s.veiculos.find(x=>x.clienteId===c.id&&x.modelo===o.veiculo);
  if(!v&&o.veiculo){v={id:uid('vei'),clienteId:c.id,modelo:o.veiculo,criadoEm:new Date().toISOString()};s.veiculos.push(v);}
  o.clienteId=c.id;o.veiculoId=v?v.id:'';s.orcamentos.push(o);
  const tx={id:'tx_'+o.id,tipo:'receita',type:'rec',categoria:'Orçamento aprovado',cat:'Orçamento aprovado',descricao:o.cliente+' — '+o.servico,desc:o.cliente+' — '+o.servico,data:today(),date:today(),valor:o.valor,val:o.valor,status:'pendente',paid:'Não pago',origem:'orcamento',orcamentoId:o.id,clienteId:c.id};
  s.financeiro.lancamentos.push(tx);
  const ag={id:'os_'+o.id,clienteId:c.id,veiculoId:o.veiculoId,orcamentoId:o.id,cliente:o.cliente,veiculo:o.veiculo,servico:o.servico,valor:o.valor,entrada:today(),entregaPrevista:o.prazo||today(),etapa:'Agendado',status:'agendado',fotos:[],historico:[{data:new Date().toISOString(),evento:'OS criada a partir do orçamento'}],origem:'orcamento'};
  s.agenda.push(ag);s.relatorios.ultimoEvento={tipo:'orcamento_aprovado',orcamentoId:o.id,valor:o.valor,data:new Date().toISOString()};
  saveState(s);alert('Orçamento aprovado: receita pendente criada no Financeiro e OS criada na Agenda.');
}
function agendaEntregue(){
  const s=loadState();let os=s.agenda[s.agenda.length-1];
  if(!os){os={id:uid('os'),cliente:text(q('input[placeholder*="cliente" i],#cliente'))||'Cliente',servico:text(q('textarea,#servico'))||'Serviço',valor:n(text(q('input[placeholder*="valor" i],#valor'))),status:'entregue',historico:[]};s.agenda.push(os);}
  os.status='entregue';os.etapa='Entregue';os.entregueEm=new Date().toISOString();os.historico=os.historico||[];os.historico.push({data:new Date().toISOString(),evento:'OS marcada como entregue'});
  const tx=s.financeiro.lancamentos.find(t=>t.orcamentoId===os.orcamentoId||t.id==='tx_'+(os.orcamentoId||''));
  if(tx){if(confirm('Marcar receita desta OS como recebida no Financeiro?')){tx.status='pago';tx.paid='Pago';tx.recebidoEm=today();}}
  else if(os.valor){s.financeiro.lancamentos.push({id:'tx_os_'+os.id,tipo:'receita',type:'rec',categoria:'OS entregue',cat:'OS entregue',descricao:(os.cliente||'Cliente')+' — '+(os.servico||'Serviço'),desc:(os.cliente||'Cliente')+' — '+(os.servico||'Serviço'),data:today(),date:today(),valor:n(os.valor),val:n(os.valor),status:'pendente',paid:'Não pago',origem:'agenda',agendaId:os.id});}
  saveState(s);alert('Agenda sincronizada com Financeiro e histórico do cliente.');
}
function addNotice(msg){
  const div=document.createElement('div');div.textContent='🔗 '+msg;div.style.cssText='position:fixed;left:12px;bottom:12px;z-index:9999;background:#fffaf4;border:1px solid #ead7c4;border-radius:999px;padding:8px 12px;box-shadow:0 2px 10px #0002;font-weight:700';document.body.appendChild(div);setTimeout(()=>div.remove(),4500);
}
function resumoDados(){
  const s=loadState(), rec=s.financeiro.receitas.reduce((a,b)=>a+n(b.valor),0), dep=s.financeiro.despesas.reduce((a,b)=>a+n(b.valor),0), ent=s.agenda.filter(x=>String(x.status).toLowerCase().includes('entreg')).length, pend=s.financeiro.receber.reduce((a,b)=>a+n(b.valor),0);
  return {s,rec,dep,ent,pend};
}
function showResumo(){
  const r=resumoDados(), s=r.s;
  alert('STATE ÚNICO '+VERSION+'\nClientes: '+s.clientes.length+'\nVeículos: '+s.veiculos.length+'\nOrçamentos: '+s.orcamentos.length+'\nAgenda/OS: '+s.agenda.length+'\nOS entregues: '+r.ent+'\nReceitas: '+money(r.rec)+'\nDespesas: '+money(r.dep)+'\nA receber: '+money(r.pend)+'\nResultado: '+money(r.rec-r.dep));
}
function injectResumoPanel(){
  const page=(location.pathname.split('/').pop()||'').toLowerCase();
  if(!(page.includes('relatorio')||page.includes('meta')||page.includes('ia')||page.includes('cliente')))return;
  if(document.getElementById('ofixResumoState'))return;
  const r=resumoDados();const box=document.createElement('div');box.id='ofixResumoState';
  box.style.cssText='margin:10px;padding:10px;border:1px solid #dcb990;border-radius:8px;background:#fffaf4;font:12px Arial;color:#2b1a0e';
  box.innerHTML='<b>🔗 Dados reais do STATE único</b><br>Receitas: '+money(r.rec)+' · Despesas: '+money(r.dep)+' · Resultado: '+money(r.rec-r.dep)+' · OS: '+r.s.agenda.length+' · Entregues: '+r.ent;
  document.body.insertBefore(box,document.body.firstChild);
}
function injectBar(){
  if(document.getElementById('ofixStateBar'))return;
  const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const bar=document.createElement('div');bar.id='ofixStateBar';
  bar.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99999;background:#fffaf4;border:1px solid #dcb990;border-radius:12px;padding:8px;display:flex;gap:6px;flex-wrap:wrap;box-shadow:0 2px 14px #0002;font:12px Arial';
  let html='<button onclick="OFIX_STATE.showResumo()">🔗 STATE</button>';
  if(page.includes('cliente'))html+='<button onclick="OFIX_STATE.clientesParaOrcamento()">Cliente → Orçamento</button>';
  if(page.includes('orcamento'))html+='<button onclick="OFIX_STATE.aprovarOrcamento()">Aprovar → Financeiro + Agenda</button>';
  if(page.includes('agenda'))html+='<button onclick="OFIX_STATE.agendaEntregue()">Entregar → Financeiro</button>';
  if(page.includes('relatorio')||page.includes('meta')||page.includes('ia'))html+='<button onclick="OFIX_STATE.showResumo()">Consultar dados reais</button>';
  html+='<button onclick="location.href=\'index.html\'">Painel</button>';
  bar.innerHTML=html;document.body.appendChild(bar);
}
window.OFIX_STATE={loadState,saveState,clientesParaOrcamento,aprovarOrcamento,agendaEntregue,showResumo,preencherOrcamento};
document.addEventListener('DOMContentLoaded',function(){
  const s=loadState();saveState(s);injectBar();injectResumoPanel();
  if(location.pathname.toLowerCase().includes('orcamento'))preencherOrcamento();
  document.addEventListener('click',function(e){const t=String((e.target&&(e.target.innerText||e.target.value||''))||'');if(location.pathname.toLowerCase().includes('orcamento')&&/aprovar.*financeiro|enviar.*financeiro/i.test(t)){setTimeout(aprovarOrcamento,150);}},true);
});
})();

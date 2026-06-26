
/* OficinaOS V547.30 — Master Release Core */
(function(){
'use strict';

const VERSION = 'V547.30 MASTER RELEASE';
const K = {
  meta:'OFICINAOS_META',
  config:'OFICINAOS_CONFIG',
  clientes:'OFICINAOS_CLIENTES',
  veiculos:'OFICINAOS_VEICULOS',
  orcamentos:'OFICINAOS_ORCAMENTOS_MIN',
  agenda:'OFICINAOS_AGENDA_MIN',
  financeiro:'OFICINAOS_FINANCEIRO_MIN',
  metas:'OFICINAOS_METAS',
  lastBackup:'OFICINAOS_LAST_BACKUP'
};

const LEGACY = [
  'OFICINAOS_V549_STATE','OFICINAOS_STATE_MASTER','OFICINAOS_STATE',
  'oficinaos_state','OFICINA_STATE','oficinaos_clean_v546_30_state',
  'oficinaos_v546_state','oficinaos_v546_15_financeiro','oficinaos_v546_16_3_agenda'
];

function uid(p){return (crypto&&crypto.randomUUID)?crypto.randomUUID():p+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}
function parse(raw,fallback){try{return JSON.parse(raw||'')}catch(e){return fallback}}
function get(k,f){return parse(localStorage.getItem(k),f)}
function set(k,v){localStorage.setItem(k,JSON.stringify(v))}
function money(v){return n(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function n(v){
  if(v===null||v===undefined||v==='') return 0;
  if(typeof v==='string') v=v.replace(/R\$/g,'').replace(/\s/g,'').replace(/\./g,'').replace(',','.');
  v=Number(v);
  return Number.isFinite(v)?v:0;
}
function today(){return new Date().toISOString().slice(0,10)}
function month(){return today().slice(0,7)}

function normCliente(c){
  c=c||{};
  return {
    id:String(c.id||uid('cli')),
    nome:String(c.nome||c.cliente||c.name||'').trim(),
    telefone:String(c.telefone||c.fone||c.whatsapp||'').trim(),
    whatsapp:String(c.whatsapp||c.telefone||'').trim(),
    cpfCnpj:String(c.cpfCnpj||c.cpf||c.cnpj||c.documento||'').trim(),
    email:String(c.email||'').trim(),
    endereco:String(c.endereco||'').trim(),
    observacoes:String(c.observacoes||c.obs||'').trim(),
    historico:Array.isArray(c.historico)?c.historico:[],
    ativo:c.ativo!==false,
    criadoEm:c.criadoEm||new Date().toISOString()
  }
}
function normVeiculo(v,clienteId){
  v=v||{};
  return {
    id:String(v.id||uid('vei')),
    clienteId:String(v.clienteId||clienteId||''),
    placa:String(v.placa||'').toUpperCase().trim(),
    marca:String(v.marca||'').trim(),
    modelo:String(v.modelo||v.veiculo||'').trim(),
    ano:String(v.ano||'').trim(),
    cor:String(v.cor||'').trim(),
    chassi:String(v.chassi||'').trim(),
    observacoes:String(v.observacoes||v.obs||'').trim()
  }
}
function normTx(t){
  t=t||{};
  const raw=String(t.tipo||t.type||'').toLowerCase();
  const tipo = raw==='dep'||raw.includes('desp') ? 'despesa' : 'receita';
  const statusRaw=String(t.status||t.paid||'').toLowerCase();
  const status = statusRaw.includes('pago') && !statusRaw.includes('não') ? 'pago' : (statusRaw.includes('parcial')?'parcial':'pendente');
  return {
    id:String(t.id||uid('tx')),
    tipo, type: tipo==='receita'?'rec':'dep',
    categoria:String(t.categoria||t.cat||'Geral'),
    descricao:String(t.descricao||t.desc||''),
    data:String(t.data||t.date||t.vencimento||today()).slice(0,10),
    valor:n((Object.prototype.hasOwnProperty.call(t,'valor')?t.valor:(Object.prototype.hasOwnProperty.call(t,'val')?t.val:t.total))),
    status, paid: status==='pago'?'Pago':'Não pago',
    recorrente:!!t.recorrente,
    clienteId:t.clienteId||'', veiculoId:t.veiculoId||'',
    orcamentoId:t.orcamentoId||'', agendaId:t.agendaId||'',
    origem:t.origem||'oficinaos'
  }
}
function normOrc(o){
  o=o||{};
  return {
    id:String(o.id||uid('orc')),
    numero:String(o.numero||o.id||''),
    clienteId:o.clienteId||'', veiculoId:o.veiculoId||'',
    cliente:String(o.cliente||o.nome||''),
    telefone:String(o.telefone||''),
    veiculo:String(o.veiculo||''),
    placa:String(o.placa||'').toUpperCase(),
    descricao:String(o.descricao||o.servico||''),
    status:String(o.status||'Aberto'),
    data:String(o.data||o.criadoEm||today()).slice(0,10),
    validadeAte:o.validadeAte||'',
    valor:n((Object.prototype.hasOwnProperty.call(o,'valor')?o.valor:(Object.prototype.hasOwnProperty.call(o,'total')?o.total:(o.resumo&&o.resumo.total)||0))),
    total:n((Object.prototype.hasOwnProperty.call(o,'valor')?o.valor:(Object.prototype.hasOwnProperty.call(o,'total')?o.total:0))),
    origem:o.origem||'oficinaos'
  }
}
function normOS(x){
  x=x||{};
  return {
    id:String(x.id||uid('os')),
    orcamentoId:x.orcamentoId||'',
    clienteId:x.clienteId||'', veiculoId:x.veiculoId||'',
    cliente:String(x.cliente||''),
    veiculo:String(x.veiculo||x.modelo||''),
    placa:String(x.placa||'').toUpperCase(),
    servico:String(x.servico||x.obs||x.observacoes||''),
    etapa:String(x.etapa||x.etapaAtual||'Entrada'),
    status:String(x.status||'Agendado'),
    prioridade:String(x.prioridade||'Normal'),
    entrada:String(x.entrada||x.data||today()).slice(0,10),
    entrega:String(x.entrega||x.entregaPrevista||x.prazo||'').slice(0,10),
    valor:n((Object.prototype.hasOwnProperty.call(x,'valor')?x.valor:x.total)),
    fotos:x.fotos||{},
    timeline:Array.isArray(x.timeline)?x.timeline:[],
    origem:x.origem||'oficinaos'
  }
}

function migrateLegacyOnce(){
  if(get(K.meta,{}).version) return;
  let clientes=get(K.clientes,[]), veiculos=get(K.veiculos,[]);
  let financeiro=get(K.financeiro,{lancamentos:[]});
  let orcamentos=get(K.orcamentos,[]);
  let agenda=get(K.agenda,[]);
  const found=[];
  LEGACY.forEach(k=>{
    const v=get(k,null);
    if(v) found.push(v);
  });
  found.forEach(s=>{
    if(Array.isArray(s.clientes)) clientes=clientes.concat(s.clientes);
    if(Array.isArray(s.veiculos)) veiculos=veiculos.concat(s.veiculos);
    if(s.financeiro&&Array.isArray(s.financeiro.lancamentos)) financeiro.lancamentos=(financeiro.lancamentos||[]).concat(s.financeiro.lancamentos);
    if(Array.isArray(s.ALL_TX)) financeiro.lancamentos=(financeiro.lancamentos||[]).concat(s.ALL_TX);
    if(Array.isArray(s.orcamentos)) orcamentos=orcamentos.concat(s.orcamentos);
    if(Array.isArray(s.agenda)) agenda=agenda.concat(s.agenda);
    if(s.agenda&&Array.isArray(s.agenda.os)) agenda=agenda.concat(s.agenda.os);
  });
  save({clientes,veiculos,orcamentos,agenda,financeiro,metas:get(K.metas,{})});
  LEGACY.forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});
}

function load(){
  migrateLegacyOnce();
  const s={
    config:get(K.config,{}),
    clientes:get(K.clientes,[]).map(normCliente).filter(c=>c.nome),
    veiculos:get(K.veiculos,[]).map(v=>normVeiculo(v,v.clienteId)),
    orcamentos:get(K.orcamentos,[]).map(normOrc),
    agenda:get(K.agenda,[]).map(normOS),
    financeiro:get(K.financeiro,{lancamentos:[]}),
    metas:get(K.metas,{mensal:10000,pontoEquilibrio:3000})
  };
  s.financeiro.lancamentos=Array.isArray(s.financeiro.lancamentos)?s.financeiro.lancamentos.map(normTx):[];
  s.financeiro.receitas=s.financeiro.lancamentos.filter(t=>t.tipo==='receita');
  s.financeiro.despesas=s.financeiro.lancamentos.filter(t=>t.tipo==='despesa');
  s.financeiro.receber=s.financeiro.receitas.filter(t=>t.status!=='pago');
  s.financeiro.pagar=s.financeiro.despesas.filter(t=>t.status!=='pago');
  s.clientes.forEach(c=>c.veiculos=s.veiculos.filter(v=>v.clienteId===c.id));
  const receitasPagas=s.financeiro.receitas.filter(t=>t.status==='pago').reduce((a,b)=>a+n(b.valor),0);
  const despesasPagas=s.financeiro.despesas.filter(t=>t.status==='pago').reduce((a,b)=>a+n(b.valor),0);
  const osEntregues=s.agenda.filter(o=>/entreg/i.test(o.status)).length;
  s.relatorios={
    receitasPagas, despesasPagas, resultado:receitasPagas-despesasPagas,
    clientes:s.clientes.length, veiculos:s.veiculos.length, orcamentos:s.orcamentos.length,
    os:s.agenda.length, osEntregues,
    ticketMedio: osEntregues ? receitasPagas/osEntregues : 0
  };
  window.OFICINAOS_STATE=s;
  window.STATE=s;
  return s;
}

function save(s){
  s=s||window.OFICINAOS_STATE||{};
  set(K.clientes,(s.clientes||[]).map(c=>{const x=normCliente(c); delete x.veiculos; return x;}));
  set(K.veiculos,(s.veiculos||[]).map(v=>normVeiculo(v,v.clienteId)));
  set(K.orcamentos,(s.orcamentos||[]).map(normOrc));
  set(K.agenda,(s.agenda||[]).map(normOS));
  set(K.financeiro,{lancamentos:((s.financeiro&&s.financeiro.lancamentos)||[]).map(normTx)});
  set(K.metas,s.metas||get(K.metas,{mensal:10000,pontoEquilibrio:3000}));
  set(K.config,s.config||get(K.config,{}));
  set(K.meta,{version:VERSION,updatedAt:new Date().toISOString()});
  return load();
}

function clearAll(){
  Object.values(K).forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});
  LEGACY.concat(['ALL_TX']).forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});
  return save({clientes:[],veiculos:[],orcamentos:[],agenda:[],financeiro:{lancamentos:[]},metas:{mensal:10000,pontoEquilibrio:3000},config:{}});
}

function exportBackup(){
  const s=load();
  const backup={
    version:VERSION, exportedAt:new Date().toISOString(),
    config:s.config,
    clientes:s.clientes.map(c=>{const x={...c}; delete x.veiculos; return x}),
    veiculos:s.veiculos,
    orcamentos:s.orcamentos,
    agenda:s.agenda,
    financeiro:{lancamentos:s.financeiro.lancamentos},
    metas:s.metas
  };
  set(K.lastBackup,{version:VERSION,exportedAt:backup.exportedAt,clientes:backup.clientes.length,lancamentos:backup.financeiro.lancamentos.length});
  return backup;
}

function importBackup(obj){
  obj=obj||{};
  let s={
    config:obj.config||{},
    clientes:obj.clientes||[],
    veiculos:obj.veiculos||[],
    orcamentos:obj.orcamentos||[],
    agenda:obj.agenda||[],
    financeiro:obj.financeiro||{lancamentos:[]},
    metas:obj.metas||{mensal:10000,pontoEquilibrio:3000}
  };
  if(obj.localStorage){
    Object.entries(obj.localStorage).forEach(([k,v])=>{
      const p=parse(v,null);
      if(!p) return;
      if(Array.isArray(p.clientes)) s.clientes=s.clientes.concat(p.clientes);
      if(Array.isArray(p.veiculos)) s.veiculos=s.veiculos.concat(p.veiculos);
      if(Array.isArray(p.orcamentos)) s.orcamentos=s.orcamentos.concat(p.orcamentos);
      if(Array.isArray(p.agenda)) s.agenda=s.agenda.concat(p.agenda);
      if(p.financeiro&&Array.isArray(p.financeiro.lancamentos)) s.financeiro.lancamentos=(s.financeiro.lancamentos||[]).concat(p.financeiro.lancamentos);
      if(Array.isArray(p)) s.financeiro.lancamentos=(s.financeiro.lancamentos||[]).concat(p);
    });
  }
  return save(s);
}

function download(name,data,type='application/json'){
  const blob=new Blob([data],{type});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}

function importFile(file,cb){
  const r=new FileReader();
  r.onload=e=>{
    try{const s=importBackup(JSON.parse(e.target.result)); cb&&cb(null,s)}
    catch(err){cb&&cb(err)}
  };
  r.readAsText(file);
}

function status(t){
  const el=document.getElementById('status')||document.querySelector('[data-status]');
  if(el) el.textContent=t+' · '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
}

function purgeDevText(){
  document.querySelectorAll('button,.btn').forEach(b=>{
    const t=(b.textContent||'').toLowerCase();
    if(t.includes('simulação')||t.includes('demo')||t.includes('validar')) b.style.display='none';
  });
}

window.OficinaOS={VERSION,K,load,save,clearAll,exportBackup,importBackup,download,importFile,money,n,today,month,status};
window.OSCORE=Object.assign(window.OSCORE||{}, {load,save,clearAll,exportBackup,importBackup,money,n,status});
document.addEventListener('DOMContentLoaded',()=>{load();purgeDevText();});
})();


(function(){
'use strict';

const VERSION = 'V546.22.2 RC2 STATE ÚNICO REAL';
const STATE_KEY = 'OFICINAOS_STATE';
const STATE_KEY_V = 'OFICINAOS_STATE_V546_22';
const DRAFT_KEY = 'OFICINAOS_DRAFT_ORCAMENTO';
const TX_KEYS = ['ALL_TX','oficinaos_ALL_TX','oficinaos_financeiro_lancamentos'];

function uid(p){return p+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}
function hoje(){return new Date().toISOString().slice(0,10)}
function moeda(v){return num(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function num(v){
  if(v===null||v===undefined||v==='') return 0;
  if(typeof v==='string') v=v.replace(/\s/g,'').replace(/R\$/g,'').replace(/\./g,'').replace(',','.');
  v=Number(v);
  return Number.isFinite(v)?v:0;
}
function jget(k,f){try{return JSON.parse(localStorage.getItem(k)||'')}catch(e){return f}}
function txt(el){return el ? String(el.value||el.textContent||'').trim() : ''}
function q(sel){try{return document.querySelector(sel)}catch(e){return null}}
function qa(sel){try{return Array.from(document.querySelectorAll(sel))}catch(e){return []}}

function emptyState(){
  return {
    meta:{versao:VERSION, criadoEm:new Date().toISOString(), atualizadoEm:new Date().toISOString()},
    config:jget('oficinaos_config',{}),
    clientes:[],
    veiculos:[],
    orcamentos:[],
    agenda:[],
    financeiro:{lancamentos:[],receitas:[],despesas:[],receber:[],pagar:[]},
    metas:{objetivos:{}, categorias:[]},
    relatorios:{resumos:[], ultimoResumo:null},
    materiais:[],
    ia:{historico:[], contexto:[]}
  };
}
function normalizeTx(t){
  const tipo = t.tipo || (t.type==='rec'?'receita':(t.type==='dep'?'despesa':''));
  const valor = num(t.valor!==undefined?t.valor:t.val);
  const raw = String(t.status||t.paid||'').toLowerCase();
  const status = raw.includes('pago') && !raw.includes('não') ? 'pago':'pendente';
  return {
    id:String(t.id||uid('tx')),
    tipo,
    type:tipo==='receita'?'rec':'dep',
    categoria:t.categoria||t.cat||'Outros',
    cat:t.categoria||t.cat||'Outros',
    descricao:t.descricao||t.desc||'',
    desc:t.descricao||t.desc||'',
    data:t.data||t.date||hoje(),
    date:t.data||t.date||hoje(),
    valor,
    val:valor,
    status,
    paid:status==='pago'?'Pago':'Não pago',
    origem:t.origem||'state',
    clienteId:t.clienteId||'',
    veiculoId:t.veiculoId||'',
    orcamentoId:t.orcamentoId||'',
    agendaId:t.agendaId||''
  };
}
function denormTx(t){
  return {id:t.id,type:t.tipo==='receita'?'rec':'dep',cat:t.categoria,desc:t.descricao,date:t.data,val:t.valor,paid:t.status==='pago'?'Pago':'Não pago',origem:t.origem,clienteId:t.clienteId,veiculoId:t.veiculoId,orcamentoId:t.orcamentoId,agendaId:t.agendaId};
}
function rebuildFinanceiro(s){
  s.financeiro=s.financeiro||{lancamentos:[]};
  s.financeiro.lancamentos=(s.financeiro.lancamentos||[]).map(normalizeTx);
  s.financeiro.receitas=s.financeiro.lancamentos.filter(x=>x.tipo==='receita');
  s.financeiro.despesas=s.financeiro.lancamentos.filter(x=>x.tipo==='despesa');
  s.financeiro.receber=s.financeiro.receitas.filter(x=>x.status!=='pago');
  s.financeiro.pagar=s.financeiro.despesas.filter(x=>x.status!=='pago');
}
function dedupe(arr,key){
  const seen=new Set();
  return (arr||[]).filter(x=>{
    const v=x&&x[key];
    if(!v) return true;
    if(seen.has(v)) return false;
    seen.add(v); return true;
  });
}
function loadState(){
  let s=jget(STATE_KEY_V,null)||jget(STATE_KEY,null)||jget('oficinaos_state',null)||jget('STATE',null)||emptyState();
  s.meta=s.meta||{}; s.config=s.config||jget('oficinaos_config',{});
  s.clientes=s.clientes||[]; s.veiculos=s.veiculos||[]; s.orcamentos=s.orcamentos||[]; s.agenda=s.agenda||[];
  s.financeiro=s.financeiro||{lancamentos:[]}; s.financeiro.lancamentos=s.financeiro.lancamentos||[];
  s.metas=s.metas||{objetivos:{},categorias:[]}; s.relatorios=s.relatorios||{resumos:[]}; s.ia=s.ia||{historico:[],contexto:[]}; s.materiais=s.materiais||[];

  let tx=[];
  TX_KEYS.forEach(k=>{
    const a=jget(k,[]);
    if(Array.isArray(a)&&a.length) tx=tx.concat(a);
  });
  if(tx.length){
    const ids=new Set(s.financeiro.lancamentos.map(x=>String(x.id)));
    tx.map(normalizeTx).forEach(t=>{if(!ids.has(String(t.id))){s.financeiro.lancamentos.push(t);ids.add(String(t.id));}});
  }
  rebuildFinanceiro(s);
  return s;
}
function saveState(s){
  s.meta=s.meta||{}; s.meta.versao=VERSION; s.meta.atualizadoEm=new Date().toISOString();
  s.clientes=dedupe(s.clientes,'id'); s.veiculos=dedupe(s.veiculos,'id'); s.orcamentos=dedupe(s.orcamentos,'id'); s.agenda=dedupe(s.agenda,'id');
  rebuildFinanceiro(s);
  s.financeiro.lancamentos=dedupe(s.financeiro.lancamentos,'id'); rebuildFinanceiro(s);
  localStorage.setItem(STATE_KEY_V,JSON.stringify(s));
  localStorage.setItem(STATE_KEY,JSON.stringify(s));
  localStorage.setItem('oficinaos_state',JSON.stringify(s));
  localStorage.setItem('STATE',JSON.stringify(s));
  localStorage.setItem('oficinaos_financeiro_lancamentos',JSON.stringify(s.financeiro.lancamentos));
  localStorage.setItem('ALL_TX',JSON.stringify(s.financeiro.lancamentos.map(denormTx)));
  localStorage.setItem('oficinaos_ALL_TX',JSON.stringify(s.financeiro.lancamentos.map(denormTx)));
  return s;
}
function upsertCliente(s, obj){
  const nome=(obj.nome||'').trim()||'Cliente';
  const telefone=(obj.telefone||'').trim();
  const documento=(obj.documento||'').trim();
  let c=s.clientes.find(x=>(documento&&x.documento===documento)||(telefone&&x.telefone===telefone)||x.nome===nome);
  if(!c){
    c={id:obj.id||uid('cli'), nome, telefone, documento, email:obj.email||'', origem:obj.origem||'state', criadoEm:new Date().toISOString(), historico:[]};
    s.clientes.push(c);
  }else{
    Object.assign(c,{nome,telefone:telefone||c.telefone,documento:documento||c.documento,email:obj.email||c.email});
  }
  return c;
}
function upsertVeiculo(s, clienteId, obj){
  const modelo=(obj.modelo||'').trim(); const placa=(obj.placa||'').trim();
  let v=s.veiculos.find(x=>x.clienteId===clienteId && ((placa&&x.placa===placa)||(modelo&&x.modelo===modelo)));
  if(!v){
    v={id:obj.id||uid('vei'), clienteId, modelo, placa, cor:obj.cor||'', ano:obj.ano||'', observacoes:obj.observacoes||'', criadoEm:new Date().toISOString()};
    s.veiculos.push(v);
  }else Object.assign(v,{modelo:modelo||v.modelo,placa:placa||v.placa,cor:obj.cor||v.cor,ano:obj.ano||v.ano});
  return v;
}
function field(selectors){
  for(const sel of selectors){const el=q(sel);const v=txt(el);if(v)return v;}
  return '';
}
function readClienteTela(){
  return {
    nome:field(['input[placeholder*="cliente" i]','input[name*="cliente" i]','#cliente','#nome','#nomeCliente','input[placeholder*="nome" i]'])||'Cliente não informado',
    telefone:field(['input[placeholder*="whatsapp" i]','input[placeholder*="telefone" i]','#whatsapp','#telefone','#fone']),
    documento:field(['input[placeholder*="cnpj" i]','input[placeholder*="cpf" i]','#documento','#cnpj','#cpf']),
    email:field(['input[type="email"]','input[placeholder*="email" i]'])
  };
}
function readVeiculoTela(){
  return {
    modelo:field(['input[placeholder*="veículo" i]','input[placeholder*="veiculo" i]','input[placeholder*="modelo" i]','#veiculo','#modelo','#orcVeiculo']),
    placa:field(['input[placeholder*="placa" i]','#placa']),
    cor:field(['input[placeholder*="cor" i]','#cor']),
    ano:field(['input[placeholder*="ano" i]','#ano'])
  };
}
function readOrcamentoTela(){
  const cliente=readClienteTela();
  const veiculo=readVeiculoTela();
  const servico=field(['textarea','#descricao','#servico','input[placeholder*="serviço" i]','input[placeholder*="servico" i]'])||'Serviço aprovado';
  const body=document.body?document.body.innerText:'';
  const valores=[...body.matchAll(/R\$\s*([\d\.\,]+)/g)].map(m=>num(m[1])).filter(v=>v>0);
  const valor=valores.length?valores[valores.length-1]:0;
  const prazo=field(['input[type="date"]','#dataPrevista','#prazo'])||hoje();
  return {cliente,veiculo,servico,valor,prazo};
}
function clienteParaOrcamento(){
  const s=loadState();
  const c=upsertCliente(s,readClienteTela());
  const v=upsertVeiculo(s,c.id,readVeiculoTela());
  localStorage.setItem(DRAFT_KEY,JSON.stringify({cliente:c,veiculo:v,criadoEm:new Date().toISOString()}));
  saveState(s);
  alert('Cliente e veículo enviados para o Orçamento.');
  location.href='orcamento.html';
}
function preencherOrcamento(){
  const d=jget(DRAFT_KEY,null);
  if(!d)return;
  const pairs=[
    [['input[placeholder*="cliente" i]','input[name*="cliente" i]','#cliente','#orcCliente'],d.cliente&&d.cliente.nome],
    [['input[placeholder*="telefone" i]','input[placeholder*="whatsapp" i]','#telefone','#whatsapp'],d.cliente&&d.cliente.telefone],
    [['input[placeholder*="cnpj" i]','input[placeholder*="cpf" i]','#documento','#cnpj','#cpf'],d.cliente&&d.cliente.documento],
    [['input[placeholder*="veículo" i]','input[placeholder*="veiculo" i]','input[placeholder*="modelo" i]','#veiculo','#modelo','#orcVeiculo'],d.veiculo&&d.veiculo.modelo],
    [['input[placeholder*="placa" i]','#placa'],d.veiculo&&d.veiculo.placa],
    [['input[placeholder*="cor" i]','#cor'],d.veiculo&&d.veiculo.cor],
    [['input[placeholder*="ano" i]','#ano'],d.veiculo&&d.veiculo.ano]
  ];
  pairs.forEach(([sels,val])=>{
    if(!val)return;
    for(const sel of sels){
      const el=q(sel);
      if(el && 'value' in el){el.value=val;el.dispatchEvent(new Event('input',{bubbles:true}));break;}
    }
  });
  aviso('Cliente/veículo carregado no orçamento.');
}
function aprovarOrcamento(){
  const s=loadState();
  const data=readOrcamentoTela();
  const c=upsertCliente(s,data.cliente);
  const v=upsertVeiculo(s,c.id,data.veiculo);
  const orc={id:uid('orc'),clienteId:c.id,veiculoId:v.id,cliente:c.nome,veiculo:v.modelo,servico:data.servico,valor:data.valor,prazo:data.prazo,status:'aprovado',origem:'orcamento',criadoEm:new Date().toISOString()};
  s.orcamentos.push(orc);
  const tx={id:'tx_'+orc.id,tipo:'receita',type:'rec',categoria:'Orçamento aprovado',cat:'Orçamento aprovado',descricao:c.nome+' — '+data.servico,desc:c.nome+' — '+data.servico,data:hoje(),date:hoje(),valor:data.valor,val:data.valor,status:'pendente',paid:'Não pago',origem:'orcamento',clienteId:c.id,veiculoId:v.id,orcamentoId:orc.id};
  s.financeiro.lancamentos.push(tx);
  const os={id:'os_'+orc.id,clienteId:c.id,veiculoId:v.id,orcamentoId:orc.id,cliente:c.nome,veiculo:v.modelo,servico:data.servico,valor:data.valor,entrada:hoje(),entregaPrevista:data.prazo,status:'agendado',etapa:'Agendado',fotos:[],historico:[{data:new Date().toISOString(),evento:'OS criada a partir do orçamento'}],origem:'orcamento'};
  s.agenda.push(os);
  c.historico=c.historico||[]; c.historico.push({data:new Date().toISOString(),tipo:'orçamento_aprovado',orcamentoId:orc.id,agendaId:os.id,valor:data.valor,descricao:data.servico});
  gerarResumoRelatorio(s);
  saveState(s);
  alert('Orçamento aprovado: criou Receita pendente no Financeiro e OS na Agenda.');
}
function agendaEntregue(){
  const s=loadState();
  let os=s.agenda[s.agenda.length-1];
  if(!os){
    os={id:uid('os'),cliente:field(['input[placeholder*="cliente" i]','#cliente'])||'Cliente',servico:field(['textarea','#servico'])||'Serviço',valor:num(field(['input[placeholder*="valor" i]','#valor'])),status:'entregue',etapa:'Entregue',historico:[]};
    s.agenda.push(os);
  }
  os.status='entregue'; os.etapa='Entregue'; os.entregueEm=new Date().toISOString();
  os.historico=os.historico||[]; os.historico.push({data:new Date().toISOString(),evento:'OS entregue'});
  const c=s.clientes.find(x=>x.id===os.clienteId)||upsertCliente(s,{nome:os.cliente||'Cliente'});
  os.clienteId=c.id;
  c.historico=c.historico||[]; c.historico.push({data:new Date().toISOString(),tipo:'os_entregue',agendaId:os.id,descricao:os.servico,valor:os.valor});
  let tx=s.financeiro.lancamentos.find(t=>t.orcamentoId===os.orcamentoId||t.agendaId===os.id);
  if(!tx && os.valor){
    tx={id:'tx_os_'+os.id,tipo:'receita',type:'rec',categoria:'OS entregue',cat:'OS entregue',descricao:(os.cliente||c.nome)+' — '+(os.servico||'Serviço'),desc:(os.cliente||c.nome)+' — '+(os.servico||'Serviço'),data:hoje(),date:hoje(),valor:num(os.valor),val:num(os.valor),status:'pendente',paid:'Não pago',origem:'agenda',agendaId:os.id,clienteId:c.id};
    s.financeiro.lancamentos.push(tx);
  }
  if(tx && confirm('Marcar receita desta OS como recebida?')){tx.status='pago';tx.paid='Pago';tx.recebidoEm=hoje();}
  gerarResumoRelatorio(s);
  saveState(s);
  alert('OS entregue: Agenda, Clientes e Financeiro sincronizados.');
}
function anexarFotoAgenda(){
  let input=document.createElement('input');
  input.type='file'; input.accept='image/*'; input.multiple=true;
  input.onchange=()=>{
    const files=[...input.files]; if(!files.length)return;
    const s=loadState(); let os=s.agenda[s.agenda.length-1];
    if(!os){os={id:uid('os'),cliente:'Cliente',servico:'Serviço',status:'aberto',fotos:[],historico:[]};s.agenda.push(os);}
    files.forEach(f=>{
      const r=new FileReader();
      r.onload=()=>{
        os.fotos=os.fotos||[]; os.fotos.push({nome:f.name,data:r.result,em:new Date().toISOString()});
        os.historico=os.historico||[]; os.historico.push({data:new Date().toISOString(),evento:'Foto anexada: '+f.name});
        const c=s.clientes.find(x=>x.id===os.clienteId);
        if(c){c.historico=c.historico||[];c.historico.push({data:new Date().toISOString(),tipo:'foto_os',agendaId:os.id,descricao:f.name});}
        saveState(s);
      };
      r.readAsDataURL(f);
    });
    alert('Fotos anexadas à última OS do STATE.');
  };
  input.click();
}
function gerarResumoRelatorio(s){
  rebuildFinanceiro(s);
  const receitas=s.financeiro.receitas.reduce((a,b)=>a+num(b.valor),0);
  const despesas=s.financeiro.despesas.reduce((a,b)=>a+num(b.valor),0);
  const pagas=s.financeiro.receitas.filter(x=>x.status==='pago').reduce((a,b)=>a+num(b.valor),0);
  const osTotal=s.agenda.length;
  const osEntregues=s.agenda.filter(x=>String(x.status).toLowerCase().includes('entreg')).length;
  const atrasadas=s.agenda.filter(x=>x.entregaPrevista && x.status!=='entregue' && x.entregaPrevista<hoje()).length;
  const ticket=osEntregues?pagas/osEntregues:0;
  const margem=receitas?((receitas-despesas)/receitas*100):0;
  const resumo={data:new Date().toISOString(),receitas,despesas,resultado:receitas-despesas,receitasPagas:pagas,osTotal,osEntregues,atrasadas,ticketMedio:ticket,margem};
  s.relatorios=s.relatorios||{resumos:[]}; s.relatorios.ultimoResumo=resumo; s.relatorios.resumos=s.relatorios.resumos||[]; s.relatorios.resumos.push(resumo);
  s.metas=s.metas||{}; s.metas.realizado={faturamento:receitas,margem,osEntregues,ticketMedio:ticket,atrasos:atrasadas};
  s.ia=s.ia||{historico:[],contexto:[]}; s.ia.contexto=[{tipo:'resumo_operacional',dados:resumo,atualizadoEm:new Date().toISOString()}];
}
function clienteFinanceiro(clienteId){
  const s=loadState();
  const tx=s.financeiro.lancamentos.filter(t=>t.clienteId===clienteId);
  return {total:tx.reduce((a,b)=>a+num(b.valor),0),pendente:tx.filter(t=>t.status!=='pago').reduce((a,b)=>a+num(b.valor),0),pagamentos:tx.filter(t=>t.status==='pago')};
}
function painelResumo(){
  const s=loadState(); gerarResumoRelatorio(s); saveState(s);
  const r=s.relatorios.ultimoResumo;
  alert('STATE OficinaOS\\nClientes: '+s.clientes.length+'\\nVeículos: '+s.veiculos.length+'\\nOrçamentos: '+s.orcamentos.length+'\\nOS: '+s.agenda.length+'\\nReceitas: '+moeda(r.receitas)+'\\nDespesas: '+moeda(r.despesas)+'\\nResultado: '+moeda(r.resultado)+'\\nMargem: '+r.margem.toFixed(1)+'%');
}
function aviso(msg){
  const d=document.createElement('div');
  d.textContent='🔗 '+msg;
  d.style.cssText='position:fixed;left:12px;bottom:12px;z-index:9999;background:#fffaf4;border:1px solid #dcb990;border-radius:999px;padding:8px 12px;box-shadow:0 2px 10px #0002;font-weight:700';
  document.body.appendChild(d); setTimeout(()=>d.remove(),4200);
}
function injectBridge(){
  if(document.getElementById('oficinaosBridge'))return;
  const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const bar=document.createElement('div'); bar.id='oficinaosBridge';
  bar.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99999;background:#fffaf4;border:1px solid #dcb990;border-radius:12px;padding:8px;display:flex;gap:6px;flex-wrap:wrap;box-shadow:0 2px 14px #0002;font:12px Arial';
  let html='<button onclick="OFICINAOS_STATE_LAYER.painelResumo()">🔗 STATE</button>';
  if(page.includes('cliente')) html+='<button onclick="OFICINAOS_STATE_LAYER.clienteParaOrcamento()">Cliente → Orçamento</button>';
  if(page.includes('orcamento')) html+='<button onclick="OFICINAOS_STATE_LAYER.aprovarOrcamento()">Aprovar → Financeiro + Agenda</button>';
  if(page.includes('agenda')) html+='<button onclick="OFICINAOS_STATE_LAYER.agendaEntregue()">Entregar → Financeiro</button><button onclick="OFICINAOS_STATE_LAYER.anexarFotoAgenda()">📷 Fotos → Cliente</button>';
  if(page.includes('relatorio')||page.includes('meta')||page.includes('ia')) html+='<button onclick="OFICINAOS_STATE_LAYER.painelResumo()">Dados reais</button>';
  html+='<button onclick="location.href=\\'index.html\\'">Painel</button>';
  bar.innerHTML=html;
  document.body.appendChild(bar);
}
function injectResumo(){
  const page=(location.pathname.split('/').pop()||'').toLowerCase();
  if(!(page.includes('relatorio')||page.includes('meta')||page.includes('ia')||page.includes('cliente')))return;
  if(document.getElementById('oficinaosResumoState'))return;
  const s=loadState(); gerarResumoRelatorio(s); saveState(s);
  const r=s.relatorios.ultimoResumo;
  const box=document.createElement('div');
  box.id='oficinaosResumoState';
  box.style.cssText='margin:10px;padding:10px;border:1px solid #dcb990;border-radius:8px;background:#fffaf4;font:12px Arial;color:#2b1a0e';
  box.innerHTML='<b>🔗 Dados reais do STATE OficinaOS</b><br>Receitas: '+moeda(r.receitas)+' · Despesas: '+moeda(r.despesas)+' · Resultado: '+moeda(r.resultado)+' · OS: '+r.osTotal+' · Entregues: '+r.osEntregues+' · Ticket médio: '+moeda(r.ticketMedio)+' · Margem: '+r.margem.toFixed(1)+'%';
  document.body.insertBefore(box,document.body.firstChild);
}
window.OFICINAOS_STATE_LAYER={loadState,saveState,clienteParaOrcamento,preencherOrcamento,aprovarOrcamento,agendaEntregue,anexarFotoAgenda,painelResumo,clienteFinanceiro,gerarResumoRelatorio};

document.addEventListener('DOMContentLoaded',()=>{
  const s=loadState(); gerarResumoRelatorio(s); saveState(s);
  injectBridge(); injectResumo();
  if(location.pathname.toLowerCase().includes('orcamento')) preencherOrcamento();
  document.addEventListener('click',e=>{
    const t=String((e.target&&(e.target.innerText||e.target.value||''))||'');
    if(location.pathname.toLowerCase().includes('orcamento') && /aprovar.*financeiro|enviar.*financeiro/i.test(t)){
      setTimeout(aprovarOrcamento,180);
    }
  },true);
});
})();

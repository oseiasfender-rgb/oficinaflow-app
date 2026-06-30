
(function(){
'use strict';

const VERSION='V547.30 RESPONSIVIDADE';
const DB_NAME='OficinaOS_V547_DB';
const DB_VERSION=4;
const STORES=['clientes','veiculos','orcamentos','agenda','lancamentos','contas','metas','ia','meta','configuracoes','auditoria','preferencias','fotosOS'];

const n=v=>{
  if(v==null||v==='')return 0;
  let s=String(v).replace(/R\$/g,'').replace(/\s/g,'').trim();
  if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');
  else s=s.replace(',','.');
  const x=Number(s);
  return Number.isFinite(x)?x:0;
};
const money=v=>n(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const arr=x=>Array.isArray(x)?x:[];
const today=()=>new Date().toISOString().slice(0,10);
const month=()=>today().slice(0,7);
const paid=v=>{
  if(typeof v==='boolean')return v;
  return ['pago','paga','paid','true','sim','recebido','quitado'].includes(String(v||'').toLowerCase());
};

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=e=>{
      const db=e.target.result;
      STORES.forEach(name=>{
        if(!db.objectStoreNames.contains(name)){
          if(name==='meta'||name==='metas'||name==='ia') db.createObjectStore(name,{keyPath:'id'});
          else db.createObjectStore(name,{keyPath:'id'});
        }
      });
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function clearDB(){
  const db=await openDB();
  await Promise.all(STORES.map(store=>new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readwrite');
    tx.objectStore(store).clear();
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error);
  })));
  localStorage.setItem('OFICINAOS_V547_STORAGE','IndexedDB');
}
async function putMany(store,items){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readwrite');
    const os=tx.objectStore(store);
    arr(items).forEach(item=>os.put(item));
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error);
  });
}
async function getAll(store){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readonly');
    const req=tx.objectStore(store).getAll();
    req.onsuccess=()=>resolve(req.result||[]);
    req.onerror=()=>reject(req.error);
  });
}
async function getOne(store,id){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readonly');
    const req=tx.objectStore(store).get(id);
    req.onsuccess=()=>resolve(req.result||null);
    req.onerror=()=>reject(req.error);
  });
}
async function setOne(store,obj){
  return putMany(store,[obj]);
}

function normalizeLegacy(raw){
  raw=raw||{};
  const clientes=[],veiculos=[],lancamentos=[],contas=[],agenda=[],orcamentos=[];
  arr(raw.clientes).forEach((c,i)=>{
    const cid=String(c.id||c.clienteId||'cli_'+(i+1));
    const tel=String(c.fone||c.telefone||c.whatsapp||'').trim();
    const cliente={
      id:cid,nome:String(c.nome||c.cliente||c.name||'').trim(),
      tel,telefone:tel,whatsapp:String(c.whatsapp||tel).trim(),
      email:String(c.email||'').trim(),
      cpf:String(c.doc||c.cpf||c.cpfCnpj||c.cnpj||'').trim(),
      cpfCnpj:String(c.doc||c.cpf||c.cpfCnpj||c.cnpj||'').trim(),
      status:String(c.status||'Ativo'),
      obs:String(c.obs||c.observacoes||''),
      historico:arr(c.servicos||c.historico),
      criadoEm:String(c.criado||raw.exportedAt||today()).slice(0,10)
    };
    arr(c.veiculos).forEach((v,j)=>{
      veiculos.push({
        id:String(v.id||'vei_'+i+'_'+j),clienteId:cid,
        placa:String(v.placa||'').toUpperCase().trim(),
        marca:String(v.marca||'').trim(),
        modelo:String(v.modelo||v.veiculo||v.marca||'').trim(),
        ano:String(v.ano||'').trim(),
        cor:String(v.cor||'').trim(),
        observacoes:String(v.obs||v.observacoes||'')
      });
    });
    if(cliente.nome)clientes.push(cliente);
  });

  arr(raw.ALL_TX).forEach((t,i)=>{
    const tipo=String(t.type||t.tipo||'').toLowerCase()==='dep'?'despesa':'receita';
    const dt=String(t.date||t.data||t.vencimento||today()).slice(0,10);
    const ok=paid(t.paid||t.status);
    lancamentos.push({
      id:String(t.id||'tx_'+i),legacyId:String(t.id||''),
      tipo,type:tipo==='despesa'?'dep':'rec',
      descricao:String(t.desc||t.descricao||'Lançamento').trim(),
      valor:n(('val' in t)?t.val:t.valor),
      categoria:String(t.cat||t.categoria||'Geral').trim(),
      data:dt,vencimento:dt,competencia:dt.slice(0,7),
      status:ok?'pago':'pendente',paid:ok?'Pago':'Não pago',
      pagto:String(t.pagto||''),orcamentoId:String(t.orcId||t.orcamentoId||''),
      origem:'ALL_TX'
    });
  });

  arr(raw.contas).forEach((c,i)=>{
    const ok=paid(c.paid),due=String(c.due||c.vencimento||c.date||today()).slice(0,10),comp=String(c.competencia||due.slice(0,7));
    const conta={
      id:String(c.id||'ct_'+i),nome:String(c.name||c.desc||c.descricao||'Conta').trim(),
      descricao:String(c.name||c.desc||c.descricao||'Conta').trim(),
      categoria:String(c.cat||c.categoria||'Geral').trim(),
      valor:n(('val'in c)?c.val:c.valor),competencia:comp,vencimento:due,due,
      status:ok?'pago':'pendente',paid:ok,paidAt:String(c.paidAt||'').slice(0,10),
      recorrente:!!c.recur,recurKey:String(c.recurKey||''),fromTx:String(c.fromTx||''),
      paidTxId:String(c.paidTxId||''),origem:'contas'
    };
    contas.push(conta);
    if(!conta.fromTx && conta.valor){
      lancamentos.push({
        id:'conta_'+conta.id,legacyId:conta.id,tipo:'despesa',type:'dep',
        descricao:conta.descricao,valor:conta.valor,categoria:conta.categoria,
        data:conta.paidAt||conta.vencimento,vencimento:conta.vencimento,competencia:conta.competencia,
        status:conta.status,paid:conta.paid?'Pago':'Não pago',
        contaId:conta.id,recorrente:conta.recorrente,recurKey:conta.recurKey,origem:'contas'
      });
    }
  });

  arr(raw.jobs).forEach((j,i)=>{
    const done=!!j.done;
    agenda.push({
      id:String(j.id||'os_'+i),cliente:String(j.cliente||'').trim(),
      veiculo:String(j.veiculo||'').trim(),servico:String(j.tipo||j.servico||'').trim(),
      tipo:'OS',obs:String(j.obs||''),entrada:String(j.entrada||j.date||today()).slice(0,10),
      entrega:String(j.entrega||'').slice(0,10),valor:n(('val'in j)?j.val:j.valor),
      etapa:done?'Entregue':'Entrada',status:done?'Entregue':'Agendado',
      done,fotos:j.fotos||{},timeline:arr(j.timeline),origem:'jobs'
    });
  });

  arr(raw.orcamentos).forEach((o,i)=>orcamentos.push({...o,id:String(o.id||o.numero||'orc_'+i)}));

  const metas=[{
    id:'main',
    faturamento:n(raw.metaPrincipal),
    metaPrincipal:n(raw.metaPrincipal),
    categorias:arr(raw.metasCat),
    dasSituação:raw.dasSituação||{},
    origem:'legacy'
  }];

  return {
    clientes,veiculos,orcamentos,agenda,lancamentos,contas,metas,
    meta:{id:'meta',version:VERSION,sourceVersion:raw.version||'',sourceExportedAt:raw.exportedAt||'',importedAt:new Date().toISOString(),counts:{clientes:clientes.length,veiculos:veiculos.length,orcamentos:orcamentos.length,agenda:agenda.length,lancamentos:lancamentos.length,contas:contas.length}}
  };
}

async function importBackup(raw){
  const data=normalizeLegacy(raw);
  await clearDB();
  await putMany('clientes',data.clientes);
  await putMany('veiculos',data.veiculos);
  await putMany('orcamentos',data.orcamentos);
  await putMany('agenda',data.agenda);
  await putMany('lancamentos',data.lancamentos);
  await putMany('contas',data.contas);
  await putMany('metas',data.metas);
  await putMany('ia',[{id:'main',history:[],memory:[]}]);
  await putMany('meta',[data.meta]);
  localStorage.setItem('OFICINAOS_V547_STORAGE','IndexedDB');
  localStorage.setItem('OFICINAOS_V547_VERSION',VERSION);
  localStorage.setItem('OFICINAOS_V547_COUNTS',JSON.stringify(data.meta.counts));
  return data.meta.counts;
}

async function load(){
  const [clientes,veiculos,orcamentos,agenda,lancamentos,contas,metas,ia,meta]=await Promise.all([
    getAll('clientes'),getAll('veiculos'),getAll('orcamentos'),getAll('agenda'),getAll('lancamentos'),getAll('contas'),getAll('metas'),getAll('ia'),getAll('meta')
  ]);
  return {version:VERSION,clientes,veiculos,orcamentos,agenda:{os:agenda},financeiro:{lancamentos,contas,metaReceita:n((metas[0]||{}).faturamento)},metas:metas[0]||{},ia:ia[0]||{},meta:meta[0]||{}};
}

function comp(x){return String(x.competencia||x.vencimento||x.due||x.data||'').slice(0,7)}
function dm(x){return String(x.data||x.paidAt||x.vencimento||'').slice(0,7)}
function isPago(x){return String(x.status||x.paid||'').toLowerCase()==='pago'||x.paid===true}
function isRec(x){return String(x.tipo||x.type||'').toLowerCase().includes('rece')||String(x.type).toLowerCase()==='rec'}
function isDep(x){return String(x.tipo||x.type||'').toLowerCase().includes('desp')||String(x.type).toLowerCase()==='dep'}
const fixedCats=['aluguel','barracão','energia','água','saecil','internet','telefone','assinatura','das','contador','sistema','software','seguro','iptu'];
const fixedDesc=['barracão','neoenergia','saecil','claro','internet','das mei','chatgpt','claude','manus','google one','sicoob'];
const variableExcl=['materiais','material','tintas','lixas','massas','ferramentas','peças','restaurante','alimentação','mercado','gasolina','transporte','funcionários','mão de obra'];
function isFixed(x){
  const c=String(x.categoria||x.cat||'').toLowerCase(),d=String(x.descricao||x.nome||x.name||'').toLowerCase();
  if(x.fixo||x.recorrente||x.recur||x.recurKey)return true;
  if(variableExcl.some(k=>c.includes(k)))return false;
  if(fixedCats.some(k=>c.includes(k)))return true;
  if(fixedDesc.some(k=>d.includes(k)))return true;
  return false;
}
async function fixedExpenses(m){
  const s=await load(), tx=arr(s.financeiro.lancamentos), contas=arr(s.financeiro.contas), fromTx=new Set(contas.map(c=>String(c.fromTx||'')).filter(Boolean)),items=[];
  contas.forEach(c=>{if(comp(c)===m&&isFixed(c))items.push({id:c.id,origem:'contas',descricao:c.descricao||c.nome,categoria:c.categoria,status:isPago(c)?'pago':'pendente',valor:n(c.valor)});});
  tx.forEach(t=>{if(comp(t)===m&&isDep(t)&&isFixed(t)&&!fromTx.has(String(t.legacyId||t.id)))items.push({id:t.id,origem:t.origem||'financeiro',descricao:t.descricao,categoria:t.categoria,status:isPago(t)?'pago':'pendente',valor:n(t.valor)});});
  return {mes:m,total:items.reduce((a,b)=>a+n(b.valor),0),pago:items.filter(x=>x.status==='pago').reduce((a,b)=>a+n(b.valor),0),pendente:items.filter(x=>x.status!=='pago').reduce((a,b)=>a+n(b.valor),0),items};
}
async function financials(m){
  const s=await load(), tx=arr(s.financeiro.lancamentos), contas=arr(s.financeiro.contas), fx=await fixedExpenses(m);
  const recC=tx.filter(x=>isRec(x)&&isPago(x)&&dm(x)===m).reduce((a,b)=>a+n(b.valor),0);
  const depC=tx.filter(x=>isDep(x)&&isPago(x)&&dm(x)===m).reduce((a,b)=>a+n(b.valor),0);
  const recComp=tx.filter(x=>isRec(x)&&comp(x)===m).reduce((a,b)=>a+n(b.valor),0);
  const depComp=tx.filter(x=>isDep(x)&&comp(x)===m).reduce((a,b)=>a+n(b.valor),0);
  const recPend=tx.filter(x=>isRec(x)&&!isPago(x)&&comp(x)===m).reduce((a,b)=>a+n(b.valor),0);
  const depPend=tx.filter(x=>isDep(x)&&!isPago(x)&&comp(x)===m).reduce((a,b)=>a+n(b.valor),0);
  const contasPend=contas.filter(x=>!isPago(x)&&comp(x)===m).reduce((a,b)=>a+n(b.valor),0);
  const osEnt=arr(s.agenda.os).filter(o=>/entreg/i.test(o.status||'')&&String(o.entrega||o.entrada).slice(0,7)===m).length;
  return {mes:m,receitaCaixa:recC,despesaCaixa:depC,saldoCaixa:recC-depC,receitaCompetencia:recComp,despesaCompetencia:depComp,resultadoCompetencia:recComp-depComp,receitaPendente:recPend,despesaPendente:depPend,contasPendentes:contasPend,pontoEquilibrio:fx.total,despesasFixasPagas:fx.pago,despesasFixasPendentes:fx.pendente,despesasFixasItens:fx.items,margem:recC>0?((recC-depC)/recC)*100:0,osEntregues:osEnt,ticketMedio:osEnt?recC/osEnt:0,meta:n(s.financeiro.metaReceita||s.metas.faturamento)};
}
async function months(){
  const s=await load();
  return [...new Set(arr(s.financeiro.lancamentos).map(comp).concat(arr(s.financeiro.contas).map(comp)).filter(Boolean))].sort();
}
async function exportBackup(){
  const s=await load();
  return {version:VERSION,exportedAt:new Date().toISOString(),...s};
}
function download(name,data,type='application/json'){
  const a=document.createElement('a'),b=new Blob([data],{type});
  a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
async function wire(){
  const backup=document.getElementById('v547Backup'),imp=document.getElementById('v547Import');
  if(backup) backup.onclick=async()=>download('oficinaos-v547-backup-'+today()+'.json',JSON.stringify(await exportBackup(),null,2));
  if(imp) imp.onchange=e=>{
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();
    r.onload=async ev=>{
      try{
        const counts=await importBackup(JSON.parse(ev.target.result));
        alert('Backup importado no IndexedDB: '+counts.clientes+' clientes, '+counts.lancamentos+' lançamentos, '+counts.contas+' contas, '+counts.agenda+' OS.');
        location.reload();
      }catch(err){alert('Erro ao importar: '+err.message);}
    };
    r.readAsText(f);
  };
}
window.OficinaOS={VERSION,openDB,clearDB,putMany,getAll,getOne,setOne,normalizeLegacy,importBackup,load,financials,fixedExpenses,months,exportBackup,download,money,n};
document.addEventListener('DOMContentLoaded',wire);
})();


// V547.30 RESPONSIVIDADEmodule CRUD helpers
(function(){
if(!window.OficinaOS)return;
const OS=window.OficinaOS;
const uid=p=>p+'_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
OS.uid=uid;
OS.saveCliente=async c=>{c=c||{};c.id=c.id||uid('cli');c.nome=(c.nome||'').trim();if(!c.nome)throw new Error('Nome obrigatório');await OS.putMany('clientes',[c]);return c;};
OS.saveVeiculo=async v=>{v=v||{};v.id=v.id||uid('vei');if(!v.clienteId)throw new Error('Cliente obrigatório');await OS.putMany('veiculos',[v]);return v;};
OS.saveOS=async o=>{o=o||{};o.id=o.id||uid('os');o.status=o.status||'Agendado';o.etapa=o.etapa||'Entrada';await OS.putMany('agenda',[o]);return o;};
OS.saveLancamento=async l=>{l=l||{};l.id=l.id||uid('lan');l.tipo=l.tipo||'receita';l.status=l.status||'pendente';l.data=l.data||new Date().toISOString().slice(0,10);l.vencimento=l.vencimento||l.data;l.competencia=l.competencia||String(l.vencimento||l.data).slice(0,7);l.valor=OS.n(l.valor);await OS.putMany('lancamentos',[l]);return l;};
OS.saveConta=async c=>{c=c||{};c.id=c.id||uid('ct');c.status=c.status||'pendente';c.vencimento=c.vencimento||new Date().toISOString().slice(0,10);c.competencia=c.competencia||String(c.vencimento).slice(0,7);c.valor=OS.n(c.valor);await OS.putMany('contas',[c]);return c;};
OS.saveMeta=async m=>{m=m||{};m.id='main';m.faturamento=OS.n(m.faturamento);await OS.setOne('metas',m);return m;};
})();


// V547.30 RESPONSIVIDADE— Competência Real Engine
(function(){
if(!window.OficinaOS)return;
const OS=window.OficinaOS;
const arr=x=>Array.isArray(x)?x:[];
const n=OS.n;
function mes(v){return String(v||'').slice(0,7);}
function isPago(x){return String(x.status||x.paid||'').toLowerCase()==='pago'||x.paid===true;}
function isRec(x){return String(x.tipo||x.type||'').toLowerCase().includes('rece')||String(x.type).toLowerCase()==='rec';}
function isDep(x){return String(x.tipo||x.type||'').toLowerCase().includes('desp')||String(x.type).toLowerCase()==='dep';}
function dataCaixa(x){return String(x.dataPagamento||x.paidAt||x.data||x.vencimento||'').slice(0,10);}
function competencia(x){return mes(x.competencia||x.vencimento||x.due||x.data||x.paidAt);}

const oldFinancials=OS.financials;

OS.caixaResumo=async function(m){
  const s=await OS.load();
  const tx=arr(s.financeiro&&s.financeiro.lancamentos);
  const receitaCaixa=tx.filter(x=>isRec(x)&&isPago(x)&&mes(dataCaixa(x))===m).reduce((a,b)=>a+n(b.valor),0);
  const despesaCaixa=tx.filter(x=>isDep(x)&&isPago(x)&&mes(dataCaixa(x))===m).reduce((a,b)=>a+n(b.valor),0);
  return {mes:m,receitaCaixa,despesaCaixa,saldoCaixa:receitaCaixa-despesaCaixa};
};

OS.competenciaResumo=async function(m){
  const s=await OS.load();
  const tx=arr(s.financeiro&&s.financeiro.lancamentos);
  const contas=arr(s.financeiro&&s.financeiro.contas);

  const receitasCompetencia=tx.filter(x=>isRec(x)&&competencia(x)===m).reduce((a,b)=>a+n(b.valor),0);
  const despesasCompetencia=tx.filter(x=>isDep(x)&&competencia(x)===m).reduce((a,b)=>a+n(b.valor),0);

  const receitasPagasCompetencia=tx.filter(x=>isRec(x)&&competencia(x)===m&&isPago(x)).reduce((a,b)=>a+n(b.valor),0);
  const receitasPendentesCompetencia=tx.filter(x=>isRec(x)&&competencia(x)===m&&!isPago(x)).reduce((a,b)=>a+n(b.valor),0);
  const despesasPagasCompetencia=tx.filter(x=>isDep(x)&&competencia(x)===m&&isPago(x)).reduce((a,b)=>a+n(b.valor),0);
  const despesasPendentesCompetencia=tx.filter(x=>isDep(x)&&competencia(x)===m&&!isPago(x)).reduce((a,b)=>a+n(b.valor),0);

  const contasCompetencia=contas.filter(x=>competencia(x)===m);
  const contasTotal=contasCompetencia.reduce((a,b)=>a+n(b.valor),0);
  const contasPagas=contasCompetencia.filter(isPago).reduce((a,b)=>a+n(b.valor),0);
  const contasPendentes=contasCompetencia.filter(x=>!isPago(x)).reduce((a,b)=>a+n(b.valor),0);

  const resultadoCompetencia=receitasCompetencia-despesasCompetencia;
  const margemCompetencia=receitasCompetencia>0?(resultadoCompetencia/receitasCompetencia)*100:0;
  return {mes:m,receitasCompetencia,despesasCompetencia,resultadoCompetencia,margemCompetencia,receitasPagasCompetencia,receitasPendentesCompetencia,despesasPagasCompetencia,despesasPendentesCompetencia,contasTotal,contasPagas,contasPendentes,contasQuantidade:contasCompetencia.length};
};

OS.financials=async function(m){
  const base=oldFinancials?await oldFinancials(m):{};
  const cx=await OS.caixaResumo(m);
  const cp=await OS.competenciaResumo(m);
  const fx=OS.fixedExpenses?await OS.fixedExpenses(m):{total:0,pago:0,pendente:0,items:[]};
  const s=await OS.load();
  const osEntregues=arr(s.agenda&&s.agenda.os).filter(o=>/entreg/i.test(o.status||'')&&mes(o.entrega||o.entrada)===m).length;
  return {...base,...cx,receitaCompetencia:cp.receitasCompetencia,despesaCompetencia:cp.despesasCompetencia,resultadoCompetencia:cp.resultadoCompetencia,margemCompetencia:cp.margemCompetencia,receitaPendente:cp.receitasPendentesCompetencia,despesaPendente:cp.despesasPendentesCompetencia,contasTotal:cp.contasTotal,contasPagas:cp.contasPagas,contasPendentes:cp.contasPendentes,contasQuantidade:cp.contasQuantidade,pontoEquilibrio:fx.total,despesasFixasPagas:fx.pago,despesasFixasPendentes:fx.pendente,despesasFixasItens:fx.items,osEntregues,ticketMedio:osEntregues?cx.receitaCaixa/osEntregues:0,margem:cx.receitaCaixa>0?(cx.saldoCaixa/cx.receitaCaixa)*100:0};
};

OS.saveLancamento=async function(l){
  l=l||{};
  l.id=l.id||OS.uid('lan');
  l.tipo=l.tipo||'receita';
  l.status=l.status||'pendente';
  l.data=l.data||new Date().toISOString().slice(0,10);
  l.vencimento=l.vencimento||l.data;
  l.competencia=l.competencia||String(l.vencimento||l.data).slice(0,7);
  l.valor=OS.n(l.valor);
  await OS.putMany('lancamentos',[l]);
  return l;
};
})();


// V547.30 RESPONSIVIDADE— Motor de Contas Real
(function(){
if(!window.OficinaOS)return;
const OS=window.OficinaOS;
const arr=x=>Array.isArray(x)?x:[];
const n=OS.n;
function hoje(){return new Date().toISOString().slice(0,10)}
function mes(v){return String(v||'').slice(0,7)}
function isPago(x){return String(x.status||x.paid||'').toLowerCase()==='pago'||x.paid===true}
function comp(x){return mes(x.competencia||x.vencimento||x.due||x.data||x.paidAt)}
function venc(x){return String(x.vencimento||x.due||x.data||'').slice(0,10)}

OS.contasResumo=async function(m){
  const s=await OS.load();
  const contas=arr(s.financeiro&&s.financeiro.contas);
  const list=contas.filter(c=>comp(c)===m);
  const pagas=list.filter(isPago);
  const pendentes=list.filter(c=>!isPago(c));
  const vencidas=pendentes.filter(c=>venc(c) && venc(c)<hoje());
  const futuras=pendentes.filter(c=>venc(c) && venc(c)>=hoje());
  const recorrentes=list.filter(c=>c.recorrente||c.recurKey);
  return {
    mes:m,
    total:list.reduce((a,b)=>a+n(b.valor),0),
    pagas:pagas.reduce((a,b)=>a+n(b.valor),0),
    pendentes:pendentes.reduce((a,b)=>a+n(b.valor),0),
    vencidas:vencidas.reduce((a,b)=>a+n(b.valor),0),
    futuras:futuras.reduce((a,b)=>a+n(b.valor),0),
    qtdTotal:list.length,
    qtdPagas:pagas.length,
    qtdPendentes:pendentes.length,
    qtdVencidas:vencidas.length,
    qtdFuturas:futuras.length,
    qtdRecorrentes:recorrentes.length,
    lista:list
  };
};

OS.pagarConta=async function(id, dataPagamento){
  const contas=await OS.getAll('contas');
  const conta=contas.find(c=>String(c.id)===String(id));
  if(!conta)throw new Error('Conta não encontrada');
  conta.status='pago';
  conta.paid=true;
  conta.paidAt=dataPagamento||hoje();
  await OS.putMany('contas',[conta]);

  const lancamentos=await OS.getAll('lancamentos');
  const exists=lancamentos.some(l=>String(l.contaId||'')===String(conta.id)||String(l.legacyId||'')===String(conta.id));
  if(!exists){
    await OS.saveLancamento({
      tipo:'despesa',
      descricao:conta.descricao||conta.nome,
      valor:conta.valor,
      data:conta.paidAt,
      vencimento:conta.vencimento||conta.due,
      competencia:conta.competencia||mes(conta.vencimento||conta.due),
      status:'pago',
      categoria:conta.categoria||'Geral',
      contaId:conta.id,
      recorrente:!!conta.recorrente,
      recurKey:conta.recurKey||'',
      origem:'contas'
    });
  }
  return conta;
};

OS.desfazerPagamentoConta=async function(id){
  const contas=await OS.getAll('contas');
  const conta=contas.find(c=>String(c.id)===String(id));
  if(!conta)throw new Error('Conta não encontrada');
  conta.status='pendente';
  conta.paid=false;
  conta.paidAt='';
  await OS.putMany('contas',[conta]);

  const lancamentos=await OS.getAll('lancamentos');
  const keep=lancamentos.filter(l=>String(l.contaId||'')!==String(id));
  await OS.clearStore('lancamentos');
  await OS.putMany('lancamentos',keep);
  return conta;
};

OS.clearStore=async function(store){
  const db=await OS.openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readwrite');
    tx.objectStore(store).clear();
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error);
  });
};

OS.gerarRecorrenteProximoMes=async function(conta){
  conta=conta||{};
  const base=String(conta.vencimento||conta.due||hoje());
  const d=new Date(base+'T00:00:00');
  d.setMonth(d.getMonth()+1);
  const vencimento=d.toISOString().slice(0,10);
  const nova={
    id:'ct_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),
    nome:conta.nome||conta.descricao,
    descricao:conta.descricao||conta.nome,
    categoria:conta.categoria||'Geral',
    valor:n(conta.valor),
    vencimento,
    due:vencimento,
    competencia:vencimento.slice(0,7),
    status:'pendente',
    paid:false,
    paidAt:'',
    recorrente:true,
    recurKey:conta.recurKey||('rec_'+(conta.descricao||conta.nome||'conta').toLowerCase().replace(/\W+/g,'_')),
    origem:'recorrente'
  };
  await OS.putMany('contas',[nova]);
  return nova;
};

const oldFinancials=OS.financials;
OS.financials=async function(m){
  const f=oldFinancials?await oldFinancials(m):{};
  const c=await OS.contasResumo(m);
  return {
    ...f,
    contasTotal:c.total,
    contasPagas:c.pagas,
    contasPendentes:c.pendentes,
    contasVencidas:c.vencidas,
    contasFuturas:c.futuras,
    qtdContas:c.qtdTotal,
    qtdContasPagas:c.qtdPagas,
    qtdContasPendentes:c.qtdPendentes,
    qtdContasVencidas:c.qtdVencidas,
    qtdContasFuturas:c.qtdFuturas,
    qtdContasRecorrentes:c.qtdRecorrentes
  };
};
})();


// V547.30 RESPONSIVIDADE— Motor de Recorrentes Real
(function(){
if(!window.OficinaOS)return;
const OS=window.OficinaOS;
const arr=x=>Array.isArray(x)?x:[];
const n=OS.n;
function today(){return new Date().toISOString().slice(0,10)}
function ym(v){return String(v||'').slice(0,7)}
function addMonths(iso,months){
  const d=new Date((iso||today())+'T00:00:00');
  const day=d.getDate();
  d.setMonth(d.getMonth()+months);
  if(d.getDate()<day)d.setDate(0);
  return d.toISOString().slice(0,10);
}
function recurKey(c){
  return String(c.recurKey||c.recorrenciaId||('rec_'+String(c.descricao||c.nome||'conta').toLowerCase().replace(/\W+/g,'_')+'_'+n(c.valor)));
}
function isRecorrente(c){return !!(c.recorrente||c.recur||c.recurKey||c.recorrenciaId)}

OS.recorrentesResumo=async function(){
  const contas=await OS.getAll('contas');
  const rec=contas.filter(isRecorrente);
  const grupos={};
  rec.forEach(c=>{
    const k=recurKey(c);
    if(!grupos[k])grupos[k]=[];
    grupos[k].push(c);
  });
  Object.values(grupos).forEach(g=>g.sort((a,b)=>String(a.competencia||a.vencimento).localeCompare(String(b.competencia||b.vencimento))));
  return {
    totalGrupos:Object.keys(grupos).length,
    totalContas:rec.length,
    grupos
  };
};

OS.gerarRecorrentesAte=async function(mesFinal){
  const contas=await OS.getAll('contas');
  const rec=contas.filter(isRecorrente);
  const porGrupo={};
  rec.forEach(c=>{
    const k=recurKey(c);
    if(!porGrupo[k])porGrupo[k]=[];
    porGrupo[k].push(c);
  });
  const existentes=new Set(contas.map(c=>recurKey(c)+'|'+String(c.competencia||ym(c.vencimento||c.due))));
  const novas=[];
  Object.entries(porGrupo).forEach(([k,grupo])=>{
    grupo.sort((a,b)=>String(a.competencia||a.vencimento).localeCompare(String(b.competencia||b.vencimento)));
    let base=grupo[grupo.length-1];
    let venc=String(base.vencimento||base.due||today()).slice(0,10);
    let next=addMonths(venc,1);
    while(ym(next)<=mesFinal){
      const comp=ym(next);
      const unique=k+'|'+comp;
      if(!existentes.has(unique)){
        const nova={
          id:'ct_'+Date.now().toString(36)+Math.random().toString(36).slice(2,8),
          nome:base.nome||base.descricao,
          descricao:base.descricao||base.nome,
          categoria:base.categoria||'Geral',
          valor:n(base.valor),
          competencia:comp,
          vencimento:next,
          due:next,
          status:'pendente',
          paid:false,
          paidAt:'',
          recorrente:true,
          recurKey:k,
          origem:'recorrente'
        };
        novas.push(nova);
        existentes.add(unique);
      }
      next=addMonths(next,1);
    }
  });
  if(novas.length)await OS.putMany('contas',novas);
  return novas;
};

OS.criarRecorrenteManual=async function(dados){
  dados=dados||{};
  const venc=String(dados.vencimento||today()).slice(0,10);
  const key='rec_'+String(dados.descricao||dados.nome||'conta').toLowerCase().replace(/\W+/g,'_')+'_'+n(dados.valor);
  const conta={
    id:'ct_'+Date.now().toString(36)+Math.random().toString(36).slice(2,8),
    nome:dados.nome||dados.descricao,
    descricao:dados.descricao||dados.nome,
    categoria:dados.categoria||'Geral',
    valor:n(dados.valor),
    competencia:ym(venc),
    vencimento:venc,
    due:venc,
    status:'pendente',
    paid:false,
    paidAt:'',
    recorrente:true,
    recurKey:key,
    origem:'recorrente'
  };
  await OS.putMany('contas',[conta]);
  return conta;
};

OS.excluirRecorrenciaFutura=async function(recurKeyValue, apartirMes){
  const contas=await OS.getAll('contas');
  const manter=contas.filter(c=>!(recurKey(c)===recurKeyValue && ym(c.competencia||c.vencimento)>=apartirMes && String(c.status)!=='pago'));
  await OS.clearStore('contas');
  await OS.putMany('contas',manter);
  return {removidas:contas.length-manter.length};
};

const oldContasResumo=OS.contasResumo;
OS.contasResumo=async function(m){
  const base=oldContasResumo?await oldContasResumo(m):{};
  const contas=await OS.getAll('contas');
  const recMes=contas.filter(c=>isRecorrente(c)&&ym(c.competencia||c.vencimento)===m);
  return {...base,qtdRecorrentes:recMes.length,recorrentesValor:recMes.reduce((a,b)=>a+n(b.valor),0)};
};
})();


// V547.30 RESPONSIVIDADEs Financeiros Real
(function(){
if(!window.OficinaOS)return;
const OS=window.OficinaOS;
const old=OS.financials;
OS.financials=async function(m){
  const f=await old(m);
  const pe = Math.max(3000, Number(f.pontoEquilibrio||0));
  const faturamento = Number(f.receitaCaixa||0);
  const lucro = Number(f.saldoCaixa||0);

  f.kpi={
    faturamento,
    lucro,
    margem:faturamento>0?(lucro/faturamento)*100:0,
    ticket:f.ticketMedio||0,
    pe,
    pePercent:pe>0?(faturamento/pe)*100:0,
    os:f.osEntregues||0,
    receber:f.receitaPendente||0,
    pagar:f.despesaPendente||0
  };
  return f;
};
})();


// V547.30 RESPONSIVIDADE— Auditoria Operacional
(function(){
if(!window.OficinaOS)return;
const OS=window.OficinaOS;
const uid=p=>p+'_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
function now(){return new Date().toISOString();}
OS.registrarAuditoria=async function(evento, modulo, detalhes){
  const item={
    id:uid('aud'),
    data:now(),
    modulo:modulo||'Sistema',
    evento:evento||'Evento',
    detalhes:detalhes||'',
    origem:'OficinaOS'
  };
  await OS.putMany('auditoria',[item]);
  return item;
};
OS.listarAuditoria=async function(limite){
  const logs=await OS.getAll('auditoria');
  return logs.sort((a,b)=>String(b.data).localeCompare(String(a.data))).slice(0, limite||300);
};
OS.salvarConfiguracoes=async function(cfg){
  cfg=cfg||{};
  cfg.id='main';
  cfg.updatedAt=now();
  await OS.putMany('configuracoes',[cfg]);
  await OS.registrarAuditoria('Configurações salvas','Configurações','Dados da empresa/sistema atualizados');
  return cfg;
};
OS.carregarConfiguracoes=async function(){
  const rows=await OS.getAll('configuracoes');
  return rows[0]||{
    id:'main',
    empresa:{nome:'LIMAPRATA Reparações Automotivas',responsavel:'Oséias Moreira',cnpj:'55.254.863/0001-87'},
    contato:{telefone:'(19) 98612-7516',whatsapp:'(19) 98612-7516',email:''},
    endereco:{logradouro:'Av. Hermínio Ometto',numero:'576',cidade:'Leme',estado:'SP',cep:''},
    financeiro:{horaTecnica:55,proLabore:6000,pontoEquilibrio:3000,metaMensal:10000},
    documentos:{pix:'',rodape:'',assinatura:''},
    sistema:{tema:'claro',backupAutomatico:true}
  };
};

// Wrap key functions to audit important events.
function wrapAsync(name, evento, modulo){
  const original=OS[name];
  if(typeof original!=='function' || original._auditWrapped)return;
  const wrapped=async function(){
    const result=await original.apply(OS, arguments);
    try{await OS.registrarAuditoria(evento, modulo, JSON.stringify(arguments[0]||{}).slice(0,400));}catch(e){}
    return result;
  };
  wrapped._auditWrapped=true;
  OS[name]=wrapped;
}
wrapAsync('importBackup','Backup importado','Backup');
wrapAsync('saveCliente','Cliente salvo','Clientes');
wrapAsync('saveVeiculo','Veículo salvo','Clientes');
wrapAsync('saveOS','OS salva','Agenda');
wrapAsync('saveLancamento','Lançamento salvo','Financeiro');
wrapAsync('saveConta','Conta salva','Financeiro');
wrapAsync('pagarConta','Conta paga','Financeiro');
wrapAsync('desfazerPagamentoConta','Pagamento desfeito','Financeiro');
wrapAsync('criarRecorrenteManual','Recorrente criada','Financeiro');
wrapAsync('gerarRecorrentesAte','Recorrentes geradas','Financeiro');
})();


// V547.30 RESPONSIVIDADE— Central de Alertas
(function(){
if(!window.OficinaOS)return;
const OS=window.OficinaOS;
const arr=x=>Array.isArray(x)?x:[];
const n=OS.n;
function today(){return new Date().toISOString().slice(0,10)}
function addDays(days){const d=new Date(today()+'T00:00:00');d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)}
function mes(v){return String(v||'').slice(0,7)}
function venc(x){return String(x.vencimento||x.due||x.entrega||x.data||'').slice(0,10)}
function isPago(x){return String(x.status||x.paid||'').toLowerCase()==='pago'||x.paid===true}
function statusAlert(tipo,nivel,titulo,detalhe,valor,ref){
 return {id:'al_'+tipo+'_'+String(ref||titulo).replace(/\W+/g,'_'),tipo,nivel,titulo,detalhe:detalhe||'',valor:n(valor||0),ref:ref||'',data:today()};
}
OS.gerarAlertas=async function(){
 const s=await OS.load();
 const contas=arr(s.financeiro&&s.financeiro.contas);
 const agenda=arr(s.agenda&&s.agenda.os);
 const mesAtual=today().slice(0,7);
 const f=OS.financials?await OS.financials(mesAtual):{};
 const alerts=[];
 const hoje=today();
 const prox7=addDays(7);

 contas.filter(c=>!isPago(c)).forEach(c=>{
   const v=venc(c);
   if(v && v<hoje) alerts.push(statusAlert('conta','critico','Conta vencida',c.descricao||c.nome,c.valor,c.id));
   else if(v && v<=prox7) alerts.push(statusAlert('conta','aviso','Conta vencendo',c.descricao||c.nome,c.valor,c.id));
 });

 agenda.filter(o=>!/entreg/i.test(o.status||'')).forEach(o=>{
   const e=venc(o);
   if(e && e<hoje) alerts.push(statusAlert('agenda','critico','OS atrasada',(o.cliente||'')+' · '+(o.veiculo||'')+' · '+(o.servico||''),o.valor,o.id));
   else if(e && e<=prox7) alerts.push(statusAlert('agenda','aviso','OS próxima da entrega',(o.cliente||'')+' · '+(o.veiculo||''),o.valor,o.id));
 });

 const meta=n(s.financeiro&&s.financeiro.metaReceita || s.metas&&s.metas.faturamento);
 if(meta>0){
   const perc=(n(f.receitaCaixa)/meta)*100;
   if(perc<50) alerts.push(statusAlert('meta','aviso','Meta abaixo de 50%','Faturamento do mês ainda baixo',meta-n(f.receitaCaixa),'meta'));
   else if(perc>=90 && perc<100) alerts.push(statusAlert('meta','ok','Meta próxima','Faltam menos de 10% para bater a meta',meta-n(f.receitaCaixa),'meta'));
   else if(perc>=100) alerts.push(statusAlert('meta','ok','Meta batida','Meta mensal atingida',n(f.receitaCaixa)-meta,'meta'));
 }

 const pe=n(f.pontoEquilibrio);
 if(pe>0){
   const percPE=(n(f.receitaCaixa)/pe)*100;
   if(percPE<100) alerts.push(statusAlert('pe','aviso','Ponto de equilíbrio não atingido','Falta para cobrir o PE operacional',pe-n(f.receitaCaixa),'pe'));
   else alerts.push(statusAlert('pe','ok','Ponto de equilíbrio atingido','Receita cobre o PE operacional',n(f.receitaCaixa)-pe,'pe'));
 }

 return alerts.sort((a,b)=>{
   const rank={critico:0,aviso:1,ok:2};
   return (rank[a.nivel]??9)-(rank[b.nivel]??9);
 });
};
})();


// V547.30 RESPONSIVIDADE— Busca Global
(function(){
if(!window.OficinaOS)return;
const OS=window.OficinaOS;
const arr=x=>Array.isArray(x)?x:[];
function norm(v){
 return String(v||'').toLowerCase()
 .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .replace(/\s+/g,' ').trim();
}
function addResult(results,tipo,titulo,subtitulo,detalhe,valor,url,score){
 results.push({id:'busca_'+results.length,tipo,titulo,subtitulo:subtitulo||'',detalhe:detalhe||'',valor:OS.n(valor||0),url:url||'',score:score||1});
}
OS.buscaGlobal=async function(termo){
 termo=norm(termo);
 if(!termo)return [];
 const s=await OS.load();
 const results=[];

 arr(s.clientes).forEach(c=>{
   const txt=norm([c.nome,c.telefone,c.whatsapp,c.email,c.cpf,c.cpfCnpj,c.obs].join(' '));
   if(txt.includes(termo)) addResult(results,'Cliente',c.nome,c.telefone||c.whatsapp,c.email||c.cpfCnpj,0,'clientes.html',10);
 });

 arr(s.veiculos).forEach(v=>{
   const cli=arr(s.clientes).find(c=>String(c.id)===String(v.clienteId));
   const txt=norm([v.placa,v.modelo,v.marca,v.ano,v.cor,cli&&cli.nome].join(' '));
   if(txt.includes(termo)) addResult(results,'Veículo',(v.placa||'')+' '+(v.modelo||''),cli&&cli.nome,v.marca+' '+(v.ano||''),0,'clientes.html',9);
 });

 arr(s.agenda&&s.agenda.os).forEach(o=>{
   const txt=norm([o.cliente,o.veiculo,o.servico,o.status,o.entrada,o.entrega,o.obs].join(' '));
   if(txt.includes(termo)) addResult(results,'OS / Agenda',o.cliente||'OS',o.veiculo,o.servico+' · '+(o.status||''),o.valor,'agenda.html',8);
 });

 arr(s.orcamentos).forEach(o=>{
   const txt=norm([o.cliente,o.veiculo,o.servico,o.status,o.data,o.numero,o.id].join(' '));
   if(txt.includes(termo)) addResult(results,'Orçamento',o.cliente||'Orçamento',o.veiculo,o.servico+' · '+(o.status||''),o.valor,'orcamento.html',8);
 });

 arr(s.financeiro&&s.financeiro.lancamentos).forEach(l=>{
   const txt=norm([l.descricao,l.categoria,l.tipo,l.status,l.data,l.competencia,l.valor].join(' '));
   if(txt.includes(termo)) addResult(results,'Lançamento',l.descricao,l.tipo+' · '+l.status,l.categoria+' · '+(l.data||''),l.valor,'financeiro.html',7);
 });

 arr(s.financeiro&&s.financeiro.contas).forEach(c=>{
   const txt=norm([c.nome,c.descricao,c.categoria,c.status,c.vencimento,c.competencia,c.valor].join(' '));
   if(txt.includes(termo)) addResult(results,'Conta',c.descricao||c.nome,c.status,c.categoria+' · '+(c.vencimento||''),c.valor,'financeiro.html',7);
 });

 try{
   const cfg=await OS.carregarConfiguracoes();
   const txt=norm(JSON.stringify(cfg));
   if(txt.includes(termo)) addResult(results,'Configuração','Configurações da empresa',cfg.empresa&&cfg.empresa.nome,'Dados gerais do sistema',0,'configuracoes.html',5);
 }catch(e){}

 try{
   const logs=await OS.listarAuditoria(500);
   logs.forEach(a=>{
     const txt=norm([a.modulo,a.evento,a.detalhes,a.data].join(' '));
     if(txt.includes(termo)) addResult(results,'Auditoria',a.evento,a.modulo,new Date(a.data).toLocaleString('pt-BR'),0,'auditoria.html',4);
   });
 }catch(e){}

 return results.sort((a,b)=>b.score-a.score||a.tipo.localeCompare(b.tipo)).slice(0,300);
};
})();


// V547.30 RESPONSIVIDADE/V547.30 RESPONSIVIDADEreferências + Painel Operacional
(function(){
if(!window.OficinaOS)return;
const OS=window.OficinaOS, arr=x=>Array.isArray(x)?x:[], n=OS.n;
const hoje=()=>new Date().toISOString().slice(0,10);
const mes=v=>String(v||'').slice(0,7);
const entregue=o=>/entreg/i.test(String(o.status||''));
OS.carregarPreferencias=async()=>{const r=await OS.getAll('preferencias');return r[0]||{id:'main',tema:'claro',densidade:'normal',dashboardInicial:'dashboard',abrirUltimaAba:true,backupAutomatico:true,mostrarAlertas:true,mostrarKPIs:true,mostrarResumoFinanceiro:true,mostrarIA:true};};
OS.salvarPreferencias=async p=>{p=p||{};p.id='main';p.updatedAt=new Date().toISOString();await OS.putMany('preferencias',[p]);if(OS.registrarAuditoria)await OS.registrarAuditoria('Preferências salvas','Preferências','Preferências atualizadas');return p;};
OS.dashboardOperacional=async()=>{const s=await OS.load(), m=hoje().slice(0,7), f=await OS.financials(m);let alerts=[];try{alerts=await OS.gerarAlertas()}catch(e){} const os=arr(s.agenda&&s.agenda.os), abertas=os.filter(o=>!entregue(o)), entregues=os.filter(o=>entregue(o)&&mes(o.entrega||o.entrada)===m), atrasadas=abertas.filter(o=>String(o.entrega||'')&&String(o.entrega)<hoje()), andamento=abertas.filter(o=>/andamento|execu|funilaria|pintura/i.test(String(o.status||o.etapa||'')));const meta=n(s.financeiro&&s.financeiro.metaReceita||s.metas&&s.metas.faturamento);return{mes:m,financeiro:f,alertas:alerts,clientes:arr(s.clientes).length,veiculos:arr(s.veiculos).length,osTotal:os.length,osAbertas:abertas.length,osEmAndamento:andamento.length,osAtrasadas:atrasadas.length,osEntreguesMes:entregues.length,valorAberto:abertas.reduce((a,b)=>a+n(b.valor),0),valorEntregueMes:entregues.reduce((a,b)=>a+n(b.valor),0),meta,metaPercent:meta>0?(n(f.receitaCaixa)/meta)*100:0,pePercent:n(f.pontoEquilibrio)>0?(n(f.receitaCaixa)/n(f.pontoEquilibrio))*100:0};};
})();


// V547.30 RESPONSIVIDADEotos OS
(function(){
if(!window.OficinaOS)return;
const OS=window.OficinaOS;
OS.etapasFotosOS=['Entrada','Desmontagem','Funilaria','Pintura','Montagem','Entrega'];
OS.salvarFotoOS=async function(osId,etapa,file){
 if(!osId)throw new Error('OS obrigatória');
 if(!file)throw new Error('Arquivo obrigatório');
 const dataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(file);});
 const item={id:'foto_'+Date.now().toString(36)+Math.random().toString(36).slice(2,8),osId:String(osId),etapa:etapa||'Entrada',nome:file.name||'foto',tipo:file.type||'image/jpeg',tamanho:file.size||0,dataUrl,createdAt:new Date().toISOString()};
 await OS.putMany('fotosOS',[item]);
 if(OS.registrarAuditoria)await OS.registrarAuditoria('Foto adicionada','Agenda','OS '+osId+' · '+item.etapa);
 return item;
};
OS.listarFotosOS=async function(osId){const fotos=await OS.getAll('fotosOS');return fotos.filter(f=>String(f.osId)===String(osId)).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));};
OS.excluirFotoOS=async function(id){const fotos=await OS.getAll('fotosOS');const keep=fotos.filter(f=>String(f.id)!==String(id));await OS.clearStore('fotosOS');await OS.putMany('fotosOS',keep);if(OS.registrarAuditoria)await OS.registrarAuditoria('Foto removida','Agenda','Foto '+id);return {removidas:fotos.length-keep.length};};
OS.resumoFotosOS=async function(){const fotos=await OS.getAll('fotosOS');const resumo={total:fotos.length,porEtapa:{},porOS:{}};fotos.forEach(f=>{resumo.porEtapa[f.etapa]=(resumo.porEtapa[f.etapa]||0)+1;resumo.porOS[f.osId]=(resumo.porOS[f.osId]||0)+1;});return resumo;};
})();

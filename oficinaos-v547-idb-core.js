
(function(){
'use strict';

const VERSION='V547.14 MODULES IDB INTEGRATION';
const DB_NAME='OficinaOS_V547_DB';
const DB_VERSION=1;
const STORES=['clientes','veiculos','orcamentos','agenda','lancamentos','contas','metas','ia','meta'];

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
    dasStatus:raw.dasStatus||{},
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


// V547.14 module CRUD helpers
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


(function(global){
"use strict";

const VERSION="V601.11";
const DB_NAME="OficinaOSDB";
const DB_VERSION=1;
const STORE_NAME="kv";
const STATE_KEY="state";

const EMPTY={
  meta:{app:"OficinaOS",version:VERSION,updatedAt:null,counters:{}},
  clientes:[],
  orcamentos:[],
  agenda:{os:[]},
  financeiro:{lancamentos:[]},
  metas:{faturamento:0,margemObjetivo:0,os:0,ticket:0,atrasoMax:0,categorias:[]},
  ia:{history:[],memory:[]},
  audit:[]
};

function clone(v){return JSON.parse(JSON.stringify(v))}
function now(){return new Date().toISOString()}
function normalize(s){
  s=Object.assign(clone(EMPTY),s||{});
  s.meta=Object.assign(clone(EMPTY.meta),s.meta||{});
  s.meta.app="OficinaOS";
  s.meta.version=VERSION;
  s.meta.counters=Object.assign({},s.meta.counters||{});
  s.clientes=Array.isArray(s.clientes)?s.clientes:[];
  s.orcamentos=Array.isArray(s.orcamentos)?s.orcamentos:[];
  s.agenda=Object.assign({os:[]},s.agenda||{});
  s.agenda.os=Array.isArray(s.agenda.os)?s.agenda.os:[];
  s.financeiro=Object.assign({lancamentos:[]},s.financeiro||{});
  s.financeiro.lancamentos=Array.isArray(s.financeiro.lancamentos)?s.financeiro.lancamentos:[];
  s.metas=Object.assign(clone(EMPTY.metas),s.metas||{});
  s.metas.categorias=Array.isArray(s.metas.categorias)?s.metas.categorias:[];
  s.ia=Object.assign(clone(EMPTY.ia),s.ia||{});
  s.ia.history=Array.isArray(s.ia.history)?s.ia.history:[];
  s.ia.memory=Array.isArray(s.ia.memory)?s.ia.memory:[];
  s.audit=Array.isArray(s.audit)?s.audit:[];
  return s;
}

let db=null;
let state=normalize(null);
let writeQueue=Promise.resolve();

function openDB(){
  if(db)return Promise.resolve(db);
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const database=req.result;
      if(!database.objectStoreNames.contains(STORE_NAME)){
        database.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess=()=>{db=req.result;resolve(db)};
    req.onerror=()=>reject(req.error||new Error("Falha ao abrir IndexedDB"));
  });
}

async function dbGet(key){
  const database=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=database.transaction(STORE_NAME,"readonly");
    const req=tx.objectStore(STORE_NAME).get(key);
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}

async function dbSet(key,value){
  const database=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=database.transaction(STORE_NAME,"readwrite");
    tx.objectStore(STORE_NAME).put(value,key);
    tx.oncomplete=()=>resolve(true);
    tx.onerror=()=>reject(tx.error||new Error("Falha ao gravar IndexedDB"));
    tx.onabort=()=>reject(tx.error||new Error("Gravação IndexedDB abortada"));
  });
}

async function dbDelete(key){
  const database=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=database.transaction(STORE_NAME,"readwrite");
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete=()=>resolve(true);
    tx.onerror=()=>reject(tx.error);
  });
}

async function init(){
  const saved=await dbGet(STATE_KEY);
  state=normalize(saved||EMPTY);
  await requestPersistence();
  broadcast();
  return clone(state);
}

function requestPersistence(){
  if(navigator.storage&&navigator.storage.persist){
    return navigator.storage.persist().catch(()=>false);
  }
  return Promise.resolve(false);
}

async function storageInfo(){
  if(navigator.storage&&navigator.storage.estimate){
    const e=await navigator.storage.estimate();
    return {
      usage:Number(e.usage||0),
      quota:Number(e.quota||0),
      free:Math.max(0,Number(e.quota||0)-Number(e.usage||0))
    };
  }
  return {usage:0,quota:0,free:0};
}

function queueSave(action,payload){
  state=normalize(state);
  state.meta.updatedAt=now();
  if(action){
    state.audit.unshift({at:now(),action,payload:payload||{}});
    state.audit=state.audit.slice(0,500);
  }
  const snapshot=clone(state);
  writeQueue=writeQueue.then(()=>dbSet(STATE_KEY,snapshot));
  writeQueue.then(()=>broadcast()).catch(err=>notifyError(err));
  return writeQueue;
}

function notifyError(err){
  global.dispatchEvent(new CustomEvent("oficinaos:error",{detail:{message:err&&err.message||String(err)}}));
}

function id(prefix){
  const date=new Date().toISOString().slice(0,10).replace(/-/g,"");
  const key=prefix+"Seq";
  const seq=state.meta.counters[key]=Number(state.meta.counters[key]||0)+1;
  return prefix+"-"+date+"-"+String(seq).padStart(6,"0");
}

function upsert(list,item){
  const i=list.findIndex(x=>String(x.id)===String(item.id));
  if(i>=0)list[i]=Object.assign({},list[i],item);
  else list.push(item);
}

function customerFromBudget(o){
  if(!o||!o.cliente)return null;
  let c=state.clientes.find(x=>
    (o.doc&&(x.documento===o.doc||x.cpf===o.doc))||
    (o.telefone&&(x.telefone===o.telefone||x.tel===o.telefone))||
    String(x.nome||"").toLowerCase()===String(o.cliente||"").toLowerCase()
  );
  if(!c){
    c={
      id:id("CLI"),nome:o.cliente,tel:o.telefone||"",telefone:o.telefone||"",
      cpf:o.doc||"",documento:o.doc||"",email:"",status:"Cliente",
      desde:new Date().toISOString().slice(0,7),veiculos:[],historico:[],crm:[],docs:[]
    };
    state.clientes.push(c);
  }
  if(o.veiculo&&!c.veiculos.some(v=>
    String(v.placa||"")===String(o.placa||"")&&
    String(v.modelo||"")===String(o.veiculo||"")
  )){
    c.veiculos.push({
      modelo:o.veiculo,ano:o.ano||"",placa:o.placa||"",cor:o.cor||"",
      obs:"Importado do orçamento"
    });
  }
  return c;
}

function receive(msg){
  if(!msg||!msg.type)return Promise.resolve();
  const p=msg.payload||{};

  if(msg.type==="cliente:upsert"){
    upsert(state.clientes,p);
    return queueSave("CLIENTE_UPSERT",{id:p.id});
  }

  if(msg.type==="clientes:replace"){
    state.clientes=Array.isArray(p)?p:[];
    return queueSave("CLIENTES_SYNC",{total:state.clientes.length});
  }

  if(msg.type==="orcamento:save"||msg.type==="orcamento:approve"){
    const o=Object.assign({},p);
    o.id=o.id&&!String(o.id).includes("null")?o.id:id("ORC");
    o.numero=o.numero&&!String(o.numero).includes("null")?o.numero:o.id;
    const cliente=customerFromBudget(o);
    if(cliente)o.clienteId=cliente.id;
    upsert(state.orcamentos,o);

    if(msg.type==="orcamento:approve"){
      o.status="Aprovado";
      let os=state.agenda.os.find(x=>x.orcamentoId===o.id);
      if(!os){
        os={
          id:id("OS"),orcamentoId:o.id,orc:o.numero,clienteId:o.clienteId||"",
          cliente:o.cliente||"",veiculo:o.veiculo||"",
          entrada:new Date().toISOString().slice(0,10),entrega:o.prevista||"",
          valor:Number(o.total||0),etapa:o.etapaAtual||"Entrada",
          status:"Agendado",prioridade:o.prioridade||"Normal",tipo:"OS",fotos:[]
        };
        state.agenda.os.push(os);
      }
      let fin=state.financeiro.lancamentos.find(x=>x.orcamentoId===o.id);
      if(!fin){
        state.financeiro.lancamentos.push({
          id:id("FIN"),orcamentoId:o.id,osId:os.id,tipo:"receita",
          descricao:"Orçamento aprovado - "+(o.cliente||o.numero),
          valor:Number(o.total||0),categoria:"Serviço",
          data:new Date().toISOString().slice(0,10),
          vencimento:o.prevista||new Date().toISOString().slice(0,10),
          status:"pendente",origem:"ORCAMENTO_APROVADO"
        });
      }
    }
    return queueSave(
      msg.type==="orcamento:approve"?"ORCAMENTO_APROVADO":"ORCAMENTO_SALVO",
      {id:o.id}
    );
  }

  if(msg.type==="agenda:replace"){
    state.agenda.os=Array.isArray(p)?p:[];
    return queueSave("AGENDA_SYNC",{total:state.agenda.os.length});
  }

  if(msg.type==="agenda:finish"){
    const os=p;
    upsert(state.agenda.os,os);
    if(!state.financeiro.lancamentos.some(x=>x.osId===os.id)){
      state.financeiro.lancamentos.push({
        id:id("FIN"),osId:os.id,tipo:"receita",
        descricao:"OS finalizada - "+(os.cliente||os.id),
        valor:Number(os.valor||0),categoria:"Serviço",
        data:new Date().toISOString().slice(0,10),
        vencimento:new Date().toISOString().slice(0,10),
        status:"pendente",origem:"OS_FINALIZADA"
      });
    }
    return queueSave("OS_FINALIZADA",{id:os.id});
  }

  if(msg.type==="financeiro:replace"){
    state.financeiro.lancamentos=Array.isArray(p)?p:[];
    return queueSave("FINANCEIRO_SYNC",{total:state.financeiro.lancamentos.length});
  }

  if(msg.type==="metas:update"){
    state.metas=Object.assign({},state.metas,p||{});
    state.metas.categorias=Array.isArray(state.metas.categorias)?state.metas.categorias:[];
    return queueSave("METAS_ATUALIZADAS",{});
  }

  if(msg.type==="ia:update"){
    state.ia=Object.assign({},state.ia,p||{});
    state.ia.history=Array.isArray(state.ia.history)?state.ia.history:[];
    state.ia.memory=Array.isArray(state.ia.memory)?state.ia.memory:[];
    return queueSave("IA_ATUALIZADA",{});
  }

  return Promise.resolve();
}

function snapshotFor(module){
  if(module==="clientes")return {clientes:state.clientes};
  if(module==="orcamento")return {clientes:state.clientes,orcamentos:state.orcamentos};
  if(module==="agenda")return {os:state.agenda.os};
  if(module==="financeiro")return {lancamentos:state.financeiro.lancamentos};
  if(module==="metas")return clone(state);
  if(module==="relatorios")return clone(state);
  if(module==="ia")return clone(state);
  return clone(state);
}

function broadcast(){
  document.querySelectorAll("iframe[data-module]").forEach(frame=>{
    try{
      frame.contentWindow.postMessage({
        source:"oficinaos-core",
        type:"core:state",
        payload:snapshotFor(frame.dataset.module)
      },"*");
    }catch(e){}
  });
  global.dispatchEvent(new CustomEvent("oficinaos:changed",{detail:clone(state)}));
}

async function reset(){
  state=normalize(EMPTY);
  await dbSet(STATE_KEY,clone(state));
  broadcast();
  return clone(state);
}

function buildExport(){
  return {
    schema:"OFICINAOS_INDEXEDDB_JSON",
    version:VERSION,
    exportedAt:now(),
    state:clone(state)
  };
}

function downloadJSON(payload,filename){
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=filename;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

function exportBackup(){
  const payload=buildExport();
  downloadJSON(payload,"oficinaos-indexeddb-"+new Date().toISOString().slice(0,10)+".json");
  return payload;
}

function validateImport(payload){
  const imported=payload&&payload.state?payload.state:payload;
  const errors=[];
  if(!imported||typeof imported!=="object")errors.push("STATE ausente.");
  if(imported&&imported.clientes&&!Array.isArray(imported.clientes))errors.push("clientes inválido.");
  if(imported&&imported.orcamentos&&!Array.isArray(imported.orcamentos))errors.push("orcamentos inválido.");
  if(imported&&imported.agenda&&imported.agenda.os&&!Array.isArray(imported.agenda.os))errors.push("agenda.os inválido.");
  if(imported&&imported.financeiro&&imported.financeiro.lancamentos&&!Array.isArray(imported.financeiro.lancamentos))errors.push("financeiro.lancamentos inválido.");
  return {ok:errors.length===0,errors,state:imported};
}

async function importBackup(payload){
  const check=validateImport(payload);
  if(!check.ok)throw new Error(check.errors.join("\n"));

  const safety=buildExport();
  downloadJSON(
    safety,
    "oficinaos-antes-importacao-"+new Date().toISOString().slice(0,10)+".json"
  );

  const previous=clone(state);
  try{
    state=normalize(check.state);
    state.audit.unshift({at:now(),action:"JSON_IMPORTADO",payload:{}});
    await dbSet(STATE_KEY,clone(state));
    broadcast();
    return clone(state);
  }catch(err){
    state=previous;
    await dbSet(STATE_KEY,clone(previous)).catch(()=>{});
    throw new Error("Falha ao importar no IndexedDB: "+(err&&err.message||err));
  }
}

function importFile(file){
  return new Promise((resolve,reject)=>{
    if(!file)return reject(new Error("Nenhum arquivo selecionado."));
    const reader=new FileReader();
    reader.onload=async()=>{
      try{
        const payload=JSON.parse(String(reader.result||""));
        resolve(await importBackup(payload));
      }catch(err){reject(err)}
    };
    reader.onerror=()=>reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsText(file);
  });
}


function command(module,action,payload){
  document.querySelectorAll('iframe[data-module="'+module+'"]').forEach(frame=>{
    try{
      frame.contentWindow.postMessage({
        source:"oficinaos-core",
        type:"core:command",
        action,
        payload:payload||{}
      },"*");
    }catch(e){}
  });
}

const ready=init().catch(err=>{
  notifyError(err);
  return clone(state);
});

global.OficinaOSCore={
  VERSION,DB_NAME,STORE_NAME,ready,
  getState:()=>clone(state),
  receive,broadcast,command,reset,id,
  exportBackup,importBackup,importFile,
  storageInfo,requestPersistence
};
})(window);

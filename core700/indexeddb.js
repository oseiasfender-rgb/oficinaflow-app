(function(g){
"use strict";

const VERSION="V700.50";
const DB_NAME="OficinaOSV700";
const DB_VERSION=2;
const STATE_STORE="state";
const META_STORE="meta";
const STATE_KEY="main";

let connection=null;
let opening=null;
let generation=0;
let lastError=null;

function supported(){
  return typeof indexedDB!=="undefined";
}

function invalidate(){
  generation++;
  if(connection){
    try{connection.close()}catch(_){}
  }
  connection=null;
  opening=null;
}

function open(){
  if(!supported())return Promise.reject(new Error("IndexedDB não está disponível neste navegador."));
  if(connection)return Promise.resolve(connection);
  if(opening)return opening;

  const token=generation;

  opening=new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,DB_VERSION);

    request.onupgradeneeded=event=>{
      const db=request.result;

      if(!db.objectStoreNames.contains(STATE_STORE)){
        db.createObjectStore(STATE_STORE);
      }

      if(!db.objectStoreNames.contains(META_STORE)){
        db.createObjectStore(META_STORE);
      }

      const tx=request.transaction;
      if(tx){
        tx.objectStore(META_STORE).put({
          version:VERSION,
          dbVersion:DB_VERSION,
          upgradedAt:new Date().toISOString()
        },"schema");
      }
    };

    request.onblocked=()=>{
      lastError=new Error(
        "A abertura do banco foi bloqueada por outra aba. Feche outras abas do OficinaOS e tente novamente."
      );
      reject(lastError);
    };

    request.onerror=()=>{
      lastError=request.error||new Error("Falha ao abrir o IndexedDB.");
      reject(lastError);
    };

    request.onsuccess=()=>{
      const db=request.result;

      if(token!==generation){
        try{db.close()}catch(_){}
        reject(new Error("A conexão foi substituída durante a abertura."));
        return;
      }

      connection=db;
      opening=null;

      db.onversionchange=()=>{
        invalidate();
      };

      db.onclose=()=>{
        connection=null;
        opening=null;
      };

      db.onerror=event=>{
        lastError=(event.target&&event.target.error)||new Error("Erro interno do IndexedDB.");
      };

      resolve(db);
    };
  }).catch(error=>{
    opening=null;
    throw error;
  });

  return opening;
}

function isRetryable(error){
  const name=error&&error.name||"";
  const message=String(error&&error.message||"").toLowerCase();

  return [
    "InvalidStateError",
    "TransactionInactiveError",
    "AbortError",
    "UnknownError"
  ].includes(name) ||
  message.includes("connection is closing") ||
  message.includes("database connection is closing") ||
  message.includes("connection was closed") ||
  message.includes("transaction is not active");
}

async function transaction(storeNames,mode,worker,attempt=0){
  const names=Array.isArray(storeNames)?storeNames:[storeNames];

  try{
    const db=await open();

    return await new Promise((resolve,reject)=>{
      let tx;
      let result;
      let settled=false;

      try{
        tx=db.transaction(names,mode);
        result=worker(tx);
      }catch(error){
        reject(error);
        return;
      }

      tx.oncomplete=()=>{
        if(settled)return;
        settled=true;
        resolve(result);
      };

      tx.onabort=()=>{
        if(settled)return;
        settled=true;
        reject(tx.error||new Error("A transação do IndexedDB foi cancelada."));
      };

      tx.onerror=()=>{
        // onabort normalmente finaliza; evita rejeição duplicada.
      };
    });
  }catch(error){
    lastError=error;

    if(attempt<2&&isRetryable(error)){
      invalidate();
      await new Promise(resolve=>setTimeout(resolve,80*(attempt+1)));
      return transaction(names,mode,worker,attempt+1);
    }

    throw error;
  }
}

async function get(key=STATE_KEY){
  let value;

  await transaction(STATE_STORE,"readonly",tx=>{
    const request=tx.objectStore(STATE_STORE).get(key);
    request.onsuccess=()=>{value=request.result};
  });

  return value;
}

async function set(key,value){
  await transaction([STATE_STORE,META_STORE],"readwrite",tx=>{
    tx.objectStore(STATE_STORE).put(value,key);
    tx.objectStore(META_STORE).put({
      key,
      writtenAt:new Date().toISOString(),
      version:VERSION
    },"lastWrite");
  });

  return true;
}

async function atomicReplace(value,key=STATE_KEY){
  const envelope={
    value,
    checksum:JSON.stringify(value).length,
    writtenAt:new Date().toISOString(),
    version:VERSION
  };

  await transaction([STATE_STORE,META_STORE],"readwrite",tx=>{
    tx.objectStore(STATE_STORE).put(value,key);
    tx.objectStore(META_STORE).put(envelope,"lastAtomicReplace");
  });

  const confirmed=await get(key);

  if(!confirmed){
    throw new Error("O IndexedDB não confirmou a gravação do STATE.");
  }

  const expected=JSON.stringify(value).length;
  const actual=JSON.stringify(confirmed).length;

  if(expected!==actual){
    throw new Error("A confirmação do IndexedDB divergiu do conteúdo gravado.");
  }

  return confirmed;
}

async function clearState(){
  await transaction([STATE_STORE,META_STORE],"readwrite",tx=>{
    tx.objectStore(STATE_STORE).clear();
    tx.objectStore(META_STORE).put({
      clearedAt:new Date().toISOString(),
      version:VERSION
    },"lastClear");
  });

  return true;
}

async function destroy(){
  invalidate();

  return new Promise((resolve,reject)=>{
    const request=indexedDB.deleteDatabase(DB_NAME);

    request.onsuccess=()=>resolve(true);
    request.onerror=()=>reject(request.error||new Error("Falha ao excluir o banco."));
    request.onblocked=()=>reject(new Error("A exclusão foi bloqueada por outra aba aberta."));
  });
}

async function diagnose(){
  const db=await open();
  const state=await get(STATE_KEY);

  return {
    ok:true,
    version:VERSION,
    dbName:DB_NAME,
    dbVersion:db.version,
    stores:Array.from(db.objectStoreNames),
    hasState:!!state,
    counts:state?{
      clientes:Array.isArray(state.clientes)?state.clientes.length:0,
      orcamentos:Array.isArray(state.orcamentos)?state.orcamentos.length:0,
      agenda:state.agenda&&Array.isArray(state.agenda.os)?state.agenda.os.length:0,
      lancamentos:state.financeiro&&Array.isArray(state.financeiro.lancamentos)?state.financeiro.lancamentos.length:0,
      contas:state.financeiro&&Array.isArray(state.financeiro.contas)?state.financeiro.contas.length:0
    }:null,
    lastError:lastError?String(lastError.message||lastError):null
  };
}

async function estimate(){
  return navigator.storage&&navigator.storage.estimate
    ? navigator.storage.estimate()
    : {usage:0,quota:0};
}

const api={
  VERSION,
  DB_NAME,
  DB_VERSION,
  STORE_NAME:STATE_STORE,
  STATE_STORE,
  META_STORE,
  STATE_KEY,
  open,
  get,
  set,
  atomicReplace,
  clearState,
  destroy,
  diagnose,
  estimate,
  invalidate,
  health:()=>({
    ok:supported(),
    version:VERSION,
    dbName:DB_NAME,
    connected:!!connection,
    lastError:lastError?String(lastError.message||lastError):null
  })
};

g.OficinaOSIndexedDB700=api;

if(typeof module!=="undefined"&&module.exports){
  module.exports=api;
}

})(typeof window!=="undefined"?window:globalThis);

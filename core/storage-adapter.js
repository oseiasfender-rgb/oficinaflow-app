
(function(g){
'use strict';

const DB_NAME = 'OficinaOS_DB';
const DB_VERSION = 1;
const STORE_STATE = 'state';
const STORE_BACKUPS = 'backups';
const STORE_META = 'meta';
const STATE_KEY = 'OFICINAOS_STATE';
const LOCAL_KEY = 'OficinaOS';

function now(){ return new Date().toISOString(); }
function obj(v){ return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
function arr(v){ return Array.isArray(v) ? v : []; }

function localRead(){
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) {
    return null;
  }
}

function localWrite(state){
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state || {}));
    return true;
  } catch(e) {
    return false;
  }
}

function emptyState(){
  if (g.CleanStart && typeof g.CleanStart.emptyState === 'function') {
    const s = g.CleanStart.emptyState();
    s.version = '551.31';
    s.releaseStage = 'INDEXEDDB_STORAGE_UPGRADE';
    return s;
  }
  return {
    version:'551.31',
    releaseStage:'INDEXEDDB_STORAGE_UPGRADE',
    createdAt:now(),
    updatedAt:now(),
    empresa:{},
    usuarios:[],
    clientes:[],
    veiculos:[],
    orcamentos:[],
    agenda:[],
    fotos:[],
    fluxos:[],
    financeiro:{lancamentos:[],contas:[],recibos:[]},
    metas:{principal:0,categorias:[],historico:[]},
    relatorios:{},
    ia:{memoria:[],consultas:[],alertas:[],insights:[],planoAcao:{}},
    historico:{eventos:[],documentos:[],orcamentos:[]},
    documentos:{config:{templatePadrao:'',historico:true,whatsapp:true,qr:true}},
    configuracoes:{},
    backup:{historico:[],ultimaGravacao:'',origem:'OficinaOS IndexedDB Clean Start'},
    admin:{enabled:true,sections:['contas','auditoria','alertas','busca','configuracoes']},
    publicacao:{},
    monitoramento:{eventos:[]},
    storage:{engine:'indexedDB',fallback:'localStorage'}
  };
}

function indexedDBAvailable(){
  return typeof indexedDB !== 'undefined';
}

function openDB(){
  return new Promise(function(resolve,reject){
    if(!indexedDBAvailable()) {
      reject(new Error('IndexedDB não disponível neste navegador'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = function(event){
      const db = event.target.result;
      if(!db.objectStoreNames.contains(STORE_STATE)) db.createObjectStore(STORE_STATE, { keyPath:'key' });
      if(!db.objectStoreNames.contains(STORE_BACKUPS)) db.createObjectStore(STORE_BACKUPS, { keyPath:'id' });
      if(!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META, { keyPath:'key' });
    };
    req.onsuccess = function(){ resolve(req.result); };
    req.onerror = function(){ reject(req.error || new Error('Erro ao abrir IndexedDB')); };
  });
}

function txStore(db, store, mode){
  return db.transaction(store, mode || 'readonly').objectStore(store);
}

function idbGet(store, key){
  return openDB().then(function(db){
    return new Promise(function(resolve,reject){
      const req = txStore(db, store, 'readonly').get(key);
      req.onsuccess = function(){ db.close(); resolve(req.result || null); };
      req.onerror = function(){ db.close(); reject(req.error); };
    });
  });
}

function idbPut(store, value){
  return openDB().then(function(db){
    return new Promise(function(resolve,reject){
      const req = txStore(db, store, 'readwrite').put(value);
      req.onsuccess = function(){ db.close(); resolve(value); };
      req.onerror = function(){ db.close(); reject(req.error); };
    });
  });
}

function idbDelete(store, key){
  return openDB().then(function(db){
    return new Promise(function(resolve,reject){
      const req = txStore(db, store, 'readwrite').delete(key);
      req.onsuccess = function(){ db.close(); resolve(true); };
      req.onerror = function(){ db.close(); reject(req.error); };
    });
  });
}

function idbClear(store){
  return openDB().then(function(db){
    return new Promise(function(resolve,reject){
      const req = txStore(db, store, 'readwrite').clear();
      req.onsuccess = function(){ db.close(); resolve(true); };
      req.onerror = function(){ db.close(); reject(req.error); };
    });
  });
}

function load(){
  return idbGet(STORE_STATE, STATE_KEY).then(function(row){
    if(row && row.value){
      g.STATE = row.value;
      return row.value;
    }
    const local = localRead();
    if(local){
      local.version = '551.31';
      local.releaseStage = local.releaseStage || 'MIGRATED_FROM_LOCALSTORAGE';
      local.storage = {engine:'indexedDB',migratedFrom:'localStorage',migratedAt:now()};
      return save(local).then(function(){ return local; });
    }
    const fresh = emptyState();
    return save(fresh).then(function(){ return fresh; });
  }).catch(function(){
    const fallback = localRead() || emptyState();
    fallback.storage = {engine:'localStorage_fallback',reason:'indexedDB_load_failed'};
    g.STATE = fallback;
    return fallback;
  });
}

function save(state){
  state = state || g.STATE || emptyState();
  state.version = '551.31';
  state.releaseStage = state.releaseStage || 'INDEXEDDB_STORAGE_UPGRADE';
  state.updatedAt = now();
  state.storage = Object.assign({}, obj(state.storage), {engine:'indexedDB',lastSavedAt:now()});
  g.STATE = state;
  localWrite(state); // espelho leve/fallback
  return idbPut(STORE_STATE, {key:STATE_KEY, value:state, updatedAt:now()}).then(function(){ return state; }).catch(function(){
    state.storage = Object.assign({}, obj(state.storage), {engine:'localStorage_fallback',lastSavedAt:now()});
    localWrite(state);
    return state;
  });
}

function reset(confirmText){
  if(confirmText !== 'ZERAR OFICINAOS') throw new Error('Confirmação inválida. Use: ZERAR OFICINAOS');
  const fresh = emptyState();
  fresh.storage = {engine:'indexedDB',resetAt:now()};
  return Promise.all([
    idbClear(STORE_STATE).catch(function(){ return false; }),
    idbClear(STORE_BACKUPS).catch(function(){ return false; }),
    idbClear(STORE_META).catch(function(){ return false; })
  ]).then(function(){
    localStorage.removeItem(LOCAL_KEY);
    return save(fresh);
  });
}

function backup(label){
  const state = g.STATE || localRead() || emptyState();
  const rec = {
    id:'backup_'+Date.now()+'_'+Math.random().toString(36).slice(2,8),
    label:label || 'manual',
    createdAt:now(),
    version:'551.31',
    value:JSON.parse(JSON.stringify(state))
  };
  return idbPut(STORE_BACKUPS, rec).then(function(){ return rec; });
}

function listBackups(){
  return openDB().then(function(db){
    return new Promise(function(resolve,reject){
      const req = txStore(db, STORE_BACKUPS, 'readonly').getAll();
      req.onsuccess = function(){ db.close(); resolve(arr(req.result)); };
      req.onerror = function(){ db.close(); reject(req.error); };
    });
  }).catch(function(){ return []; });
}

function restoreBackup(id){
  return idbGet(STORE_BACKUPS, id).then(function(rec){
    if(!rec || !rec.value) throw new Error('Backup não encontrado');
    return save(rec.value);
  });
}

function migrateFromLocalStorage(){
  const local = localRead();
  if(!local) return Promise.resolve({ok:false,reason:'localStorage vazio'});
  local.version = '551.31';
  local.releaseStage = 'MIGRATED_FROM_LOCALSTORAGE';
  local.storage = {engine:'indexedDB',migratedFrom:'localStorage',migratedAt:now()};
  return save(local).then(function(s){
    return {ok:true,state:s};
  });
}

function status(){
  return load().then(function(state){
    return listBackups().then(function(backups){
      return {
        version:'551.31',
        indexedDBAvailable:indexedDBAvailable(),
        dbName:DB_NAME,
        dbVersion:DB_VERSION,
        stateLoaded:!!state,
        engine:obj(state.storage).engine || 'unknown',
        backups:backups.length,
        counts:{
          clientes:arr(state.clientes).length,
          veiculos:arr(state.veiculos).length,
          orcamentos:arr(state.orcamentos).length,
          agenda:arr(state.agenda).length,
          fluxos:arr(state.fluxos).length,
          lancamentos:arr(obj(state.financeiro).lancamentos).length,
          contas:arr(obj(state.financeiro).contas).length,
          recibos:arr(obj(state.financeiro).recibos).length
        },
        checkedAt:now()
      };
    });
  });
}

function installStateManagerBridge(){
  g.StateManager = {
    version:'551.31-indexeddb-bridge',
    load:function(){
      if(g.STATE) return g.STATE;
      const local = localRead() || emptyState();
      g.STATE = local;
      load().then(function(s){ g.STATE=s; });
      return local;
    },
    save:function(state){
      g.STATE = state || g.STATE || emptyState();
      save(g.STATE);
      return g.STATE;
    },
    exportJSON:function(){
      return JSON.stringify(g.STATE || localRead() || emptyState(), null, 2);
    },
    importJSON:function(raw){
      let data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      save(data);
      return data;
    },
    reset:function(confirmText){
      reset(confirmText);
      const fresh = emptyState();
      g.STATE = fresh;
      return fresh;
    },
    validate:function(){
      const s = g.STATE || localRead() || emptyState();
      return {
        valid:true,
        version:'551.31',
        engine:obj(s.storage).engine || 'pending',
        counts:{
          clientes:arr(s.clientes).length,
          orcamentos:arr(s.orcamentos).length,
          agenda:arr(s.agenda).length
        }
      };
    }
  };
}

function init(){
  installStateManagerBridge();
  return load().then(function(s){
    g.STATE = s;
    return s;
  });
}

g.StorageAdapter = {
  version:'551.31',
  DB_NAME,
  DB_VERSION,
  STATE_KEY,
  indexedDBAvailable,
  openDB,
  load,
  save,
  reset,
  backup,
  listBackups,
  restoreBackup,
  migrateFromLocalStorage,
  status,
  installStateManagerBridge,
  emptyState,
  init
};

init();
})(window);

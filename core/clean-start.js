
(function(g){
'use strict';

const STORAGE_KEY = 'OficinaOS';
const VERSION = '551.30';

function now(){ return new Date().toISOString(); }
function arr(v){ return Array.isArray(v) ? v : []; }
function obj(v){ return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }

function emptyState(){
  return {
    version: VERSION,
    releaseStage: 'CLEAN_START_ZERO_STATE',
    createdAt: now(),
    updatedAt: now(),
    empresa: {},
    usuarios: [],
    clientes: [],
    veiculos: [],
    orcamentos: [],
    agenda: [],
    fotos: [],
    fluxos: [],
    financeiro: { lancamentos: [], contas: [], recibos: [] },
    metas: { principal: 0, categorias: [], historico: [] },
    relatorios: {},
    ia: { memoria: [], consultas: [], alertas: [], insights: [], planoAcao: {} },
    historico: { eventos: [], documentos: [], orcamentos: [] },
    documentos: { config: { templatePadrao: '', historico: true, whatsapp: true, qr: true } },
    configuracoes: {},
    backup: { historico: [], ultimaGravacao: '', origem: 'OficinaOS Clean Start' },
    admin: { enabled: true, sections: ['contas','auditoria','alertas','busca','configuracoes'] },
    publicacao: {},
    monitoramento: { eventos: [] }
  };
}

function read(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) {
    return null;
  }
}

function write(state){
  state = state || emptyState();
  state.updatedAt = now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  g.STATE = state;
  return state;
}

function hasRealData(state){
  state = obj(state);
  return (
    arr(state.clientes).length > 0 ||
    arr(state.veiculos).length > 0 ||
    arr(state.orcamentos).length > 0 ||
    arr(state.agenda).length > 0 ||
    arr(state.fluxos).length > 0 ||
    arr(obj(state.financeiro).lancamentos).length > 0 ||
    arr(obj(state.financeiro).contas).length > 0 ||
    arr(obj(state.financeiro).recibos).length > 0 ||
    arr(obj(state.historico).documentos).length > 0
  );
}

function removeSimulationKeys(){
  const legacy = [
    'ALL_TX','user_tx','fp_tx','tx','transacoes','contasPagar',
    'orcamentosAntigos','demoData','sampleData','testeData',
    'OficinaOS_DEMO','OficinaOS_TEST','OficinaOS_SAMPLE'
  ];
  const removed = [];
  try {
    legacy.forEach(k => {
      if (localStorage.getItem(k) !== null) {
        localStorage.removeItem(k);
        removed.push(k);
      }
    });
  } catch(e) {}
  return removed;
}

function init(){
  removeSimulationKeys();
  const current = read();
  if (!current || !hasRealData(current)) {
    return write(emptyState());
  }
  current.version = current.version || VERSION;
  current.releaseStage = current.releaseStage || 'EXISTING_DATA_PRESERVED';
  g.STATE = current;
  return current;
}

function forceZero(confirmText){
  if (confirmText !== 'ZERAR OFICINAOS') {
    throw new Error('Confirmação inválida. Use: ZERAR OFICINAOS');
  }
  removeSimulationKeys();
  return write(emptyState());
}

function importState(raw){
  let data = raw;
  if (typeof raw === 'string') data = JSON.parse(raw);
  data = obj(data);
  data.version = VERSION;
  data.releaseStage = 'IMPORTED_ON_CLEAN_START';
  data.updatedAt = now();
  return write(data);
}

function verifyZero(){
  const s = read() || emptyState();
  const counts = {
    clientes: arr(s.clientes).length,
    veiculos: arr(s.veiculos).length,
    orcamentos: arr(s.orcamentos).length,
    agenda: arr(s.agenda).length,
    fluxos: arr(s.fluxos).length,
    fotos: arr(s.fotos).length,
    lancamentos: arr(obj(s.financeiro).lancamentos).length,
    contas: arr(obj(s.financeiro).contas).length,
    recibos: arr(obj(s.financeiro).recibos).length,
    documentos: arr(obj(s.historico).documentos).length,
    monitoramento: arr(obj(s.monitoramento).eventos).length
  };
  const total = Object.keys(counts).reduce((a,k)=>a+counts[k],0);
  return { version: VERSION, zero: total === 0, total, counts, state: s };
}

g.CleanStart = {
  version: VERSION,
  emptyState,
  init,
  forceZero,
  importState,
  verifyZero,
  removeSimulationKeys
};

init();
})(window);


/* V551.31 IndexedDB integration */
(function(g){
if(!g.CleanStart) return;
const oldForceZero = g.CleanStart.forceZero;
const oldImportState = g.CleanStart.importState;
g.CleanStart.forceZero = function(confirmText){
  if(g.StorageAdapter && typeof g.StorageAdapter.reset === 'function'){
    return g.StorageAdapter.reset(confirmText);
  }
  return oldForceZero(confirmText);
};
g.CleanStart.importState = function(raw){
  if(g.StorageAdapter && typeof g.StorageAdapter.save === 'function'){
    let data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    data.version = '551.31';
    data.releaseStage = 'IMPORTED_ON_INDEXEDDB_STORAGE';
    return g.StorageAdapter.save(data);
  }
  return oldImportState(raw);
};
g.CleanStart.verifyZero = function(){
  const s = g.STATE || (g.StorageAdapter ? g.StorageAdapter.emptyState() : g.CleanStart.emptyState());
  const counts = {
    clientes: (s.clientes||[]).length,
    veiculos: (s.veiculos||[]).length,
    orcamentos: (s.orcamentos||[]).length,
    agenda: (s.agenda||[]).length,
    fluxos: (s.fluxos||[]).length,
    fotos: (s.fotos||[]).length,
    lancamentos: ((s.financeiro||{}).lancamentos||[]).length,
    contas: ((s.financeiro||{}).contas||[]).length,
    recibos: ((s.financeiro||{}).recibos||[]).length,
    documentos: ((s.historico||{}).documentos||[]).length,
    monitoramento: ((s.monitoramento||{}).eventos||[]).length
  };
  const total = Object.keys(counts).reduce((a,k)=>a+counts[k],0);
  return {version:'551.31',zero:total===0,total,counts,state:s,engine:(s.storage||{}).engine||'indexedDB_pending'};
};
})(window);

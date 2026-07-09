
(function(g){
'use strict';

const VERSION = '551.32';
const AUTOSAVE_DELAY_MS = 4000;
const SMART_BACKUP_MIN_INTERVAL_MS = 15 * 60 * 1000;
const MAX_VERSIONED_BACKUPS = 50;
const DAILY_BACKUP_KEY_PREFIX = 'daily_';

let pendingTimer = null;
let dirty = false;
let lastSaveAt = 0;
let lastBackupAt = 0;
let changeReason = '';

function now(){ return new Date().toISOString(); }
function today(){ return new Date().toISOString().slice(0,10); }
function obj(v){ return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
function arr(v){ return Array.isArray(v) ? v : []; }
function uid(p){ return (p||'auto') + '_' + Date.now() + '_' + Math.random().toString(36).slice(2,8); }

function state(){
  return g.STATE || (g.StateManager && g.StateManager.load ? g.StateManager.load() : {});
}

function ensure(){
  let s = state();
  s.version = VERSION;
  s.releaseStage = 'AUTOSAVE_SMART_BACKUP';
  s.autosave = obj(s.autosave);
  s.autosave.version = VERSION;
  s.autosave.enabled = s.autosave.enabled !== false;
  s.autosave.delayMs = AUTOSAVE_DELAY_MS;
  s.autosave.maxVersionedBackups = MAX_VERSIONED_BACKUPS;
  s.autosave.smartBackupMinIntervalMs = SMART_BACKUP_MIN_INTERVAL_MS;
  s.backup = obj(s.backup);
  s.backup.historico = arr(s.backup.historico);
  s.historico = obj(s.historico);
  s.historico.eventos = arr(s.historico.eventos);
  g.STATE = s;
  return s;
}

function historico(tipo, descricao, extra){
  let s = ensure();
  const rec = Object.assign({id:uid('hist'), tipo, descricao, data:now()}, extra || {});
  s.historico.eventos.push(rec);
  return rec;
}

async function persist(reason){
  let s = ensure();
  s.updatedAt = now();
  s.autosave.lastReason = reason || changeReason || 'autosave';
  s.autosave.lastSaveAt = now();
  s.autosave.dirty = false;
  g.STATE = s;
  if(g.StorageAdapter && typeof g.StorageAdapter.save === 'function'){
    await g.StorageAdapter.save(s);
  } else if(g.StateManager && typeof g.StateManager.save === 'function'){
    g.StateManager.save(s);
  } else {
    localStorage.setItem('OficinaOS', JSON.stringify(s));
  }
  lastSaveAt = Date.now();
  dirty = false;
  changeReason = '';
  return s;
}

function markDirty(reason){
  let s = ensure();
  if(s.autosave.enabled === false) return {scheduled:false, reason:'autosave_disabled'};
  dirty = true;
  changeReason = reason || 'alteracao';
  s.autosave.dirty = true;
  s.autosave.lastChangeAt = now();
  s.autosave.pendingReason = changeReason;
  g.STATE = s;
  clearTimeout(pendingTimer);
  pendingTimer = setTimeout(function(){
    persist('autosave:'+changeReason).catch(function(err){
      console.warn('AutoSave falhou:', err);
    });
  }, AUTOSAVE_DELAY_MS);
  return {scheduled:true, delayMs:AUTOSAVE_DELAY_MS, reason:changeReason};
}

async function flush(reason){
  clearTimeout(pendingTimer);
  if(!dirty && !reason) return state();
  return await persist(reason || 'flush');
}

async function backup(label, type){
  await flush('before_backup');
  let s = ensure();
  let rec;
  if(g.StorageAdapter && typeof g.StorageAdapter.backup === 'function'){
    rec = await g.StorageAdapter.backup(label || 'smart-backup');
  } else if(g.BackupCore && typeof g.BackupCore.exportFullJSON === 'function'){
    const text = g.BackupCore.exportFullJSON();
    rec = {id:uid('backup'), label:label||'smart-backup', createdAt:now(), type:type||'manual', size:text.length};
  } else {
    rec = {id:uid('backup'), label:label||'smart-backup', createdAt:now(), type:type||'manual', value:JSON.parse(JSON.stringify(s))};
  }
  s = ensure();
  s.backup.historico = arr(s.backup.historico);
  s.backup.historico.push({
    id: rec.id || uid('backup'),
    label: label || 'smart-backup',
    type: type || 'smart',
    createdAt: now()
  });
  s.backup.ultimaGravacao = now();
  s.autosave.lastBackupAt = now();
  g.STATE = s;
  if(g.StorageAdapter && typeof g.StorageAdapter.save === 'function') await g.StorageAdapter.save(s);
  lastBackupAt = Date.now();
  historico('smart_backup','Backup inteligente criado',{label:label||'smart-backup', type:type||'smart'});
  await pruneBackups();
  return rec;
}

async function dailyBackup(){
  const label = DAILY_BACKUP_KEY_PREFIX + today();
  let s = ensure();
  let exists = arr(s.backup.historico).some(b => b.label === label);
  if(exists) return {skipped:true, reason:'daily_backup_already_exists', label};
  return await backup(label, 'daily');
}

async function criticalBackup(reason){
  return await backup('critical_' + (reason || 'acao') + '_' + now(), 'critical');
}

async function smartBackup(reason){
  const elapsed = Date.now() - lastBackupAt;
  let s = ensure();
  const hist = arr(s.backup.historico);
  const last = hist[hist.length-1];
  if(last && last.createdAt){
    const lastTime = new Date(last.createdAt).getTime();
    if(!Number.isNaN(lastTime) && Date.now() - lastTime < SMART_BACKUP_MIN_INTERVAL_MS){
      return {skipped:true, reason:'min_interval', nextAllowedInMs:SMART_BACKUP_MIN_INTERVAL_MS-(Date.now()-lastTime)};
    }
  } else if(lastBackupAt && elapsed < SMART_BACKUP_MIN_INTERVAL_MS){
    return {skipped:true, reason:'min_interval', nextAllowedInMs:SMART_BACKUP_MIN_INTERVAL_MS-elapsed};
  }
  return await backup('smart_' + (reason || 'periodic') + '_' + now(), 'smart');
}

async function pruneBackups(){
  let s = ensure();
  s.backup.historico = arr(s.backup.historico);
  if(s.backup.historico.length > MAX_VERSIONED_BACKUPS){
    s.backup.historico = s.backup.historico.slice(-MAX_VERSIONED_BACKUPS);
    g.STATE = s;
    if(g.StorageAdapter && typeof g.StorageAdapter.save === 'function') await g.StorageAdapter.save(s);
  }
  if(g.StorageAdapter && typeof g.StorageAdapter.listBackups === 'function'){
    try{
      const list = await g.StorageAdapter.listBackups();
      const excess = arr(list).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt))).slice(0, Math.max(0, list.length - MAX_VERSIONED_BACKUPS));
      if(g.StorageAdapter.openDB && excess.length){
        // physical pruning is intentionally conservative; metadata pruning already enforced.
      }
      return {metadataCount:s.backup.historico.length, physicalCount:list.length, max:MAX_VERSIONED_BACKUPS};
    }catch(e){}
  }
  return {metadataCount:s.backup.historico.length, max:MAX_VERSIONED_BACKUPS};
}

async function beforeImport(){
  return await criticalBackup('before_import');
}

async function beforeReset(){
  return await criticalBackup('before_reset');
}

async function afterOrcamentoFinalizado(){
  markDirty('orcamento_finalizado');
  return await smartBackup('orcamento_finalizado');
}

async function afterPagamento(){
  markDirty('pagamento');
  return await smartBackup('pagamento');
}

async function startup(){
  ensure();
  await dailyBackup().catch(function(){});
  if(typeof document !== 'undefined'){
    document.addEventListener('visibilitychange', function(){
      if(document.visibilityState === 'hidden'){
        flush('visibility_hidden').catch(function(){});
      }
    });
  }
  if(typeof window !== 'undefined'){
    window.addEventListener('beforeunload', function(){
      try{
        if(dirty && g.STATE) localStorage.setItem('OficinaOS', JSON.stringify(g.STATE));
      }catch(e){}
    });
  }
  return status();
}

function status(){
  const s = ensure();
  return {
    version: VERSION,
    enabled: s.autosave.enabled !== false,
    dirty,
    delayMs: AUTOSAVE_DELAY_MS,
    maxVersionedBackups: MAX_VERSIONED_BACKUPS,
    smartBackupMinIntervalMs: SMART_BACKUP_MIN_INTERVAL_MS,
    lastSaveAt: s.autosave.lastSaveAt || '',
    lastBackupAt: s.autosave.lastBackupAt || '',
    backupCount: arr(s.backup.historico).length,
    pendingReason: s.autosave.pendingReason || '',
    storage: obj(s.storage).engine || 'pending',
    checkedAt: now()
  };
}

function configure(options){
  let s = ensure();
  options = obj(options);
  if(typeof options.enabled === 'boolean') s.autosave.enabled = options.enabled;
  g.STATE = s;
  markDirty('autosave_config');
  return status();
}

function wrapCoreMutations(){
  const wrap = function(objName, fnName, reason){
    const target = g[objName];
    if(!target || typeof target[fnName] !== 'function' || target[fnName].__autosaveWrapped) return false;
    const original = target[fnName];
    target[fnName] = function(){
      const result = original.apply(this, arguments);
      try{ markDirty(reason || (objName+'.'+fnName)); }catch(e){}
      return result;
    };
    target[fnName].__autosaveWrapped = true;
    return true;
  };
  const wrapped = [];
  [
    ['ClientesCore','upsert','cliente_salvo'],
    ['ClientesCore','addVeiculo','veiculo_salvo'],
    ['ClientesCore','remover','cliente_removido'],
    ['OrcamentoCore','upsert','orcamento_salvo'],
    ['OrcamentoCore','approve','orcamento_aprovado'],
    ['OrcamentoCore','addPhoto','foto_orcamento'],
    ['AgendaCore','criar','agenda_criada'],
    ['AgendaCore','atualizar','agenda_atualizada'],
    ['AgendaCore','setStatus','agenda_status'],
    ['AgendaCore','avancarEtapa','agenda_etapa'],
    ['FinanceiroCore','addLancamento','financeiro_lancamento'],
    ['FinanceiroCore','updateLancamento','financeiro_lancamento_editado'],
    ['FinanceiroCore','removeLancamento','financeiro_lancamento_removido'],
    ['FinanceiroCore','addConta','conta_criada'],
    ['FinanceiroCore','pagarConta','conta_paga'],
    ['FinanceiroCore','desfazerPagamentoConta','conta_pagamento_desfeito'],
    ['MetasCore','criar','meta_criada'],
    ['MetasCore','atualizar','meta_atualizada'],
    ['AdminShell','configuracoesSet','configuracoes_atualizadas'],
    ['OperationalFlow','criarAtendimento','fluxo_criado'],
    ['OperationalFlow','concluir','fluxo_concluido']
  ].forEach(x=>{
    if(wrap(x[0],x[1],x[2])) wrapped.push(x[0]+'.'+x[1]);
  });
  return wrapped;
}

g.AutoSaveSmartBackup = {
  version: VERSION,
  AUTOSAVE_DELAY_MS,
  SMART_BACKUP_MIN_INTERVAL_MS,
  MAX_VERSIONED_BACKUPS,
  ensure,
  markDirty,
  flush,
  backup,
  dailyBackup,
  smartBackup,
  criticalBackup,
  beforeImport,
  beforeReset,
  afterOrcamentoFinalizado,
  afterPagamento,
  pruneBackups,
  status,
  configure,
  wrapCoreMutations,
  startup
};

setTimeout(function(){
  wrapCoreMutations();
  startup().catch(function(err){ console.warn('AutoSave startup falhou:', err); });
}, 0);

})(window);

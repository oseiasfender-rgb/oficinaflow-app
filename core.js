/*
OficinaOS V549.00 — CORE
Núcleo único de estado, persistência, backup e integração entre módulos.
Sem dados fictícios. Sem demo. Sem seed.
*/

(function(){
  "use strict";

  const STORAGE_KEY = "OFICINAOS_V549_STATE";
  const VERSION = "V549.00";

  const EMPTY_STATE = {
    meta: {
      app: "OficinaOS",
      version: VERSION,
      createdAt: null,
      updatedAt: null
    },
    configuracoes: {
      empresa: "",
      responsavel: "",
      cidade: "",
      telefone: "",
      cnpj: "",
      tema: "claro"
    },
    financeiro: {
      lancamentos: [],
      contas: [],
      recibos: []
    },
    agenda: {
      os: [],
      eventos: []
    },
    clientes: [],
    orcamentos: [],
    metas: [],
    relatorios: {},
    ia: {
      alertas: [],
      prioridades: [],
      recomendacoes: [],
      resumo: ""
    },
    logs: []
  };

  function clone(obj){
    return JSON.parse(JSON.stringify(obj));
  }

  function nowISO(){
    return new Date().toISOString();
  }

  function currentMonth(){
    return new Date().toISOString().slice(0, 7);
  }

  function uid(prefix="ID"){
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const day = String(d.getDate()).padStart(2,"0");
    const t = Date.now().toString().slice(-6);
    return `${prefix}-${y}${m}${day}-${t}`;
  }

  function ensureShape(state){
    const next = Object.assign(clone(EMPTY_STATE), state || {});
    next.meta = Object.assign(clone(EMPTY_STATE.meta), next.meta || {});
    next.configuracoes = Object.assign(clone(EMPTY_STATE.configuracoes), next.configuracoes || {});
    next.financeiro = Object.assign(clone(EMPTY_STATE.financeiro), next.financeiro || {});
    next.agenda = Object.assign(clone(EMPTY_STATE.agenda), next.agenda || {});
    next.ia = Object.assign(clone(EMPTY_STATE.ia), next.ia || {});

    if(!Array.isArray(next.financeiro.lancamentos)) next.financeiro.lancamentos = [];
    if(!Array.isArray(next.financeiro.contas)) next.financeiro.contas = [];
    if(!Array.isArray(next.financeiro.recibos)) next.financeiro.recibos = [];
    if(!Array.isArray(next.agenda.os)) next.agenda.os = [];
    if(!Array.isArray(next.agenda.eventos)) next.agenda.eventos = [];
    if(!Array.isArray(next.clientes)) next.clientes = [];
    if(!Array.isArray(next.orcamentos)) next.orcamentos = [];
    if(!Array.isArray(next.metas)) next.metas = [];
    if(!Array.isArray(next.logs)) next.logs = [];

    next.meta.app = "OficinaOS";
    next.meta.version = VERSION;
    next.meta.createdAt = next.meta.createdAt || nowISO();
    next.meta.updatedAt = nowISO();
    return next;
  }

  function setState(state){
    window.OFICINAOS = ensureShape(state);
    return window.OFICINAOS;
  }

  function getState(){
    if(!window.OFICINAOS) setState(clone(EMPTY_STATE));
    return window.OFICINAOS;
  }

  function save(){
    const state = ensureShape(getState());
    state.meta.updatedAt = nowISO();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.OFICINAOS = state;
    return state;
  }

  function load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw){
        return setState(clone(EMPTY_STATE));
      }
      return setState(JSON.parse(raw));
    }catch(err){
      console.error("OficinaOS load() falhou:", err);
      return setState(clone(EMPTY_STATE));
    }
  }

  function log(action, payload={}){
    const state = getState();
    state.logs.push({
      id: uid("LOG"),
      at: nowISO(),
      action,
      payload
    });
    save();
  }

  function exportJSON(filename){
    const state = save();
    const blob = new Blob([JSON.stringify(state, null, 2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename || `backup-oficinaos-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
  }

  function importJSON(file){
    return new Promise((resolve, reject)=>{
      const reader = new FileReader();
      reader.onload = () => {
        try{
          const parsed = JSON.parse(reader.result);
          const state = setState(parsed);
          save();
          log("IMPORT_JSON", {filename:file.name || ""});
          resolve(state);
        }catch(err){
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function reset(){
    localStorage.removeItem(STORAGE_KEY);
    return setState(clone(EMPTY_STATE));
  }

  function migrateLegacy(){
    /*
      Migração segura: não apaga nada antigo.
      Apenas tenta ler chaves antigas conhecidas e copiar dados se existirem.
    */
    const state = getState();
    const keys = Object.keys(localStorage);
    const legacy = [];

    keys.forEach(key=>{
      if(key === STORAGE_KEY) return;
      if(!/oficinaos|OFICINA|agenda|financeiro|clientes|metas|orcamento/i.test(key)) return;
      try{
        const parsed = JSON.parse(localStorage.getItem(key));
        if(parsed) legacy.push({key, parsed});
      }catch(e){}
    });

    legacy.forEach(item=>{
      const data = item.parsed;
      const fin = data.financeiro?.lancamentos || data.lancamentos || data.transacoes || [];
      const os = data.agenda?.os || data.os || data.eventos || [];
      const orcs = data.orcamentos || data.orcamento?.historico || [];
      const clientes = data.clientes || [];
      const metas = data.metas || [];

      if(Array.isArray(fin)) state.financeiro.lancamentos.push(...fin);
      if(Array.isArray(os)) state.agenda.os.push(...os);
      if(Array.isArray(orcs)) state.orcamentos.push(...orcs);
      if(Array.isArray(clientes)) state.clientes.push(...clientes);
      if(Array.isArray(metas)) state.metas.push(...metas);
    });

    log("MIGRATE_LEGACY", {sources: legacy.map(x=>x.key)});
    return save();
  }

  function getResumo(){
    const state = getState();
    const mes = currentMonth();
    const lanc = state.financeiro.lancamentos || [];
    const doMes = lanc.filter(x => String(x.data || x.vencimento || "").slice(0,7) === mes);
    const receitas = doMes.filter(x => String(x.tipo).toLowerCase() === "receita")
      .reduce((s,x)=>s + Number(x.valor || x.total || 0), 0);
    const despesas = doMes.filter(x => String(x.tipo).toLowerCase() === "despesa")
      .reduce((s,x)=>s + Number(x.valor || x.total || 0), 0);
    const abertas = (state.agenda.os || []).filter(x => !/entregue|finalizado|cancelado/i.test(String(x.status || ""))).length;
    return {
      mes,
      receitas,
      despesas,
      lucro: receitas - despesas,
      osAbertas: abertas,
      clientes: state.clientes.length,
      orcamentos: state.orcamentos.length
    };
  }

  window.OficinaOSCore = {
    STORAGE_KEY,
    VERSION,
    EMPTY_STATE,
    uid,
    currentMonth,
    getState,
    setState,
    save,
    load,
    log,
    reset,
    exportJSON,
    importJSON,
    migrateLegacy,
    getResumo
  };

  load();
})();

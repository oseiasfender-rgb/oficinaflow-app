(function(g){'use strict';const VERSION='V700.50';let q=Promise.resolve(),started=false;const S=()=>g.OficinaOSState700,E=()=>g.OficinaOSEvents700,D=()=>g.OficinaOSIndexedDB700,I=()=>g.OficinaOSIds700;
async function start(){
  await D().open();

  let saved=await D().get(D().STATE_KEY);

  const isEmpty=!saved||(
    (!Array.isArray(saved.clientes)||saved.clientes.length===0)&&
    (!Array.isArray(saved.orcamentos)||saved.orcamentos.length===0)&&
    (!saved.agenda||!Array.isArray(saved.agenda.os)||saved.agenda.os.length===0)&&
    (!saved.financeiro||!Array.isArray(saved.financeiro.lancamentos)||saved.financeiro.lancamentos.length===0)
  );

  if(isEmpty&&g.OficinaOSRealBackup700&&g.OficinaOSRealBackup700.payload){
    const migrated=migrateImportedState(g.OficinaOSRealBackup700.payload);
    const normalized=S().normalize(migrated);
    saved=await D().atomicReplace(normalized,D().STATE_KEY);
  }

  S().replace(saved||S().EMPTY_STATE);
  started=true;

  E().emit("CORE_READY",{state:getState()});
  E().emit("STATE_CHANGED",{state:getState(),action:"CORE_STARTED"});

  return health();
}
function persist(action,payload){S().audit(action,payload);const snap=S().clone(S().get());q=q.then(()=>D().atomicReplace(snap,D().STATE_KEY)).then(()=>{E().emit('STATE_CHANGED',{state:getState(),action});return snap});return q}
function update(fn,a,p){S().update(fn);return persist(a||'STATE_UPDATED',p||{})} function replaceState(v,a){S().replace(v);return persist(a||'STATE_REPLACED',{})} function getState(){return S().clone(S().get())} function subscribe(fn){return E().on('STATE_CHANGED',p=>fn(p.state,p))}
function createCliente(x){const c=Object.assign({id:I().next('CLI'),nome:'',veiculos:[],historico:[]},x||{});return update(d=>(d.clientes.push(c),d),'CLIENT_CREATED',{id:c.id}).then(()=>c)}
function createOrcamento(x){const o=Object.assign({id:I().next('ORC'),numero:'',status:'Aberto',total:0},x||{});o.numero=o.numero||o.id;return update(d=>(d.orcamentos.push(o),d),'ORC_CREATED',{id:o.id}).then(()=>o)}
function approveOrcamento(id){let r;return update(d=>{const o=d.orcamentos.find(x=>x.id===id);if(!o)throw Error('Orçamento não encontrado');o.status='Aprovado';let os=d.agenda.os.find(x=>x.orcamentoId===id);if(!os){os={id:I().next('OS'),orcamentoId:id,cliente:o.cliente||'',veiculo:o.veiculo||'',status:'Agendado',etapa:'Entrada',valor:Number(o.total||0)};d.agenda.os.push(os)}let f=d.financeiro.lancamentos.find(x=>x.orcamentoId===id);if(!f){f={id:I().next('FIN'),orcamentoId:id,osId:os.id,tipo:'receita',descricao:'Orçamento aprovado',valor:Number(o.total||0),status:'pendente'};d.financeiro.lancamentos.push(f)}r={orcamento:o,os,financeiro:f};return d},'ORC_APPROVED',{id}).then(()=>r)}

function upsertOrcamento(data){
  const input=Object.assign({},data||{});
  let result;
  return update(d=>{
    const existing=input.id?d.orcamentos.find(x=>x.id===input.id):null;
    if(existing){
      Object.assign(existing,input);
      result=existing;
    }else{
      input.id=I().ensure(input.id,"ORC");
      input.numero=input.numero&&!String(input.numero).includes("null")?input.numero:input.id;
      input.status=input.status||"Aberto";
      input.total=Number(input.total||0);
      d.orcamentos.push(input);
      result=input;
    }
    return d;
  },"ORC_UPSERT",{id:input.id}).then(()=>result);
}
function finishOS(id,options){
  const opts=options||{};
  let result;
  return update(d=>{
    const os=d.agenda.os.find(x=>x.id===id);
    if(!os)throw Error("OS não encontrada");
    os.status="Entregue";
    os.etapa="Entregue";
    os.entrega=opts.data||new Date().toISOString().slice(0,10);
    if(Array.isArray(opts.fotos))os.fotos=opts.fotos;
    let f=d.financeiro.lancamentos.find(x=>x.osId===os.id);
    if(!f){
      f={
        id:I().next("FIN"),osId:os.id,orcamentoId:os.orcamentoId||"",
        tipo:"receita",descricao:"Entrega finalizada - "+(os.cliente||os.id),
        valor:Number(opts.valor??os.valor??0),categoria:"Serviço",
        data:os.entrega,vencimento:os.entrega,status:"pendente",
        origem:"OS_FINALIZADA"
      };
      d.financeiro.lancamentos.push(f);
    }
    result={os,financeiro:f};
    return d;
  },"OS_FINISHED",{id}).then(()=>result);
}
function upsertAgendaOS(os){
  let result;
  return update(d=>{
    const i=d.agenda.os.findIndex(x=>x.id===os.id);
    if(i>=0)d.agenda.os[i]=Object.assign({},d.agenda.os[i],os);
    else d.agenda.os.push(os);
    result=i>=0?d.agenda.os[i]:os;
    return d;
  },"AGENDA_OS_UPSERT",{id:os.id}).then(()=>result);
}
function replaceFinanceiro(lancamentos,contas){
  return update(d=>{
    d.financeiro.lancamentos=Array.isArray(lancamentos)?lancamentos:[];
    if(Array.isArray(contas))d.financeiro.contas=contas;
    return d;
  },"FINANCEIRO_REPLACED",{total:Array.isArray(lancamentos)?lancamentos.length:0});
}
function updateMetas(metas){
  return update(d=>{
    d.metas=Object.assign({},d.metas,metas||{});
    d.metas.categorias=Array.isArray(d.metas.categorias)?d.metas.categorias:[];
    return d;
  },"METAS_UPDATED",{});
}

function exportJSON(){const p={schema:'OFICINAOS_V700_JSON',version:VERSION,exportedAt:new Date().toISOString(),state:getState()},b=new Blob([JSON.stringify(p,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='oficinaos-v700.json';a.click();return p}

function firstArray(){
  for(let i=0;i<arguments.length;i++){
    if(Array.isArray(arguments[i]))return arguments[i];
  }
  return [];
}
function unwrapJSON(payload){
  if(!payload||typeof payload!=="object")return null;
  return payload.state||payload.data||payload.backup||payload.oficinaos||payload;
}
function migrateImportedState(payload){
  const raw=unwrapJSON(payload);
  if(!raw||typeof raw!=="object")throw Error("O arquivo não contém um objeto JSON válido.");

  const clientes=firstArray(
    raw.clientes,
    raw.crm&&raw.crm.clientes,
    raw.STATE&&raw.STATE.clientes
  );

  const orcamentos=firstArray(
    raw.orcamentos,
    raw.orcamento&&raw.orcamento.historico,
    raw.orcamento&&raw.orcamento.lista,
    raw.historicoOrcamentos,
    raw.STATE&&raw.STATE.orcamentos
  ).map(item=>{
    if(item&&item.snapshot)return item.snapshot;
    return item;
  }).filter(Boolean);

  const agendaOS=firstArray(
    raw.agenda&&raw.agenda.os,
    raw.agenda&&raw.agenda.eventos,
    raw.os,
    raw.ordensServico,
    raw.STATE&&raw.STATE.agenda&&raw.STATE.agenda.os
  );

  const lancamentos=firstArray(
    raw.financeiro&&raw.financeiro.lancamentos,
    raw.financeiro&&raw.financeiro.transacoes,
    raw.lancamentos,
    raw.transacoes,
    raw.STATE&&raw.STATE.financeiro&&raw.STATE.financeiro.lancamentos
  );

  const contas=firstArray(
    raw.financeiro&&raw.financeiro.contas,
    raw.contas,
    raw.contasPagar,
    raw.STATE&&raw.STATE.financeiro&&raw.STATE.financeiro.contas
  );

  const metas=raw.metas&&typeof raw.metas==="object"
    ? raw.metas
    : raw.STATE&&raw.STATE.metas&&typeof raw.STATE.metas==="object"
      ? raw.STATE.metas
      : {};

  const ia=raw.ia&&typeof raw.ia==="object"
    ? raw.ia
    : raw.STATE&&raw.STATE.ia&&typeof raw.STATE.ia==="object"
      ? raw.STATE.ia
      : {};

  const migrated={
    meta:Object.assign({},raw.meta||{},{
      app:"OficinaOS",
      version:"V700.50",
      importedAt:new Date().toISOString()
    }),
    clientes,
    veiculos:firstArray(raw.veiculos),
    orcamentos,
    agenda:{
      os:agendaOS,
      eventos:firstArray(raw.agenda&&raw.agenda.eventos)
    },
    financeiro:{
      lancamentos,
      contas,
      recibos:firstArray(raw.financeiro&&raw.financeiro.recibos,raw.recibos)
    },
    metas,
    relatorios:raw.relatorios&&typeof raw.relatorios==="object"?raw.relatorios:{cache:{}},
    ia,
    auditoria:firstArray(raw.auditoria,raw.audit)
  };

  const recognized=
    migrated.clientes.length+
    migrated.orcamentos.length+
    migrated.agenda.os.length+
    migrated.financeiro.lancamentos.length+
    migrated.financeiro.contas.length+
    (Object.keys(migrated.metas||{}).length?1:0);

  if(recognized===0){
    throw Error(
      "Nenhum dado reconhecido no JSON. "+
      "O arquivo precisa conter clientes, orçamentos, agenda, financeiro, contas ou metas."
    );
  }

  return migrated;
}
function importSummary(state){
  return {
    clientes:Array.isArray(state.clientes)?state.clientes.length:0,
    orcamentos:Array.isArray(state.orcamentos)?state.orcamentos.length:0,
    agenda:state.agenda&&Array.isArray(state.agenda.os)?state.agenda.os.length:0,
    lancamentos:state.financeiro&&Array.isArray(state.financeiro.lancamentos)?state.financeiro.lancamentos.length:0,
    contas:state.financeiro&&Array.isArray(state.financeiro.contas)?state.financeiro.contas.length:0,
    metas:state.metas&&typeof state.metas==="object"?Object.keys(state.metas).length:0
  };
}
async function importJSON(payload){
  const migrated=migrateImportedState(payload);
  const normalized=S().normalize(migrated);

  const confirmed=await D().atomicReplace(
    S().clone(normalized),
    D().STATE_KEY
  );

  S().replace(confirmed);
  S().audit("JSON_IMPORTED",importSummary(S().get()));

  const audited=await D().atomicReplace(
    S().clone(S().get()),
    D().STATE_KEY
  );

  S().replace(audited);

  E().emit("STATE_CHANGED",{
    state:getState(),
    action:"JSON_IMPORTED",
    summary:importSummary(S().get())
  });

  return {
    state:getState(),
    summary:importSummary(S().get())
  };
}
async function loadRealBackup(){
  if(!g.OficinaOSRealBackup700||!g.OficinaOSRealBackup700.payload){
    throw Error("O backup real interno não foi encontrado.");
  }

  return importJSON(g.OficinaOSRealBackup700.payload);
}
function importFile(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=async()=>{try{res(await importJSON(JSON.parse(r.result)))}catch(e){rej(e)}};r.onerror=rej;r.readAsText(file)})}
function health(){return{ok:S().health().ok&&E().health().ok&&D().health().ok&&I().health().ok,version:VERSION,started}}
const api={VERSION,start,persist,update,replaceState,getState,subscribe,createCliente,createOrcamento,upsertOrcamento,approveOrcamento,finishOS,upsertAgendaOS,replaceFinanceiro,updateMetas,exportJSON,migrateImportedState,importSummary,importJSON,loadRealBackup,importFile,health};g.OficinaOSCore700=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;})(typeof window!=='undefined'?window:globalThis);
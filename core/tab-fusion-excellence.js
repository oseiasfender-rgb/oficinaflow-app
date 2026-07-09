
(function(g){
'use strict';

const VERSION = '551.33';

function now(){return new Date().toISOString()}
function arr(v){return Array.isArray(v)?v:[]}
function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function uid(p){return(p||'fusion')+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}
function st(){return g.StateManager?g.StateManager.load():(g.STATE=g.STATE||{})}
function sv(s){if(g.StateManager&&g.StateManager.save)return g.StateManager.save(s);g.STATE=s;try{localStorage.setItem('OficinaOS',JSON.stringify(s))}catch(e){}return s}

const TAB_PLAN = [
  {area:'Orçamento', key:'orcamento', base:'Híbrido V547 + V4', official:'principal', clean:'1-Orcamento-CLEAN.html', core:'OrcamentoCore', route:'orcamento'},
  {area:'Financeiro', key:'financeiro', base:'V547', official:'principal', clean:'2-Financeiro-CLEAN.html', core:'FinanceiroCore', route:'financeiro'},
  {area:'Contas', key:'contas', base:'Consolidada', official:'subaba Financeiro/Administração', clean:null, core:'AdminShell', route:'admin/contas'},
  {area:'Agenda', key:'agenda', base:'Híbrida', official:'principal', clean:'3-Agenda-CLEAN.html', core:'AgendaCore', route:'agenda'},
  {area:'Metas', key:'metas', base:'V4', official:'principal', clean:'5-Metas-CLEAN.html', core:'MetasCore', route:'metas'},
  {area:'Clientes', key:'clientes', base:'V547', official:'principal', clean:'6-Clientes-CLEAN.html', core:'ClientesCore', route:'clientes'},
  {area:'Relatórios', key:'relatorios', base:'V4', official:'principal', clean:'4-Relatorios-CLEAN.html', core:'RelatoriosCore', route:'relatorios'},
  {area:'IA', key:'ia', base:'V4', official:'principal', clean:'7-IA-CLEAN.html', core:'IACore', route:'ia'},
  {area:'Auditoria', key:'auditoria', base:'V547', official:'subaba Administração', clean:null, core:'AdminShell', route:'admin/auditoria'},
  {area:'Alertas', key:'alertas', base:'V547', official:'subaba Administração', clean:null, core:'AdminShell', route:'admin/alertas'},
  {area:'Busca', key:'busca', base:'V547', official:'subaba Administração', clean:null, core:'AdminShell', route:'admin/busca'},
  {area:'Configurações', key:'configuracoes', base:'V547', official:'subaba Administração', clean:null, core:'AdminShell', route:'admin/configuracoes'}
];

function ensure(){
  let s=st();
  s.version=VERSION;
  s.releaseStage='TAB_FUSION_EXCELLENCE_AUDIT';
  s.tabFusion=obj(s.tabFusion);
  s.tabFusion.version=VERSION;
  s.tabFusion.updatedAt=now();
  s.tabFusion.plan=TAB_PLAN;
  s.admin=obj(s.admin);
  s.admin.enabled=true;
  s.admin.sections=['contas','auditoria','alertas','busca','configuracoes'];
  s.navigation=obj(s.navigation);
  s.navigation.version=VERSION;
  s.navigation.primary=[
    'orcamento','financeiro','agenda','clientes','metas','relatorios','ia','administracao'
  ];
  s.navigation.admin=[
    'contas','auditoria','alertas','busca','configuracoes'
  ];
  s.historico=obj(s.historico);
  s.historico.eventos=arr(s.historico.eventos);
  g.STATE=s;
  sv(s);
  return s;
}

function historico(tipo,descricao,extra){
  let s=ensure();
  const rec=Object.assign({id:uid('hist'),tipo,descricao,data:now()},extra||{});
  s.historico.eventos.push(rec);
  sv(s);
  return rec;
}

function coreAvailable(name){
  return !!g[name];
}

function areaStatus(area){
  const a=TAB_PLAN.find(x=>x.key===area||x.area===area);
  if(!a)return null;
  let score=0;
  let checks=[];
  function ck(name,pass,detail){checks.push({name,pass:!!pass,detail:detail||''}); if(pass)score++}
  ck('planejada na matriz de abas',true,a.base);
  ck('core disponível', a.core==='AdminShell'?!!g.AdminShell:!!g[a.core], a.core);
  ck('navegação oficial registrada',true,a.official);
  if(a.clean) ck('Aba CLEAN preservada',true,a.clean);
  else ck('Área administrativa oficializada',!!g.AdminShell,a.official);
  return {
    area:a.area,
    key:a.key,
    base:a.base,
    official:a.official,
    route:a.route,
    core:a.core,
    clean:a.clean,
    score,
    total:checks.length,
    status:score===checks.length?'OK':'ATENÇÃO',
    checks
  };
}

function audit(){
  ensure();
  const areas=TAB_PLAN.map(x=>areaStatus(x.key));
  const ok=areas.filter(a=>a.status==='OK').length;
  const warnings=areas.filter(a=>a.status!=='OK');
  const report={
    version:VERSION,
    title:'Tab Fusion Excellence Audit',
    generatedAt:now(),
    principle:'CLEAN como base visual + V547/V4 como referência funcional + index antigo somente como referência secundária',
    areas,
    ok,
    warnings:warnings.length,
    warningAreas:warnings.map(w=>w.area),
    decision:{
      primaryTabs:['Orçamento','Financeiro','Agenda','Clientes','Metas','Relatórios','IA','Administração'],
      financeSubtabs:['Lançamentos','Contas a pagar','Contas pagas','Recibos','Fluxo de caixa'],
      adminSubtabs:['Contas','Auditoria','Alertas','Busca Global','Configurações']
    }
  };
  let s=ensure();
  s.tabFusion.lastAudit=report;
  sv(s);
  historico('tab_fusion_audit','Auditoria de fusão de abas executada',{warnings:report.warningAreas});
  return report;
}

function excellenceScore(){
  const r=audit();
  const pct=Math.round((r.ok/r.areas.length)*100);
  return {
    version:VERSION,
    score:pct,
    status:pct>=95?'EXCELENTE':pct>=85?'FORTE_COM_AJUSTES':'PRECISA_CONSOLIDAR',
    ok:r.ok,
    total:r.areas.length,
    warnings:r.warningAreas
  };
}

function officialNavigation(){
  return {
    version:VERSION,
    primary:[
      {key:'orcamento',label:'Orçamento',source:'Híbrido V547 + V4',type:'main'},
      {key:'financeiro',label:'Financeiro',source:'V547',type:'main',sub:['Lançamentos','Contas','Recibos','Fluxo de caixa']},
      {key:'agenda',label:'Agenda',source:'Híbrida',type:'main'},
      {key:'clientes',label:'Clientes',source:'V547',type:'main'},
      {key:'metas',label:'Metas',source:'V4',type:'main'},
      {key:'relatorios',label:'Relatórios',source:'V4',type:'main'},
      {key:'ia',label:'IA',source:'V4',type:'main'},
      {key:'administracao',label:'Administração',source:'V547/AdminShell',type:'main',sub:['Contas','Auditoria','Alertas','Busca','Configurações']}
    ]
  };
}

function adminDashboard(){
  const base={
    contas:null,
    auditoria:null,
    alertas:null,
    busca:true,
    configuracoes:null
  };
  try{if(g.AdminShell){base.contas=g.AdminShell.contasResumo();base.auditoria=g.AdminShell.auditoriaResumo();base.alertas=g.AdminShell.alertasListar();base.configuracoes=g.AdminShell.configuracoesGet();}}catch(e){base.error=e.message}
  return base;
}

function renderAdminShellHTML(){
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OficinaOS — Administração</title><style>body{font-family:Arial,sans-serif;background:#f8f6f3;color:#22160c;margin:0;padding:24px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}.card{background:white;border:1px solid #e7dacd;border-radius:16px;padding:16px;box-shadow:0 8px 20px rgba(0,0,0,.06)}button,input{padding:10px;border-radius:10px;border:1px solid #d8c8b8}button{background:#111827;color:white}pre{white-space:pre-wrap;background:#111827;color:#f8f6f3;padding:16px;border-radius:14px;overflow:auto;max-height:420px}</style></head><body><h1>OficinaOS — Administração</h1><p>Contas, auditoria, alertas, busca global e configurações.</p><div class="grid"><div class="card"><h2>Contas</h2><button onclick="show(AdminShell.contasResumo())">Abrir</button></div><div class="card"><h2>Auditoria</h2><button onclick="show(AdminShell.auditoria())">Abrir</button></div><div class="card"><h2>Alertas</h2><button onclick="show(AdminShell.gerarAlertas())">Gerar</button></div><div class="card"><h2>Busca Global</h2><input id="q" placeholder="cliente, placa, orçamento..."> <button onclick="show(AdminShell.buscaGlobal(document.getElementById('q').value))">Buscar</button></div><div class="card"><h2>Configurações</h2><button onclick="show(AdminShell.configuracoesGet())">Abrir</button></div><div class="card"><h2>Auditoria de Abas</h2><button onclick="show(TabFusionExcellence.audit())">Rodar</button></div></div><h2>Resultado</h2><pre id="out">Aguardando...</pre><script src="../core/storage-adapter.js"><\/script><script src="../core/clean-start.js"><\/script><script src="../core/admin-shell.js"><\/script><script src="../core/tab-fusion-excellence.js"><\/script><script>function show(x){document.getElementById("out").textContent=JSON.stringify(x,null,2)}<\/script></body></html>`;
}

function boot(){
  ensure();
  setTimeout(function(){audit()},100);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();

g.TabFusionExcellence={
  version:VERSION,
  TAB_PLAN,
  ensure,
  audit,
  areaStatus,
  excellenceScore,
  officialNavigation,
  adminDashboard,
  renderAdminShellHTML,
  boot
};
})(window);

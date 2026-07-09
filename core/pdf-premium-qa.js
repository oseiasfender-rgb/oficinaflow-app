
(function(g){
'use strict';

const VERSION='551.37';

function now(){return new Date().toISOString()}
function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function arr(v){return Array.isArray(v)?v:[]}
function clean(v){return String(v??'').trim()}
function st(){return g.StateManager?g.StateManager.load():(g.STATE=g.STATE||{})}
function sv(s){if(g.StateManager&&g.StateManager.save)return g.StateManager.save(s);g.STATE=s;try{localStorage.setItem('OficinaOS',JSON.stringify(s))}catch(e){}return s}

const REQUIRED_COMPANY_FIELDS=[
  'nome',
  'responsavel',
  'telefone',
  'cnpj',
  'endereco',
  'cidade'
];

const REQUIRED_BUDGET_FIELDS=[
  'numero',
  'data',
  'cliente',
  'veiculo',
  'descricao',
  'complexidade',
  'prioridade',
  'total'
];

const PREMIUM_PDF_REQUIREMENTS=[
  {key:'empresa_nome', label:'Nome LIMAPRATA/Reparações Automotivas'},
  {key:'orcamento_numero', label:'Orçamento Nº'},
  {key:'data', label:'Data do orçamento'},
  {key:'endereco', label:'Endereço completo'},
  {key:'responsavel', label:'Responsável'},
  {key:'telefone', label:'Telefone/WhatsApp'},
  {key:'cnpj', label:'CNPJ'},
  {key:'cliente', label:'Cliente'},
  {key:'veiculo', label:'Veículo'},
  {key:'descricao_servico', label:'Descrição do serviço'},
  {key:'complexidade', label:'Nível de complexidade'},
  {key:'prioridade', label:'Prioridade'},
  {key:'servicos_materiais', label:'Serviços e materiais'},
  {key:'total_geral', label:'Total geral'},
  {key:'garantia', label:'Garantia'},
  {key:'assinatura', label:'Assinatura do cliente/responsável'},
  {key:'visual_premium', label:'Visual premium com contraste e hierarquia'},
  {key:'rodape', label:'Rodapé profissional'}
];

function ensure(){
  let s=st();
  s.version=VERSION;
  s.releaseStage='PDF_PREMIUM_FINAL_VERIFICATION';
  s.pdfQA=obj(s.pdfQA);
  s.pdfQA.version=VERSION;
  s.pdfQA.lastRun=s.pdfQA.lastRun||'';
  s.updatedAt=now();
  sv(s);
  return s;
}

function getEmpresa(){
  const s=ensure();
  const cfg=obj(s.configuracoes);
  return Object.assign({nome:'',responsavel:'',telefone:'',cnpj:'',endereco:'',cidade:''},
    obj(s.empresa),
    obj(cfg.empresa)
  );
}

function sampleBudget(){
  return {
    numero:'',
    data:new Date().toLocaleDateString('pt-BR'),
    cliente:'',
    telefone:'',
    veiculo:'',
    placa:'',
    descricao:'',
    complexidade:'',
    prioridade:'',
    servicos:[],
    pecas:[],
    materiais:[],
    garantia:'',
    total:0,
    validadeDias:null
  };
}

function validateCompany(empresa){
  empresa=empresa||getEmpresa();
  return REQUIRED_COMPANY_FIELDS.map(k=>({
    field:k,
    pass:!!clean(empresa[k]),
    value:empresa[k]||''
  }));
}

function validateBudget(budget){
  budget=Object.assign({},sampleBudget(),obj(budget));
  return REQUIRED_BUDGET_FIELDS.map(k=>({
    field:k,
    pass:k==='total' ? typeof budget[k]==='number' : !!clean(budget[k]),
    value:budget[k]
  }));
}

function premiumChecklistStatus(options){
  options=obj(options);
  const confirmed=obj(options.confirmed);
  return PREMIUM_PDF_REQUIREMENTS.map(item=>({
    key:item.key,
    label:item.label,
    pass:confirmed[item.key]===true,
    manual:true
  }));
}

function generatePreviewHTML(budget, empresa){
  budget=Object.assign({},sampleBudget(),obj(budget));
  empresa=Object.assign({},getEmpresa(),obj(empresa));
  const total=Number(budget.total||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const servicos=arr(budget.servicos).map(s=>'<tr><td>'+clean(s.descricao)+'</td><td>'+clean(s.qtd||1)+'</td><td>'+Number(s.valor||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})+'</td></tr>').join('');
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Orçamento Premium</title>
<style>
@page{size:A4;margin:14mm}
body{font-family:Arial,sans-serif;background:#f4efe8;color:#20150c;margin:0}
.sheet{max-width:794px;margin:0 auto;background:#fff;min-height:1123px;box-shadow:0 12px 36px rgba(0,0,0,.18)}
.header{background:linear-gradient(135deg,#23150c,#7a421f,#c28a55);color:#fff;padding:28px 34px;display:flex;justify-content:space-between;gap:24px}
.brand h1{margin:0;font-size:28px;letter-spacing:.06em}.brand p{margin:6px 0 0;color:#f8e8d6}
.num{text-align:right}.num strong{display:block;font-size:26px}.section{padding:24px 34px;border-bottom:1px solid #eadfd2}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.box{background:#fbf7f2;border:1px solid #ead8c5;border-radius:14px;padding:14px}
.label{font-size:11px;text-transform:uppercase;color:#8a5b34;letter-spacing:.08em}.value{font-size:15px;font-weight:700;margin-top:4px}
.badges span{display:inline-block;border-radius:999px;background:#2f1f15;color:#fff;padding:7px 12px;margin:4px 6px 0 0;font-size:12px}
table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#2f1f15;color:white;text-align:left;padding:10px}td{border-bottom:1px solid #eadfd2;padding:10px}
.total{font-size:30px;text-align:right;color:#7a421f;font-weight:800}
.sign{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:36px}.line{border-top:1px solid #5c4636;text-align:center;padding-top:8px;color:#5c4636}
.footer{padding:20px 34px;background:#23150c;color:#f4e2cf;font-size:12px;display:flex;justify-content:space-between}
</style>
</head>
<body>
<div class="sheet">
  <div class="header">
    <div class="brand">
      <h1>${empresa.nome}</h1>
      <p>Reparações Automotivas • ${empresa.cidade}</p>
      <p>${empresa.endereco}</p>
    </div>
    <div class="num">
      <div>ORÇAMENTO Nº</div>
      <strong>${budget.numero}</strong>
      <div>${budget.data}</div>
    </div>
  </div>

  <div class="section grid">
    <div class="box"><div class="label">Responsável</div><div class="value">${empresa.responsavel}</div></div>
    <div class="box"><div class="label">Telefone</div><div class="value">${empresa.telefone}</div></div>
    <div class="box"><div class="label">CNPJ</div><div class="value">${empresa.cnpj}</div></div>
    <div class="box"><div class="label">Cidade</div><div class="value">${empresa.cidade}</div></div>
  </div>

  <div class="section grid">
    <div class="box"><div class="label">Cliente</div><div class="value">${budget.cliente}</div></div>
    <div class="box"><div class="label">Veículo</div><div class="value">${budget.veiculo}</div></div>
  </div>

  <div class="section">
    <div class="label">Descrição do serviço</div>
    <p>${budget.descricao}</p>
    <div class="badges">
      <span>Complexidade: ${budget.complexidade}</span>
      <span>Prioridade: ${budget.prioridade}</span>
      <span>Validade: ${budget.validadeDias} dias</span>
    </div>
  </div>

  <div class="section">
    <h2>Serviços e Materiais</h2>
    <table><thead><tr><th>Descrição</th><th>Qtd</th><th>Valor</th></tr></thead><tbody>${servicos}</tbody></table>
    <p class="total">Total: ${total}</p>
  </div>

  <div class="section">
    <h2>Garantia</h2>
    <p>${budget.garantia}</p>
    <div class="sign">
      <div class="line">Assinatura do Cliente</div>
      <div class="line">${empresa.responsavel} — Responsável</div>
    </div>
  </div>

  <div class="footer">
    <span>${empresa.nome} • ${empresa.endereco} • ${empresa.cidade}</span>
    <span>Documento gerado pelo OficinaOS</span>
  </div>
</div>
</body>
</html>`;
}

function openPreview(budget, empresa){
  const html=generatePreviewHTML(budget, empresa);
  const w=window.open('', '_blank');
  if(w){w.document.open();w.document.write(html);w.document.close();}
  return html;
}

function run(options){
  ensure();
  options=obj(options);
  const empresa=Object.assign({},getEmpresa(),obj(options.empresa));
  const budget=Object.assign({},sampleBudget(),obj(options.budget));
  const company=validateCompany(empresa);
  const budgetChecks=validateBudget(budget);
  const premium=premiumChecklistStatus(options);
  const autoChecks=[
    {name:'Empresa configurada', pass:company.every(x=>x.pass), items:company},
    {name:'Orçamento com campos essenciais', pass:budgetChecks.every(x=>x.pass), items:budgetChecks},
    {name:'Preview HTML premium disponível', pass:typeof generatePreviewHTML(budget,empresa)==='string'},
    {name:'Função de impressão do navegador disponível', pass:typeof window.print==='function'},
    {name:'Configurações centralizadas disponíveis', pass:!!obj(st().configuracoes)}
  ];
  const manualPassed=premium.filter(x=>x.pass).length;
  const report={
    version:VERSION,
    status:autoChecks.every(x=>x.pass) ? 'PDF_PREMIUM_AUTO_OK' : 'PDF_PREMIUM_AUTO_WARNINGS',
    generatedAt:now(),
    autoChecks,
    manualChecklist:premium,
    manualPassed,
    manualTotal:premium.length,
    recommendation: manualPassed===premium.length ? 'PDF premium visualmente validado' : 'Abrir preview, imprimir/salvar em PDF e confirmar checklist manual'
  };
  let s=ensure();
  s.pdfQA.lastRun=now();
  s.pdfQA.lastReport=report;
  sv(s);
  return report;
}

function summary(){
  const s=ensure();
  return s.pdfQA.lastReport || {version:VERSION,status:'NOT_RUN',message:'Execute PDFPremiumQA.run()'};
}

function checklist(){
  return PREMIUM_PDF_REQUIREMENTS;
}

function renderHTML(){
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OficinaOS V551.37 — PDF Premium QA</title><style>body{font-family:Arial,sans-serif;background:#f8f6f3;color:#23180f;margin:0;padding:24px}.wrap{max-width:1100px;margin:auto}.card{background:white;border:1px solid #e8dccf;border-radius:18px;padding:18px;box-shadow:0 8px 22px rgba(0,0,0,.06);margin-bottom:16px}button,input,textarea{padding:12px;border-radius:12px;border:1px solid #d6c8b8;margin:4px 0;box-sizing:border-box}button{background:#111827;color:white;cursor:pointer}textarea{width:100%;min-height:100px}pre{background:#111827;color:#f8f6f3;padding:16px;border-radius:14px;white-space:pre-wrap;overflow:auto;max-height:620px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}</style></head><body><div class="wrap"><h1>OficinaOS V551.37 — PDF Premium Final Verification</h1><div class="card"><p>Validação final do orçamento PDF premium Limaprata antes do uso real.</p><button onclick="show(PDFPremiumQA.run())">Rodar QA automático</button><button onclick="PDFPremiumQA.openPreview()">Abrir Preview Premium</button><button onclick="show(PDFPremiumQA.checklist())">Checklist manual</button><button onclick="show(PDFPremiumQA.summary())">Resumo</button></div><pre id="out">Aguardando...</pre></div><script src="../core/storage-adapter.js"></script><script src="../core/clean-start.js"></script><script src="../core/autosave-smart-backup.js"></script><script src="../core/first-run-wizard.js"></script><script src="../core/pdf-premium-qa.js"></script><script>function show(x){document.getElementById("out").textContent=typeof x==="string"?x:JSON.stringify(x,null,2)}</script></body></html>';
}

function boot(){ensure()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();

g.PDFPremiumQA={
  version:VERSION,
  ensure,
  getEmpresa,
  sampleBudget,
  validateCompany,
  validateBudget,
  checklist,
  premiumChecklistStatus,
  generatePreviewHTML,
  openPreview,
  run,
  summary,
  renderHTML
};
})(window);

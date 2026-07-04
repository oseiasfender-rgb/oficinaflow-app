
(function(global){
'use strict';

function esc(v){
  return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
function money(v){
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
}
function css(doc){
  const color = doc?.empresa?.corPrincipal || '#b8621a';
  return `
  *{box-sizing:border-box}
  body{margin:0;background:#f8f6f3;color:#2c1a08;font-family:Arial,sans-serif}
  .doc-page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;padding:18mm;box-shadow:0 8px 24px rgba(0,0,0,.12)}
  .doc-header{display:flex;justify-content:space-between;gap:18px;border-bottom:3px solid ${color};padding-bottom:12px;margin-bottom:18px}
  .doc-header h1{margin:0;font-size:26px;letter-spacing:.08em}
  .doc-number{text-align:right;color:#6b4a2b}.doc-number strong{display:block;font-size:24px;color:${color}}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0}
  .card{border:1px solid rgba(100,60,20,.16);border-left:4px solid ${color};border-radius:8px;padding:12px;background:#fff}
  .card h3{margin:0 0 8px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:${color}}
  .row{display:flex;justify-content:space-between;border-bottom:1px solid rgba(100,60,20,.08);padding:6px 0;font-size:13px}
  .total{font-size:32px;font-weight:900;color:${color};text-align:right}
  .photo{border:1px dashed rgba(100,60,20,.16);border-radius:8px;min-height:170px;display:flex;align-items:center;justify-content:center;color:#6b4a2b;background:#faf5ee;overflow:hidden}
  .photo img{width:100%;height:100%;object-fit:cover}
  .sig{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:28px}.sig div{border-top:1px solid #2c1a08;padding-top:6px;text-align:center;font-size:12px}
  @media print{body{background:#fff}.doc-page{box-shadow:none;margin:0;width:auto;min-height:auto}}
  `;
}
function photo(p){
  return p && p.arquivo ? `<div class="photo"><img src="${esc(p.arquivo)}"></div>` : `<div class="photo">SEM FOTO</div>`;
}
function fallback(doc, templateName){
  const o=doc.orcamento||{}, f=o.financeiro||{}, fotos=doc.fotos||{};
  return `<article class="doc-page template-${esc(templateName)}">
    <header class="doc-header"><div><h1>${esc(doc.empresa?.nome||'OficinaOS')}</h1><small>${esc(doc.empresa?.endereco||'')} ${esc(doc.empresa?.cidade||'')}</small></div><div class="doc-number">ORÇAMENTO Nº<strong>${esc(o.numero||o.id||'-')}</strong><span>${esc(o.dataBR||o.data||'')}</span></div></header>
    ${photo(fotos.principal)}
    <section class="grid"><div class="card"><h3>Cliente</h3><div class="row"><span>Nome</span><b>${esc(doc.cliente?.nome||'-')}</b></div><div class="row"><span>Telefone</span><b>${esc(doc.cliente?.telefone||doc.cliente?.whatsapp||'-')}</b></div></div>
    <div class="card"><h3>Veículo</h3><div class="row"><span>Modelo</span><b>${esc(doc.veiculo?.modelo||'-')}</b></div><div class="row"><span>Placa</span><b>${esc(doc.veiculo?.placa||'-')}</b></div></div></section>
    <section class="card"><h3>Descrição</h3><p>${esc(o.descricao||o.danoAvaliado||'Não informado')}</p><div class="row"><span>Complexidade</span><b>${esc(o.complexidade||'-')}</b></div><div class="row"><span>Prioridade</span><b>${esc(o.prioridade||'-')}</b></div><div class="row"><span>Prazo</span><b>${esc(o.prazoBR||o.prazo||'-')}</b></div></section>
    <section class="grid"><div class="card"><h3>Composição</h3><div class="row"><span>Mão de obra</span><b>${money(o.maoObra?.total)}</b></div><div class="row"><span>Materiais</span><b>${money(o.materiais?.total)}</b></div><div class="row"><span>Peças</span><b>${money(o.pecas?.total)}</b></div><div class="row"><span>Terceiros</span><b>${money(o.terceiros?.total)}</b></div></div><div class="card"><h3>Total do Investimento</h3><div class="total">${money(f.total)}</div></div></section>
    <section class="sig"><div>${esc(doc.assinatura?.responsavel||'Responsável')}</div><div>${esc(doc.assinatura?.clienteNome||'Cliente')}</div></section>
  </article>`;
}
function render(documentModel, template){
  if(!documentModel) throw new Error('RenderEngine: DocumentModel não informado.');
  const tpl = typeof template === 'string' ? (global.TemplateRegistry && global.TemplateRegistry.get(template)) : template;
  const templateName = tpl?.name || documentModel.meta?.template || 'clean';
  let rendered = tpl && typeof tpl.render === 'function' ? tpl.render(documentModel) : null;
  let html = typeof rendered === 'string' ? rendered : (rendered && rendered.html) ? rendered.html : fallback(documentModel, templateName);
  return {html, css:css(documentModel), metadata:{template:templateName,documentId:documentModel.meta?.id||'',tipo:documentModel.meta?.tipo||'',criadoEm:new Date().toISOString()}, template:templateName};
}
function preview(documentModel, template){
  const out=render(documentModel, template);
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${out.css}</style></head><body>${out.html}</body></html>`;
}
function mount(container, rendered){
  const el=typeof container==='string'?document.querySelector(container):container;
  if(!el) throw new Error('RenderEngine.mount: container não encontrado.');
  el.innerHTML=`<style>${rendered.css||''}</style>${rendered.html||rendered||''}`;
  return el;
}
function print(documentModel, template){
  const w=window.open('', '_blank');
  if(!w) throw new Error('Pop-up bloqueado.');
  w.document.open(); w.document.write(preview(documentModel, template)); w.document.close(); w.focus(); w.print();
  return true;
}
global.RenderEngine={render,preview,mount,print};
})(window);


(function(global){
'use strict';
const T={name:'laudo_fotografico',version:'1.0',render(doc){
 const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
 const etapas=['antes','dano','desmontagem','reparo','preparação','pintura','finalização','entrega'];
 const fotos=[doc.fotos?.principal,...(doc.fotos?.galeria||[])].filter(Boolean);
 const blocks=etapas.map(et=>{const fs=fotos.filter(f=>String(f.tipo||f.etapa||'').toLowerCase().includes(et));return `<section><h3>${e(et.toUpperCase())}</h3><div class="laudo-grid">${(fs.length?fs:[null]).slice(0,4).map(f=>f&&f.arquivo?`<figure><img src="${e(f.arquivo)}"><figcaption>${e(f.titulo||f.observacao||'')}</figcaption></figure>`:`<div class="sem">SEM FOTO</div>`).join('')}</div></section>`}).join('');
 return {html:`<article class="laudo"><header><h1>Laudo Fotográfico</h1><p>${e(doc.cliente?.nome||'-')} • ${e(doc.veiculo?.modelo||'-')} • ${e(doc.orcamento?.numero||doc.orcamento?.id||'-')}</p></header>${blocks}</article>`,css:T.css()};
},css(){return `.laudo{font-family:Arial,sans-serif;background:#fff;padding:16mm;color:#2c1a08}.laudo header{border-bottom:3px solid #7c3aed;margin-bottom:14px}.laudo h1{color:#7c3aed}.laudo section{page-break-inside:avoid;border:1px solid #ddd;border-radius:8px;margin:12px 0;padding:12px}.laudo h3{color:#7c3aed;margin-top:0}.laudo-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.laudo img,.sem{width:100%;height:180px;object-fit:cover;border-radius:6px;background:#f4f1f8;display:flex;align-items:center;justify-content:center}.laudo figcaption{font-size:12px;color:#666;margin-top:4px}`}}
global.LaudoFotograficoTemplate=T;global.TemplateRegistry&&global.TemplateRegistry.register('laudo_fotografico',T);
})(window);

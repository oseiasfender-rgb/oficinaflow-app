
(function(global){
'use strict';
const T={name:'oficinaos_tecnico',version:'3.0',render(doc){
 const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
 const m=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
 const o=doc.orcamento||{}, p=doc.processo||{};
 const timeline=(p.timeline||[]).map(x=>`<li>${e(x.etapa||x.nome||x)} ${e(x.data||'')}</li>`).join('')||'<li>Sem timeline registrada.</li>';
 const checklist=(p.checklist||[]).map(x=>`<li>${x.ok?'☑':'☐'} ${e(x.nome||x.item||x)}</li>`).join('')||'<li>Sem checklist registrado.</li>';
 return {html:`<article class="tec-doc"><header><h1>OficinaOS Técnico</h1><div>OS/Orçamento: <b>${e(o.numero||o.id||'-')}</b><br>Revisão: ${e(doc.meta?.versao||'1.0')}</div></header><section class="tec-grid"><div><h3>Identificação</h3><p>Cliente: <b>${e(doc.cliente?.nome||'-')}</b></p><p>Veículo: <b>${e(doc.veiculo?.modelo||'-')}</b> ${e(doc.veiculo?.placa||'')}</p></div><div><h3>Status</h3><p>Etapa atual: <b>${e(p.etapaAtual||'-')}</b></p><p>Prioridade: <b>${e(o.prioridade||'-')}</b></p></div></section><section><h3>Avaliação Técnica</h3><p>${e(o.descricao||o.danoAvaliado||'Não informado')}</p></section><section class="tec-grid"><div><h3>Timeline</h3><ol>${timeline}</ol></div><div><h3>Checklist</h3><ul>${checklist}</ul></div></section><section><h3>Composição Financeira</h3><table><tr><td>Mão de obra</td><td>${m(o.maoObra?.total)}</td></tr><tr><td>Materiais</td><td>${m(o.materiais?.total)}</td></tr><tr><td>Peças</td><td>${m(o.pecas?.total)}</td></tr><tr><td>Total</td><td><b>${m(o.financeiro?.total)}</b></td></tr></table></section><footer>Documento técnico gerado pelo OficinaOS • Controle documental</footer></article>`,css:T.css()};
},css(){return `.tec-doc{font-family:Arial,sans-serif;background:#fff;color:#172033;padding:16mm}.tec-doc header{display:flex;justify-content:space-between;border-bottom:3px solid #1d6fa4;padding-bottom:12px}.tec-doc h1{margin:0;color:#1d6fa4}.tec-doc h3{color:#1d6fa4;text-transform:uppercase;font-size:13px}.tec-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.tec-doc section{border:1px solid #d9e2ea;border-radius:8px;padding:12px;margin:12px 0}.tec-doc table{width:100%;border-collapse:collapse}.tec-doc td{border-bottom:1px solid #e6edf2;padding:8px}.tec-doc td:last-child{text-align:right}.tec-doc footer{margin-top:20px;color:#667;font-size:12px}`}}
global.OficinaOSTecnicoTemplate=T;global.TemplateRegistry&&global.TemplateRegistry.register('oficinaos_tecnico',T);
})(window);


(function(global){
'use strict';
const T = {
  name:'limaprata_premium',
  version:'2.0',
  render(doc){
    const o=doc.orcamento||{}, f=o.financeiro||{}, fotos=doc.fotos||{};
    const m=(v)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
    const e=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
    const foto=fotos.principal&&fotos.principal.arquivo?`<img class="hero-photo" src="${e(fotos.principal.arquivo)}">`:`<div class="sem-foto">SEM FOTO</div>`;
    const gal=(fotos.galeria||[]).slice(0,6).map(x=>x&&x.arquivo?`<img src="${e(x.arquivo)}">`:`<div>SEM FOTO</div>`).join('');
    return {html:`<article class="lp-doc">
      <header class="lp-head"><div><h1>${e(doc.empresa?.nome||'LIMAPRATA')}</h1><p>Orçamento automotivo premium</p></div><div class="lp-num">ORÇAMENTO Nº<br><b>${e(o.numero||o.id||'-')}</b><small>${e(o.dataBR||o.data||'')}</small></div></header>
      <section class="lp-hero">${foto}<div class="lp-total"><span>Total do investimento</span><b>${m(f.total)}</b><small>Garantia: ${e(o.garantiaDias||90)} dias</small></div></section>
      <section class="lp-grid"><div><h3>Cliente</h3><p><b>${e(doc.cliente?.nome||'-')}</b><br>${e(doc.cliente?.telefone||doc.cliente?.whatsapp||'')}</p></div><div><h3>Veículo</h3><p><b>${e(doc.veiculo?.modelo||'-')}</b><br>${e(doc.veiculo?.placa||'')} • ${e(doc.veiculo?.ano||'')} • ${e(doc.veiculo?.cor||'')}</p></div></section>
      <section class="lp-card"><h3>Avaliação do dano</h3><p>${e(o.danoAvaliado||o.descricao||'Não informado')}</p><p><b>Complexidade:</b> ${e(o.complexidade||'-')} &nbsp; <b>Prioridade:</b> ${e(o.prioridade||'-')} &nbsp; <b>Prazo:</b> ${e(o.prazoBR||o.prazo||'-')}</p></section>
      <section class="lp-grid"><div class="lp-card"><h3>Composição</h3><p>Mão de obra: <b>${m(o.maoObra?.total)}</b></p><p>Materiais: <b>${m(o.materiais?.total)}</b></p><p>Peças: <b>${m(o.pecas?.total)}</b></p><p>Terceiros: <b>${m(o.terceiros?.total)}</b></p></div><div class="lp-card"><h3>Aprovação</h3><p>Responsável: ${e(doc.assinatura?.responsavel||'-')}</p><p>Cliente: ${e(doc.assinatura?.clienteNome||doc.cliente?.nome||'-')}</p><p>WhatsApp: ${e(doc.qr?.whatsapp||'')}</p><p>Pix: ${doc.qr?.pix?'Disponível':'-'}</p></div></section>
      ${gal?`<section class="lp-card"><h3>Galeria</h3><div class="lp-gallery">${gal}</div></section>`:''}
      <footer class="lp-sign"><div>Assinatura responsável</div><div>Aprovação do cliente</div></footer>
    </article>`, css: T.css()};
  },
  css(){return `.lp-doc{font-family:Arial,sans-serif;color:#2c1a08;background:#fff;padding:18mm}.lp-head{display:flex;justify-content:space-between;border-bottom:4px solid #b8621a;padding-bottom:12px}.lp-head h1{margin:0;font-size:32px;letter-spacing:.08em}.lp-head p{color:#5a3a1a}.lp-num{text-align:right;color:#5a3a1a}.lp-num b{font-size:28px;color:#b8621a}.lp-num small{display:block}.lp-hero{display:grid;grid-template-columns:1.3fr .7fr;gap:16px;margin:18px 0}.hero-photo,.sem-foto{width:100%;min-height:230px;border-radius:10px;object-fit:cover;background:#faf5ee;border:1px solid rgba(100,60,20,.16);display:flex;align-items:center;justify-content:center}.lp-total{background:#faf5ee;border-left:6px solid #b8621a;padding:22px;border-radius:10px}.lp-total span{text-transform:uppercase;font-size:12px;color:#5a3a1a}.lp-total b{display:block;color:#b8621a;font-size:36px;margin:10px 0}.lp-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:14px 0}.lp-grid>div,.lp-card{border:1px solid rgba(100,60,20,.16);border-radius:10px;padding:14px;background:#fff}.lp-card h3,.lp-grid h3{margin:0 0 8px;color:#b8621a;text-transform:uppercase;font-size:13px;letter-spacing:.1em}.lp-gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.lp-gallery img,.lp-gallery div{height:90px;width:100%;object-fit:cover;border:1px solid #ddd;border-radius:6px;display:flex;align-items:center;justify-content:center;background:#faf5ee}.lp-sign{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:34px}.lp-sign div{border-top:1px solid #2c1a08;text-align:center;padding-top:8px}`;}
};
global.LimaprataPremiumTemplate=T;
global.TemplateRegistry&&global.TemplateRegistry.register('limaprata_premium',T);
})(window);

import {br} from '../utils/format.js?v=546114';

const EMPRESA={
  nome:'LIMAPRATA',
  subtitulo:'Reparações Automotivas',
  endereco:'Av. Hermínio Ometto, 576 • Leme/SP',
  responsavel:'Oséias',
  telefone:'(19) 98612-7516',
  cnpj:'55.254.863/0001-87',
  pagamento:'50% entrada + 50% entrega',
  garantia:'90 dias no serviço',
  validade:'30 dias corridos'
};
const esc=(v='')=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const dataBR=(iso)=>{const d=iso?new Date(iso):new Date();return Number.isNaN(d.getTime())?new Date().toLocaleDateString('pt-BR'):d.toLocaleDateString('pt-BR')};
const numeroOrc=(orc={})=>String(orc.numero||orc.codigo||orc.id||'—').replace(/^orc[-_]?/i,'').toUpperCase();
function descricaoServico(orc={}){
  const txt=orc.descricao||orc.descricaoServico||orc.observacoes||orc.problema||'';
  const linhas=String(txt).split(/\n|•/).map(x=>x.trim()).filter(Boolean);
  if(linhas.length)return linhas.map(l=>`<li>${esc(l)}</li>`).join('');
  return `<li>${esc(orc.servico||'Serviço automotivo')}</li>`;
}
function itensServicos(orc={},resumo={}){
  const pecas=Number(resumo.pecas||0)+Number(resumo.terceiros||0)+Number(resumo.frete||0);
  const moMateriais=Number(resumo.mo||0)+Number(resumo.materiais||0)+Number(resumo.margemValor||0)-Number(resumo.descontoValor||0);
  return `<tr><td>Mão de Obra + Materiais</td><td>${br(moMateriais)}</td></tr><tr><td>Peças e Serviços</td><td>${br(pecas)}</td></tr>`;
}
export function gerarHtmlOrcamentoPremium(orc={},resumo={}){
  const cliente=orc.cliente||{};
  const veiculo=[cliente.veiculo||orc.veiculo,orc.cor,cliente.placa||orc.placa,orc.ano].filter(Boolean).join(' • ');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Orçamento ${esc(numeroOrc(orc))}</title><style>
  @page{size:A4;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#242424;background:#fff;margin:0}.sheet{width:100%;max-width:760px;margin:0 auto}.top-line{height:9px;background:#202020;margin-bottom:28px}.header{display:grid;grid-template-columns:1fr 170px;gap:20px;align-items:start}.brand{font-size:28px;font-weight:800;letter-spacing:.03em}.sub{font-size:13px;color:#555;margin-top:8px;font-weight:700}.addr{font-size:13px;color:#555;margin-top:12px;font-weight:700}.orcbox{text-align:right}.orcbox .lbl{font-size:11px;text-transform:uppercase;color:#777;font-weight:800;letter-spacing:.08em}.orcbox .num{font-size:32px;color:#8a5a32;font-weight:800;margin-top:8px}.orcbox .date{font-size:13px}.rule{border-top:1px solid #d8c8b3;margin:26px 0 24px}.info{border:1px solid #ddd;background:#f8f7f4;padding:18px 20px;display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:22px}.info p,.box p{margin:4px 0;font-size:14px}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #ddd;margin-bottom:20px}.box{padding:16px 20px;border-right:1px solid #eee;min-height:70px}.box:nth-child(even){border-right:0}.label{font-size:11px;text-transform:uppercase;color:#999;margin-bottom:8px}.value{font-size:15px;font-weight:800}.section-title{font-size:16px;color:#8a5a32;text-transform:uppercase;font-weight:900;margin:34px 0 10px}.desc{border:1px solid #ddd;padding:16px 20px;min-height:120px}.desc ul{margin:0;padding-left:18px;line-height:1.55;font-size:14px}table{width:100%;border-collapse:collapse;margin-top:12px}th{background:#202020;color:#fff;text-align:left;padding:16px 18px;font-size:14px}td{border:1px solid #e2e2e2;padding:16px 18px;font-size:14px}td:last-child{width:210px;font-weight:700}.total td{background:#eee0cd;font-weight:900;font-size:16px}.footer{border-top:1px solid #d8c8b3;margin-top:40px;padding-top:20px;color:#777;font-size:11px;line-height:1.35}@media print{.no-print{display:none}.sheet{max-width:none}.top-line{margin-top:0}}
  </style></head><body><div class="sheet"><div class="top-line"></div><header class="header"><div><div class="brand">${esc(EMPRESA.nome)}</div><div class="sub">${esc(EMPRESA.subtitulo)}</div><div class="addr">${esc(EMPRESA.endereco)}</div></div><div class="orcbox"><div class="lbl">Orçamento Nº</div><div class="num">${esc(numeroOrc(orc))}</div><div class="date">${esc(dataBR(orc.createdAt||orc.updatedAt))}</div></div></header><div class="rule"></div><section class="info"><div><p><b>Responsável:</b> ${esc(EMPRESA.responsavel)}</p><p><b>Telefone:</b> ${esc(EMPRESA.telefone)}</p><p><b>CNPJ:</b> ${esc(EMPRESA.cnpj)}</p></div><div><p><b>Pagamento:</b> ${esc(EMPRESA.pagamento)}</p><p><b>Garantia:</b> ${esc(EMPRESA.garantia)}</p><p><b>Validade:</b> ${esc(EMPRESA.validade)}</p></div></section><section class="grid2"><div class="box"><div class="label">Cliente</div><div class="value">${esc(cliente.nome||orc.clienteNome||'')}</div></div><div class="box"><div class="label">Veículo</div><div class="value">${esc(veiculo||'')}</div></div></section><section class="grid2"><div class="box"><div class="label">Complexidade</div><div class="value">${esc(orc.complexidade||'')}</div></div><div class="box"><div class="label">Serviço</div><div class="value">${esc(orc.servico||'')}</div></div></section><h2 class="section-title">Identificação e descrição do serviço</h2><section class="desc"><ul>${descricaoServico(orc)}</ul></section><h2 class="section-title">Serviços e materiais</h2><table><thead><tr><th>Descrição</th><th>Valor</th></tr></thead><tbody>${itensServicos(orc,resumo)}<tr class="total"><td>TOTAL GERAL</td><td>${br(resumo.total||0)}</td></tr></tbody></table><footer class="footer">${esc(EMPRESA.nome)} ${esc(EMPRESA.subtitulo)} • Leme/SP<br>${esc(EMPRESA.responsavel)} — Responsável Técnico</footer></div><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));</script></body></html>`;
}
export function abrirPdfOrcamentoPremium(orc,resumo){const html=gerarHtmlOrcamentoPremium(orc,resumo);const w=window.open('','_blank');if(!w){return html}w.document.open();w.document.write(html);w.document.close();return html}
export function gerarTextoOrcamento(orc,resumo){return `ORÇAMENTO ${orc.id}\nCliente: ${orc.clienteNome}\nServiço: ${orc.servico}\nTotal: ${Number(resumo.total||0).toFixed(2)}`}

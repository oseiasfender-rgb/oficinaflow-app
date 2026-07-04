
(function(global){
'use strict';
function safe(v,f){const t=String(v??'').trim();return t||f||'Não informado'}
function dateBR(v){if(!v)return'Não informado';const s=String(v);if(/^\d{4}-\d{2}-\d{2}/.test(s)){const p=s.slice(0,10).split('-');return p[2]+'/'+p[1]+'/'+p[0]}return s}
function moneyNumber(v){return Number(v||0)}
function normalize(doc){
  doc=doc||{};
  if(doc.empresa)doc.empresa.nome=safe(doc.empresa.nome,'Empresa não informada');
  if(doc.cliente)doc.cliente.nome=safe(doc.cliente.nome,'Cliente não informado');
  if(doc.veiculo)doc.veiculo.modelo=safe(doc.veiculo.modelo,'Veículo não informado');
  if(doc.orcamento){doc.orcamento.dataBR=dateBR(doc.orcamento.data);doc.orcamento.prazoBR=dateBR(doc.orcamento.prazo);doc.orcamento.financeiro.total=moneyNumber(doc.orcamento.financeiro.total)}
  return doc;
}
function validate(doc){
  const errors=[],warnings=[];
  if(!doc)errors.push('Documento vazio.');
  if(!doc?.empresa?.nome)warnings.push('Empresa sem nome.');
  if(!doc?.cliente?.nome)warnings.push('Cliente sem nome.');
  if(!doc?.veiculo?.modelo)warnings.push('Veículo sem modelo.');
  if(!doc?.orcamento?.descricao&&!doc?.orcamento?.danoAvaliado)warnings.push('Documento sem descrição.');
  if(!doc?.orcamento?.financeiro?.total)warnings.push('Total do orçamento zerado.');
  return{ok:errors.length===0,errors,warnings};
}
function build(orcamentoId,template){
  if(!global.OficinaOSStateConnector)throw new Error('StateConnector não carregado.');
  return normalize(global.OficinaOSStateConnector.buildDocumentModel(orcamentoId,template));
}
global.DocumentModelCore={build,normalize,validate,safeText:safe,formatDateBR:dateBR};
})(window);

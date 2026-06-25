

/* OficinaOS V546.41 — CLIENTES HOTFIX */
(function(){
'use strict';
if(window.OFICINAOS_CLIENTES_HOTFIX_54641) return;
window.OFICINAOS_CLIENTES_HOTFIX_54641 = true;

const STATE_KEYS = ['OFICINAOS_STATE_REAL_CORE','OFICINAOS_STATE_REAL','OFICINAOS_STATE','STATE'];

function uid(prefix){
  return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2,8);
}
function getJSON(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || ''); } catch(e){ return fallback; } }
function setJSON(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function onlyDigits(v){ return String(v || '').replace(/\D/g,''); }
function money(v){ v = Number(v || 0); if(!Number.isFinite(v)) v = 0; return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function normalizeSearch(v){ return String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }

function normalizeCliente(c){
  c = c || {};
  c.id = String(c.id || uid('cli'));
  c.nome = String(c.nome || c.cliente || c.name || 'Cliente').trim();
  c.telefone = String(c.telefone || c.fone || c.celular || c.whatsapp || '').trim();
  c.whatsapp = String(c.whatsapp || c.telefone || '').trim();
  c.cpfCnpj = String(c.cpfCnpj || c.cpf || c.cnpj || c.documento || '').trim();
  c.email = String(c.email || '').trim();
  c.endereco = String(c.endereco || c.endereço || '').trim();
  c.observacoes = String(c.observacoes || c.observações || c.obs || '').trim();
  c.ativo = c.ativo !== false;
  c.criadoEm = c.criadoEm || new Date().toISOString();
  c.veiculos = Array.isArray(c.veiculos) ? c.veiculos : [];
  c.historico = Array.isArray(c.historico) ? c.historico : [];
  return c;
}

function normalizeVeiculo(v){
  v = v || {};
  v.id = String(v.id || uid('vei'));
  v.clienteId = String(v.clienteId || '');
  v.placa = String(v.placa || '').trim().toUpperCase();
  v.marca = String(v.marca || '').trim();
  v.modelo = String(v.modelo || v.veiculo || v.veículo || '').trim();
  v.ano = String(v.ano || '').trim();
  v.cor = String(v.cor || '').trim();
  v.chassi = String(v.chassi || '').trim();
  v.observacoes = String(v.observacoes || v.obs || '').trim();
  return v;
}

function normalizeState(s){
  s = s || {};
  s.meta = s.meta || {};
  s.meta.version = 'V546.41 CLIENTES HOTFIX';
  s.meta.updatedAt = new Date().toISOString();
  s.clientes = Array.isArray(s.clientes) ? s.clientes.map(normalizeCliente) : [];
  s.veiculos = Array.isArray(s.veiculos) ? s.veiculos.map(normalizeVeiculo) : [];
  s.orcamentos = Array.isArray(s.orcamentos) ? s.orcamentos : [];
  s.agenda = Array.isArray(s.agenda) ? s.agenda : [];
  s.financeiro = s.financeiro || {};
  s.financeiro.lancamentos = Array.isArray(s.financeiro.lancamentos) ? s.financeiro.lancamentos : [];
  s.financeiro.receitas = Array.isArray(s.financeiro.receitas) ? s.financeiro.receitas : [];
  s.financeiro.despesas = Array.isArray(s.financeiro.despesas) ? s.financeiro.despesas : [];
  s.financeiro.receber = Array.isArray(s.financeiro.receber) ? s.financeiro.receber : [];
  s.financeiro.pagar = Array.isArray(s.financeiro.pagar) ? s.financeiro.pagar : [];

  s.clientes.forEach(c => {
    c.veiculos = c.veiculos.map(v => normalizeVeiculo({...v, clienteId:c.id}));
    c.veiculos.forEach(v => {
      if(!s.veiculos.some(x => x.id === v.id || (v.placa && x.placa === v.placa && x.clienteId === c.id))) s.veiculos.push(v);
    });
  });
  s.clientes.forEach(c => c.veiculos = s.veiculos.filter(v => v.clienteId === c.id));
  return s;
}

function loadState(){
  if(window.OSCORE && typeof OSCORE.load === 'function') return normalizeState(OSCORE.load());
  for(const k of STATE_KEYS){ const s = getJSON(k, null); if(s && typeof s === 'object') return normalizeState(s); }
  return normalizeState({});
}
function saveState(s){
  s = normalizeState(s);
  if(window.OSCORE && typeof OSCORE.save === 'function') s = normalizeState(OSCORE.save(s));
  STATE_KEYS.forEach(k => setJSON(k, s));
  window.OFICINAOS_STATE = s;
  return s;
}

function rebuildClientes(){
  const s = loadState();
  s.clientes.forEach(c => c.historico = Array.isArray(c.historico) ? c.historico : []);

  (s.orcamentos || []).forEach(o => {
    const c = s.clientes.find(x => x.id === o.clienteId) || s.clientes.find(x => x.nome === o.cliente);
    if(c && !c.historico.some(h => h.tipo === 'orcamento' && h.refId === o.id)){
      c.historico.push({id:uid('hist'),tipo:'orcamento',refId:o.id,data:o.criadoEm||o.data||new Date().toISOString(),descricao:o.servico||'Orçamento',valor:Number(o.valor||0),status:o.status||'aberto'});
    }
  });
  (s.agenda || []).forEach(o => {
    const c = s.clientes.find(x => x.id === o.clienteId) || s.clientes.find(x => x.nome === o.cliente);
    if(c && !c.historico.some(h => h.tipo === 'os' && h.refId === o.id)){
      c.historico.push({id:uid('hist'),tipo:'os',refId:o.id,data:o.entrada||o.data||new Date().toISOString(),descricao:o.servico||'OS',valor:Number(o.valor||0),status:o.status||'agendado'});
    }
  });
  (s.financeiro.lancamentos || []).forEach(t => {
    const c = s.clientes.find(x => x.id === t.clienteId);
    if(c && !c.historico.some(h => h.tipo === 'financeiro' && h.refId === t.id)){
      c.historico.push({id:uid('hist'),tipo:'financeiro',refId:t.id,data:t.data||new Date().toISOString(),descricao:t.descricao||'Lançamento',valor:Number(t.valor||0),status:t.status||'pendente'});
    }
  });
  return saveState(s);
}

function salvarCliente(cliente){
  const s = loadState();
  const novo = normalizeCliente(cliente);
  const doc = onlyDigits(novo.cpfCnpj), tel = onlyDigits(novo.telefone);
  let atual = s.clientes.find(c => c.id === novo.id);
  if(!atual && doc) atual = s.clientes.find(c => onlyDigits(c.cpfCnpj) === doc);
  if(!atual && tel) atual = s.clientes.find(c => onlyDigits(c.telefone) === tel);
  if(atual){
    const oldId = atual.id;
    Object.assign(atual, novo);
    atual.id = oldId;
    atual.historico = Array.isArray(atual.historico) ? atual.historico : [];
    atual.veiculos = s.veiculos.filter(v => v.clienteId === oldId);
  } else {
    s.clientes.push(novo);
  }
  return saveState(s);
}

function salvarVeiculo(clienteId, veiculo){
  const s = loadState();
  const c = s.clientes.find(x => String(x.id) === String(clienteId));
  if(!c) return saveState(s);
  const v = normalizeVeiculo({...veiculo, clienteId});
  let atual = s.veiculos.find(x => x.id === v.id || (v.placa && x.placa === v.placa && String(x.clienteId) === String(clienteId)));
  if(atual) Object.assign(atual, v); else s.veiculos.push(v);
  c.veiculos = s.veiculos.filter(x => String(x.clienteId) === String(clienteId));
  return saveState(s);
}

function excluirCliente(id){
  const s = loadState();
  const before = s.clientes.length;
  s.clientes = s.clientes.filter(c => String(c.id) !== String(id));
  s.veiculos = s.veiculos.filter(v => String(v.clienteId) !== String(id));
  (s.orcamentos || []).forEach(o => { if(String(o.clienteId) === String(id)) o.clienteId = ''; });
  (s.agenda || []).forEach(o => { if(String(o.clienteId) === String(id)) o.clienteId = ''; });
  (s.financeiro.lancamentos || []).forEach(t => { if(String(t.clienteId) === String(id)) t.clienteId = ''; });
  const saved = saveState(s);
  return {ok:saved.clientes.length < before, before, after:saved.clientes.length, id};
}

function clienteFinanceiro(clienteId){
  const s = loadState();
  const tx = (s.financeiro.lancamentos || []).filter(t => String(t.clienteId) === String(clienteId));
  return {total:tx.reduce((a,b)=>a+Number(b.valor||0),0), pago:tx.filter(t=>t.status==='pago').reduce((a,b)=>a+Number(b.valor||0),0), pendente:tx.filter(t=>t.status!=='pago').reduce((a,b)=>a+Number(b.valor||0),0), lancamentos:tx};
}

function indicadores(){
  const s = rebuildClientes();
  const totalClientes = s.clientes.length, ativos = s.clientes.filter(c=>c.ativo!==false).length, totalVeiculos = s.veiculos.length;
  const receitas = (s.financeiro.receitas || []).reduce((a,b)=>a+Number(b.valor||0),0);
  const ticket = totalClientes ? receitas / totalClientes : 0;
  const pendencias = (s.financeiro.receber || []).reduce((a,b)=>a+Number(b.valor||0),0);
  return {totalClientes, ativos, totalVeiculos, receitas, ticket, pendencias};
}

function buscar(q){
  const s = rebuildClientes();
  q = normalizeSearch(q);
  if(!q) return s.clientes;
  return s.clientes.filter(c => {
    const veiculos = (c.veiculos || []).map(v => [v.placa,v.marca,v.modelo,v.ano,v.cor,v.chassi].join(' ')).join(' ');
    return normalizeSearch([c.nome,c.telefone,c.whatsapp,c.cpfCnpj,c.email,c.endereco,c.observacoes,veiculos].join(' ')).includes(q);
  });
}

function enviarParaOrcamento(clienteId, veiculoId){
  const s = rebuildClientes();
  const c = s.clientes.find(x => String(x.id) === String(clienteId));
  if(!c) return false;
  const v = s.veiculos.find(x => String(x.id) === String(veiculoId)) || (c.veiculos || [])[0] || null;
  localStorage.setItem('OFICINAOS_DRAFT_ORCAMENTO', JSON.stringify({cliente:c,veiculo:v,criadoEm:new Date().toISOString(),origem:'clientes_hotfix_54641'}));
  return true;
}

window.OFICINAOS_CLIENTES_CORE = {rebuildClientes,salvarCliente,salvarVeiculo,excluirCliente,indicadores,clienteFinanceiro,buscar,enviarParaOrcamento,money};
window.OFICINAOS_CLIENTES_HOTFIX = {version:'V546.41 CLIENTES HOTFIX',status:'aplicado',teste:function(){const s=rebuildClientes();return {clientes:s.clientes.length,veiculos:s.veiculos.length,state:'OK',excluir:typeof excluirCliente==='function',editar:typeof salvarCliente==='function',buscar:typeof buscar==='function'}}};
})();

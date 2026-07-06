
(function(g){
'use strict';

function arr(v){return Array.isArray(v)?v:[]}
function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function clean(v){return String(v??'').trim()}
function norm(v){return clean(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function num(v){if(typeof v==='number')return isFinite(v)?v:0;return Number(String(v??0).replace(/[^\d,.-]/g,'').replace(/\./g,'').replace(',','.'))||0}
function now(){return new Date().toISOString()}
function today(){return new Date().toISOString().slice(0,10)}
function uid(p){return(p||'admin')+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}
function st(){return g.StateManager?g.StateManager.load():(g.STATE=g.STATE||{})}
function sv(s){return g.StateManager?g.StateManager.save(s):(g.STATE=s,localStorage.setItem('OficinaOS',JSON.stringify(s)),s)}

function ensure(){
  let s=st();
  s.version='551.10';
  s.releaseStage='ADMIN_SHELL_FINAL';
  s.admin=obj(s.admin);
  s.admin.version='551.10';
  s.admin.enabled=true;
  s.admin.sections=['contas','auditoria','alertas','busca','configuracoes'];
  s.configuracoes=obj(s.configuracoes);
  s.historico=obj(s.historico);
  s.historico.eventos=arr(s.historico.eventos);
  s.financeiro=obj(s.financeiro);
  s.financeiro.contas=arr(s.financeiro.contas);
  s.ia=obj(s.ia);
  s.ia.alertas=arr(s.ia.alertas);
  s.updatedAt=now();
  sv(s);
  return s;
}

function historico(tipo,descricao,extra){
  let s=ensure();
  let rec=Object.assign({id:uid('hist'),tipo,descricao,data:now()},extra||{});
  s.historico.eventos.push(rec);
  sv(s);
  return rec;
}

/* CONTAS */
function contasResumo(){
  let s=ensure();
  let contas=arr(s.financeiro.contas);
  let pendentes=contas.filter(c=>c.status!=='paga');
  let pagas=contas.filter(c=>c.status==='paga');
  let vencidas=pendentes.filter(c=>(c.data||c.vencimento||'') < today());
  return {
    total:contas.length,
    pendentes:pendentes.length,
    pagas:pagas.length,
    vencidas:vencidas.length,
    valorPendente:pendentes.reduce((a,b)=>a+num(b.valor),0),
    valorPago:pagas.reduce((a,b)=>a+num(b.valorPago||b.valor),0),
    itens:{pendentes, pagas, vencidas}
  };
}

function contasListar(filtro){
  let s=ensure();
  let contas=arr(s.financeiro.contas);
  if(!filtro || filtro==='todas') return contas;
  if(filtro==='pendentes') return contas.filter(c=>c.status!=='paga');
  if(filtro==='pagas') return contas.filter(c=>c.status==='paga');
  if(filtro==='vencidas') return contas.filter(c=>c.status!=='paga' && (c.data||c.vencimento||'') < today());
  return contas;
}

/* AUDITORIA */
function auditoria(filtro){
  let s=ensure();
  let eventos=arr(s.historico.eventos).slice().reverse();
  if(filtro){
    let q=norm(filtro);
    eventos=eventos.filter(e=>norm(e.tipo).includes(q)||norm(e.descricao).includes(q)||norm(JSON.stringify(e)).includes(q));
  }
  return eventos;
}

function auditoriaResumo(){
  let eventos=auditoria();
  let porTipo={};
  eventos.forEach(e=>{porTipo[e.tipo||'sem_tipo']=(porTipo[e.tipo||'sem_tipo']||0)+1});
  return {total:eventos.length,porTipo};
}

/* ALERTAS */
function gerarAlertas(){
  let s=ensure();
  let alertas=[];
  let cr=contasResumo();
  if(cr.vencidas>0) alertas.push({id:uid('alerta'),nivel:'critico',area:'contas',mensagem:'Existem contas vencidas.',quantidade:cr.vencidas,data:now()});
  if(cr.pendentes>0) alertas.push({id:uid('alerta'),nivel:'atencao',area:'contas',mensagem:'Existem contas pendentes.',quantidade:cr.pendentes,data:now()});
  let agenda=arr(s.agenda);
  let atrasadas=agenda.filter(a=>a.status!=='concluido' && a.dataFim && a.dataFim < today());
  if(atrasadas.length) alertas.push({id:uid('alerta'),nivel:'atencao',area:'agenda',mensagem:'Há serviços atrasados na agenda.',quantidade:atrasadas.length,data:now()});
  let semTelefone=arr(s.clientes).filter(c=>!clean(c.telefone)&&!clean(c.whatsapp));
  if(semTelefone.length) alertas.push({id:uid('alerta'),nivel:'info',area:'clientes',mensagem:'Clientes sem telefone/WhatsApp cadastrado.',quantidade:semTelefone.length,data:now()});
  let backupData=s.backup&&s.backup.ultimaGravacao;
  if(!backupData) alertas.push({id:uid('alerta'),nivel:'atencao',area:'backup',mensagem:'Nenhum backup completo recente registrado.',data:now()});
  s.ia=obj(s.ia);
  s.ia.alertas=alertas;
  sv(s);
  historico('admin_alertas','Alertas administrativos atualizados',{total:alertas.length});
  return alertas;
}

function alertasListar(){
  let s=ensure();
  if(!arr(s.ia.alertas).length) return gerarAlertas();
  return arr(s.ia.alertas);
}

/* BUSCA GLOBAL */
function buscaGlobal(query){
  let s=ensure();
  let q=norm(query);
  if(!q) return [];
  let results=[];
  arr(s.clientes).forEach(c=>{
    if(norm(c.nome).includes(q)||norm(c.telefone).includes(q)||norm(c.whatsapp).includes(q)||norm(c.email).includes(q)||norm(c.documento).includes(q)){
      results.push({tipo:'cliente',id:c.id,titulo:c.nome||'Cliente',subtitulo:c.telefone||c.whatsapp||c.email||'',data:c});
    }
  });
  arr(s.veiculos).forEach(v=>{
    if(norm(v.placa).includes(q)||norm(v.marca).includes(q)||norm(v.modelo).includes(q)){
      results.push({tipo:'veiculo',id:v.id,titulo:(v.marca||'')+' '+(v.modelo||''),subtitulo:v.placa||'',data:v});
    }
  });
  arr(s.orcamentos).forEach(o=>{
    if(norm(o.numero).includes(q)||norm(o.cliente||o.clienteNome).includes(q)||norm(o.descricao||o.servico).includes(q)||norm(o.status).includes(q)){
      results.push({tipo:'orcamento',id:o.id||o.numero,titulo:'Orçamento '+(o.numero||o.id||''),subtitulo:o.cliente||o.clienteNome||o.status||'',data:o});
    }
  });
  arr(s.agenda).forEach(a=>{
    if(norm(a.titulo).includes(q)||norm(a.status).includes(q)||norm(a.etapa).includes(q)){
      results.push({tipo:'agenda',id:a.id,titulo:a.titulo||'Agenda',subtitulo:(a.dataInicio||'')+' '+(a.status||''),data:a});
    }
  });
  arr(obj(s.financeiro).contas).forEach(c=>{
    if(norm(c.descricao||c.nome).includes(q)||norm(c.status).includes(q)){
      results.push({tipo:'conta',id:c.id,titulo:c.descricao||c.nome||'Conta',subtitulo:(c.status||'')+' R$ '+num(c.valor).toFixed(2),data:c});
    }
  });
  arr(obj(s.financeiro).lancamentos).forEach(l=>{
    if(norm(l.descricao).includes(q)||norm(l.tipo).includes(q)){
      results.push({tipo:'lancamento',id:l.id,titulo:l.descricao||'Lançamento',subtitulo:(l.tipo||'')+' R$ '+num(l.valor).toFixed(2),data:l});
    }
  });
  arr(obj(s.historico).eventos).forEach(e=>{
    if(norm(e.tipo).includes(q)||norm(e.descricao).includes(q)){
      results.push({tipo:'auditoria',id:e.id,titulo:e.tipo||'Evento',subtitulo:e.descricao||e.data||'',data:e});
    }
  });
  historico('admin_busca','Busca global executada',{query:query,total:results.length});
  return results;
}

/* CONFIGURAÇÕES */
function configuracoesPadrao(){
  return {
    empresa:{
      nome:'LIMAPRATA Reparações Automotivas',
      cidade:'Leme/SP',
      responsavel:'Oséias',
      telefone:'(19) 98612-7516',
      cnpj:'55.254.863/0001-87',
      endereco:'Av. Herminio Ometto, 576 — Leme/SP'
    },
    financeiro:{
      horaTecnica:55,
      margemPadrao:0,
      descontoPadrao:0,
      metaMensal:10000,
      pontoEquilibrio:3000
    },
    documentos:{
      templatePadrao:'limaprata_premium',
      validadeDias:90,
      garantiaTexto:'Garantia conforme serviço executado e condições combinadas.'
    },
    sistema:{
      backupAutomatico:true,
      tema:'clean',
      pwa:true
    }
  };
}

function configuracoesGet(){
  let s=ensure();
  s.configuracoes=Object.assign({},configuracoesPadrao(),obj(s.configuracoes));
  sv(s);
  return s.configuracoes;
}

function configuracoesSet(patch){
  let s=ensure();
  s.configuracoes=Object.assign({},configuracoesGet(),obj(patch));
  sv(s);
  historico('admin_configuracoes','Configurações atualizadas',{});
  return s.configuracoes;
}

/* ADMIN DASHBOARD */
function dashboard(){
  let s=ensure();
  return {
    version:'551.10',
    contas:contasResumo(),
    auditoria:auditoriaResumo(),
    alertas:alertasListar(),
    buscaDisponivel:true,
    configuracoes:configuracoesGet(),
    modulos:{
      contas:true,
      auditoria:true,
      alertas:true,
      busca:true,
      configuracoes:true
    },
    counts:{
      clientes:arr(s.clientes).length,
      veiculos:arr(s.veiculos).length,
      orcamentos:arr(s.orcamentos).length,
      agenda:arr(s.agenda).length,
      fluxos:arr(s.fluxos).length
    }
  };
}

function exportAdminJSON(){
  return JSON.stringify(dashboard(),null,2);
}

function boot(){ensure();configuracoesGet();gerarAlertas()}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();

g.AdminShell={
  version:'551.10',
  ensure,
  contasResumo,
  contasListar,
  auditoria,
  auditoriaResumo,
  gerarAlertas,
  alertasListar,
  buscaGlobal,
  configuracoesPadrao,
  configuracoesGet,
  configuracoesSet,
  dashboard,
  exportAdminJSON,
  boot
};
})(window);

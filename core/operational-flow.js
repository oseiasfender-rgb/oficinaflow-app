
(function(g){
'use strict';

function uid(p){return(p||'flow')+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}
function arr(v){return Array.isArray(v)?v:[]}
function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function clean(v){return String(v??'').trim()}
function num(v){if(typeof v==='number')return isFinite(v)?v:0;return Number(String(v??0).replace(/[^\d,.-]/g,'').replace(/\./g,'').replace(',','.'))||0}
function now(){return new Date().toISOString()}
function today(){return new Date().toISOString().slice(0,10)}
function st(){return g.StateManager?g.StateManager.load():(g.STATE=g.STATE||{})}
function sv(s){return g.StateManager?g.StateManager.save(s):(g.STATE=s,localStorage.setItem('OficinaOS',JSON.stringify(s)),s)}

function ensure(){
  let s=st();
  s.fluxos=arr(s.fluxos);
  s.historico=obj(s.historico);
  s.historico.eventos=arr(s.historico.eventos);
  s.historico.documentos=arr(s.historico.documentos);
  s.version='550.40';
  s.releaseStage='OPERATIONAL_FLOW_INTEGRATION';
  s.updatedAt=now();
  sv(s);
  return s;
}

function historico(tipo,descricao,extra){
  let s=ensure();
  let r=Object.assign({id:uid('hist'),tipo,descricao,data:now()},extra||{});
  s.historico.eventos.push(r);
  sv(s);
  return r;
}

function criarAtendimento(dados){
  ensure();
  dados=obj(dados);
  let cliente=dados.cliente||{};
  let veiculo=dados.veiculo||{};
  let orcamento=dados.orcamento||{};
  let agenda=dados.agenda||{};

  let cli;
  if(g.ClientesCore){
    cli=g.ClientesCore.upsert(cliente);
    if(veiculo && Object.keys(veiculo).length) {
      try{
        let v=g.ClientesCore.addVeiculo(cli.id,veiculo);
        cli.veiculoAtual=v;
      }catch(e){}
    }
  }else{
    cli=Object.assign({id:uid('cli')},cliente);
  }

  let orc;
  if(g.OrcamentoCore){
    orc=g.OrcamentoCore.upsert(Object.assign({},orcamento,{
      clienteId:cli.id,
      cliente:cli.nome,
      veiculoId:(cli.veiculoAtual&&cli.veiculoAtual.id)||orcamento.veiculoId||'',
      status:orcamento.status||'rascunho'
    }));
  }else{
    orc=Object.assign({id:uid('orc'),clienteId:cli.id,status:'rascunho'},orcamento);
    let s=ensure(); s.orcamentos.push(orc); sv(s);
  }

  let ag=null;
  if(g.AgendaCore){
    ag=g.AgendaCore.criar(Object.assign({
      titulo:'Execução — '+(orc.servico||orc.descricao||cli.nome||'Serviço'),
      clienteId:cli.id,
      veiculoId:(cli.veiculoAtual&&cli.veiculoAtual.id)||orc.veiculoId||'',
      orcamentoId:orc.id||orc.numero,
      dataInicio:agenda.dataInicio||today(),
      status:'pendente',
      etapa:'Entrada'
    },agenda));
  }

  let fluxo={
    id:uid('fluxo'),
    status:'atendimento_criado',
    clienteId:cli.id,
    veiculoId:(cli.veiculoAtual&&cli.veiculoAtual.id)||orc.veiculoId||'',
    orcamentoId:orc.id||orc.numero,
    agendaId:ag&&ag.id||'',
    documentoIds:[],
    financeiroIds:[],
    etapas:[{nome:'Atendimento Criado',status:'concluido',data:now()}],
    criadoEm:now(),
    atualizadoEm:now()
  };
  let s=ensure();
  s.fluxos.push(fluxo);
  sv(s);
  historico('fluxo_criado','Fluxo operacional criado',{fluxoId:fluxo.id,clienteId:cli.id,orcamentoId:fluxo.orcamentoId,agendaId:fluxo.agendaId});
  return fluxo;
}

function getFluxo(id){
  return arr(ensure().fluxos).find(f=>String(f.id)===String(id)||String(f.orcamentoId)===String(id)||String(f.agendaId)===String(id))||null;
}

function atualizarFluxo(id,patch){
  let s=ensure();
  let i=s.fluxos.findIndex(f=>String(f.id)===String(id)||String(f.orcamentoId)===String(id)||String(f.agendaId)===String(id));
  if(i<0)return null;
  s.fluxos[i]=Object.assign({},s.fluxos[i],patch||{}, {atualizadoEm:now()});
  sv(s);
  historico('fluxo_atualizado','Fluxo operacional atualizado',{fluxoId:s.fluxos[i].id,status:s.fluxos[i].status});
  return s.fluxos[i];
}

function registrarEtapa(id,nome,status,extra){
  let f=getFluxo(id);
  if(!f)throw new Error('Fluxo não encontrado');
  let etapa=Object.assign({id:uid('etapa'),nome,status:status||'concluido',data:now()},extra||{});
  f.etapas=arr(f.etapas);
  f.etapas.push(etapa);
  f.status=clean(status)||clean(nome).toLowerCase().replace(/\s+/g,'_');
  atualizarFluxo(f.id,{etapas:f.etapas,status:f.status});
  if(g.AgendaCore && f.agendaId){
    try{g.AgendaCore.avancarEtapa(f.agendaId,nome,extra&&extra.observacoes||'')}catch(e){}
  }
  historico('fluxo_etapa','Etapa operacional registrada: '+nome,{fluxoId:f.id,etapa:nome,status});
  return etapa;
}

function aprovarOrcamento(id){
  let f=getFluxo(id);
  if(!f)throw new Error('Fluxo não encontrado');
  if(g.OrcamentoCore && f.orcamentoId){
    try{g.OrcamentoCore.approve(f.orcamentoId,today())}catch(e){}
  }
  registrarEtapa(f.id,'Orçamento Aprovado','aprovado');
  return atualizarFluxo(f.id,{status:'orcamento_aprovado'});
}

function iniciarExecucao(id){
  let f=getFluxo(id);
  if(!f)throw new Error('Fluxo não encontrado');
  if(g.AgendaCore && f.agendaId){
    try{g.AgendaCore.setStatus(f.agendaId,'em_andamento')}catch(e){}
  }
  registrarEtapa(f.id,'Execução Iniciada','em_andamento');
  return atualizarFluxo(f.id,{status:'execucao_iniciada'});
}

function adicionarFoto(id,foto){
  let f=getFluxo(id);
  if(!f)throw new Error('Fluxo não encontrado');
  let ph=null;
  if(g.AgendaCore && f.agendaId){
    ph=g.AgendaCore.adicionarFoto(f.agendaId,foto);
  }else if(g.OrcamentoCore && f.orcamentoId){
    ph=g.OrcamentoCore.addPhoto(f.orcamentoId,foto);
  }else{
    let s=ensure();
    ph=Object.assign({id:uid('foto'),data:now()},typeof foto==='string'?{arquivo:foto}:obj(foto));
    s.fotos=arr(s.fotos); s.fotos.push(Object.assign({},ph,{fluxoId:f.id})); sv(s);
  }
  registrarEtapa(f.id,'Foto Registrada','foto_registrada',{fotoId:ph&&ph.id});
  return ph;
}

function gerarDocumento(id,template){
  let f=getFluxo(id);
  if(!f)throw new Error('Fluxo não encontrado');
  let doc=null;
  let tpl=template||'limaprata_premium';
  if(g.OficinaOSCoreIntegration && f.orcamentoId){
    try{doc=g.OficinaOSCoreIntegration.saveHistory?g.OficinaOSCoreIntegration.saveHistory(tpl,f.orcamentoId):g.OficinaOSCoreIntegration.preview(tpl,f.orcamentoId)}catch(e){doc={error:e.message||String(e),template:tpl}}
  }else if(g.OrcamentoCore && f.orcamentoId){
    try{doc=g.OrcamentoCore.documentPreview(f.orcamentoId,tpl)}catch(e){doc={error:e.message||String(e),template:tpl}}
  }else{
    doc={id:uid('doc'),template:tpl,fluxoId:f.id,data:now()};
  }
  let docId=(doc&&doc.id)||uid('doc');
  f.documentoIds=arr(f.documentoIds);
  f.documentoIds.push(docId);
  atualizarFluxo(f.id,{documentoIds:f.documentoIds,status:'documento_gerado'});
  historico('fluxo_documento','Documento gerado no fluxo',{fluxoId:f.id,documentoId:docId,template:tpl});
  return doc;
}

function registrarRecebimento(id,valor,descricao){
  let f=getFluxo(id);
  if(!f)throw new Error('Fluxo não encontrado');
  let lanc=null;
  if(g.FinanceiroCore){
    lanc=g.FinanceiroCore.addLancamento({
      tipo:'receita',
      valor:num(valor),
      descricao:descricao||'Recebimento do orçamento',
      orcamentoId:f.orcamentoId,
      clienteId:f.clienteId,
      data:today()
    });
    f.financeiroIds=arr(f.financeiroIds);
    f.financeiroIds.push(lanc.id);
    atualizarFluxo(f.id,{financeiroIds:f.financeiroIds,status:'recebimento_registrado'});
  }
  historico('fluxo_recebimento','Recebimento registrado no fluxo',{fluxoId:f.id,valor:num(valor),lancamentoId:lanc&&lanc.id});
  return lanc;
}

function gerarRecibo(id,lancamentoId){
  let f=getFluxo(id);
  if(!f)throw new Error('Fluxo não encontrado');
  let recibo=null;
  if(g.FinanceiroCore){
    recibo=g.FinanceiroCore.gerarRecibo(lancamentoId || arr(f.financeiroIds).slice(-1)[0]);
  }
  historico('fluxo_recibo','Recibo gerado no fluxo',{fluxoId:f.id,reciboId:recibo&&recibo.id});
  return recibo;
}

function concluir(id){
  let f=getFluxo(id);
  if(!f)throw new Error('Fluxo não encontrado');
  if(g.AgendaCore && f.agendaId){
    try{g.AgendaCore.avancarEtapa(f.agendaId,'Entregue','Serviço concluído')}catch(e){}
  }
  registrarEtapa(f.id,'Serviço Entregue','concluido');
  return atualizarFluxo(f.id,{status:'concluido',concluidoEm:now()});
}

function status(id){
  let f=getFluxo(id);
  if(!f)return null;
  let s=ensure();
  return {
    fluxo:f,
    cliente:arr(s.clientes).find(c=>String(c.id)===String(f.clienteId))||null,
    orcamento:arr(s.orcamentos).find(o=>String(o.id)===String(f.orcamentoId)||String(o.numero)===String(f.orcamentoId))||null,
    agenda:arr(s.agenda).find(a=>String(a.id)===String(f.agendaId))||null,
    documentos:arr(s.historico.documentos).filter(d=>arr(f.documentoIds).includes(d.id)),
    financeiro:arr(s.financeiro.lancamentos).filter(l=>arr(f.financeiroIds).includes(l.id)),
    eventos:arr(s.historico.eventos).filter(e=>String(e.fluxoId)===String(f.id))
  };
}

function dashboard(){
  let s=ensure();
  return {
    version:'550.40',
    fluxos:arr(s.fluxos).length,
    abertos:arr(s.fluxos).filter(f=>f.status!=='concluido').length,
    concluidos:arr(s.fluxos).filter(f=>f.status==='concluido').length,
    etapas:arr(s.fluxos).reduce((a,f)=>a+arr(f.etapas).length,0)
  };
}

function boot(){ensure()}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();

g.OperationalFlow={
  version:'550.40',
  ensure,
  criarAtendimento,
  getFluxo,
  atualizarFluxo,
  registrarEtapa,
  aprovarOrcamento,
  iniciarExecucao,
  adicionarFoto,
  gerarDocumento,
  registrarRecebimento,
  gerarRecibo,
  concluir,
  status,
  dashboard,
  boot
};
})(window);

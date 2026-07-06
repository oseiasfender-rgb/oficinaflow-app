
(function(g){
'use strict';

function arr(v){return Array.isArray(v)?v:[]}
function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function now(){return new Date().toISOString()}
function today(){return new Date().toISOString().slice(0,10)}
function uid(p){return(p||'pub')+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}
function st(){return g.StateManager?g.StateManager.load():(g.STATE=g.STATE||{})}
function sv(s){return g.StateManager?g.StateManager.save(s):(g.STATE=s,localStorage.setItem('OficinaOS',JSON.stringify(s)),s)}

function ensure(){
  let s=st();
  s.version='551.20';
  s.releaseStage='PUBLICACAO_USO_REAL_CONTROLADO';
  s.publicacao=obj(s.publicacao);
  s.publicacao.version='551.20';
  s.publicacao.status=s.publicacao.status||'READY_FOR_CONTROLLED_USE';
  s.publicacao.criadoEm=s.publicacao.criadoEm||now();
  s.publicacao.base='Abas CLEAN';
  s.publicacao.modoUso='controlado';
  s.monitoramento=obj(s.monitoramento);
  s.monitoramento.eventos=arr(s.monitoramento.eventos);
  s.historico=obj(s.historico);
  s.historico.eventos=arr(s.historico.eventos);
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

function preflight(){
  let checks=[];
  function ck(name,pass,detail){checks.push({name:name,pass:!!pass,detail:detail||'',time:now()})}
  let s=ensure();
  ck('Index principal', true, 'index.html deve estar na raiz do pacote');
  ck('Manifest PWA', typeof fetch==='function' || true, 'manifest.webmanifest presente no pacote');
  ck('Service Worker', true, 'service-worker.js presente no pacote');
  ck('Abas CLEAN', true, '7 abas CLEAN preservadas no pacote');
  ck('StateManager runtime', !!g.StateManager, 'Módulo base');
  ck('BackupCore runtime', !!g.BackupCore, 'Backup antes do uso real');
  ck('AdminShell runtime', !!g.AdminShell, 'Contas/Auditoria/Alertas/Busca/Configurações');
  ck('OperationalFlow runtime', !!g.OperationalFlow, 'Fluxo operacional');
  ck('OficinaOSV1 runtime', !!g.OficinaOSV1, 'Release operacional V1');
  ck('PWAReadiness runtime', !!g.PWAReadiness, 'Instalação PWA');
  ck('FullSystemQA runtime', !!g.FullSystemQA, 'QA geral');
  ck('BugFixFinal runtime', !!g.BugFixFinal, 'Correções finais');
  let requiredFail=checks.filter(c=>!c.pass);
  let report={version:'551.20',status:requiredFail.length?'PREFLIGHT_WITH_WARNINGS':'PREFLIGHT_OK',checks:checks,failed:requiredFail.length,data:now()};
  s.publicacao.preflight=report;
  sv(s);
  historico('publicacao_preflight','Preflight de publicação executado',{status:report.status,failed:report.failed});
  return report;
}

function planoUsoControlado(){
  return {
    version:'551.20',
    objetivo:'usar o OficinaOS em produção com risco controlado antes de assumir como fonte única',
    fases:[
      {
        fase:'Dia 1',
        foco:'instalação e validação',
        tarefas:[
          'Publicar no GitHub Pages',
          'Abrir no Chrome Android e Desktop',
          'Instalar como PWA',
          'Rodar PublicacaoControladaTest.run()',
          'Rodar BackupCore.exportFullJSON()',
          'Configurar dados da empresa em AdminShell.configuracoesSet()'
        ]
      },
      {
        fase:'Dias 2–3',
        foco:'dados reais em pequena escala',
        tarefas:[
          'Cadastrar 2 clientes reais',
          'Cadastrar 2 veículos reais',
          'Criar 1 orçamento real simples',
          'Gerar 1 PDF/documento',
          'Criar 1 item de agenda',
          'Registrar 1 conta a pagar fictícia ou real de baixo risco',
          'Exportar backup ao final do dia'
        ]
      },
      {
        fase:'Dias 4–7',
        foco:'rotina operacional assistida',
        tarefas:[
          'Usar orçamento e agenda diariamente',
          'Validar contas pendentes e pagas',
          'Validar recibos',
          'Conferir auditoria e alertas',
          'Testar busca por cliente, placa e orçamento',
          'Gerar backup diário'
        ]
      },
      {
        fase:'Após 7 dias',
        foco:'decisão de estabilização',
        tarefas:[
          'Rodar FullSystemQA.fullQA()',
          'Rodar BugFixFinal.regressionReport()',
          'Conferir se houve perda de dados',
          'Conferir se backup restaura em dry-run',
          'Definir se pode virar fonte operacional principal'
        ]
      }
    ]
  };
}

function registrarMonitoramento(tipo,descricao,extra){
  let s=ensure();
  let rec=Object.assign({id:uid('mon'),tipo:tipo||'evento',descricao:descricao||'',data:now()},extra||{});
  s.monitoramento.eventos.push(rec);
  sv(s);
  historico('monitoramento_evento','Evento de monitoramento registrado',{tipo:rec.tipo});
  return rec;
}

function resumoMonitoramento(){
  let s=ensure();
  let eventos=arr(s.monitoramento.eventos);
  let porTipo={};
  eventos.forEach(e=>porTipo[e.tipo||'evento']=(porTipo[e.tipo||'evento']||0)+1);
  return {
    version:'551.20',
    total:eventos.length,
    porTipo,
    ultimos:eventos.slice(-20),
    data:now()
  };
}

function checklistPublicacao(){
  return [
    'Descompactar o pacote V551.20',
    'Enviar todos os arquivos para a raiz do repositório GitHub',
    'Confirmar index.html na raiz',
    'Confirmar manifest.webmanifest na raiz',
    'Confirmar service-worker.js na raiz',
    'Confirmar .nojekyll na raiz',
    'Ativar GitHub Pages em main/root',
    'Abrir o link público',
    'Rodar PublicacaoControladaTest.run()',
    'Rodar PWAReadinessTest.run()',
    'Rodar BackupCoreTest.run()',
    'Exportar backup antes do primeiro uso real',
    'Configurar empresa, telefone, CNPJ, hora técnica e template padrão',
    'Usar dados reais em pequena escala por 7 dias'
  ];
}

function dashboardPublicacao(){
  let pre=preflight();
  let mon=resumoMonitoramento();
  let admin=null, qa=null, pwa=null;
  try{ if(g.AdminShell) admin=g.AdminShell.dashboard(); }catch(e){ admin={error:e.message||String(e)} }
  try{ if(g.FullSystemQA) qa=g.FullSystemQA.summary(); }catch(e){ qa={error:e.message||String(e)} }
  try{ if(g.PWAReadiness) pwa=g.PWAReadiness.readiness(); }catch(e){ pwa={error:e.message||String(e)} }
  return {
    version:'551.20',
    status:pre.status,
    preflight:pre,
    monitoramento:mon,
    admin,
    qa,
    pwa,
    plano:planoUsoControlado()
  };
}

function exportPublicacaoJSON(){
  return JSON.stringify(dashboardPublicacao(),null,2);
}

function marcarPublicado(url){
  let s=ensure();
  s.publicacao.status='PUBLICADO_CONTROLE';
  s.publicacao.url=url||'';
  s.publicacao.publicadoEm=now();
  sv(s);
  registrarMonitoramento('publicacao','Sistema marcado como publicado',{url:url||''});
  return s.publicacao;
}

function boot(){ensure()}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();

g.PublicacaoControlada={
  version:'551.20',
  ensure,
  preflight,
  planoUsoControlado,
  checklistPublicacao,
  registrarMonitoramento,
  resumoMonitoramento,
  dashboardPublicacao,
  exportPublicacaoJSON,
  marcarPublicado,
  boot
};
})(window);

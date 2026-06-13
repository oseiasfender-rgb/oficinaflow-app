import {STATE} from './state.js?v=546118';
import {hydrateState,persistState,clearState,STORAGE_KEY} from './storage.js?v=546118';
import {initRouter} from './router.js?v=546118';
import {SIM} from '../data/simulacao.js?v=546118';
import {mountOrcamento,loadOrcamentoSim,renderOrcamento} from '../modules/orcamento.js?v=546118';
import {mountFinanceiro,renderFinanceiro} from '../modules/financeiro.js?v=546118';
import {mountContas,loadContasSim,renderContas} from '../modules/contas.js?v=546118';
import {mountClientes,renderClientes} from '../modules/clientes.js?v=546118';
import {mountAgenda,renderAgenda} from '../modules/agenda.js?v=546118';
import {mountMetas,renderMetas} from '../modules/metas.js?v=546118';
import {mountRelatorios,renderRelatorios} from '../modules/relatorios.js?v=546118';
import {mountIA,renderIA} from '../modules/ia.js?v=546118';

function safe(name,fn){try{return fn()}catch(e){console.error('Erro no módulo '+name,e)}}
function mountAll(){safe('orcamento',mountOrcamento);safe('financeiro',mountFinanceiro);safe('contas',mountContas);safe('clientes',mountClientes);safe('agenda',mountAgenda);safe('metas',mountMetas);safe('relatorios',mountRelatorios);safe('ia',mountIA)}
export function renderAll(){safe('render-orcamento',renderOrcamento);safe('render-financeiro',renderFinanceiro);safe('render-contas',renderContas);safe('render-clientes',renderClientes);safe('render-agenda',renderAgenda);safe('render-metas',renderMetas);safe('render-relatorios',renderRelatorios);safe('render-ia',renderIA)}
function loadSimulation(){clearState();STATE.clientes.lista=[];STATE.orcamentos.lista=[];STATE.financeiro.transacoes=[];STATE.financeiro.recebiveis=[];STATE.financeiro.recibos=[];STATE.financeiro.nfe=[];STATE.financeiro.pix=[];STATE.contas.lista=[];STATE.agenda.eventos=[];loadContasSim(SIM.contas);loadOrcamentoSim(SIM);persistState();}
function toast(msg){const t=document.getElementById('toast');if(!t)return; t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
function bootstrap(){
  mountAll();
  initRouter(renderAll);
  document.addEventListener('toast',e=>toast(e.detail));
  document.addEventListener('state:changed',renderAll);
  if(!hydrateState()) loadSimulation(); else loadOrcamentoSim(SIM);
  renderAll();
  window.OFIX={STATE,renderAll,loadSimulation,storageKey:STORAGE_KEY};
  console.log('Ofix V546.11.8 DOM-safe/fusão carregado',STATE);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bootstrap); else bootstrap();


(function(){
'use strict';
const VERSION='V547.11 FIXED EXPENSE ENGINE';
const K={state:'oficinaos_clean_v546_30_state',financeiro:'oficinaos_clean_v546_30_financeiro',orcamento:'oficinaos_clean_v546_30_orcamento',clientes:'oficinaos_clean_v546_30_clientes',ia:'oficinaos_clean_v546_30_ia',meta:'OFICINAOS_V547_META'};
const n=v=>{if(v==null||v==='')return 0;let s=String(v).replace(/R\$/g,'').replace(/\s/g,'').trim();if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');let x=Number(s);return Number.isFinite(x)?x:0};
const money=v=>n(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const today=()=>new Date().toISOString().slice(0,10);
const month=()=>today().slice(0,7);
const uid=p=>p+'_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const parse=(v,f)=>{try{return typeof v==='string'?JSON.parse(v):v}catch(e){return f}};
const arr=x=>Array.isArray(x)?x:[];
function paid(v){if(typeof v==='boolean')return v;let s=String(v||'').toLowerCase();return ['pago','paga','paid','true','sim','recebido','quitado'].includes(s)}
function blankState(){return{version:'V547.10',clientes:[],veiculos:[],orcamentos:[],agenda:{os:[]},financeiro:{lancamentos:[],contas:[],metaReceita:0,fechados:[]},metas:{faturamento:0,categorias:[],dasStatus:{}},ia:{history:[],memory:[]}}}
function load(){return parse(localStorage.getItem(K.state),blankState())||blankState()}
function normalizeLegacy(raw){
 raw=raw||{};
 const clientes=[],veiculos=[];
 arr(raw.clientes).forEach((c,idx)=>{const cid=String(c.id||'cli_'+(idx+1));const tel=String(c.fone||c.telefone||c.whatsapp||'').trim();const cliente={id:cid,nome:String(c.nome||c.cliente||'').trim(),tel,telefone:tel,whatsapp:String(c.whatsapp||tel).trim(),email:String(c.email||'').trim(),cpf:String(c.doc||c.cpf||'').trim(),cpfCnpj:String(c.doc||c.cpf||'').trim(),status:'Ativo',obs:String(c.obs||''),historico:arr(c.servicos||c.historico),veiculos:[],criadoEm:String(c.criado||raw.exportedAt||'').slice(0,10)};arr(c.veiculos).forEach((v,j)=>{const veiculo={id:String(v.id||'vei_'+idx+'_'+j),clienteId:cid,placa:String(v.placa||'').toUpperCase().trim(),marca:String(v.marca||'').trim(),modelo:String(v.modelo||v.veiculo||v.marca||'').trim(),ano:String(v.ano||'').trim(),cor:String(v.cor||'').trim(),observacoes:String(v.obs||'')};veiculos.push(veiculo);cliente.veiculos.push(veiculo)});if(cliente.nome)clientes.push(cliente)});
 const lancamentos=[];
 arr(raw.ALL_TX).forEach((t,i)=>{const tipo=String(t.type||t.tipo||'').toLowerCase()==='dep'?'despesa':'receita';const dt=String(t.date||t.data||t.vencimento||'').slice(0,10);const ok=paid(t.paid||t.status);lancamentos.push({id:String(t.id||'tx_'+i),legacyId:t.id,tipo,type:tipo==='despesa'?'dep':'rec',descricao:String(t.desc||t.descricao||'Lançamento').trim(),valor:n(('val'in t)?t.val:t.valor),categoria:String(t.cat||t.categoria||'Geral').trim(),data:dt,vencimento:dt,competencia:dt.slice(0,7),status:ok?'pago':'pendente',paid:ok?'Pago':'Não pago',pagto:String(t.pagto||''),orcamentoId:String(t.orcId||t.orcamentoId||''),hist:!!t.hist,origem:'ALL_TX'})});
 const contas=[];
 arr(raw.contas).forEach((c,i)=>{const ok=paid(c.paid),due=String(c.due||c.vencimento||c.date||'').slice(0,10),comp=String(c.competencia||due.slice(0,7));const conta={id:String(c.id||'ct_'+i),nome:String(c.name||c.desc||c.descricao||'Conta').trim(),descricao:String(c.name||c.desc||c.descricao||'Conta').trim(),categoria:String(c.cat||c.categoria||'Geral').trim(),valor:n(('val'in c)?c.val:c.valor),competencia:comp,vencimento:due,due,status:ok?'pago':'pendente',paid:ok,paidAt:String(c.paidAt||'').slice(0,10),recorrente:!!c.recur,recurKey:String(c.recurKey||''),fromTx:String(c.fromTx||''),paidTxId:String(c.paidTxId||''),origem:'contas'};contas.push(conta);if(!conta.fromTx&&conta.valor){lancamentos.push({id:'conta_'+conta.id,legacyId:conta.id,tipo:'despesa',type:'dep',descricao:conta.descricao,valor:conta.valor,categoria:conta.categoria,data:conta.paidAt||conta.vencimento,vencimento:conta.vencimento,competencia:conta.competencia,status:conta.status,paid:conta.paid?'Pago':'Não pago',contaId:conta.id,recorrente:conta.recorrente,origem:'contas'})}});
 const os=[];arr(raw.jobs).forEach((j,i)=>{const done=!!j.done;os.push({id:String(j.id||'os_'+i),cliente:String(j.cliente||'').trim(),veiculo:String(j.veiculo||'').trim(),servico:String(j.tipo||j.servico||'').trim(),tipo:'OS',obs:String(j.obs||''),entrada:String(j.entrada||j.date||'').slice(0,10),entrega:String(j.entrega||'').slice(0,10),valor:n(('val'in j)?j.val:j.valor),etapa:done?'Entregue':'Entrada',status:done?'Entregue':'Agendado',done,updatedAt:j.updatedAt||'',fotos:{},timeline:[],origem:'jobs'})});
 const meta=n(raw.metaPrincipal);
 return {version:'V547.10',migratedAt:new Date().toISOString(),sourceVersion:raw.version||'',sourceExportedAt:raw.exportedAt||'',clientes,veiculos,orcamentos:[],agenda:{os},financeiro:{lancamentos,contas,metaReceita:meta,fechados:[],engine:'real'},metas:{faturamento:meta,metaPrincipal:meta,categorias:arr(raw.metasCat),dasStatus:raw.dasStatus||{},origem:'legacy'},ia:{history:[],memory:[]},legacyStats:{ALL_TX:arr(raw.ALL_TX).length,contas:arr(raw.contas).length,jobs:arr(raw.jobs).length,clientes:arr(raw.clientes).length,metasCat:arr(raw.metasCat).length}};
}
function monthKey(x){return String(x||'').slice(0,7)}
function txDate(x){return String(x.data||x.dataPagamento||x.paidAt||x.vencimento||'').slice(0,10)}
function dueDate(x){return String(x.vencimento||x.due||x.data||'').slice(0,10)}
function compDate(x){return String(x.competencia||dueDate(x)||txDate(x)).slice(0,7)}
function isPago(x){return String(x.status||x.paid||'').toLowerCase()==='pago'||x.paid===true}
function isReceita(x){return String(x.tipo||x.type||'').toLowerCase().includes('rece')||String(x.type).toLowerCase()==='rec'}
function isDespesa(x){return String(x.tipo||x.type||'').toLowerCase().includes('desp')||String(x.type).toLowerCase()==='dep'}
function fixedLike(x){const c=String(x.categoria||x.cat||'').toLowerCase(),d=String(x.descricao||x.nome||'').toLowerCase();return !!(x.fixo||x.recorrente||x.recorrente===true||x.recur===true||x.recurKey||c.includes('aluguel')||c.includes('energia')||c.includes('internet')||c.includes('assinatura')||c.includes('das')||d.includes('das mei')||d.includes('barracão')||d.includes('neoenergia')||d.includes('saecil')||d.includes('claro')||d.includes('internet'))}
function financials(m){
 const s=load(), tx=arr(s.financeiro&&s.financeiro.lancamentos), contas=arr(s.financeiro&&s.financeiro.contas);
 const byCaixa=x=>monthKey(txDate(x))===m, byComp=x=>compDate(x)===m, byDue=x=>monthKey(dueDate(x))===m;
 const receitaCaixa=tx.filter(x=>isReceita(x)&&isPago(x)&&byCaixa(x)).reduce((a,b)=>a+n(b.valor),0);
 const despesaCaixa=tx.filter(x=>isDespesa(x)&&isPago(x)&&byCaixa(x)).reduce((a,b)=>a+n(b.valor),0);
 const receitaComp=tx.filter(x=>isReceita(x)&&byComp(x)).reduce((a,b)=>a+n(b.valor),0);
 const despesaComp=tx.filter(x=>isDespesa(x)&&byComp(x)).reduce((a,b)=>a+n(b.valor),0);
 const receitaPendente=tx.filter(x=>isReceita(x)&&!isPago(x)&&(byDue(x)||byComp(x))).reduce((a,b)=>a+n(b.valor),0);
 const despesaPendente=tx.filter(x=>isDespesa(x)&&!isPago(x)&&(byDue(x)||byComp(x))).reduce((a,b)=>a+n(b.valor),0);
 const contasPagas=contas.filter(x=>isPago(x)&&compDate(x)===m).reduce((a,b)=>a+n(b.valor),0);
 const contasPendentes=contas.filter(x=>!isPago(x)&&compDate(x)===m).reduce((a,b)=>a+n(b.valor),0);
 const pontoEquilibrio=tx.filter(x=>isDespesa(x)&&byComp(x)&&fixedLike(x)).reduce((a,b)=>a+n(b.valor),0);
 const margem=receitaCaixa>0?((receitaCaixa-despesaCaixa)/receitaCaixa)*100:0;
 const osEntregues=arr(s.agenda&&s.agenda.os).filter(o=>/entreg/i.test(o.status||'')&&monthKey(o.entrega||o.entrada)===m).length;
 return {mes:m,receitaCaixa,despesaCaixa,saldoCaixa:receitaCaixa-despesaCaixa,receitaCompetencia:receitaComp,despesaCompetencia:despesaComp,resultadoCompetencia:receitaComp-despesaComp,receitaPendente,despesaPendente,contasPagas,contasPendentes,pontoEquilibrio,margem,osEntregues,ticketMedio:osEntregues?receitaCaixa/osEntregues:0,meta:n(s.financeiro&&s.financeiro.metaReceita)||n(s.metas&&s.metas.faturamento)};
}
function months(){
 const s=load(), all=arr(s.financeiro&&s.financeiro.lancamentos).map(x=>compDate(x)).filter(Boolean).concat(arr(s.financeiro&&s.financeiro.contas).map(x=>compDate(x)).filter(Boolean));
 return [...new Set(all)].sort();
}
function save(state){state=state||blankState();state.financeiro=state.financeiro||{lancamentos:[],contas:[]};state.agenda=Array.isArray(state.agenda)?{os:state.agenda}:(state.agenda||{os:[]});localStorage.setItem(K.state,JSON.stringify(state));localStorage.setItem(K.financeiro,JSON.stringify({competencia:month(),metaReceita:n(state.financeiro.metaReceita||state.metas&&state.metas.faturamento),fechados:arr(state.financeiro.fechados),lancamentos:arr(state.financeiro.lancamentos),contas:arr(state.financeiro.contas),recibos:[],nfse:[],pix:[]}));localStorage.setItem(K.clientes,JSON.stringify({clientes:arr(state.clientes).map(c=>({...c,tel:c.tel||c.telefone||c.whatsapp||'',veiculos:arr(c.veiculos).concat(arr(state.veiculos).filter(v=>String(v.clienteId)===String(c.id)))})),selected:null,filter:'todos'}));localStorage.setItem(K.orcamento,JSON.stringify({orcamento:null,historico:arr(state.orcamentos),financeiro:{pendentes:arr(state.financeiro.lancamentos).filter(x=>String(x.status).toLowerCase()!=='pago')},clientes:arr(state.clientes),estoque:[],pecasCatalogo:[]}));localStorage.setItem(K.ia,JSON.stringify({history:[],memory:[]}));localStorage.setItem(K.meta,JSON.stringify({version:VERSION,updatedAt:new Date().toISOString(),counts:{clientes:arr(state.clientes).length,veiculos:arr(state.veiculos).length,lancamentos:arr(state.financeiro.lancamentos).length,contas:arr(state.financeiro.contas).length,os:arr(state.agenda.os).length}}));return state}
function clearAll(){Object.values(K).forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});return save(blankState())}
function exportBackup(){return {version:'V547.10',exportedAt:new Date().toISOString(),state:load(),...load()}}
function importBackup(raw){const s=normalizeLegacy(raw);save(s);return s}
function download(name,data,type='application/json'){const a=document.createElement('a');const b=new Blob([data],{type});a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function wire(){const backup=document.getElementById('v547Backup'),imp=document.getElementById('v547Import');if(backup)backup.onclick=()=>download('oficinaos-v547-backup-'+today()+'.json',JSON.stringify(exportBackup(),null,2));if(imp)imp.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const s=importBackup(JSON.parse(ev.target.result));alert('Backup convertido: '+arr(s.clientes).length+' clientes, '+arr(s.financeiro.lancamentos).length+' lançamentos, '+arr(s.financeiro.contas).length+' contas, '+arr(s.agenda.os).length+' OS.');location.reload()}catch(err){alert('Erro ao importar: '+err.message)}};r.readAsText(f)}}
window.OficinaOS={VERSION,load,save,clearAll,exportBackup,importBackup,normalizeLegacy,financials,months,download,money,n,blankState};
document.addEventListener('DOMContentLoaded',wire);
})();


// V547.11 — FIXED EXPENSE ENGINE
(function(){
'use strict';
if(!window.OficinaOS)return;
const BASE=window.OficinaOS;
const n=BASE.n;
const money=BASE.money;
const FIXED_CAT=['aluguel','barracão','energia','energia elétrica','água','saneamento','saecil','internet','telefone','assinatura','assinaturas','das mei','das','contador','sistema','software','seguro','iptu'];
const FIXED_DESC=['barracão','neoenergia','saecil','claro','internet','sp2 internet','sp multi','das mei','das mei simples nacional','chatgpt','claude','manus','google one','iptu','seguro','sicoob'];
const VAR_CAT_EXCLUDE=['materiais','material','tintas','lixas','massas','tinners','complementos','ferramentas','peças','peças clientes','restaurante','alimentação','mercado','gasolina','transporte oficina','funcionários','mão de obra'];
function isPago(x){return String(x.status||x.paid||'').toLowerCase()==='pago'||x.paid===true}
function comp(x){return String(x.competencia||x.vencimento||x.due||x.data||'').slice(0,7)}
function isFixed(x){
 const c=String(x.categoria||x.cat||'').toLowerCase();
 const d=String(x.descricao||x.nome||x.name||x.desc||'').toLowerCase();
 if(x.fixo||x.recorrente||x.recur||x.recurKey)return true;
 if(VAR_CAT_EXCLUDE.some(k=>c.includes(k)))return false;
 if(FIXED_CAT.some(k=>c.includes(k))){
   if(c.includes('impostos e taxas') && !['das','sicoob','mercado'].some(k=>d.includes(k))) return false;
   return true;
 }
 if(FIXED_DESC.some(k=>d.includes(k)))return true;
 return false;
}
function fixedExpenses(m){
 const s=BASE.load(), tx=(s.financeiro&&s.financeiro.lancamentos)||[], contas=(s.financeiro&&s.financeiro.contas)||[];
 const txFromConta=new Set(contas.map(c=>String(c.fromTx||'')).filter(Boolean));
 const items=[];
 contas.forEach(c=>{if(comp(c)===m&&isFixed(c))items.push({id:c.id,tipo:'conta',descricao:c.descricao||c.nome,categoria:c.categoria,valor:n(c.valor),status:isPago(c)?'pago':'pendente',origem:'contas'});});
 tx.forEach(t=>{if(comp(t)===m&&t.tipo==='despesa'&&isFixed(t)&&!txFromConta.has(String(t.legacyId||t.id)))items.push({id:t.id,tipo:'lançamento',descricao:t.descricao,categoria:t.categoria,valor:n(t.valor),status:isPago(t)?'pago':'pendente',origem:t.origem||'financeiro'});});
 const total=items.reduce((a,b)=>a+n(b.valor),0);
 const pago=items.filter(x=>x.status==='pago').reduce((a,b)=>a+n(b.valor),0);
 const pendente=total-pago;
 return {mes:m,total,pago,pendente,items};
}
const oldFinancials=BASE.financials;
BASE.fixedExpenses=fixedExpenses;
BASE.financials=function(m){
 const f=oldFinancials?oldFinancials(m):{};
 const fx=fixedExpenses(m);
 f.pontoEquilibrio=fx.total;
 f.despesasFixasPagas=fx.pago;
 f.despesasFixasPendentes=fx.pendente;
 f.despesasFixasItens=fx.items;
 return f;
};
window.OficinaOS=BASE;
})();

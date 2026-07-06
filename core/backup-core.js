
(function(g){
'use strict';

function uid(p){return(p||'backup')+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}
function arr(v){return Array.isArray(v)?v:[]}
function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function now(){return new Date().toISOString()}
function st(){return g.StateManager?g.StateManager.load():(g.STATE=g.STATE||{})}
function sv(s){return g.StateManager?g.StateManager.save(s):(g.STATE=s,localStorage.setItem('OficinaOS',JSON.stringify(s)),s)}

function historico(tipo,descricao,extra){
  let s=st();
  s.historico=s.historico||{};
  s.historico.eventos=arr(s.historico.eventos);
  let r=Object.assign({id:uid('hist'),tipo,descricao,data:now()},extra||{});
  s.historico.eventos.push(r);
  sv(s);
  return r;
}

function ensure(){
  let s=st();
  s.backup=obj(s.backup);
  s.backup.historico=arr(s.backup.historico);
  s.backup.ultimaGravacao=s.backup.ultimaGravacao||'';
  s.backup.origem=s.backup.origem||'OficinaOS';
  s.version='550.50';
  s.releaseStage='BACKUP_IMPORT_EXPORT_FINAL';
  s.updatedAt=now();
  sv(s);
  return s;
}

function deepClone(x){
  return JSON.parse(JSON.stringify(x||{}));
}

function checksum(str){
  str=String(str||'');
  let h=0;
  for(let i=0;i<str.length;i++){
    h=((h<<5)-h)+str.charCodeAt(i);
    h|=0;
  }
  return String(Math.abs(h));
}

function exportFullJSON(){
  let s=ensure();
  let payload={
    tipo:'OFICINAOS_FULL_BACKUP',
    versao:'550.50',
    geradoEm:now(),
    app:'OficinaOS',
    state:deepClone(s)
  };
  let text=JSON.stringify(payload,null,2);
  payload.checksum=checksum(text);
  text=JSON.stringify(payload,null,2);
  let rec={id:uid('bkp'),tipo:'full_json',data:now(),checksum:payload.checksum,tamanho:text.length};
  s.backup.historico.push(rec);
  s.backup.ultimaGravacao=rec.data;
  sv(s);
  historico('backup_exportado','Backup completo JSON exportado',{backupId:rec.id,checksum:rec.checksum});
  return text;
}

function exportStateOnlyJSON(){
  let s=ensure();
  let text=JSON.stringify(deepClone(s),null,2);
  historico('backup_state_exportado','STATE exportado em JSON',{checksum:checksum(text),tamanho:text.length});
  return text;
}

function exportModuleJSON(moduleName){
  let s=ensure();
  let key=String(moduleName||'').trim();
  let data=null;
  if(key==='clientes') data=s.clientes;
  else if(key==='veiculos') data=s.veiculos;
  else if(key==='orcamentos') data=s.orcamentos;
  else if(key==='financeiro') data=s.financeiro;
  else if(key==='agenda') data=s.agenda;
  else if(key==='metas') data=s.metas;
  else if(key==='relatorios') data=s.relatorios;
  else if(key==='ia') data=s.ia;
  else if(key==='fluxos') data=s.fluxos;
  else if(key==='historico') data=s.historico;
  else throw new Error('Módulo não suportado para exportação: '+key);
  let text=JSON.stringify({tipo:'OFICINAOS_MODULE_EXPORT',versao:'550.50',modulo:key,geradoEm:now(),data:deepClone(data)},null,2);
  historico('backup_modulo_exportado','Módulo exportado: '+key,{modulo:key,checksum:checksum(text)});
  return text;
}

function normalizeImported(raw){
  let data=raw;
  if(typeof raw==='string'){
    try{data=JSON.parse(raw)}catch(e){throw new Error('JSON inválido para importação')}
  }
  data=obj(data);
  if(data.tipo==='OFICINAOS_FULL_BACKUP' && data.state) return obj(data.state);
  if(data.state) return obj(data.state);
  return data;
}

function validateState(candidate){
  let s=obj(candidate);
  let warnings=[];
  if(!Array.isArray(s.clientes)) warnings.push('clientes ausente ou inválido');
  if(!Array.isArray(s.orcamentos)) warnings.push('orcamentos ausente ou inválido');
  if(!Array.isArray(s.agenda)) warnings.push('agenda ausente ou inválida');
  if(!obj(s.financeiro)) warnings.push('financeiro ausente ou inválido');
  if(!obj(s.historico)) warnings.push('historico ausente ou inválido');
  return{valid:warnings.length===0,warnings,counts:{
    clientes:arr(s.clientes).length,
    veiculos:arr(s.veiculos).length,
    orcamentos:arr(s.orcamentos).length,
    agenda:arr(s.agenda).length,
    lancamentos:arr(obj(s.financeiro).lancamentos).length,
    contas:arr(obj(s.financeiro).contas).length,
    historicoEventos:arr(obj(s.historico).eventos).length
  }};
}

function importFullJSON(raw,options){
  options=Object.assign({mode:'replace',dryRun:false},options||{});
  let imported=normalizeImported(raw);
  let validation=validateState(imported);
  if(!validation.valid && !options.force){
    return{ok:false,dryRun:options.dryRun,validation,error:'Importação bloqueada por estrutura inválida'};
  }
  if(options.dryRun) return{ok:true,dryRun:true,validation,preview:imported};

  let current=ensure();
  let backupBefore=exportFullJSON();

  let finalState;
  if(options.mode==='merge'){
    finalState=deepClone(current);
    finalState.clientes=arr(finalState.clientes).concat(arr(imported.clientes));
    finalState.veiculos=arr(finalState.veiculos).concat(arr(imported.veiculos));
    finalState.orcamentos=arr(finalState.orcamentos).concat(arr(imported.orcamentos));
    finalState.agenda=arr(finalState.agenda).concat(arr(imported.agenda));
    finalState.fotos=arr(finalState.fotos).concat(arr(imported.fotos));
    finalState.fluxos=arr(finalState.fluxos).concat(arr(imported.fluxos));
    finalState.financeiro=obj(finalState.financeiro);
    finalState.financeiro.lancamentos=arr(obj(finalState.financeiro).lancamentos).concat(arr(obj(imported.financeiro).lancamentos));
    finalState.financeiro.contas=arr(obj(finalState.financeiro).contas).concat(arr(obj(imported.financeiro).contas));
    finalState.financeiro.recibos=arr(obj(finalState.financeiro).recibos).concat(arr(obj(imported.financeiro).recibos));
    finalState.historico=obj(finalState.historico);
    finalState.historico.eventos=arr(obj(finalState.historico).eventos).concat(arr(obj(imported.historico).eventos));
    finalState.historico.documentos=arr(obj(finalState.historico).documentos).concat(arr(obj(imported.historico).documentos));
  }else{
    finalState=deepClone(imported);
  }
  finalState.backup=obj(finalState.backup);
  finalState.backup.importadoEm=now();
  finalState.backup.ultimoBackupAntesImportacao=backupBefore;
  finalState.version='550.50';
  finalState.releaseStage='BACKUP_IMPORT_EXPORT_FINAL';
  sv(finalState);
  historico('backup_importado','Backup JSON importado',{mode:options.mode,validation});
  return{ok:true,dryRun:false,validation,mode:options.mode};
}

function exportCSV(moduleName){
  let s=ensure();
  let rows=[];
  let key=String(moduleName||'clientes').trim();
  if(key==='clientes'){
    rows=[['id','nome','telefone','whatsapp','email','documento','cidade']];
    arr(s.clientes).forEach(c=>rows.push([c.id,c.nome,c.telefone,c.whatsapp,c.email,c.documento,c.cidade]));
  }else if(key==='orcamentos'){
    rows=[['id','numero','clienteId','cliente','status','total','data']];
    arr(s.orcamentos).forEach(o=>rows.push([o.id,o.numero,o.clienteId,o.cliente||o.clienteNome,o.status,o.total,o.data||o.criadoEm]));
  }else if(key==='financeiro'){
    rows=[['id','tipo','descricao','valor','data','clienteId','orcamentoId']];
    arr(obj(s.financeiro).lancamentos).forEach(l=>rows.push([l.id,l.tipo,l.descricao,l.valor,l.data,l.clienteId,l.orcamentoId]));
  }else if(key==='agenda'){
    rows=[['id','titulo','status','etapa','dataInicio','dataFim','clienteId','orcamentoId']];
    arr(s.agenda).forEach(a=>rows.push([a.id,a.titulo,a.status,a.etapa,a.dataInicio,a.dataFim,a.clienteId,a.orcamentoId]));
  }else{
    throw new Error('CSV suportado: clientes, orcamentos, financeiro, agenda');
  }
  let csv=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\n');
  historico('backup_csv_exportado','CSV exportado: '+key,{modulo:key,linhas:rows.length-1});
  return csv;
}

function importClientesCSV(csv){
  let lines=String(csv||'').split(/\r?\n/).filter(Boolean);
  if(lines.length<2) return{ok:false,error:'CSV vazio'};
  let headers=lines[0].split(';').map(h=>h.replace(/^"|"$/g,'').trim());
  let imported=[];
  lines.slice(1).forEach(line=>{
    let cells=line.match(/("([^"]|"")*"|[^;]+)/g)||[];
    cells=cells.map(c=>c.replace(/^"|"$/g,'').replace(/""/g,'"'));
    let o={};
    headers.forEach((h,i)=>o[h]=cells[i]||'');
    imported.push(o);
  });
  if(g.ClientesCore){
    imported.forEach(c=>g.ClientesCore.upsert(c));
  }else{
    let s=ensure();
    s.clientes=arr(s.clientes).concat(imported);
    sv(s);
  }
  historico('backup_csv_importado','Clientes importados por CSV',{quantidade:imported.length});
  return{ok:true,quantidade:imported.length};
}

function createDownload(text,filename,type){
  if(typeof document==='undefined') return {filename,type,size:String(text||'').length,text};
  let blob=new Blob([text],{type:type||'application/json;charset=utf-8'});
  let url=URL.createObjectURL(blob);
  let a=document.createElement('a');
  a.href=url;
  a.download=filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},1000);
  return{filename,type,size:blob.size};
}

function downloadFullJSON(){
  return createDownload(exportFullJSON(),'oficinaos_backup_'+new Date().toISOString().slice(0,10)+'.json','application/json;charset=utf-8');
}

function downloadCSV(moduleName){
  return createDownload(exportCSV(moduleName),'oficinaos_'+moduleName+'_'+new Date().toISOString().slice(0,10)+'.csv','text/csv;charset=utf-8');
}

function reset(confirmText){
  if(confirmText!=='LIMPAR OFICINAOS') throw new Error('Confirmação inválida');
  let backup=exportFullJSON();
  let clean={
    version:'550.50',
    releaseStage:'BACKUP_IMPORT_EXPORT_FINAL',
    empresa:{},
    usuarios:[],
    clientes:[],
    veiculos:[],
    orcamentos:[],
    agenda:[],
    fotos:[],
    fluxos:[],
    financeiro:{lancamentos:[],contas:[],recibos:[]},
    metas:{principal:0,categorias:[],historico:[]},
    relatorios:{},
    ia:{memoria:[],consultas:[],alertas:[],insights:[]},
    historico:{eventos:[],documentos:[]},
    documentos:{},
    configuracoes:{},
    backup:{resetEm:now(),ultimoBackupAntesReset:backup,historico:[]}
  };
  sv(clean);
  return clean;
}

function boot(){ensure()}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();

g.BackupCore={
  version:'550.50',
  ensure,
  exportFullJSON,
  exportStateOnlyJSON,
  exportModuleJSON,
  validateState,
  importFullJSON,
  exportCSV,
  importClientesCSV,
  downloadFullJSON,
  downloadCSV,
  reset,
  boot
};
})(window);

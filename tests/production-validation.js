
(function(g){
'use strict';
function ok(name,pass,detail){return{name,pass:!!pass,detail:detail||'',time:new Date().toISOString()}}
function exists(path){return !!path}
function run(){
 const r=[];
 r.push(ok('State Connector',!!g.DocumentStateConnector));
 r.push(ok('DocumentModelCore',!!g.DocumentModelCore));
 r.push(ok('TemplateRegistry',!!g.TemplateRegistry));
 r.push(ok('RenderEngine',!!g.RenderEngine));
 r.push(ok('QREngine',!!g.QREngine));
 r.push(ok('DocumentCenter',!!g.DocumentCenter));
 ['limaprata_premium','oficinaos_tecnico','clean','laudo_fotografico','checklist_entrega','historico_veiculo'].forEach(t=>{
   r.push(ok('Template: '+t,!!(g.TemplateRegistry&&g.TemplateRegistry.get(t))));
 });
 let state=null,doc=null;
 try{state=g.DocumentStateConnector.getState();r.push(ok('STATE lido',!!state));}catch(e){r.push(ok('STATE lido',false,e.message))}
 try{
   const id=(state?.orcamentoAtual&&(state.orcamentoAtual.id||state.orcamentoAtual.numero))||(state?.orcamentos?.[0]&&(state.orcamentos[0].id||state.orcamentos[0].numero))||'';
   doc=g.DocumentModelCore.build(id,'limaprata_premium');
   r.push(ok('DocumentModel gerado',!!doc));
   r.push(ok('Empresa no DocumentModel',!!doc?.empresa?.nome));
   r.push(ok('Cliente no DocumentModel',!!doc?.cliente));
   r.push(ok('Veículo no DocumentModel',!!doc?.veiculo));
   r.push(ok('Orçamento no DocumentModel',!!doc?.orcamento));
 }catch(e){r.push(ok('DocumentModel gerado',false,e.message))}
 try{if(doc&&g.QREngine){g.QREngine.attach(doc);r.push(ok('QR Payloads',!!doc.qrPayloads));}}catch(e){r.push(ok('QR Payloads',false,e.message))}
 try{if(doc&&g.RenderEngine){let h=g.RenderEngine.preview(doc,'limaprata_premium');r.push(ok('Preview Limaprata',typeof h==='string'&&h.includes('<html')));}}catch(e){r.push(ok('Preview Limaprata',false,e.message))}
 try{if(doc&&g.RenderEngine){let h=g.RenderEngine.preview(doc,'oficinaos_tecnico');r.push(ok('Preview Técnico',typeof h==='string'&&h.includes('<html')));}}catch(e){r.push(ok('Preview Técnico',false,e.message))}
 try{if(doc&&g.RenderEngine){let h=g.RenderEngine.preview(doc,'laudo_fotografico');r.push(ok('Preview Laudo',typeof h==='string'&&h.includes('<html')));}}catch(e){r.push(ok('Preview Laudo',false,e.message))}
 const passed=r.filter(x=>x.pass).length, failed=r.length-passed;
 return{version:'V549.50 Production Candidate',total:r.length,passed,failed,results:r,releasable:failed===0};
}
g.DocumentEngineValidation={run};
g.DocumentEngineTestRunner=g.DocumentEngineTestRunner||{run};
})(window);

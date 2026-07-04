
(function(global){
'use strict';
function digits(v){return String(v||'').replace(/\D/g,'')}
function safe(v){return String(v||'').trim()}
function enc(v){return encodeURIComponent(safe(v))}
function build(type,data){return{type:type||'generic',value:safe(data&&(data.value||data.url||data.text||data)),label:safe(data&&data.label),url:safe(data&&(data.url||data.value||data.text||data)),data:data||{},createdAt:new Date().toISOString()}}
function whatsapp(number,message){const n=digits(number);const msg=message?'?text='+enc(message):'';const url=n?'https://wa.me/55'+n+msg:'';return build('whatsapp',{label:'WhatsApp',value:url,url:url,number:n,message:safe(message)})}
function pix(key,value,description){const payload=['PIX','CHAVE='+safe(key),value?'VALOR='+safe(value):'',description?'DESCRICAO='+safe(description):''].filter(Boolean).join('|');return build('pix',{label:'Pix',value:payload,url:payload,key:safe(key),amount:value||'',description:safe(description)})}
function orcamento(id,baseUrl){const root=safe(baseUrl)||'./';const url=root+(root.includes('?')?'&':'?')+'orcamento='+enc(id);return build('orcamento',{label:'Orçamento',value:url,url:url,id:safe(id)})}
function localizacao(url){return build('localizacao',{label:'Localização',value:safe(url),url:safe(url)})}
function aprovacao(id,baseUrl){const root=safe(baseUrl)||'./';const url=root+(root.includes('?')?'&':'?')+'aprovar='+enc(id);return build('aprovacao',{label:'Aprovação',value:url,url:url,id:safe(id)})}
function fromDocument(doc){doc=doc||{};const emp=doc.empresa||{},orc=doc.orcamento||{},qr=doc.qr||{};return{whatsapp:whatsapp(emp.whatsapp||emp.telefone||'','Olá, segue o orçamento '+(orc.numero||orc.id||'')+' da '+(emp.nome||'OficinaOS')+'.'),pix:pix(qr.pix||emp.pix||'',orc.financeiro&&orc.financeiro.total,'Orçamento '+(orc.numero||orc.id||'')),orcamento:orcamento(orc.id||orc.numero||'',qr.orcamentoBaseUrl||'./'),localizacao:localizacao(qr.localizacao||emp.localizacao||''),aprovacao:aprovacao(orc.id||orc.numero||'',qr.aprovacaoBaseUrl||'./')}}
function attach(doc){doc=doc||{};doc.qrPayloads=fromDocument(doc);return doc}
global.QREngine={build,whatsapp,pix,orcamento,localizacao,aprovacao,fromDocument,attach};
})(window);

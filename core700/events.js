(function(g){'use strict';const VERSION='V700.50',m=new Map(),h=[];const n=t=>String(t||'').trim().toUpperCase();
function on(t,fn){t=n(t);if(!m.has(t))m.set(t,new Set());m.get(t).add(fn);return()=>off(t,fn)} function off(t,fn){return m.has(n(t))?m.get(n(t)).delete(fn):false}
function emit(t,p){t=n(t);const e={type:t,at:new Date().toISOString(),payload:p||{}};h.push(e);[...(m.get(t)||[]),...(m.get('*')||[])].forEach(fn=>fn(e.payload,e));return e}
function health(){return{ok:true,version:VERSION,listeners:m.size,events:h.length}} const api={VERSION,on,off,emit,health,getHistory:()=>h.slice()};g.OficinaOSEvents700=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
(function(g){const r=new Map();
g.TemplateRegistry={register:(n,t)=>(r.set(n,t),t),get:n=>r.get(n)||null,list:()=>Array.from(r.keys())};
['limaprata_premium','oficinaos_tecnico','clean','laudo_fotografico','checklist_entrega','historico_veiculo']
.forEach(n=>g.TemplateRegistry.register(n,{name:n,version:'1.0',render:(doc)=>({template:n,document:doc})}));
})(window);
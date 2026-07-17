
const assert=require("assert");
require("../core700/state.js");
require("../core700/events.js");
require("../core700/ids.js");

const legacy={
  clientes:[{id:"CLI-1",nome:"Cliente legado"}],
  orcamento:{
    historico:[{
      snapshot:{id:"ORC-1",cliente:"Cliente legado",total:1200,status:"Aprovado"}
    }]
  },
  agenda:{os:[{id:"OS-1",cliente:"Cliente legado"}]},
  financeiro:{
    transacoes:[{id:"FIN-1",tipo:"receita",valor:1200,status:"pago"}],
    contas:[{id:"CON-1",valor:100,status:"pendente"}]
  },
  metas:{faturamento:5000}
};

function firstArray(){
  for(let i=0;i<arguments.length;i++)if(Array.isArray(arguments[i]))return arguments[i];
  return [];
}
function migrate(raw){
  const clientes=firstArray(raw.clientes);
  const orcamentos=firstArray(raw.orcamentos,raw.orcamento&&raw.orcamento.historico)
    .map(x=>x.snapshot||x);
  const os=firstArray(raw.agenda&&raw.agenda.os);
  const lanc=firstArray(raw.financeiro&&raw.financeiro.lancamentos,raw.financeiro&&raw.financeiro.transacoes);
  const contas=firstArray(raw.financeiro&&raw.financeiro.contas);
  return {clientes,orcamentos,agenda:{os},financeiro:{lancamentos:lanc,contas},metas:raw.metas||{}};
}

const migrated=migrate(legacy);
assert.strictEqual(migrated.clientes.length,1);
assert.strictEqual(migrated.orcamentos.length,1);
assert.strictEqual(migrated.agenda.os.length,1);
assert.strictEqual(migrated.financeiro.lancamentos.length,1);
assert.strictEqual(migrated.financeiro.contas.length,1);
assert.strictEqual(migrated.metas.faturamento,5000);

console.log("✅ V700.41 migração JSON legado: OK");

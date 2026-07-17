# V700.41 — Importação JSON corrigida

## Correções

- aceita JSON V700;
- aceita JSON com `state`, `data`, `backup` ou objeto direto;
- aceita estruturas antigas de Orçamento, Financeiro, Agenda e Clientes;
- converte histórico de orçamento com `snapshot`;
- grava no IndexedDB;
- relê o IndexedDB para confirmar;
- substitui o STATE em memória;
- dispara Event Bus;
- força atualização das sete abas;
- informa quantos registros foram importados;
- rejeita arquivos sem dados reconhecidos.

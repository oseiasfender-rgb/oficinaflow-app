# V700.50 — IndexedDB reconstruído

## Alterações

- banco `OficinaOSV700`, versão 2;
- stores `state` e `meta`;
- gerenciador único de conexão;
- reabertura automática após fechamento;
- repetição de transações recuperáveis;
- `atomicReplace()` com confirmação por leitura;
- importação JSON usando uma gravação atômica;
- carregamento direto do backup real interno;
- diagnóstico do banco na barra superior;
- erro explícito quando outra aba bloqueia abertura ou exclusão.

## Teste esperado no Chrome

Application → IndexedDB deve exibir:

- OficinaOSV700
  - state
  - meta

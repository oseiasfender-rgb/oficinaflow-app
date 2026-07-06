# Política de Backup — OficinaOS V551.32

## AutoSave

O AutoSave salva o `STATE` no IndexedDB em até 4 segundos após alteração.

Isso serve para evitar perda de dados ao fechar, recarregar ou sair do sistema.

## Smart Backup

Backup completo versionado não roda a cada 4 segundos.

Ele roda em:

- primeiro uso do dia;
- antes de importação;
- antes de reset;
- depois de evento crítico;
- a cada 15 minutos, no mínimo, se houver alteração relevante;
- manualmente quando solicitado.

## Limite

O histórico versionado é limitado a 50 registros para evitar crescimento descontrolado.

## Regra prática

- Salvamento rápido: sempre.
- Backup completo: com inteligência.

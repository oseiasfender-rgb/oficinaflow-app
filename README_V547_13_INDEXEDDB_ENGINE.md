# OficinaOS V547.13 — IndexedDB Storage Engine

Migração estrutural de armazenamento.

## Mudança principal
- Sai `localStorage` como banco principal.
- Entra `IndexedDB` com stores separadas:
  - clientes
  - veiculos
  - orcamentos
  - agenda
  - lancamentos
  - contas
  - metas
  - ia
  - meta

## Por que
O backup real estourou a cota do localStorage. IndexedDB é o caminho correto para volume grande.

## Teste
1. Subir todos os arquivos no GitHub Pages.
2. Abrir `index.html`.
3. Importar `OficinaOS-backup-2026-06-27.json`.
4. Conferir o alerta de importação.
5. Validar Financeiro, Clientes, Agenda e Relatórios.

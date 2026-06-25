# OficinaOS V546.42 — CLIENTES FREEZE / STORAGE HOTFIX

Gerado em 2026-06-25 19:23.

## Correção principal
Resolve o risco de `QuotaExceededError` removendo o STATE gigante e fragmentando o armazenamento.

## Novo armazenamento
- `OFICINAOS_CLIENTES`
- `OFICINAOS_VEICULOS`
- `OFICINAOS_FINANCEIRO_MIN`
- `OFICINAOS_ORCAMENTOS_MIN`
- `OFICINAOS_AGENDA_MIN`

## Teste final
1. Cadastrar cliente.
2. Adicionar veículo.
3. Editar cliente.
4. Excluir cliente.
5. Atualizar página.
6. Abrir `storage.html`.
7. Confirmar que não voltou e não há QuotaExceeded.

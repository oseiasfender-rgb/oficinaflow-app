# OficinaOS V546.20.5 FINAL BUILD MODULAR — Importação Compacta

Gerado em 2026-06-20 18:26.

## Correção
Erro anterior:
`OFICINAOS_BACKUP_RAW exceeded the quota`

Correção:
- Não salva mais o JSON bruto no localStorage.
- Salva apenas dados normalizados e resumo.
- Mantém compatibilidade com:
  - ALL_TX
  - oficinaos_ALL_TX
  - oficinaos_financeiro_lancamentos
  - oficinaos_state
  - OFICINAOS_STATE
  - STATE

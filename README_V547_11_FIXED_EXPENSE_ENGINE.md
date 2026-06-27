# OficinaOS V547.11 — FIXED EXPENSE ENGINE

Etapa intermediária para corrigir despesas fixas, recorrentes e ponto de equilíbrio.

## Corrigido
- Identificação de despesas fixas por categoria e descrição.
- Recorrentes com `recur`, `recurKey`, `fixo` ou `recorrente`.
- Evita duplicar conta quando já existe transação vinculada por `fromTx`.
- Financeiro ganhou aba "Fixas".
- Ponto de equilíbrio passa a usar despesas fixas/recorrentes da competência.

## Teste
1. Suba no GitHub.
2. Limpe cache.
3. Importe o backup real.
4. Abra Financeiro.
5. Confira a aba Fixas e o ponto de equilíbrio.

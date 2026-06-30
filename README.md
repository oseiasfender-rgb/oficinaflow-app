# OficinaOS V547.30 — Release Final

Data: 29/06/2026

## Status
Release final candidata para publicação no GitHub Pages.

## Base técnica
- IndexedDB como banco principal.
- Backup/importação JSON.
- Financeiro Real.
- Caixa separado de competência.
- Contas a pagar.
- Recorrentes.
- KPIs financeiros.
- Categorias financeiras flexíveis.

## Regra financeira definitiva

### Caixa
Só entra no caixa:
- receita paga;
- despesa paga.

### Competência
Usa:
- mês de referência;
- vencimento;
- competência informada.

### Contas
Conta criada, vencida ou pendente não altera caixa.
Conta só altera caixa quando marcada como paga.

### Recorrentes
Recorrente gera conta futura.
Não gera despesa automaticamente.

## Publicação GitHub Pages
1. Suba todos os arquivos deste ZIP no repositório.
2. Mantenha `index.html` na raiz.
3. Ative GitHub Pages.
4. Importe o backup real.
5. Confira Clientes, Agenda, Financeiro e Relatórios.

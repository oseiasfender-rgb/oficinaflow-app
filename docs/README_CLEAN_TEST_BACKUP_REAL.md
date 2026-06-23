# OficinaOS V546.30 CLEAN TEST — Backup Real

Gerado em 2026-06-23 16:43.

## Objetivo
Versão limpa para importar um backup real atual e testar o sistema completo sem interferência de dados fictícios.

## Como testar
1. Suba o ZIP extraído inteiro no GitHub Pages.
2. Abra `clean-test.html` e limpe os dados locais.
3. Volte ao `index.html`.
4. Clique em `Importar JSON`.
5. Importe o backup real.
6. Clique em `🔄 Sincronizar STATE`.
7. Abra `diagnostico.html`.

## Esperado
- Financeiro deve ler lançamentos reais.
- Relatórios devem mostrar receitas/despesas reais.
- Metas devem usar faturamento/margem/ticket real.
- Clientes devem receber histórico quando houver vínculo.
- IA deve consultar o resumo do STATE, sem alterar dados.

# OficinaOS V546.31 REAL ONLY — Sem Fictícios

Gerado em 2026-06-23 18:05.

Correção:
- Bloqueia gravação automática de dados fictícios/simulação.
- Filtra nomes/dados de demonstração no STATE.
- Modo `REAL_ONLY`.
- Limpeza agressiva via `clean-test.html`.
- Service Worker limpo para não manter cache antigo.

Teste:
1. Suba o ZIP inteiro.
2. Abra `clean-test.html`.
3. Clique `Limpar tudo`.
4. Abra `index.html`.
5. Importe o backup real.
6. Clique `🔄 Sincronizar REAL`.
7. Abra `diagnostico.html`.

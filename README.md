# Ofix V546.11.8 — Fusão Completa

Versão de fusão entre o visual/UX premium do índice Fase 3 e o núcleo modular DOM-safe V546.11.

## Aplicado

1. HTML premium migrado para as abas principais.
2. CSS premium incorporado em `modules.css`, mantendo a separação modular.
3. IDs/classes adaptados para leitura e escrita via `STATE`.
4. Handlers antigos não foram trazidos; os eventos novos ficam dentro dos módulos.
5. Renderização conectada ao núcleo modular: `STATE → render → UI`.
6. PDF Premium integrado no local correto: aba Orçamento, botão **PDF Premium**.

## Fluxo principal

- Orçamento salva cliente e histórico.
- Orçamento aprovado gera recebível, PIX, NF-e e evento na Agenda.
- Financeiro só transforma recebível em receita após confirmação de pagamento.
- Contas pagas geram despesa no caixa.
- Clientes, Agenda, Metas, Relatórios e IA leem o STATE consolidado.

## Como abrir

Use servidor local ou GitHub Pages:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

> Evite abrir por `file://`, porque o navegador pode bloquear `type=module`.

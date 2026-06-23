# OficinaOS V546.21.2 — GitHub Pages + PWA Inicial

Gerado em 2026-06-21 15:53.

Base Master funcional com abas congeladas.

Adicionado:
- Pacote GitHub Pages.
- .nojekyll.
- manifest.webmanifest.
- sw.js.
- ícones SVG.
- checklist de publicação.


# OficinaOS V546.22.1 — Correção de Nomenclatura

Gerado em 2026-06-21 19:05.

## Correção aplicada

Removidas referências indevidas a Ofix/OFIX/ofix.

Padronização:
- `ofix-state.js` → `oficinaos-state.js`
- `OFIX_STATE` → `OFICINAOS_STATE_LAYER`
- `OFIX_DRAFT_ORCAMENTO` → `OFICINAOS_DRAFT_ORCAMENTO`
- `OFIX_STATE_V546_22` → `OFICINAOS_STATE_V546_22`

## Observação técnica

Esta versão ainda é modular com camada de integração.
As abas continuam em arquivos separados porque essa foi a forma estável que funcionou sem travar Agenda e Clientes.

O próximo salto real, se aprovado, é:
- Painel único OficinaOS;
- navegação interna sem sair de página;
- refatoração gradual dos módulos para STATE único nativo.

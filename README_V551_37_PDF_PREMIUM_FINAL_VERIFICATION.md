# OficinaOS V551.37 — PDF Premium Final Verification

Esta etapa valida o orçamento/PDF premium da Limaprata.

## Entrada visual

Abrir:

`pdf/index.html`

## Console

```js
PDFPremiumQA.run()
PDFPremiumQA.openPreview()
PDFPremiumQA.checklist()
PDFPremiumQA.summary()
```

## O que valida automaticamente

- Dados essenciais da empresa.
- Campos essenciais do orçamento.
- Função de preview HTML.
- Preparação para impressão/salvar como PDF.
- Configurações disponíveis.

## O que precisa de conferência manual

- Visual premium.
- Contraste.
- Hierarquia do cabeçalho.
- Orçamento Nº sem sobreposição.
- Assinaturas.
- Garantia.
- Total geral destacado.
- Quebra correta no A4 ao imprimir/salvar como PDF.

## Arquivos

- `core/pdf-premium-qa.js`
- `pdf/index.html`
- `pdf/CHECKLIST_MANUAL_PDF_PREMIUM.md`
- `pdf/PDF_PREMIUM_SPEC_V551_37.json`

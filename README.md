# OficinaOS — GitHub Start Final

Versão: V551.39 — GitHub Start Final

Pacote final para subir na raiz do GitHub Pages e iniciar o uso controlado do OficinaOS.

## Como publicar

1. Descompacte este ZIP.
2. Suba todo o conteúdo para a raiz do repositório GitHub.
3. Confirme `index.html` na raiz.
4. Confirme `.nojekyll` na raiz.
5. Confirme `manifest.webmanifest` e `service-worker.js` na raiz.
6. Ative GitHub Pages em **Settings > Pages**.
7. Escolha branch principal e pasta raiz.
8. Aguarde a publicação e abra o link.

## Primeiro uso obrigatório

Abra:

`wizard/index.html`

Fluxo:

1. Verificar IndexedDB.
2. Começar do zero absoluto ou importar backup real.
3. Configurar empresa.
4. Gerar primeiro backup.
5. Concluir primeiro uso.
6. Criar primeiro cliente real.

## Validação

Browser QA:

`qa/index.html`

```js
await BrowserRuntimeQA.run()
```

PDF Premium:

`pdf/index.html`

```js
PDFPremiumQA.openPreview()
PDFPremiumQA.run()
```

Manual IA:

`ia/consultor.html`

```js
IAConsultor.answer('como fazer backup')
IAConsultor.diagnose()
```

## Console final

```js
GitHubStartFinal.readiness()
GitHubStartFinal.firstSteps()
ProductionDist.readiness()
CleanStart.verifyZero()
await StorageAdapter.status()
AutoSaveSmartBackup.status()
FirstRunWizard.status()
```

## Segurança

Use por 7 dias em uso controlado com backup diário antes de tratar como fonte única.

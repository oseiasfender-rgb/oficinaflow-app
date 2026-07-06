# V551.34 — First Run Wizard

Base oficial: Abas CLEAN + V551.33 Tab Fusion.

## Objetivo

Criar um assistente de primeira inicialização para evitar uso real sem preparação.

## Caminhos disponíveis

1. Começar do zero absoluto.
2. Importar backup real.
3. Configurar dados reais da empresa.
4. Verificar IndexedDB/AutoSave.
5. Gerar primeiro backup real.
6. Liberar a primeira ação completa.

## Arquivos principais

- `core/first-run-wizard.js`
- `wizard/index.html`
- `wizard/FIRST_RUN_FLOW_V551_34.json`
- `tests/first-run-wizard-test.js`

## Funções principais

```js
await FirstRunWizard.checkStorage()
FirstRunWizard.chooseMode('zero')
await FirstRunWizard.startZero('COMEÇAR DO ZERO')
await FirstRunWizard.saveEmpresa({...})
await FirstRunWizard.importBackup(json)
await FirstRunWizard.createInitialBackup()
await FirstRunWizard.complete()
FirstRunWizard.status()
FirstRunWizard.nextRecommendation()
```

## Teste no console

```js
await FirstRunWizardTest.run()
FirstRunWizard.status()
```

## Entrada visual

Abrir:

`wizard/index.html`

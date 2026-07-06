# OficinaOS V551.35 — Production Dist Clean

Este é o pacote enxuto para publicação.

## O que este pacote mantém

- `index.html`
- `manifest.webmanifest`
- `service-worker.js`
- `.nojekyll`
- Abas CLEAN
- Core runtime
- Admin oficial
- Wizard de primeiro uso
- IndexedDB Storage
- AutoSave & Smart Backup
- Clean Start / Zero State
- Matriz de fusão das abas
- Dados vazios oficiais

## O que foi removido do DIST

- Pasta `/tests`
- READMEs históricos de versões antigas
- Checklists históricos
- Relatórios intermediários de desenvolvimento
- Arquivos que não são necessários para rodar em produção

## Primeiro uso

Abra:

`wizard/index.html`

Fluxo:

1. Verificar IndexedDB.
2. Começar do zero absoluto ou importar backup real.
3. Configurar empresa.
4. Gerar primeiro backup.
5. Concluir primeiro uso.
6. Fazer primeira ação real.

## Console útil

```js
ProductionDist.readiness()
ProductionDist.deployChecklist()
CleanStart.verifyZero()
await StorageAdapter.status()
AutoSaveSmartBackup.status()
FirstRunWizard.status()
```

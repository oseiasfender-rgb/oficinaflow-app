# OficinaOS V551.36 — Browser Runtime QA

Esta etapa adiciona validação real no navegador.

## Entrada visual

Abrir:

`qa/index.html`

## Console

```js
await BrowserRuntimeQA.run()
BrowserRuntimeQA.summary()
BrowserRuntimeQA.checklist()
```

## O que valida

- IndexedDB.
- StorageAdapter.
- Clean Start.
- AutoSave em 4 segundos.
- Smart Backup.
- First Run Wizard.
- Service Worker.
- Manifest PWA.
- Cache API.
- Administração.
- Fusão oficial das abas.
- Ambiente mobile/desktop.

## Uso correto

Rodar no:

1. Chrome Desktop.
2. Chrome Android.
3. Versão publicada no GitHub Pages.
4. PWA instalado, se possível.

## Próxima etapa

Se o QA passar sem falhas críticas:

**V551.37 — PDF Premium Final Verification**

# Checklist de Publicação — V551.35 Production Dist Clean

- [ ] Descompactar este pacote.
- [ ] Subir o conteúdo para a raiz do repositório.
- [ ] Confirmar `index.html`.
- [ ] Confirmar `manifest.webmanifest`.
- [ ] Confirmar `service-worker.js`.
- [ ] Confirmar `.nojekyll`.
- [ ] Confirmar `wizard/index.html`.
- [ ] Confirmar `admin/index.html`.
- [ ] Confirmar `core/storage-adapter.js`.
- [ ] Confirmar `core/autosave-smart-backup.js`.
- [ ] Confirmar que não existe pasta `/tests`.
- [ ] Abrir o sistema publicado.
- [ ] Abrir `wizard/index.html`.
- [ ] Rodar `ProductionDist.readiness()`.
- [ ] Rodar `CleanStart.verifyZero()`.
- [ ] Rodar `await StorageAdapter.status()`.
- [ ] Fazer primeiro backup real.

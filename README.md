# OficinaOS V1000.100

Release final da Série V1000: homologação, correção integrada e preparação para produção Enterprise.

## Homologação

```bash
cp .env.example .env
docker compose up -d
npm ci --no-audit --no-fund
npm run db:generate
npm run db:migrate
npm run production:gate
npm run release:manifest
```

Consulte `docs/V1000.100_HOMOLOGACAO_FINAL.md` e `docs/CHECKLIST_GO_LIVE_V1000.100.md`.

As referências CLEAN permanecem em `reference/v551-clean/` e `apps/web/public/reference-cleans/`.

## Publicação inicial no GitHub

Antes do primeiro push, execute:

```bash
npm run github:preflight
```

O passo a passo completo está em [`docs/GITHUB_PRIMEIRO_UPLOAD.md`](docs/GITHUB_PRIMEIRO_UPLOAD.md).

> O projeto é uma Release Candidate. O envio ao GitHub inicia a homologação real; não representa automaticamente autorização para produção.

# essensys-user-portal-frontend — documentation

SPA React du **portail domotique distant** — servie sur `https://mon.essensys.fr/portal/`.

## Liens

| Sujet | Document |
|-------|----------|
| Build & déploiement | [deployment.md](deployment.md) |
| New Relic Browser | [observability.md](observability.md) |
| Backend API | `essensys-user-portal-backend/docs/api-routes.md` |
| Doc gateway | `essensys-raspberry-gateway/docs/acces/portal-remote.md` |

## Développement local

```bash
npm install
npm run dev
```

Proxy Vite vers backend local (voir `vite.config.ts`).

## Build production

```bash
npm run build
# dist/ → /opt/essensys/portal-frontend/dist/ sur OVH
```

## API consommée

Toutes les requêtes passent par `/api/portal/*` et `/api/auth/*` sur le même host (`mon.essensys.fr`).

Le client gère le flag `stale` sur `GET /api/portal/exchange` (`src/services/legacyApi.ts`).

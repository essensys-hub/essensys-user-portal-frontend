# Observabilité — New Relic Browser

Implémentation : `src/observability/newrelic.ts`

Chargement lazy de `@newrelic/browser-agent` quand `VITE_NEW_RELIC_ENABLED=true`.

## Configuration prod

| Source | Clés |
|--------|------|
| `group_vars/essensys/main.yml` | `newrelic_browser_application_id`, `agent_id`, `trust_key` |
| `group_vars/essensys/vault.yml` | `vault_newrelic_browser_license_key` |

App NR : `essensys-user-portal-frontend` (ID `538864961` en prod Essensys EU).

## Support-site (distinct)

Le site support (`essensys-support-site/site`) a son propre agent NR (`538864962`) — ne pas confondre avec le portail.

## Dépannage build

Erreur TypeScript :

```
Cannot find module '@newrelic/browser-agent/loaders/browser-agent'
```

→ `npm install @newrelic/browser-agent` avant `npm run build`.

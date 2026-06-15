# Déploiement

## Ansible

Rôle : `essensys-ansible/roles/portal_frontend`

| Chemin VPS | Contenu |
|------------|---------|
| `/opt/essensys/portal-frontend/dist/` | Build Vite (`index.html`, `assets/`) |

Nginx sert `/portal/` via le snippet `essensys-portal.conf` :

```nginx
location ^~ /portal/ {
    alias /opt/essensys/portal-frontend/dist/;
    try_files $uri $uri/ /portal/index.html;
}
```

En mode **consolidé**, seul ce bloc statique est dans le snippet — les API `/api/portal/*` passent par `location /api/` → `:8080`.

## Build sur le VPS

Le playbook clone le repo et exécute `npm run build`. Prérequis :

```bash
npm install   # inclut @newrelic/browser-agent si observability activée
```

Si le build échoue (module NR manquant), déployer le `dist/` local :

```bash
rsync -az dist/ user@vps:/opt/essensys/portal-frontend/dist/
```

## Variables build (Vite)

Injectées par Ansible / CI :

| Variable | Description |
|----------|-------------|
| `VITE_NEW_RELIC_ENABLED` | Active NR Browser |
| `VITE_NEW_RELIC_ACCOUNT_ID` | Compte NR |
| `VITE_NEW_RELIC_APPLICATION_ID` | App ID portail |
| `VITE_NEW_RELIC_AGENT_ID` | Agent ID |
| `VITE_NEW_RELIC_TRUST_KEY` | Trust key |

Valeurs prod dans `essensys-ansible/group_vars/essensys/main.yml` (`newrelic_browser_*`).

## Secrets

Les IDs Browser NR publics vont dans `group_vars/essensys/main.yml`.  
La license key Browser : `vault_newrelic_browser_license_key` dans **`essensys-ansible/group_vars/essensys/vault.yml`**.

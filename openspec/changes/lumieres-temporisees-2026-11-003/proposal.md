> Ticket : [essensys-hub/essensys-feature-lifecycle#45](https://github.com/essensys-hub/essensys-feature-lifecycle/issues/45). Feature ID : `lumieres-temporisees-2026-11-003`.
> Feature répartie sur plusieurs dépôts. Le change commun (proposal, design avec le contrat d'API, tasks complets) est dans `essensys-feature-lifecycle/openspec/changes/lumieres-temporisees-2026-11-003`. Ce change ne décrit que le code de **essensys-user-portal-frontend** (sub-issue #39).

## Why

L'armoire éteint six lumières après un délai réglable, mais seul l'écran tactile de l'armoire permet de le régler. Le portail cloud doit offrir ce réglage à l'administrateur de l'armoire.

## What Changes

- Menu « Temporisations » (section Administration, visible pour `admin_local` et `admin_global`, aussi dans le tiroir mobile) et page `/lighting/timers` : les six lumières (Dressing, WC 1, WC 2, Service, Annexe 1, Annexe 2) avec leur délai.
- Panneau repliable « Temporisation » dans la page Éclairage pour ces six lumières seulement, avec le même composant `LightTimerControl`.
- Raccourcis 15 min, 30 min, 1 h, Jamais, valeur libre de 1 à 255 minutes, relecture à 5, 10 et 20 s, contrôles désactivés hors ligne, mode test respecté.
- Appels `GET /api/portal/lights/timers` et `PUT /api/portal/admin/lights/timers/{id}` (corps `{"minutes": n}`) ; le masquage est une commodité, le serveur répond 403 aux non-administrateurs.
- Session de démonstration à rôle (`admin_local` par défaut, `user`) et tests Playwright `NR-portal-frontend-10`.
- Page `temporisations.md` du guide utilisateur.

## Capabilities

### New Capabilities

- `light-timers-clients` : menu central et réglage par lumière (surface portail cloud).

### Modified Capabilities

Aucune.

## Impact

- **Code** : `src/lights/`, `src/components/Lighting/`, `src/pages/LightTimersPage.tsx`, `src/pages/LightingPage.tsx`, navigation, `src/services/legacyApi.ts`, `src/mockFetch.ts`.
- **Dépendance** : les routes cloud (essensys-user-portal-backend) doivent être déployées avant ce portail.
- **Legacy IoT** : aucun endpoint legacy modifié.

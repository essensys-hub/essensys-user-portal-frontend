> Ticket : [essensys-hub/essensys-feature-lifecycle#41](https://github.com/essensys-hub/essensys-feature-lifecycle/issues/41). Feature ID : `noms-lumieres-2026-11-004`.
> Feature répartie sur plusieurs dépôts. Le change commun (proposal, design avec le contrat d'API, tasks complets) est dans `essensys-feature-lifecycle/openspec/changes/noms-lumieres-2026-11-004`. Ce change ne décrit que le code de **essensys-user-portal-frontend** (sub-issue #41).

## Why

Les noms des lumières sont codés en dur dans le portail. Quand l'usage réel d'une lumière ne correspond plus à son nom (la lumière « Dressing » sert de WC 3), l'administrateur de l'armoire doit pouvoir l'adapter.

## What Changes

- Module `src/lights/` : catalogue des 33 lumières avec leur nom d'origine, lecture `GET /api/portal/lights/names` (repli sur les noms d'origine si la lecture échoue), fonction `displayName(id)`, règle du nom (1 à 40 caractères, sans caractère de contrôle ni `<` `>`), hook partagé `useLightNames`.
- Le nom affiché remplace le nom d'origine dans la page Éclairage (principales et indirectes), le panneau de temporisation, l'écran Temporisations et les messages de commande. Texte brut uniquement.
- Lien « Renommer » dans la fiche de chaque lumière, pour l'administrateur seulement (même règle que les temporisations) : champ « Nom », boutons « Enregistrer » et « Nom d'origine », appel `PUT /api/portal/admin/lights/names/{id}` (corps `{"name": "..."}` ou `{"name": null}`), messages clairs pour 400, 403 et 503. Le masquage est une commodité : le serveur reste la protection.
- Session de démonstration étendue aux deux routes ; tests Playwright `NR-portal-frontend-11` en mode `no-armoire` (desktop, iPhone, iPad).
- Pages `eclairage.md` et `temporisations.md` du guide utilisateur.

## Capabilities

### New Capabilities

- `light-names-clients` : affichage du nom personnalisé et modification par l'administrateur (surface portail cloud).

### Modified Capabilities

Aucune.

## Impact

- **Code** : `src/lights/`, `src/components/Lighting/`, `src/components/Dashboard/LightingControl.tsx`, `src/pages/LightingPage.tsx`, `src/pages/LightTimersPage.tsx`, `src/services/legacyApi.ts`, `src/mockFetch.ts`.
- **Dépendance** : les routes cloud (essensys-user-portal-backend) doivent être déployées avant ce portail.
- **Armoire et legacy IoT** : aucune écriture dans l'armoire ; aucun endpoint legacy modifié.

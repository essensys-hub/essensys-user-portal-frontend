> Ticket : [essensys-hub/essensys-feature-lifecycle#52](https://github.com/essensys-hub/essensys-feature-lifecycle/issues/52). Feature ID : `noms-volets-2026-11-005`.
> Feature répartie sur plusieurs dépôts. Le change commun (proposal, design avec le contrat d'API, tasks complets) est dans `essensys-feature-lifecycle/openspec/changes/noms-volets-2026-11-005`. Ce change ne décrit que le code de **essensys-user-portal-frontend** (sub-issue #43).

## Why

Les noms des volets et des stores sont codés en dur dans le portail. Quand l'usage réel d'un volet ne correspond plus à son nom (« Volet 1 Salon » devenu la baie vitrée), l'administrateur de l'armoire doit pouvoir l'adapter, comme pour les lumières (#41).

## What Changes

- Module `src/shutters/` : catalogue des 16 volets et stores avec leur nom d'origine, lecture `GET /api/portal/shutters/names` (repli sur les noms d'origine si la lecture échoue), fonction `displayName(id)`, règle du nom (1 à 40 caractères, sans caractère de contrôle ni `<` `>`, identique aux lumières), hook partagé `useShutterNames`.
- Le nom affiché remplace le nom d'origine dans `ShuttersPage.tsx` : liste des commandes (les deux groupes), carte « Temps de course » et messages « Ouvert », « Fermé » et « temps de course réglé ». Texte brut uniquement.
- Lien « Renommer » sous chaque volet, pour l'administrateur seulement (même règle que les noms de lumières) : champ « Nom », boutons « Enregistrer » et « Nom d'origine », appel `PUT /api/portal/admin/shutters/names/{id}` (corps `{"name": "..."}` ou `{"name": null}`), messages clairs pour 400, 403 et 503. Le masquage est une commodité : le serveur reste la protection.
- Session de démonstration étendue aux deux routes (et `essensys_demo_inject=live` pour simuler une commande acceptée) ; tests Playwright `NR-portal-frontend-12` en mode `no-armoire` (desktop, iPhone, iPad).
- Page `volets.md` du guide utilisateur.

## Capabilities

### New Capabilities

- `shutter-names-clients` : affichage du nom personnalisé et modification par l'administrateur (surface portail cloud).

### Modified Capabilities

Aucune.

## Impact

- **Code** : `src/shutters/`, `src/components/Shutters/`, `src/pages/ShuttersPage.tsx`, `src/services/legacyApi.ts`, `src/mockFetch.ts`.
- **Dépendance** : les routes cloud (essensys-user-portal-backend) doivent être déployées avant ce portail.
- **Armoire et legacy IoT** : aucune écriture dans l'armoire ; les indices de commande et de temps de course ne changent pas ; aucun endpoint legacy modifié.

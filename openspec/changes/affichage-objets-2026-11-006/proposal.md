> Ticket : [essensys-hub/essensys-feature-lifecycle#55](https://github.com/essensys-hub/essensys-feature-lifecycle/issues/55). Feature ID : `affichage-objets-2026-11-006`.
> Feature répartie sur plusieurs dépôts. Le change commun (proposal, design avec le contrat d'API figé, tasks complets) est dans `essensys-feature-lifecycle/openspec/changes/affichage-objets-2026-11-006`. Ce change ne décrit que le code de **essensys-user-portal-frontend** (sub-issue #45).

## Why

Toutes les lumières et tous les volets sont toujours affichés dans l'ordre d'origine. Une lumière ou un volet qui ne sert plus (ou qui n'existe pas dans une installation) encombre les écrans et les commandes de groupe. L'administrateur de l'armoire doit pouvoir les masquer et choisir l'ordre d'affichage, comme il peut déjà les renommer (#41, #52).

## What Changes

- Modules `src/layout/` (règle commune `effectiveLayout`, lecture, messages d'erreur, magasin partagé `useObjectLayout`), `src/lights/lightLayout.ts` et `src/shutters/shutterLayout.ts` (catalogues et groupes) avec leurs hooks : lecture `GET /api/portal/{lights|shutters}/layout`, repli sur le catalogue complet au 404 ou à l'échec, conservation de la dernière lecture réussie.
- Filtre et ordre appliqués une seule fois, à la construction de la liste de chaque groupe, dans `LightingPage.tsx` et `ShuttersPage.tsx` ; la carte « Temps de course » et la lecture des temps partent des volets actifs ; `LightTimersPage.tsx` filtre les entrées désactivées. Les commandes de groupe reçoivent la même liste : un objet désactivé ne peut pas être commandé. Un groupe vide affiche « Aucune lumière activée » ou « Aucun volet activé », sans bouton de groupe.
- Écran de gestion (administrateur seulement) : tous les objets, interrupteur Activé/Désactivé, Monter/Descendre (voisin du même groupe), « Ordre d'origine » (écriture `{"reset":true}`), « Enregistrer » en une écriture `PUT /api/portal/admin/{lights|shutters}/layout`, messages clairs pour 400, 403 et 503.
- Session de démonstration étendue aux deux routes (graine `essensys_demo_layout_seed`, `essensys_demo_layout=absent` pour simuler un ancien cloud) ; tests `NR-portal-frontend-13` en mode `no-armoire` (desktop, iPhone, iPad).
- Les scénarios et leur éditeur ne sont pas modifiés (catalogue complet).

## Capabilities

### New Capabilities

- `object-layout-clients` : affichage filtré et ordonné, et écran de gestion de l'administrateur (surface portail cloud).

### Modified Capabilities

Aucune.

## Impact

- **Code** : `src/layout/`, `src/lights/`, `src/shutters/`, `src/components/Layout/`, `src/pages/LightingPage.tsx`, `ShuttersPage.tsx`, `LightTimersPage.tsx`, `src/services/legacyApi.ts`, `src/mockFetch.ts`.
- **Dépendance** : les routes cloud (essensys-user-portal-backend, migration `021`) doivent être déployées avant ce portail ; sans elles, le portail affiche le catalogue complet.
- **Armoire et legacy IoT** : aucune écriture dans l'armoire ; les indices de commande, de temporisation et de temps de course ne changent pas ; aucun endpoint legacy modifié.

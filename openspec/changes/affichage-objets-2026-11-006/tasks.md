## 3. Portail cloud (essensys-user-portal-frontend) (#45)

- [x] 3.1 Ajouter `src/lights/lightLayout.ts` et `src/shutters/shutterLayout.ts` (fonction `effectiveLayout`, lecture `GET /api/portal/{lights|shutters}/layout`, repli sur le catalogue complet au 404 ou à l'échec, conservation de la dernière lecture) et leurs hooks ; vérifier par des tests de la logique
- [x] 3.2 Filtrer et ordonner aux appels de `LightingPage.tsx` et `ShuttersPage.tsx`, construire `allShutters` et la carte « Temps de course » à partir des volets actifs, filtrer `LightTimersPage.tsx` ; vérifier par Playwright
- [x] 3.3 Ajouter l'écran de gestion (administrateur seulement : interrupteur, Monter/Descendre, « Ordre d'origine », « Enregistrer » en une écriture, erreurs 400/403/503) ; vérifier par Playwright
- [x] 3.4 Ajouter les tests `@nr NR-portal-frontend-13` en mode `no-armoire` sur desktop, iPhone et iPad

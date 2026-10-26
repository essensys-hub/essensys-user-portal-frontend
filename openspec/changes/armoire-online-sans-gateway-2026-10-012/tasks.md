## 1. Règle armoire en ligne (#34)

- [x] 1.1 Ajouter `isArmoireOnline(session)` et le champ `armoire.online` au type ; l'utiliser dans `DashboardPage`, `ScenariosPage`, `SecurityPage` et `PortalContextPanel` ; vérifier par `npm run build` et `npm run lint`
- [x] 1.2 Variantes de session (avec et sans gateway, armoire vue ou ancienne) dans `mockFetch` ; vérifier à la main dans le mode démo

## 2. Tests et livraison (#35)

- [x] 2.1 Tests Playwright `@nr NR-portal-frontend-9` (cas A à F, desktop / iPhone / iPad, garde no-armoire) ; vérifier qu'ils passent en local
- [ ] 2.2 `/checkup` vert, déploiement du portail cloud (`deploy-portal-stack.yml`) après le backend, puis validation sur le banc BP

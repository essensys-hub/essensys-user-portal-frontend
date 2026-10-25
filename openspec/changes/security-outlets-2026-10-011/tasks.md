## 1. Carte Prises de sécurité

- [ ] 1.1 Carte sur `SecurityPage.tsx` (état 440, « Couper » avec confirmation, « Rétablir » via `sendInjectionBatch`, désactivée hors ligne) ; vérifier par `npm run build` et `npm run lint`
- [ ] 1.2 Choix « Prises de sécurité » dans `ScenarioEditorDrawer.tsx` (décalage 31) ; vérifier dans le mode démo

## 2. Tests et documentation

- [ ] 2.1 Mettre en place Playwright (desktop / iPhone / iPad, fixture no-armoire) et le test `@nr NR-portal-frontend-8` (lot exact, annulation, hors ligne) ; vérifier qu'il passe en local
- [ ] 2.2 Compléter `docs/user-guide/securite.md` avec les prises de sécurité ; vérifier `npm run docs:check`

## 3. Livraison

- [ ] 3.1 `/checkup` vert, captures sur #36, déploiement du portail cloud après celui des backends, puis validation sur le banc BP

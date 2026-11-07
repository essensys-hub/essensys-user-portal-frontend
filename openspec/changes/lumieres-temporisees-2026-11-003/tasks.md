## 3. Portail cloud (essensys-user-portal-frontend) (#39)

- [x] 3.1 Ajouter la logique pure (catalogue, raccourcis 15, 30, 60, 0, validation de la valeur libre) et la lecture par `GET /portal/lights/timers` ; vérifier par des tests de la logique
- [x] 3.2 Ajouter le menu « Temporisations » (section administration, filtré par rôle) et sa page ; vérifier par Playwright (six lumières, « inconnue » sans valeur, masqué pour un utilisateur simple)
- [x] 3.3 Ajouter le panneau de réglage dans la fiche des six lumières de `LightingPage` ; vérifier par Playwright (Dressing : même valeur que le menu central, valeur libre 7, 300 refusé, aucune requête hors mode test)
- [x] 3.4 Ajouter la session de démonstration à rôle et les tests `@nr NR-portal-frontend-10` en mode `no-armoire` sur desktop, iPhone et iPad

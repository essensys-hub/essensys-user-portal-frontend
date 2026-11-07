## 3. Portail cloud (essensys-user-portal-frontend) (#41)

- [x] 3.1 Ajouter la lecture des noms (`GET /api/portal/lights/names`, repli sur les noms d'origine) et la fonction d'affichage ; vérifier par des tests de la logique
- [x] 3.2 Afficher le nom personnalisé dans les listes d'éclairage, la fiche, l'écran Temporisations et les messages de commande ; vérifier par Playwright (« Dressing » renommé « WC 3 » apparaît dans la liste et dans Temporisations)
- [x] 3.3 Ajouter le champ « Nom » et le bouton « Nom d'origine » dans la fiche, pour l'administrateur seulement ; vérifier par Playwright (renommer, remise à zéro, 41 caractères refusé, non-administrateur sans champ)
- [x] 3.4 Ajouter les tests `@nr NR-portal-frontend-11` en mode `no-armoire` sur desktop, iPhone et iPad (aucune requête vers l'armoire)

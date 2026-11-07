## 3. Portail cloud (essensys-user-portal-frontend) (#43)

- [x] 3.1 Ajouter la lecture des noms (`GET /api/portal/shutters/names`, repli sur les noms d'origine) et la fonction d'affichage dans `ShuttersPage.tsx` ; vérifier par des tests de la logique
- [x] 3.2 Afficher le nom personnalisé dans la liste des commandes (les deux groupes), la carte « Temps de course » et les messages « Ouvert », « Fermé » et « temps de course réglé » ; vérifier par Playwright (« Volet 1 Salon » renommé « Volet baie vitrée » apparaît dans la liste, dans « Temps de course » et dans le message)
- [x] 3.3 Ajouter le champ « Nom » et le bouton « Nom d'origine » pour l'administrateur seulement ; vérifier par Playwright (renommer, remise à zéro, 41 caractères refusé, non-administrateur sans champ, `Store "nord"` affiché tel quel)
- [x] 3.4 Ajouter les tests `@nr NR-portal-frontend-12` en mode `no-armoire` sur desktop, iPhone et iPad (aucune requête vers l'armoire, noms de lumières inchangés, nom de 40 caractères lisible)

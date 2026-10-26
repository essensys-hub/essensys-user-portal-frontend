## Context

Motivation : voir `proposal.md`. État des lieux (2026-10-26) : le cloud calcule `online` pour la gateway seulement ; les clients n'ont aucun moyen de savoir qu'une armoire sans gateway est joignable ; les tests n'ont jamais simulé une installation sans gateway.

**Décisions communes aux 4 dépôts** :
- **E1 — Le cloud expose l'état de l'armoire** : `GET /api/portal/session` ajoute `armoire.online` (dernier contact de l'armoire de 2 min au plus, même seuil que la gateway). `gateway.online` et les endpoints legacy (`serverinfos`, `mystatus`, `myactions`, `done`) ne changent pas.
- **E2 — Règle client** : l'armoire est « en ligne » si `gateway.online` **ou** `armoire.online` est vrai. Un champ absent vaut faux : face à un ancien backend, le comportement actuel est conservé.
- **E3 — LAN inchangé** : en mode réseau local, les commandes restent actives.
- **E4 — Tests dans les deux configurations** : avec gateway et sans gateway, matrice A à G ci-dessous, dans chaque dépôt. Le cas D (sans gateway, armoire vue) est celui du signalement et porte la référence `#37`.
- **E5 — Validation réelle** : sur le banc BP, par un humain, avec et sans gateway.

| Cas | Session cloud | Attendu |
|---|---|---|
| A. Avec gateway, en ligne | `gateway.online = true` | en ligne, commandes actives |
| B. Avec gateway, hors ligne, armoire vue | `gateway.online = false`, `armoire.online = true` | en ligne, commandes actives |
| C. Avec gateway, tout hors ligne | `gateway.online = false`, `armoire.online = false` | hors ligne, commandes désactivées |
| D. Sans gateway, armoire vue | pas de bloc `gateway`, `armoire.online = true` | en ligne, commandes actives |
| E. Sans gateway, armoire ancienne | pas de bloc `gateway`, `armoire.online = false` | hors ligne, commandes désactivées |
| F. Sans gateway, armoire jamais vue | ni `gateway` ni `armoire` | hors ligne, commandes désactivées |
| G. Mode LAN | sans objet | commandes actives, inchangé |

## Goals / Non-Goals

**Goals :** voir les specs de ce change.

**Non-Goals :** l'état de la gateway elle-même, les endpoints legacy du protocole IoT, l'affichage de l'état des prises (indice 440) sans gateway (il reste « inconnu », la lecture de la table d'échange dépendant de la gateway).

## Decisions

### D1 — Un seul endroit pour la règle
`isArmoireOnline(session)` dans `src/api/portalApi.ts` (ou un module `src/session/online.ts`) : `Boolean(session?.gateway?.online || session?.armoire?.online)`. Toutes les pages l'utilisent ; plus aucune lecture directe de `gateway.online` pour décider d'activer une commande.

### D2 — Libellés
Le badge du tableau de bord affiche toujours « Armoire en ligne » / « Armoire hors ligne » (suffixe « · pilotage distant ») au lieu de « Gateway en ligne » : avec une gateway hors ligne mais une armoire vue, « Gateway hors ligne » serait trompeur. `PortalContextPanel` garde sa ligne « Gateway … » (exacte), affichée seulement s'il y a une gateway. Guide utilisateur : `tableau-de-bord.md`, `premiers-pas.md` et captures.

### D3 — Tests `NR-portal-frontend-9`
Playwright en mode démo, garde no-armoire, matrice desktop / iPhone / iPad : `mockFetch` sert une session choisie par `sessionStorage['essensys_demo_session']` (cas A à F ; le cas G, LAN, ne concerne pas ce portail). Cas D = tableau de bord et Scénarios actifs, carte « Prises de sécurité » active.

## Risks / Trade-offs

- [Armoire vue il y a moins de 2 min mais hors service côté BP] → l'état suit le dernier contact réseau, comme pour la gateway ; une commande peut rester en file jusqu'au prochain `myactions`.
- [Ancien backend déployé après le client] → champ absent = faux : comportement actuel, aucune régression.
- [Horloges] → le seuil est évalué côté serveur : aucune dépendance à l'horloge du téléphone.

## Migration Plan

1. Backend cloud d'abord (`armoire.online`), puis portail cloud, puis apps Android et iPhone.
2. Une PR par dépôt avec `Feature: armoire-online-sans-gateway-2026-10-012` et `Refs` vers les sub-issues et #37.
3. Validation sur le banc BP par un humain (sans gateway et avec gateway), puis email de suivi à l'utilisateur pilote.
4. Rollback : retirer `armoire.online` du backend ramène les clients à `gateway.online`.

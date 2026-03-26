# Etat du projet - branche et historique

Ce document résume l'état du projet à partir de l'historique Git et de la branche de travail actuelle.

---

## Lecture rapide

OfferTrail a évolué en plusieurs étapes :

1. base locale simple pour suivre des candidatures
2. ajout de KPI et d'un historique d'événements
3. introduction d'un front React
4. séparation progressive entre candidatures, organisations et contacts
5. montée d'une lecture plus qualitative du pipeline via les stats d'organisation

---

## Ce que raconte l'historique Git

### Socle initial

Les premiers commits posent :
- un backend FastAPI minimal
- des vues HTML serveur
- une logique locale simple
- une base SQLite légère

### Montée des KPI et du dashboard

L'historique montre ensuite :
- un dashboard plus riche
- des métriques mensuelles
- une meilleure lecture du volume de candidatures

### Bascule progressive vers React

Plusieurs branches dédiées ont introduit :
- le frontend React + Vite
- la parité progressive avec les vues historiques
- du theming et des composants UI

### Evolution métier récente

Depuis `dev`, la branche `feat/organizations-contacts-probity` apporte surtout :
- le passage du concept `company` vers `organization`
- des endpoints API pour les organisations et les contacts
- des pages React dédiées pour consulter ces entités
- des statistiques de réponse / ghosting / probité
- des migrations SQL pour accompagner la transition du schéma

---

## Comparaison avec `dev`

Par rapport à `origin/dev`, la branche courante ajoute un bloc fonctionnel clair :

- organisation comme entité métier structurée
- contact comme entité autonome
- compatibilité API maintenue sur certaines routes historiques
- migration du backend pour supporter ce nouveau modèle
- nouvelles vues React pour explorer ce portefeuille

En clair :
le projet n'est plus seulement un tracker de candidatures, il devient un outil de lecture relationnelle du pipeline 🙂

---

## Etat de la branche actuelle

### Déjà dans l'historique

Les commits récents visibles montrent :
- séparation company / organization
- ajout de métriques organisation
- pages organisations / contacts
- ajustements API / types / migrations
- nettoyage du README

### Encore en worktree local

Le worktree courant contient aussi un volume important de changements non commités, notamment sur :
- pages React détaillées
- modales de création / édition
- i18n
- maintenance des organisations
- enrichissements backend associés

Conclusion :
- la direction produit est claire
- la doc doit refléter ce cap
- mais tout ce qui est en worktree ne doit pas être présenté comme complètement stabilisé

---

## Conseils de discipline Git

Le dépôt gagne à garder la logique actuelle :
- `main` propre
- `dev` pour intégrer
- une branche par intention
- commits courts et conventionnels avec smiley

Exemples adaptés au projet :
- `✨ feat: add org detail page`
- `🧱 feat: add contact api`
- `♻️ refactor: rename company to organization`
- `📝 docs: refresh project state`
- `🐛 fix: handle missing org data`

Le vrai nettoyage de l'historique ici n'est pas de tout compacter.
C'est de garder des commits courts, lisibles et homogènes d'une intention à l'autre.

# Stratégie de tests

## Principe

La couverture répond au risque, pas au nombre de fichiers. Une PR ne remplace jamais un test comportemental par une recherche de texte source.

| Niveau | Objet | Outil cible | Obligatoire pour |
| --- | --- | --- | --- |
| Unitaire | règles et transformations pures | Pytest, Vitest | logique avec branches |
| Composant | rendu, formulaire, clavier, états query | Testing Library, MSW | composants interactifs |
| Contrat | OpenAPI ↔ client et réponses | snapshot/codegen + tests API | changement d'endpoint/schéma |
| Intégration | DB, auth, permissions, Stripe simulé | Pytest | routes et services métier |
| E2E | parcours utilisateur réel | Playwright | auth, CRUD principal, checkout, admin |
| Qualité UI | axe, responsive, régression visuelle | axe + snapshots | design system et parcours critiques |

## Matrice minimale

- Auth : inscription, login, logout, recovery, session expirée.
- Métier : CRUD candidature, organisation et contact ; relance ; import selon plan.
- Autorisations : utilisateur A/B, compte désactivé, Free/Pro/Ultimate, admin/user.
- Paiement : création checkout, retour succès/annulation, webhook idempotent, portail.
- UI : landing desktop/mobile, navigation clavier, dialogues, erreurs réseau, 403 et 404.

## Gates livrés

Le gate local `make validate` exécute les 211 tests backend, les contrôles statiques frontend, Vitest et les tests legacy, puis le build avec budgets. La CI est volontairement plus forte :

1. `npm run check` : Prettier, ESLint, Stylelint, TypeScript et Knip ;
2. `npm run test:coverage` : Vitest avec couverture V8, puis invariants legacy ;
3. audit des dépendances de production au niveau `high` ;
4. `npm run build` : build de production puis budgets de bundles ;
5. `npm run test:e2e` : smoke tests Playwright Chromium desktop et mobile.

Les seuils de couverture bloquants actuels sont 75 % statements, 55 % branches, 75 % functions et 80 % lines. Ils s'appliquent aux modules chargés par la suite Vitest : ils prouvent la couverture des **fondations testées**, pas celle de toute l'application. Ne pas présenter ces pourcentages comme une couverture globale tant que `coverage.include` ne porte pas explicitement toutes les vertical slices.

Les budgets minifiés bloquants actuels sont : plus gros chunk JavaScript 430 kB, JavaScript total 1 350 kB et CSS total 130 kB. Ce sont des plafonds de non-régression, pas des objectifs de performance utilisateur ; les métriques terrain et budgets Core Web Vitals restent à définir.

## Couverture actuelle et trajectoire

Le backend possède une couverture d'intégration substantielle. Côté frontend, Vitest/Testing Library vérifie actuellement les frontières d'architecture, l'environnement public, la normalisation `ApiError`, la politique CSP, les guards de routes, une primitive bouton et le harnais MSW. Les tests Node historiques vérifient encore certains invariants par lecture de source. Playwright ne couvre pour l'instant que deux smoke tests publics : parcours principal de landing et redirection légale canonique, sur desktop et mobile.

La prochaine progression se fait par vertical slice, sans gonfler artificiellement les seuils :

1. inclure explicitement les sources applicatives dans la mesure globale et publier le rapport CI ;
2. couvrir auth/session/recovery puis candidatures avec Testing Library et MSW ;
3. ajouter des E2E authentifiés pour CRUD, isolation A/B, capacités Free/Pro/Ultimate, checkout et admin ;
4. ajouter axe et régression visuelle sur primitives et parcours critiques ;
5. retirer chaque test legacy de lecture de source quand son équivalent comportemental existe.

# Contribuer à OfferTrail

## Flux Git

`main` représente la production et `dev` l'intégration. Aucun commit direct n'est autorisé sur ces branches.

1. Partir de `dev` à jour.
2. Créer une branche courte : `feat/OT-123-sujet`, `fix/OT-123-sujet`, `chore/OT-123-sujet` ou `docs/OT-123-sujet`.
3. Ouvrir une Pull Request vers `dev` et utiliser le modèle fourni.
4. Obtenir au moins une revue du propriétaire du domaine. Les changements auth, paiement, permissions ou migrations exigent aussi une revue transverse.
5. Squash-merger avec un titre Conventional Commit, par exemple `feat(applications): add follow-up filter`.
6. Les releases passent de `dev` vers `main` par une PR dédiée et un tag SemVer. Un `hotfix/*` part de `main`, puis est réintégré dans `dev`.

Les branches d'intégration longues ne constituent pas un second `dev`. Une initiative importante doit être découpée en stories intégrables et masquée par feature flag si nécessaire.

## Definition of Ready

Une story entre en sprint seulement si elle possède :

- un résultat utilisateur et un owner ;
- des critères d'acceptation Given/When/Then ;
- les routes, rôles, plans et permissions concernés ;
- les états `loading`, `empty`, `error`, `forbidden`, `not-found` et `success` pertinents ;
- une maquette ou les composants/tokens à réutiliser ;
- le contrat API et les migrations identifiés ;
- un plan de tests et les dépendances connues.

## Definition of Done

- Les critères d'acceptation sont démontrés dans la PR.
- Aucun chemin legacy parallèle n'est ajouté sans ADR et date de retrait.
- TypeScript, lint, formatage, styles, code mort, tests et build passent via `make validate`.
- Les tests unitaires, composants, contractuels et E2E sont ajoutés selon le risque.
- Les textes et attributs accessibles sont localisés ; clavier, focus, responsive et reduced motion sont contrôlés.
- Permissions, isolation utilisateur et capacités de plan sont testées côté serveur.
- Les changements de contrat, configuration, migration, monitoring et rollback sont documentés.
- La documentation de feature et l'ADR éventuelle sont à jour.

## Cadence Scrum

- Le Product Owner maintient l'objectif de sprint et ordonne le backlog.
- Le refinement vérifie la Definition of Ready ; le planning ne redéfinit pas une story incomplète.
- Le daily expose avancement, risque et aide requise, sans remplacer le suivi du ticket.
- La review démontre des parcours utilisateurs, pas uniquement des fichiers modifiés.
- La rétrospective produit au moins une action mesurable avec owner et échéance.

Les responsabilités sont détaillées dans [docs/engineering/ownership.md](docs/engineering/ownership.md).

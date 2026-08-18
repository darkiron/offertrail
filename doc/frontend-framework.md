# Framework frontend interne OfferTrail

## Direction

OfferTrail utilise une base éditoriale sobre : papier chaud, encre profonde, accent terre cuite et vert relationnel. Les écrans doivent privilégier une hiérarchie claire, des bordures fines, des surfaces peu nombreuses et une action principale identifiable.

## Tokens

Les tokens sont déclarés dans `frontend/src/styles/framework.css` avec le préfixe `--ot-` : couleurs, rayons, ombres et espacements. Les variables `--mantine-*` restantes sont uniquement des alias de transition et ne doivent pas être utilisées dans un nouvel écran.

## Primitives

- `.ot-panel` : surface métier structurée ;
- `.ot-field` + `.ot-control` : champs et labels ;
- `.ot-button[data-variant]` : actions `primary`, `secondary`, `ghost` ;
- `.ot-alert[data-tone]` : états de résultat ;
- `.ot-badge[data-tone]` : statut court ;
- `Button`, `ActionButton`, `ActionLink`, `Dialog`, `EntityLink`, `DetailHeader`, `DetailSummary`, `RelatedRecords` : composants React correspondants.

## Règles de migration

1. Aucun import Mantine dans un nouvel écran.
2. Aucun style inline pour une structure réutilisable.
3. Les listes, fiches, modales, états de chargement et erreurs passent par une primitive partagée.
4. Toute chaîne visible passe par `useI18n`, avec les mêmes clés `fr` et `en`.
5. Une entité interne navigable utilise son UUID canonique et conserve `from`/`scrollY`.
6. Toute interaction clavier doit utiliser un élément natif ou exposer son rôle et son état.
7. Les animations doivent respecter `prefers-reduced-motion`.

## État de migration

Le shell public, l’authentification, le pricing, le checkout et la gestion du compte utilisent cette base. Les écrans secondaires (maintenance, drawers historiques, import et administration) restent à migrer avant suppression de `MantineProvider` et des dépendances associées.

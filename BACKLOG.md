# Backlog — OfferTrail

## Bugs identifiés mais non corrigés dans ce ticket

- Corriger les imports fragiles dans `src/auth.py` selon le contexte d'exécution local.
- Stabiliser les endpoints de maintenance ETS (`merge` / `split`) et leur contrat backend réel.
- Corriger les problèmes d'encodage encore présents dans plusieurs messages frontend et backend historiques.
- Réduire le mélange entre routes legacy HTML, routes `/api/...` de compatibilité et routes SaaS dans `src/main.py`.

## Features manquantes identifiées pendant l'audit

- Endpoint SaaS dédié pour les contacts, afin de sortir définitivement de `/api/contacts`.
- Endpoint SaaS dédié pour l'import, afin de sortir de `/api/import`.
- Flux complet de maintenance ETS côté backend pour la fusion/scission.
- Couverture de tests frontend sur les parcours principaux.

## Dette technique non résolue

- Couche de compatibilité d'IDs hashés côté frontend toujours nécessaire pour faire cohabiter ancien et nouveau modèle.
- Composants UI encore partiellement hétérogènes malgré l'harmonisation des boutons et badges de statut.
- Couverture de tests encore incomplète côté React.
- Coexistence durable entre base legacy SQLite et modèle SaaS avec plusieurs adaptations transitoires.

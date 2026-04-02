# Backlog — OfferTrail

## Bugs identifiés mais non corrigés dans ce ticket

- Corriger les imports fragiles dans `src/auth.py` (`from models`, `from services`) pour éviter les écarts selon le contexte d'exécution.
- Stabiliser les endpoints de maintenance ETS (`merge` / `split`) et leur contrat backend réel.
- Corriger les problèmes d'encodage encore présents dans plusieurs messages frontend et backend historiques.
- Réduire le mélange entre routes legacy HTML, routes `/api/...` de compatibilité et routes SaaS dans `src/main.py`.

## Features manquantes identifiées pendant l'audit

- Endpoint SaaS dédié pour les contacts, afin de sortir définitivement de `/api/contacts`.
- Endpoint d'import SaaS dédié, pour sortir de `/api/import`.
- Tests API ciblés pour les KPIs dashboard et les cas de visibilité 404.
- Gestion plus explicite des états vides et erreurs sur les vues secondaires détaillées.

## Dette technique non résolue

- Couche de compatibilité d'IDs hashés côté frontend toujours nécessaire pour faire cohabiter ancien et nouveau modèle.
- Composants UI encore partiellement hétérogènes malgré l'harmonisation des boutons et badges de statut.
- Couverture de tests encore faible côté frontend React.
- Historique Git et worktree local déjà chargés sur cette branche, ce qui complique les commits parfaitement atomiques par domaine.

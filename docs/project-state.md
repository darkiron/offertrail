# État du projet — 2026-04-02

## Ce qui fonctionne
- L'authentification JWT locale fonctionne avec inscription, connexion, profil courant et changement de mot de passe.
- Les routes CRUD principales existent côté backend pour les candidatures, relances, événements de candidature, établissements et abonnement.
- Le frontend React couvre les écrans principaux : tableau de bord, candidatures, détail candidature, établissements, contacts, import, compte et pricing.
- Les dépendances d'authentification `get_current_user` et `get_current_user_id` sont présentes sur les routes SaaS principales.
- Les schémas Pydantic sont définis pour les routers SaaS audités.
- Les contrôles de propriété sur les candidatures et relances utilisent déjà le bon pattern `id + user_id`, ce qui masque correctement les ressources absentes.

## Ce qui est cassé / bugué
- `src/main.py` garde un CORS trop permissif avec `allow_origins=["*"]` au lieu d'une config locale stricte.
- `GET /health` existe mais ne retourne pas la version attendue.
- `GET /me/stats` ne renvoie pas encore tous les KPIs attendus par le ticket : `pipeline_actif` et `relances_dues` manquent.
- `GET /me/relances/dues` filtre uniquement les relances du jour, alors que le besoin est `date_prevue <= aujourd'hui`.
- L'historique d'une candidature existe via `/me/candidatures/{id}/history`, mais l'endpoint attendu `/candidatures/{id}/events` n'est pas présent.
- `src/services/email.py` contient encore des `print()` de debug au lieu d'un logger.
- Plusieurs pages frontend gardent des `console.error` ou `console.warn`.
- Certaines pages n'ont pas encore de titre document explicite.
- Le frontend mélange encore des endpoints legacy `/api/...` avec les routes SaaS sur `contacts` et `import`.

## Ce qui est manquant
- Feedback de succès homogène après création de candidature, changement de statut et enregistrement du profil.
- États vides mieux cadrés sur certaines vues détaillées et listes secondaires.
- Cohérence complète d'affichage des statuts entre les différentes pages.
- Wrappers responsive systématiques pour les tableaux larges sur mobile.
- Audit doc aligné avec l'état réel du code : le précédent `docs/project-state.md` décrivait surtout l'historique Git, pas l'état exécutable courant.

## Dette technique identifiée
- `src/main.py` mélange encore vues HTML legacy, routes `/api/...` de compatibilité et routers SaaS récents, ce qui rend la surface API difficile à raisonner.
- `src/auth.py` importe encore `models` et `services` sans préfixe `src`, ce qui reste fragile selon le contexte d'exécution.
- Le frontend conserve une couche de compatibilité d'IDs hashés pour naviguer entre anciennes routes et nouvelles entités.
- Plusieurs textes UI et messages backend contiennent encore des problèmes d'encodage.
- Les composants de base UI ne sont pas complètement harmonisés : boutons utilitaires d'un côté, styles tailwind-like et styles inline de l'autre.
- Les tests existants couvrent surtout l'historique legacy et une partie de l'abonnement, mais peu les écrans React et les nouveaux contrats API attendus.

## À faire dans les prochains tickets
- Séparer clairement les routes legacy de compatibilité et les routes SaaS stabilisées.
- Remplacer progressivement les endpoints frontend legacy `/api/...` restants par des routes SaaS dédiées.
- Corriger les problèmes d'encodage dans les messages UI, emails simulés et chaînes backend.
- Ajouter des tests API ciblés pour `/me/stats`, `/me/relances/dues`, `/candidatures/{id}/events` et les cas 404 de visibilité.
- Harmoniser définitivement les composants UI partagés pour boutons, badges de statut et messages flash.

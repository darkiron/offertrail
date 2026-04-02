# État du projet — 2026-04-02

## Ce qui fonctionne
- L'authentification JWT locale fonctionne avec inscription, connexion, profil courant, changement de mot de passe et restauration de session.
- Les routes CRUD principales existent côté backend pour les candidatures, relances, événements de candidature, établissements et abonnement.
- Le frontend React couvre les écrans principaux : tableau de bord, candidatures, détail candidature, établissements, contacts, import, compte et pricing.
- Les dépendances d'authentification `get_current_user` et `get_current_user_id` sont présentes sur les routes SaaS principales.
- Les schémas Pydantic sont définis pour les routers SaaS audités.
- Les contrôles de propriété sur les candidatures et relances utilisent le pattern `id + user_id`, ce qui masque correctement les ressources absentes.
- Le plan starter/pro est branché de bout en bout avec bannière d'alerte, endpoint `/subscription/me`, upgrade local et garde 402 à la création.
- Les établissements disposent d'une couche SaaS dédiée et d'un flux d'édition front cohérent.

## Ce qui était cassé et a été corrigé dans ce ticket
- CORS dans `src/main.py` resserré sur `http://localhost:5173`.
- `GET /health` aligné sur le contrat `{ "status": "ok", "version": "0.1.0" }`.
- `GET /me/stats` enrichi avec `pipeline_actif`, `relances_dues` et `temps_moyen_reponse`.
- `GET /me/relances/dues` corrigé pour couvrir `date_prevue <= aujourd'hui`.
- Ajout de `GET /candidatures/{id}/events`.
- Suppression des `print()` backend restants au profit du logging.
- Suppression des `console.*` frontend restants dans le périmètre du ticket.
- Ajout des titres de pages principaux, de feedbacks visuels et d'états vides plus explicites.

## Ce qui reste cassé / fragile
- `src/main.py` mélange encore vues HTML legacy, routes `/api/...` de compatibilité et routers SaaS récents.
- Le frontend mélange encore des endpoints legacy `/api/...` avec les routes SaaS sur `contacts` et `import`.
- Les endpoints de maintenance ETS `merge` / `split` ne sont pas encore stabilisés côté backend.
- Plusieurs textes UI et messages backend historiques gardent des problèmes d'encodage.

## Ce qui est manquant
- Endpoint SaaS dédié pour les contacts, afin de sortir définitivement de `/api/contacts`.
- Endpoint SaaS dédié pour l'import, afin de sortir de `/api/import`.
- Tests plus larges côté frontend React.
- Finalisation d'un flux de maintenance ETS complet avec fusion/scission réelles.

## Dette technique identifiée
- `src/auth.py` garde des imports historiques fragiles sans préfixe `src` dans certains chemins d'exécution.
- Le frontend conserve une couche de compatibilité d'IDs hashés pour faire cohabiter ancien et nouveau modèle.
- Les composants UI ne sont pas encore totalement homogènes malgré l'harmonisation des boutons et badges de statut.
- La base legacy SQLite et la base SaaS cohabitent encore avec plusieurs adaptations de compatibilité.

## À faire dans les prochains tickets
- Séparer clairement les routes legacy de compatibilité et les routes SaaS stabilisées.
- Remplacer progressivement les endpoints frontend legacy `/api/...` restants par des routes SaaS dédiées.
- Corriger les problèmes d'encodage dans les messages UI, emails simulés et chaînes backend.
- Étendre les tests API autour des KPIs dashboard, de la visibilité 404 et des routes établissements.
- Finaliser un vrai lot produit dédié à la maintenance ETS.

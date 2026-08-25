# Ownership

Les handles effectifs sont déclarés dans `.github/CODEOWNERS`. Tant que les équipes génériques n'ont pas été remplacées par des comptes GitHub réels, l'ownership ci-dessous reste une responsabilité de processus non automatisée.

| Domaine | Accountable | Revue obligatoire | Artefacts |
| --- | --- | --- | --- |
| Produit, plans, parcours | Product Owner | PO | définition produit, backlog, AC |
| Architecture et API | Tech Lead | backend/frontend selon impact | ADR, OpenAPI, migrations |
| Frontend et performance | Frontend owner | frontend | features, router, bundle |
| Design system et accessibilité | Design owner | design + frontend | tokens, catalogue, audits |
| Auth, permissions, paiement | Security owner | sécurité + backend | threat model, tests A/B, webhooks |
| Qualité et release | QA/release owner | QA | stratégie, E2E, checklist release |

Le Product Owner décide **quoi/pourquoi** ; les owners techniques décident **comment** dans les contraintes acceptées. Un désaccord transversal produit une RFC ou ADR, pas une implémentation concurrente.

Chaque feature documente au minimum : owner, routes, rôles/plans, modèle de données, endpoints, états UI, événements analytics et tests d'acceptation.

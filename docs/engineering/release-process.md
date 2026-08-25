# Processus de release

## Flux

1. Les stories validées sont squash-mergées dans `dev` avec Conventional Commits.
2. Une PR `release/x.y.z` de `dev` vers `main` fixe la version, complète `CHANGELOG.md` et référence les migrations.
3. Les checks bloquants, la review produit et le plan de rollback sont requis.
4. Après merge, créer le tag annoté `vX.Y.Z`, déployer puis exécuter les smoke tests.
5. Sur incident, rollback applicatif si compatible ; ne jamais rétrograder une migration destructive sans procédure dédiée.

SemVer : `major` pour rupture de contrat ou migration non compatible, `minor` pour capacité rétrocompatible, `patch` pour correction. Les changements internes sans livraison utilisateur restent dans la prochaine entrée release.

## Checklist

- Changelog orienté utilisateur et numéro de version cohérent avec l'application.
- Migrations testées sur une copie représentative, sauvegarde et rollback documentés.
- Variables d'environnement et secrets présents avant déploiement.
- Stripe/webhooks, CORS, Supabase redirect URLs et domaines vérifiés.
- Smoke : healthcheck, landing, login, lecture/écriture principale, paiement en mode approprié.
- Monitoring contrôlé après déploiement ; owner de release nommé.

Un hotfix part de `main`, reçoit les mêmes checks et est réintégré immédiatement dans `dev`.

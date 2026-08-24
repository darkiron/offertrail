# Définition produit canonique

**Statut : canonique — 24 août 2026.** En cas de contradiction, ce document prévaut sur les audits, changelogs et anciens états du projet. Une modification du modèle produit exige une décision validée par le Product Owner et, si elle affecte l'architecture, une ADR sous `docs/adr/`.

## Produit

OfferTrail est un CRM SaaS individuel pour piloter des candidatures CDI et freelance. Le produit relie candidatures, organisations, contacts, interactions et relances afin de rendre le pipeline observable et actionnable. Il n'est ni un ATS d'entreprise, ni un outil de scraping ou d'auto-candidature.

Le terme historique « local-first » décrit l'origine et la facilité d'exécution locale ; il ne décrit plus l'architecture de production. L'authentification, la facturation et la base de production sont des services SaaS.

## Autorités techniques

- Supabase Auth crée les comptes, sessions et flux de récupération.
- FastAPI vérifie les JWT Supabase et reste l'autorité des permissions métier.
- PostgreSQL/SQLAlchemy stocke les données de production ; Alembic versionne le schéma.
- Stripe est l'autorité de facturation. Seuls les statuts `active` et `trialing` accordent les capacités payantes.
- `src/services/subscription.py` est l'autorité exécutable des capacités de plan. La présentation frontend ne doit pas redéfinir ces droits.

## Plans et capacités

`0` signifie illimité dans la configuration serveur.

| Capacité | Free | Pro | Ultimate |
| --- | ---: | ---: | ---: |
| Prix mensuel indicatif | 0 € | 9,99 € | 14,99 € |
| Candidatures | 5 | 100 | illimité |
| Relances actives | 1 | 10 | illimité |
| Historique | 1 mois | 6 mois | illimité |
| KPI avancés | non | oui | oui |
| Import / export | non | oui | oui |
| Probité complète | non | non | oui |
| Timeline complète | non | non | oui |
| Support prioritaire | non | non | oui |

Les tarifs annuels présentés par le frontend sont 99 € pour Pro et 149 € pour Ultimate. Toute évolution de prix doit être synchronisée entre Stripe, serveur, frontend, pages légales et ce tableau dans la même initiative.

## Accès

- Les routes marketing et légales sont publiques.
- Les routes `/app/*` exigent une session, sauf redirects publics de compatibilité explicitement déclarés.
- L'administration exige le rôle `admin` côté route frontend et côté API.
- L'accès à une donnée métier est filtré par l'identité du JWT, jamais par un `user_id` fourni par le client.

La carte détaillée routes/fonctions demeure dans [frontend-product-map.md](frontend-product-map.md), qui est un audit historique et non une autorité produit.

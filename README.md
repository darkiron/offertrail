# OfferTrail

OfferTrail est un CRM SaaS de suivi de candidatures : pipeline, relances, organisations, contacts et métriques dans un même espace de travail.

## Source de vérité

Le comportement déployable actuel est résumé dans [docs/product-definition.md](docs/product-definition.md). Cette page est canonique pour la stack, l'authentification, les plans et les capacités. Les décisions structurantes sont versionnées dans [docs/adr](docs/adr).

## Stack actuelle

| Couche | Technologie |
| --- | --- |
| Frontend | React 19, TypeScript strict, Vite 8, SCSS Modules |
| État serveur | TanStack Query, Axios |
| Formulaires | React Hook Form, Zod |
| Auth | Supabase Auth ; JWT vérifié par FastAPI |
| Backend | Python 3.12, FastAPI, SQLAlchemy, Alembic |
| Données | PostgreSQL en production ; SQLite pour certains scénarios locaux/tests |
| Paiement | Stripe |

Node 24 est requis par le frontend. La CI doit utiliser les mêmes versions majeures que ce document et les fichiers de version du dépôt.

## Démarrage local

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.dev
make install
make run
```

- API : `http://localhost:8000`
- documentation OpenAPI : `http://localhost:8000/docs`
- application : `http://localhost:5173`

Renseigner au minimum Supabase côté backend et frontend. Stripe et Resend ne sont nécessaires que pour tester leurs parcours. La matrice complète est dans [docs/engineering/environments.md](docs/engineering/environments.md).

## Validation locale

```bash
make validate
```

Cette commande constitue le point d'entrée local avant toute Pull Request. La stratégie et les niveaux de tests attendus sont documentés dans [docs/engineering/testing-strategy.md](docs/engineering/testing-strategy.md).

## Architecture et contribution

- [Architecture actuelle et cible](docs/architecture/frontend.md)
- [Ownership des domaines](docs/engineering/ownership.md)
- [Sécurité navigateur et transport API](docs/engineering/frontend-security.md)
- [Contribuer au projet](CONTRIBUTING.md)
- [Processus de release](docs/engineering/release-process.md)
- [Runbook](docs/runbook.md)

Le dépôt est en transition contrôlée : les vues Jinja, routes de compatibilité et anciens modèles ne définissent pas l'architecture cible. Leur suppression doit passer par une ADR avec critères de sortie.

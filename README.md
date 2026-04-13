# OfferTrail

CRM SaaS de suivi de candidatures — pipeline, relances, contacts et métriques dans un seul workspace.

## Stack

| Couche | Technologie |
|--------|-------------|
| Backend | Python 3.12 · FastAPI · SQLite (SQLAlchemy) |
| Frontend | React 19 · TypeScript · Vite · Mantine v7 |
| Auth | JWT local (HS256, 7 jours) |
| Rate limiting | slowapi |
| Déploiement | Railway (backend) · Vercel (frontend) |

## Démarrage local

```bash
# Installation (venv Python + npm)
make install

# Lancer backend + frontend
make run
# API  : http://localhost:8000
# App  : http://localhost:5173
```

## Tests

```bash
make test
```

Pour un rapport de couverture :

```bash
make test-coverage
```

## Variables d'environnement

Copier `.env.example` en `.env` puis remplir :

```env
DATABASE_URL=sqlite:///./offertrail.db
SECRET_KEY=<chaine-aleatoire-32-chars>
RESEND_API_KEY=                         # optionnel — emails de reset password
ALLOWED_ORIGINS=http://localhost:5173   # virgule-séparé en production
```

Pour le frontend en local, créer `frontend/.env.dev` :

```env
VITE_API_URL=http://localhost:8000
```

`make run` lance Vite avec le mode `dev`, donc `frontend/.env.dev` est chargé automatiquement.

## Décisions produit

### Plan unique (Pro à 9,99€/mois)

Un plan Starter gratuit avait été envisagé puis supprimé. Raison : un plan gratuit avec limitations artificielles (ex. 25 candidatures) crée de la friction inutile et nuit à la rétention. L'outil est focalisé sur les freelances et chercheurs d'emploi actifs — des utilisateurs qui ont besoin de toutes les fonctionnalités dès le départ. Un seul plan Pro à 9,99€/mois, sans restriction.

## Déploiement

### Backend — Railway

1. Connecter le repo GitHub dans Railway
2. Définir les variables d'env (`SECRET_KEY`, `ALLOWED_ORIGINS`, `DATABASE_URL`)
3. Railway détecte `railway.toml` et lance automatiquement `uvicorn src.main:app`

### Frontend — Vercel

1. Connecter le dossier `frontend/` dans Vercel
2. Définir `VITE_API_URL=https://ton-backend.railway.app`
3. `frontend/vercel.json` gère le rewrite SPA

## Architecture

```
src/
├── main.py             # App FastAPI + middleware CORS + routes legacy
├── models.py           # Modèles SQLAlchemy (User, Candidature, Etablissement…)
├── auth.py             # JWT, get_current_user_id, get_admin_user, scheduler
├── database.py         # Engine SQLAlchemy + get_db
├── routers/
│   ├── auth.py         # /auth/register, /auth/login, /auth/me, reset password
│   ├── candidatures.py # CRUD /candidatures
│   ├── relances.py     # CRUD /relances
│   ├── etablissements.py # CRUD /etablissements
│   ├── me.py           # /me/stats, /me/candidatures, /me/pipeline
│   ├── admin.py        # /admin/stats, /admin/users (role=admin requis)
│   └── subscription.py # /subscription/me, /subscription/upgrade
└── services/
    ├── subscription.py # Logique plan Starter/Pro, limites
    ├── probite.py      # Score de propreté des établissements
    └── email.py        # Envoi emails via Resend
```

## Modèle de données

- **User** : plan (starter|pro), role (user|admin), is_active
- **Candidature** : user_id (isolé par workspace), etablissement_id, statut, events
- **Etablissement** : couche globale partagée entre users
- **Contact** : rattaché à un établissement, visible selon les candidatures du user
- **Relance** : planification de relances par candidature

## Limites Starter

Un compte Starter est limité à **25 candidatures**. La 26e renvoie HTTP 402 avec `{"code": "LIMIT_REACHED"}`. Upgrade via `/subscription/upgrade`.

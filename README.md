# OfferTrail

CRM de suivi de candidatures pour freelances et chercheurs d'emploi.
Suivre, relancer, mesurer. Simple, rapide, local-first.

## Stack

- Backend : Python 3.9+ / FastAPI / SQLite
- Frontend : React 19 / TypeScript / Vite
- Auth : JWT (migration Supabase prévue)

## Démarrage local

```bash
# Installation
make install

# Lancer
make run
# API : http://localhost:8000
# App  : http://localhost:5173
```

## Tests

```bash
make test
```

## Variables d'environnement

Copier `.env.example` en `.env` et remplir :

```bash
DATABASE_URL=sqlite:///./offertrail.db
SECRET_KEY=<32 chars random>
RESEND_API_KEY=          # optionnel en local
VITE_API_URL=http://localhost:8000
```

## Statut

v0.1.0 - Foundation SaaS locale. Déploiement cloud en cours.

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

## Décisions produit

### Plan unique (Pro à 9,99€/mois)

Un plan Starter gratuit avait été envisagé puis supprimé. Raison : un plan gratuit avec limitations artificielles (ex. 25 candidatures) crée de la friction inutile et nuit à la rétention. L'outil est focalisé sur les freelances et chercheurs d'emploi actifs — des utilisateurs qui ont besoin de toutes les fonctionnalités dès le départ. Un seul plan Pro à 9,99€/mois, sans restriction.

## Statut

v0.1.0 - Foundation SaaS locale. Déploiement cloud en cours.

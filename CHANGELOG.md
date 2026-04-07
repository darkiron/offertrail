# Changelog

Toutes les modifications notables de ce projet sont documentées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)
Versionnage : [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

## [0.2.0] — 2026-04-07

### Added
- Backoffice admin : métriques SaaS, gestion des plans et désactivation de comptes (`/admin/*`)
- Lien "Administration" dans le menu navbar conditionnel au role `admin`
- Rate limiting sur les endpoints auth (register 5/min, login 10/min, forgot-password 3/min)
- Route aliases `/contacts/*` et `/etablissements/{id}/merge|split` côté backend
- `document.title` sur toutes les pages de l'app

### Fixed
- Limite d'abonnement Starter non vérifiée sur `POST /me/candidatures` (bypass possible)
- Frontend appelait `/api/contacts` — migré vers `/contacts`
- Frontend appelait `/api/organizations/merge|split` — migré vers `/etablissements`
- Page Register : navigait vers `/dashboard` au lieu de `/` après inscription
- Validation zod avec messages d'erreur champ par champ sur Register et Login

### Changed
- README réécrit avec stack actuelle, déploiement Railway + Vercel, architecture
- CORS lit depuis `ALLOWED_ORIGINS` env var avec fallback `localhost:5173`

## [0.1.0] — 2026-03-01

### Added
- Foundation SaaS : auth JWT locale, isolation workspaces par user_id
- CRUD candidatures, établissements, relances, contacts, events
- Plan Starter (limite 25 candidatures) / Pro avec garde HTTP 402
- Score de propreté des établissements (probité) calculé toutes les heures
- Dashboard avec KPIs, pipeline, relances dues, graphe mensuel
- Import TSV de candidatures
- Pages : Dashboard, Candidatures, Détail candidature, Établissements, Contacts, Import, Mon compte, Pricing
- Tests : 52 tests backend (auth, candidatures, isolation, subscription)
- CI GitHub Actions : backend pytest + frontend npm build
- Déploiement : Procfile, railway.toml, vercel.json

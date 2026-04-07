# État du projet — 2026-04-07 (v0.2.0)

## Ce qui fonctionne

### Backend
- Auth JWT : register, login, profil, changement de mot de passe, reset password, restauration de session
- Isolation workspaces : toutes les routes privées filtrent par `user_id` extrait du token JWT (jamais du body)
- CRUD complet : candidatures, relances, candidature-events, contact-interactions, établissements
- Limites d'abonnement Starter (25 candidatures max, HTTP 402 + `LIMIT_REACHED`) appliquées sur `/candidatures` ET `/me/candidatures`
- Plan Starter/Pro : bannière d'alerte 80%, upgrade, downgrade, expiration
- Score de propreté (probité) des établissements, recalculé toutes les heures
- Backoffice admin (`/admin/*`) : métriques SaaS, gestion users, changement de plan, soft delete
- Rate limiting : register 5/min, login 10/min, forgot-password 3/min
- Routes aliases : `/contacts/*` ↔ `/api/contacts/*`, `/etablissements/{id}/merge|split`
- CORS lit depuis `ALLOWED_ORIGINS` env var

### Frontend
- React 19 + TypeScript + Vite + Mantine v7
- Auth : Login, Register (public, navigate('/') après succès), Forgot/Reset password
- Pages : Dashboard, Candidatures, Détail candidature, Établissements, Contacts, Import, Mon compte, Pricing, Admin
- `document.title` défini sur toutes les pages
- `axiosInstance` utilisé partout (pas de `fetch()` direct)
- Routes frontend migrées vers `/candidatures`, `/etablissements`, `/contacts`, `/me/stats`
- Toast system via `@mantine/notifications`
- `statut.ts` avec `getStatutLabel()` et `getStatutStyle()`
- Lien "Administration" conditionnel dans la navbar (`user.role === 'admin'`)

### Tests
- 52 tests backend, tous verts
- Couverture : auth, candidatures, isolation workspace, subscription, établissements, contacts, main

### Déploiement
- `Procfile`, `railway.toml`, `frontend/vercel.json`, `.env.example`
- `.github/workflows/ci.yml` : backend (pytest) + frontend (npm build) sur push dev/main

## Points d'attention

- `src/main.py` contient encore la couche HTML legacy (Jinja2 templates pour les routes `/`, `/applications/*`) — non supprimée car les tests test_main.py en dépendent
- Les routes `/api/contacts/*`, `/api/organizations/*` restent actives en parallèle des aliases — backward compatible
- SQLite en local : migration vers PostgreSQL/Supabase prévue sans changement de modèles
- Score probité affiché seulement si ≥ 3 candidatures pour l'établissement

## BDD actuelle (offertrail.db)

- 37 candidatures, 32 établissements, 1 user, tables legacy séparées
- Pas de tables legacy dans le schéma SaaS (`init_saas_db` ne crée que les tables déclarées dans `models.py`)

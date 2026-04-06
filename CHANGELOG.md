# Changelog

## [0.1.0] - 2026-04-xx

### Ajouté
- Auth JWT complète (register, login, logout, forgot/reset password)
- Isolation workspaces multi-tenant prouvée par tests
- Dashboard KPIs (taux refus, taux réponse, délai moyen)
- Pipeline candidatures avec historique Git-like
- Score de probité consolidé entre users
- Abonnement Starter/Pro (paiement simulé)
- Import CSV candidatures
- File de relances
- Backoffice admin

### Infrastructure
- FastAPI + SQLite (migration Supabase prévue)
- React 19 + TypeScript + Vite
- Tests pytest avec couverture critique
- CI GitHub Actions

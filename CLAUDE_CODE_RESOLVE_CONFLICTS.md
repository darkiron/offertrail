Tu dois résoudre les conflits de merge sur la PR #52 (feat/landing-rich → dev).

## CONTEXTE

La branche feat/landing-rich a 15 commits et un check CI qui passe.
Elle a des conflits avec dev sur ces fichiers :
- CHANGELOG.md
- Makefile
- README.md
- frontend/src/App.tsx
- frontend/src/components/organisms/NewApplicationModal.tsx
- frontend/src/context/AuthContext.tsx
- frontend/src/pages/Admin.tsx
- frontend/src/pages/ApplicationDetails.tsx
- frontend/src/pages/ApplicationsPage.tsx
- frontend/src/pages/CompanyDetailsPage.tsx
- frontend/src/pages/ContactDetailsPage.tsx
- frontend/src/pages/ContactsPage.tsx
- frontend/src/pages/Dashboard.tsx
- frontend/src/pages/Import.tsx
- frontend/src/pages/Login.tsx
- frontend/src/pages/MonCompte.tsx
- frontend/src/pages/OrganizationMaintenancePage.tsx
- frontend/src/pages/OrganizationsPage.tsx
- frontend/src/pages/Register.tsx

## CE QUE TU DOIS FAIRE

```bash
# 1. S'assurer d'être sur la bonne branche
git checkout feat/landing-rich
git fetch origin
git merge origin/dev
```

Pour chaque fichier en conflit, la règle est :

**Garder le meilleur des deux côtés :**
- Code métier de dev (isolation user_id, auth, abonnement) → toujours garder
- Nouvelles features de feat/landing-rich (routing /app/, landing page, legal pages) → toujours garder
- En cas de conflit sur un même bloc → fusionner manuellement, ne jamais supprimer du code fonctionnel

**Règles spécifiques par fichier :**

frontend/src/App.tsx :
- Garder le routing /app/* de feat/landing-rich
- Garder toutes les pages importées des deux côtés
- Garder ProtectedRoute et AppLayout
- Garder les routes publiques / /login /register /forgot-password /reset-password

frontend/src/context/AuthContext.tsx :
- Garder la logique d'auth de dev (get_current_user, token storage)
- Garder les navigate('/app') de feat/landing-rich

frontend/src/pages/*.tsx :
- Garder les navigate('/app/...') de feat/landing-rich
- Garder les corrections métier de dev (filtres, user_id, gestion erreurs)

CHANGELOG.md / README.md :
- Fusionner les deux versions, garder tout le contenu

Makefile :
- Garder toutes les cibles des deux côtés

## APRÈS LA RÉSOLUTION

```bash
# Vérifier qu'il n'y a plus de marqueurs de conflit
grep -r "<<<<<<" frontend/src/
grep -r "<<<<<<" src/

# Builder le frontend pour vérifier qu'il compile
cd frontend && npm run build && cd ..

# Lancer les tests backend
pytest tests/ -v

# Si tout passe, committer
git add .
git commit -m "fix: resolve merge conflicts feat/landing-rich with dev"

# Pusher
git push origin feat/landing-rich

# Mettre à jour dev en local
git checkout dev
git pull origin dev
git merge feat/landing-rich
git push origin dev
```

## RÈGLE ABSOLUE

Ne jamais choisir l'une ou l'autre version en bloc avec git checkout --ours ou --theirs.
Toujours fusionner manuellement pour ne perdre aucune feature des deux branches.

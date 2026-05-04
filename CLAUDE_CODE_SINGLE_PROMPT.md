Tu es en charge du projet OfferTrail. Lis l'intégralité du code avant de toucher quoi que ce soit.

## CONTEXTE PROJET

Stack : FastAPI + SQLite (src/) · React 19 + TypeScript + Vite (frontend/)
Auth JWT opérationnelle · Isolation workspaces multi-tenant · Abonnement Starter/Pro simulé
BDD : 37 candidatures, 32 établissements, 1 user, 0 tables legacy

## ÉTAPE 0 — LIS D'ABORD

Lis dans cet ordre :
1. src/main.py → routers branchés et middleware
2. src/models.py → modèles et champs existants
3. src/auth.py → get_current_user_id et get_current_user
4. src/routers/*.py → tous les endpoints
5. src/services/*.py → logique métier
6. frontend/src/App.tsx → routes et navbar
7. frontend/src/api.ts → tous les appels API
8. frontend/src/pages/*.tsx → toutes les pages
9. tests/*.py → couverture existante

Produis mentalement un diagnostic avant de commencer.

## CE QUE TU DOIS FAIRE (dans l'ordre)

### 1. Isolation workspaces — CRITIQUE
- Vérifie que chaque endpoint privé (candidatures, relances, events, contact_interactions) a Depends(get_current_user_id) ET filtre par user_id
- user_id vient TOUJOURS du token JWT — jamais du body (exclude={"user_id"} sur les créations)
- Accès à une ressource d'un autre user → 404 (pas 403)
- Branche : fix/workspace-isolation

### 2. Routes frontend
- Cherche tous les appels vers /api/applications, /api/organizations, /api/contacts, /api/dashboard dans frontend/src/
- Remplace par : /candidatures, /etablissements, /contacts, /me/stats
- Vérifie que axiosInstance est utilisé partout — pas de fetch() direct
- Branche : fix/frontend-api-routes

### 3. Register public
- /register doit être une route publique dans App.tsx (pas dans ProtectedRoute)
- Après register réussi → navigate('/') pas navigate('/login')
- Validation zod : email valide, password min 8 chars
- Erreur 409 → message "Cet email est déjà utilisé."
- Lien croisé login ↔ register
- Branche : fix/register-public

### 4. Backoffice admin
- Ajoute role = Column(String, default='user') sur User dans src/models.py si absent
- Ajoute get_admin_user dans src/auth.py (vérifie role == 'admin', 403 sinon)
- Crée src/routers/admin.py :
  - GET /admin/stats → total users, pro users, MRR estimé (pro * 9.99), total candidatures
  - GET /admin/users → liste avec email, plan, role, nb_candidatures, created_at
  - PATCH /admin/users/{id}/plan → body {plan: starter|pro}, appelle activate_pro() ou _downgrade_to_starter()
  - DELETE /admin/users/{id} → soft delete is_active=False, interdit sur soi-même
  - POST /admin/recompute-probite → appelle recompute_probite_scores(db)
- Branche le router dans src/main.py
- Crée frontend/src/pages/Admin.tsx : métriques + tableau users + actions upgrade/downgrade/désactiver
- Ajoute route /admin dans App.tsx (ProtectedRoute, le 403 géré dans la page)
- Lien "Administration" dans le dropdown navbar uniquement si user.role === 'admin'
- Branche : feat/admin-backoffice

### 5. Rate limiting
- Installe slowapi, ajoute dans requirements.txt
- POST /auth/register : 5/minute · POST /auth/login : 10/minute · POST /auth/forgot-password : 3/minute
- Branche : feat/rate-limiting

### 6. Tests isolation
- Lis tests/conftest.py pour reprendre les fixtures
- Complète ou crée tests/test_isolation.py :
  - user B ne voit pas les candidatures de A (liste → absente, par ID → 404)
  - user B ne peut pas modifier ni supprimer les candidatures de A → 404
  - user_id dans le body est ignoré, c'est le token qui fait foi
  - sans token → 401
  - 26e candidature en Starter → 402 avec code LIMIT_REACHED
  - après upgrade Pro → 26e candidature passe
- Lance pytest tests/test_isolation.py -v et corrige jusqu'à tout vert
- Branche : test/isolation-coverage

### 7. Déploiement
- Crée Procfile : web: uvicorn src.main:app --host 0.0.0.0 --port $PORT
- Crée railway.toml : builder nixpacks, healthcheck /health, restart on_failure
- Crée frontend/vercel.json : rewrite SPA vers /index.html
- CORS dans src/main.py doit lire ALLOWED_ORIGINS depuis os.getenv() avec fallback localhost:5173
- Crée .env.example avec DATABASE_URL, SECRET_KEY, RESEND_API_KEY, ALLOWED_ORIGINS
- Crée .github/workflows/ci.yml : job backend (pytest) + job frontend (npm run build) sur push dev/main
- Lance npm run build dans frontend/ et corrige les erreurs TypeScript bloquantes
- Branche : feat/deployment

### 8. Polish UX
- Toutes les listes qui font un appel API : ajouter état loading + empty state + catch erreur
- Toast system minimal (bas droite, 3 secondes) : succès après création candidature, changement statut, enregistrement profil
- Badges statuts cohérents : crée frontend/src/utils/statut.ts avec getStatutLabel() et getStatutStyle(), utilise ces fonctions partout
- Titres de page : document.title = 'PageName — OfferTrail' dans chaque page
- Tableaux larges : wrapper overflow-x: auto
- Branche : chore/ux-polish

### 9. Documentation
- Réécris README.md : stack actuelle (plus Bulma, plus local-first), make install && make run, variables d'env, make test, déploiement Railway + Vercel
- Crée CHANGELOG.md au format Keep a Changelog avec entrée v0.1.0
- Crée docs/project-state.md avec l'état réel après toutes ces corrections
- Branche : docs/update

## RÈGLES ABSOLUES

- Une branche par ticket depuis dev
- make test doit passer avant chaque commit
- Ne jamais committer sur main ou dev directement
- Supprimer les console.log() et print() de debug trouvés en chemin
- Si quelque chose est ambigu → lire le code existant pour en déduire la convention, ne pas inventer

## ORDRE DES BRANCHES ET MERGES

fix/workspace-isolation → dev
fix/frontend-api-routes → dev  
fix/register-public → dev
feat/admin-backoffice → dev
feat/rate-limiting → dev
test/isolation-coverage → dev
feat/deployment → dev
chore/ux-polish → dev
docs/update → dev
── PR dev → main (release v0.2.0)

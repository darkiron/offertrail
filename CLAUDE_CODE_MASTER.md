# OfferTrail — Master prompt
## Règles non négociables
- Git flow strict : chaque ticket = branche depuis `dev` = PR vers `dev`
- Commits : `emoji type(scope): message court` — ex: `🐛 fix(auth): remove hardcoded secret`
- Lire les fichiers concernés AVANT d'écrire
- `make test` + `npm run build` avant chaque push
- Jamais de commit direct sur `dev` ou `main`

---

## TICKET 1 — `fix/legacy-html-railway`
**Objectif :** FastAPI ne sert plus que du JSON.

Lis `src/main.py` + tous les fichiers `src/routers/`.
Supprimer : `Jinja2Templates`, `StaticFiles`, `HTMLResponse`, `TemplateResponse`.
Supprimer `src/templates/` et `src/static/` si présents.
Retirer `jinja2` de `requirements.txt` si plus utilisé.
Vérifier : `grep -rn "HTMLResponse\|Jinja2" src/` → 0 résultats.

```
🔥 fix(backend): remove jinja2 legacy views - api serves json only
```

---

## TICKET 2 — `fix/single-pro-plan`
**Objectif :** Starter gratuit + Pro 14,99€. Rien d'autre.

Audit : `grep -rn "9,99\|9\.99\|essential\|Essential" src/ frontend/src/ landing/`

**Backend** — `src/services/subscription.py` :
- PLANS : starter (0€, 25 cands) + pro (14.99€, illimité)
- Supprimer toute référence "essential"
- `activate_plan(db, profile, plan)` accepte uniquement "starter" | "pro"

**Backend** — `src/routers/subscription.py` :
- `POST /checkout` : si `STRIPE_SECRET_KEY` absent → lever `RuntimeError("STRIPE_SECRET_KEY manquante")` au démarrage, pas de fallback silencieux
- En local : mettre la vraie clé test Stripe dans `.env`, pas de placeholder

**Frontend** — créer `frontend/src/config.ts` :
```ts
export const CONFIG = {
  PRO_PRICE: "14,99€", PRO_PRICE_NUM: 14.99, STARTER_LIMIT: 25,
  CONTACT_EMAIL: import.meta.env.VITE_CONTACT_EMAIL,
  CRAFTCODES_URL: import.meta.env.VITE_CRAFTCODES_URL,
}
```
Aucun fallback en dur. Si une variable d'env manque → l'app le signale clairement.
Remplacer toutes les strings hardcodées prix/email/url par CONFIG.*.
Supprimer toute card/logique Essential dans Pricing, MonCompte.

Vérifier : `grep -rn "9,99\|essential" frontend/src/ src/ landing/` → 0 résultats.

```
✨ fix(plans): single pro plan 14.99€ + config constants
```

---

## TICKET 3 — `fix/profile-loading`
**Objectif :** Prénom/Nom s'affichent dans MonCompte.

Lis `frontend/src/pages/MonCompte.tsx` + `frontend/src/context/AuthContext.tsx`.
Au montage : charger depuis `useAuth().profile` EN PREMIER, puis `GET /auth/me` pour sync.
Gérer le cas Supabase Auth (données dans `user_metadata`) ET FastAPI Auth (données dans profil).

```
🐛 fix(account): load profile prenom/nom on mount
```

---

## TICKET 4 — `feat/legal-pages`
**Objectif :** CGU + Confidentialité (requis pour Stripe live).

Créer `frontend/src/pages/legal/CGU.tsx` et `frontend/src/pages/legal/Confidentialite.tsx`.
Contenu minimal légalement valide (éditeur CraftCodes, données Supabase UE, résiliation mensuelle sans remboursement prorata, RGPD).
Ajouter routes dans App.tsx sous `/app/legal/cgu` et `/app/legal/confidentialite`.
Footer : liens CGU + Confidentialité pointant vers ces routes.

```
📄 feat(legal): add CGU and privacy policy pages
```

---

## TICKET 5 — `fix/workspace-isolation-proof`
**Objectif :** Prouver l'isolation par des tests automatisés.

Lis `tests/conftest.py` + `tests/test_isolation.py` si existants.
Créer/compléter `tests/test_isolation.py` avec ces cas OBLIGATOIRES :
- User B : liste candidatures de A → absent
- User B : GET candidature A par ID → 404
- User B : PATCH candidature A → 404
- user_id dans body ignoré → user_id = token
- Sans token → 401
- 26e candidature Starter → 402 avec `code: LIMIT_REACHED`
- Après upgrade Pro → 26e candidature OK

Lancer `pytest tests/test_isolation.py -v` et corriger jusqu'à tout vert.

```
✅ test(isolation): prove workspace isolation - all cases green
```

---

## TICKET 6 — `feat/ux-polish`
**Objectif :** Empty states, loading, toasts, titres.

Lis toutes les pages dans `frontend/src/pages/`.
Pour chaque page avec appel API :
- Loading : texte "Chargement..." si absent
- Empty state : message contextuel si liste vide
- Erreur : message visible si appel échoue

Toast system minimal (bas droite, 3s, CSS variables) sur :
- Création candidature → "Candidature ajoutée ✓"
- Changement statut → "Statut mis à jour ✓"
- Enregistrement profil → "Profil enregistré ✓"

`document.title = 'PageName — OfferTrail'` sur chaque page principale.

```
✨ feat(ux): empty states, loading, toasts, page titles
```

---

## TICKET 7 — `feat/admin-backoffice`
**Objectif :** Page /app/admin protégée par role=admin.

Lis `src/models.py` — ajouter `role = Column(String, default="user")` sur Profile si absent.
Lis `src/auth.py` — ajouter `get_admin_profile` si absent.
Créer `src/routers/admin.py` avec :
- `GET /admin/stats` → total_users, pro_users, starter_users, total_candidatures, mrr (pro * 14.99)
- `GET /admin/users` → liste avec email/plan/nb_candidatures/created_at
- `PATCH /admin/users/{id}/plan` → "starter" | "pro" uniquement
- `PATCH /admin/users/{id}/toggle-active` → is_active flip, interdit sur soi-même

Créer `frontend/src/pages/Admin.tsx` :
- KPIs en grille (4 métriques)
- Tableau users avec badges plan (2 couleurs : vert=pro, gris=starter)
- Boutons → Pro / → Starter / Désactiver
- Si 403 → redirect /app
- Lien "Administration" dans dropdown navbar uniquement si `profile?.role === 'admin'`

Brancher router dans `src/main.py` + route dans `App.tsx`.

```
✨ feat(admin): backoffice with user management and mrr stats
```

---

## TICKET 8 — `feat/client-final-id`
**Objectif :** Gérer les cabinets de recrutement comme intermédiaires.

Lis `src/models.py` — ajouter sur `Candidature` :
```python
client_final_id = Column(String, ForeignKey("etablissements.id"), nullable=True)
```
Ajouter dans les schémas Pydantic Create et Schema.
Dans `src/services/probite.py` : utiliser `COALESCE(client_final_id, etablissement_id)` pour grouper les scores.
Ajouter le champ dans le formulaire de création de candidature frontend (optionnel, libellé "Client final (si cabinet)").

Nouvelle migration Alembic : `alembic revision --autogenerate -m "add client_final_id to candidatures"`

```
✨ feat(candidatures): add client_final_id for recruitment agencies
```

---

## TICKET 9 — `chore/docs-and-ci`
**Objectif :** README, CHANGELOG, GitHub Actions, GitHub Issues.

Réécrire `README.md` : stack actuelle (FastAPI + PostgreSQL + React + Vite), make install/run/test, .env.example, déploiement Railway+Vercel. Supprimer toute mention Bulma/SQLite/local-first.

Créer `CHANGELOG.md` format Keep a Changelog, entrée v0.1.0 avec features implémentées.

Vérifier `.github/workflows/ci.yml` : si absent, créer avec job backend (pytest) + job frontend (npm build) sur push dev/main.

Sur GitHub.com — manuellement après merge :
- Settings → Features → activer Issues
- Créer labels : bug, feat, ux, infra, security

```
📝 chore(docs): update readme + changelog + ci workflow
```

---

## ORDRE D'EXÉCUTION

```
fix/legacy-html-railway        → PR → dev  (débloquer Railway)
fix/single-pro-plan            → PR → dev  (débloquer prod)
fix/profile-loading            → PR → dev
feat/legal-pages               → PR → dev  (débloquer Stripe live)
fix/workspace-isolation-proof  → PR → dev
feat/ux-polish                 → PR → dev
feat/admin-backoffice          → PR → dev
feat/client-final-id           → PR → dev
chore/docs-and-ci              → PR → dev
                                     ↓
                               PR dev → main  (release v1.0)
```

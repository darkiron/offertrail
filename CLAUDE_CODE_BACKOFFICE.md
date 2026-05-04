Branche depuis dev : `feat/admin-backoffice`

Lis src/models.py, src/auth.py, src/main.py, frontend/src/App.tsx
et frontend/src/pages/ avant de toucher quoi que ce soit.

## CONTEXTE
- Auth : Supabase JWT (get_current_profile existe déjà)
- Plans : starter (gratuit) et pro (14,99€) uniquement
- UI : Mantine v7+ — utiliser les composants Mantine existants dans le projet

---

## COMMIT 1 — Backend

**src/models.py** — ajouter sur Profile si absent :
```python
role = Column(String, default="user")  # user | admin
```

**src/auth.py** — ajouter si absent :
```python
def get_admin_profile(profile=Depends(get_current_profile)):
    if profile.role != "admin":
        raise HTTPException(status_code=403, detail="Accès admin requis")
    return profile
```

**Créer src/routers/admin.py** :
- `GET /admin/stats` → total_users, pro_users, starter_users, total_candidatures, mrr (pro × 14.99)
- `GET /admin/users` → liste avec id, email, plan, role, is_active, nb_candidatures, created_at
- `PATCH /admin/users/{id}/plan` → body `{plan: "starter"|"pro"}` uniquement
- `PATCH /admin/users/{id}/toggle-active` → flip is_active, interdit sur soi-même

Brancher dans src/main.py.

Nouvelle migration Alembic si role absent :
```bash
alembic revision --autogenerate -m "add role to profiles"
alembic upgrade head
```

Passer son compte en admin :
```bash
python -c "
from src.database import SessionLocal
from src.models import Profile
db = SessionLocal()
p = db.query(Profile).first()
p.role = 'admin'
db.commit()
print('Done:', p.id)
"
```

```
✨ feat(admin): backend router stats + user management
```

---

## COMMIT 2 — Page Admin frontend

**Créer frontend/src/pages/Admin.tsx** avec Mantine.
Structure :
- 4 KPI cards en haut (SimpleGrid) : total users, Pro, Starter, MRR estimé
- Table Mantine avec colonnes : Email, Plan (Badge), Candidatures, Inscrit le, Actif, Actions
- Badge vert=pro, gris=starter
- Actions par ligne : bouton → Pro (si starter) ou → Starter (si pro), bouton Désactiver/Réactiver
- Si GET /admin/stats → 403 : afficher "Accès refusé" et navigate('/app')
- Loading skeleton pendant le chargement

Utiliser axiosInstance pour tous les appels.
useEffect au montage → charger stats + users en parallèle (Promise.all).

**App.tsx** — ajouter route :
```tsx
<Route path="admin" element={<Admin />} />
```
Dans le dropdown navbar, uniquement si `profile?.role === 'admin'` :
```tsx
<Menu.Item component={Link} to="/app/admin">Administration</Menu.Item>
```

```
✨ feat(admin): backoffice page with mantine ui
```

---

## VÉRIFICATION
```bash
pytest tests/ -v
cd frontend && npm run build
```

- /app/admin avec compte admin → KPIs + tableau visible
- /app/admin avec compte normal → redirect /app
- Bouton → Pro → plan change dans le tableau
- Désactiver → is_active=false

PR → dev

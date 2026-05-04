Branche depuis dev : `feat/admin-backoffice-v2`

Lis src/routers/admin.py, src/models.py, frontend/src/pages/Admin.tsx
intégralement avant de toucher quoi que ce soit.

---

## COMMIT 1 — Bug fix : candidatures = 0

Le compte candidatures est toujours 0. Diagnostiquer et corriger.

Dans src/routers/admin.py, GET /admin/users :
```python
# Vérifier que la query filtre bien par user_id ET compte toutes les tables
nb_cands = db.query(func.count(Candidature.id)).filter(
    Candidature.user_id == p.id
).scalar()
```

Vérifier que `Candidature` est bien importé depuis src/models.py.
Vérifier que `user_id` sur Candidature correspond bien à l'id du Profile (UUID Supabase).

```
🐛 fix(admin): candidature count always zero
```

---

## COMMIT 2 — KPIs enrichis backend

Enrichir `GET /admin/stats` :

```python
from datetime import datetime, timedelta
from sqlalchemy import func

today = datetime.utcnow()
week_ago = today - timedelta(days=7)
month_ago = today - timedelta(days=30)

# Revenus
mrr = round(pro_users * 14.99, 2)
arr = round(mrr * 12, 2)

# Croissance
new_users_7d = db.query(Profile).filter(Profile.created_at >= week_ago).count()
new_users_30d = db.query(Profile).filter(Profile.created_at >= month_ago).count()
new_pro_30d = db.query(Profile).filter(
    Profile.plan == "pro",
    Profile.plan_started_at >= month_ago
).count()

# Conversion
conversion_rate = round((pro_users / total_users * 100), 1) if total_users > 0 else 0

# Activité
total_cands = db.query(func.count(Candidature.id)).scalar()
avg_cands_per_user = round(total_cands / total_users, 1) if total_users > 0 else 0
total_relances = db.query(func.count(Relance.id)).scalar()
total_etablissements = db.query(func.count(Etablissement.id)).scalar()

return {
    # Revenus
    "mrr": mrr,
    "arr": arr,
    # Users
    "total_users": total_users,
    "pro_users": pro_users,
    "starter_users": starter_users,
    "new_users_7d": new_users_7d,
    "new_users_30d": new_users_30d,
    "new_pro_30d": new_pro_30d,
    "conversion_rate": conversion_rate,
    # Produit
    "total_candidatures": total_cands,
    "avg_cands_per_user": avg_cands_per_user,
    "total_relances": total_relances,
    "total_etablissements": total_etablissements,
}
```

Ajouter `GET /admin/activity` — 10 derniers events :
```python
@router.get("/activity")
def recent_activity(db=Depends(get_db), _=Depends(get_admin_profile)):
    # 5 derniers inscrits
    new_users = db.query(Profile).order_by(Profile.created_at.desc()).limit(5).all()
    # 5 derniers upgrades Pro
    new_pro = db.query(Profile).filter(
        Profile.plan == "pro",
        Profile.plan_started_at.isnot(None)
    ).order_by(Profile.plan_started_at.desc()).limit(5).all()

    return {
        "new_users": [{"email": p.email, "created_at": p.created_at} for p in new_users],
        "new_pro": [{"email": p.email, "plan_started_at": p.plan_started_at} for p in new_pro],
    }
```

Ajouter `POST /admin/recompute-probite` si absent.

Ajouter `GET /admin/export-users` — CSV :
```python
import csv, io
from fastapi.responses import StreamingResponse

@router.get("/export-users")
def export_users(db=Depends(get_db), _=Depends(get_admin_profile)):
    profiles = db.query(Profile).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "email", "plan", "role", "is_active", "created_at", "plan_started_at"])
    for p in profiles:
        writer.writerow([p.id, getattr(p, "email", ""), p.plan, p.role, p.is_active, p.created_at, p.plan_started_at])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=offertrail-users.csv"}
    )
```

```
✨ feat(admin): enriched stats - mrr, arr, conversion, growth, activity
```

---

## COMMIT 3 — Page Admin refonte complète

Refaire frontend/src/pages/Admin.tsx avec Mantine.
Charger stats + users + activity en parallèle avec Promise.all.

### Section 1 — KPIs revenus (ligne du haut)
```
MRR        ARR        Conversion    Nouveaux 30j
14,99€     179,88€    100%          +2
```
Cards avec couleur accent sur les valeurs financières.

### Section 2 — KPIs produit (ligne du bas)
```
Users total    Pro    Starter    Candidatures    Relances    Établissements    Moy. cands/user
1              1      0          37              32          32                37
```

### Section 3 — Activité récente (2 colonnes)
```
Derniers inscrits          Derniers upgrades Pro
• user@mail.com — il y a 2h   • user@mail.com — il y a 1j
• ...                          • ...
```

### Section 4 — Actions globales
```
[Recalculer probité]   [Exporter users CSV]
```
- Recalculer probité → POST /admin/recompute-probite → notification succès
- Exporter CSV → GET /admin/export-users → déclenche téléchargement

### Section 5 — Table users (existante, à améliorer)
Colonnes : Email + Prénom Nom, Plan (Badge), Rôle (Badge), Candidatures, Inscrit le, Plan démarré, Actif, Actions

Améliorer les actions :
- Si plan=starter → bouton "Passer Pro" (vert)
- Si plan=pro → bouton "Rétrograder" (gris)
- Bouton "Désactiver" / "Réactiver" (rouge/vert)
- Confirmation avant désactivation : `modals.openConfirmModal` Mantine

Ajouter une barre de recherche email au-dessus de la table.
Filtrer côté client sur l'email (pas d'appel API supplémentaire).

```
✨ feat(admin): full saas backoffice - kpis, activity, export, search
```

---

## VÉRIFICATION
```bash
pytest tests/ -v
cd frontend && npm run build
```

Tester :
- Stats affichent les vraies valeurs (candidatures > 0)
- MRR = 14,99 si 1 user Pro
- ARR = 179,88
- Export CSV → fichier téléchargeable
- Recalculer probité → toast succès
- Recherche email → filtre la table
- Désactiver → confirmation modale → is_active=false

PR → dev

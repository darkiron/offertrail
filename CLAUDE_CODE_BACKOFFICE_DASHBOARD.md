Branche depuis dev : `feat/admin-dashboard-pro`

Lis src/routers/admin.py, src/services/subscription.py, src/models.py,
frontend/src/pages/Admin.tsx intégralement avant de toucher quoi que ce soit.

## CONTEXTE PRODUIT
Un seul plan payant : Pro à 14,99€/mois.
Le plan "starter" n'existe pas — il faut le remplacer par "free" partout.
Un user est soit `free` (accès limité à 25 candidatures), soit `pro` (illimité).
Purger toutes les occurrences "starter" et "Starter" du code.

---

## COMMIT 1 — Purger "starter" partout

```bash
grep -rn "starter\|Starter\|STARTER" src/ frontend/src/ landing/ docs/
```

Pour chaque occurrence :
- Dans le code métier (models, services, routers) → remplacer par `free`
- Dans l'UI (labels, badges, textes) → remplacer par "Gratuit" ou "Free"
- Dans les migrations existantes → NE PAS toucher (historique Alembic)
- Dans les nouveaux modèles → `plan: free | pro`

**src/services/subscription.py** :
```python
PLANS = {
    "free": {
        "nom": "Gratuit",
        "prix_mensuel": 0,
        "candidatures_max": 25,
    },
    "pro": {
        "nom": "Pro",
        "prix_mensuel": 14.99,
        "candidatures_max": 0,
    },
}
```

Nouvelle migration Alembic pour migrer les données existantes :
```bash
alembic revision -m "rename plan starter to free"
```

Dans le fichier généré :
```python
def upgrade():
    op.execute("UPDATE profiles SET plan = 'free' WHERE plan = 'starter'")

def downgrade():
    op.execute("UPDATE profiles SET plan = 'starter' WHERE plan = 'free'")
```

```
🔥 refactor(plans): rename starter to free everywhere
```

---

## COMMIT 2 — Backend : séries temporelles pour graphiques

Enrichir src/routers/admin.py.

**GET /admin/stats** — stats instantanées :
```python
{
  "mrr": 14.99,
  "arr": 179.88,
  "total_users": 1,
  "pro_users": 1,
  "free_users": 0,
  "new_users_7d": 0,
  "new_users_30d": 1,
  "new_pro_30d": 1,
  "conversion_rate": 100.0,
  "churn_rate_30d": 0.0,  # (users passés de pro à free sur 30j) / pro_users
  "total_candidatures": 37,
  "avg_cands_per_user": 37.0,
  "total_relances": 32,
  "total_etablissements": 32,
  "active_users_7d": 1,  # users avec au moins 1 candidature créée sur 7j
}
```

**GET /admin/chart/mrr-evolution** — évolution MRR sur 90 jours :
```python
@router.get("/chart/mrr-evolution")
def mrr_evolution(db=Depends(get_db), _=Depends(get_admin_profile)):
    # Pour chaque jour des 90 derniers jours, compter les users Pro actifs ce jour-là
    from datetime import datetime, timedelta
    today = datetime.utcnow().date()
    result = []
    for i in range(90, -1, -1):
        day = today - timedelta(days=i)
        pro_count = db.query(Profile).filter(
            Profile.plan == "pro",
            Profile.plan_started_at <= datetime.combine(day, datetime.max.time()),
        ).count()
        result.append({"date": day.isoformat(), "mrr": round(pro_count * 14.99, 2)})
    return result
```

**GET /admin/chart/users-growth** — nouveaux users par jour sur 30 jours :
```python
@router.get("/chart/users-growth")
def users_growth(db=Depends(get_db), _=Depends(get_admin_profile)):
    from datetime import datetime, timedelta
    today = datetime.utcnow().date()
    result = []
    for i in range(30, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        count = db.query(Profile).filter(
            Profile.created_at >= day_start,
            Profile.created_at <= day_end
        ).count()
        result.append({"date": day.isoformat(), "signups": count})
    return result
```

**GET /admin/chart/candidatures-activity** — candidatures créées par jour sur 30 jours :
```python
@router.get("/chart/candidatures-activity")
def candidatures_activity(db=Depends(get_db), _=Depends(get_admin_profile)):
    # Même logique mais sur Candidature.created_at
```

**GET /admin/chart/plan-distribution** — répartition plans :
```python
@router.get("/chart/plan-distribution")
def plan_distribution(db=Depends(get_db), _=Depends(get_admin_profile)):
    free = db.query(Profile).filter(Profile.plan == "free").count()
    pro = db.query(Profile).filter(Profile.plan == "pro").count()
    return [
        {"plan": "Gratuit", "count": free, "color": "#868e96"},
        {"plan": "Pro", "count": pro, "color": "#12b886"},
    ]
```

**GET /admin/top-etablissements** — top 10 entreprises les plus postulées :
```python
@router.get("/top-etablissements")
def top_etablissements(db=Depends(get_db), _=Depends(get_admin_profile)):
    results = db.query(
        Etablissement.nom,
        func.count(Candidature.id).label("total")
    ).join(
        Candidature, Candidature.etablissement_id == Etablissement.id
    ).group_by(Etablissement.id, Etablissement.nom).order_by(
        func.count(Candidature.id).desc()
    ).limit(10).all()
    return [{"nom": r[0], "total": r[1]} for r in results]
```

```
✨ feat(admin): time series endpoints for charts
```

---

## COMMIT 3 — Dashboard pro frontend avec Recharts

Mantine fournit `@mantine/charts` basé sur Recharts.
Vérifier s'il est installé, sinon :
```bash
cd frontend && npm install @mantine/charts recharts
```

Refaire entièrement frontend/src/pages/Admin.tsx.

Layout : 3 sections clairement séparées avec titres.

### Section A — Vue d'ensemble (4 KPI cards en haut)
SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}.
Chaque card montre :
- Valeur principale (gros chiffre)
- Label
- Variation par rapport à la période précédente (petite flèche ↑↓ colorée)

KPIs :
1. **MRR** : `14,99€` + variation vs 30j (ex: +14,99€ ↑)
2. **Users total** : `1` + `+X sur 30j`
3. **Taux de conversion** : `100%` (pro_users / total_users)
4. **Candidatures moy.** : `37` par user

### Section B — Graphiques (grid 2 colonnes)

Utiliser `@mantine/charts` :

**Graphique 1 — LineChart MRR (90 jours)**
```tsx
<LineChart
  h={280}
  data={mrrData}
  dataKey="date"
  series={[{ name: "mrr", color: "green.6", label: "MRR (€)" }]}
  withLegend
  withTooltip
  curveType="monotone"
/>
```

**Graphique 2 — BarChart Nouveaux users (30 jours)**
```tsx
<BarChart
  h={280}
  data={signupsData}
  dataKey="date"
  series={[{ name: "signups", color: "blue.6", label: "Inscriptions" }]}
  withLegend
/>
```

**Graphique 3 — AreaChart Activité candidatures (30 jours)**
```tsx
<AreaChart
  h={240}
  data={activityData}
  dataKey="date"
  series={[{ name: "candidatures", color: "violet.6" }]}
  curveType="monotone"
  withTooltip
/>
```

**Graphique 4 — DonutChart Répartition des plans**
```tsx
<DonutChart
  data={planDistribution}
  h={240}
  withLabelsLine
  withLabels
  withTooltip
/>
```

### Section C — Tables (2 colonnes sur desktop, 1 sur mobile)

**Colonne gauche — Top 10 établissements**
Table Mantine : Rang | Nom | Nombre de candidatures
Avec barre de progression Mantine `<Progress value={...} />` visible dans la ligne.

**Colonne droite — Activité récente**
Deux sous-blocs :
- 5 derniers inscrits
- 5 derniers upgrades Pro

### Section D — Gestion utilisateurs (inchangée, juste corrections)

Garder le tableau existant mais :
- Remplacer badge "STARTER" par "GRATUIT" (gris)
- Remplacer bouton "Rétrograder" par "Passer en Gratuit"
- Ajouter TextInput de recherche au-dessus (filtrage client)
- Ajouter Group avec boutons "Exporter CSV" et "Recalculer probité"

### Responsive
- Mobile : tout en 1 colonne, graphiques en pleine largeur
- Desktop : grid 2 colonnes pour graphiques

### Loading
Utiliser `<Skeleton />` de Mantine pour chaque card/graphique pendant le chargement initial.

```
✨ feat(admin): professional dashboard with charts and analytics
```

---

## VÉRIFICATION

```bash
# Plus aucune trace de "starter"
grep -rn "starter\|Starter" src/ frontend/src/
# Doit retourner 0 résultats hors alembic/versions et commentaires migration

# Build
cd frontend && npm run build

# Tests
pytest tests/ -v

# Lancer
make run
```

Visiter /app/admin et vérifier :
- Badge "GRATUIT" au lieu de "STARTER"
- 4 KPIs en haut avec variations
- 4 graphiques (MRR, inscriptions, activité, répartition plans)
- Top 10 établissements avec barres de progression
- Tableau users avec recherche + export CSV

PR → dev

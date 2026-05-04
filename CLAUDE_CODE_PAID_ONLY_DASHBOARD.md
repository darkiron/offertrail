Branche depuis dev : `feat/paid-only-admin-dashboard`

Lis src/models.py, src/services/subscription.py, src/routers/subscription.py,
src/routers/admin.py, frontend/src/pages/Admin.tsx, frontend/src/context/AuthContext.tsx
intégralement avant de toucher quoi que ce soit.

## NOUVEAU MODÈLE
- Plus de plan "starter" — SaaS 100% payant
- Inscription → Stripe checkout immédiat → webhook confirme → accès débloqué
- États du compte : `pending` (inscrit mais pas encore payé), `active` (Pro), `cancelled` (abonnement résilié)

---

## COMMIT 1 — Killer le plan Starter

**src/services/subscription.py** :
- Supprimer toute référence à "starter"
- Supprimer CANDIDATURES_MAX_STARTER et check_can_create()
- PLANS = uniquement `{"pro": {...}}`
- Remplacer le champ `plan` par `subscription_status` : `"pending" | "active" | "cancelled"`

**src/models.py** :
- Sur Profile : remplacer `plan = "starter"` par `subscription_status = "pending"`
- Garder `plan_started_at`, `plan_expires_at`
- Migration Alembic pour renommer la colonne et migrer les valeurs existantes

**src/auth.py** — nouvelle dépendance bloquante :
```python
def get_active_profile(profile=Depends(get_current_profile)):
    if profile.subscription_status != "active":
        raise HTTPException(
            status_code=402,
            detail={"code": "PAYMENT_REQUIRED", "message": "Abonnement requis"}
        )
    return profile
```

**Remplacer `get_current_profile` par `get_active_profile` sur tous les endpoints métier** (candidatures, etablissements, contacts, relances).
Garder `get_current_profile` uniquement sur `/auth/me` et `/subscription/checkout`.

```
💥 refactor(plans): remove starter - paid only saas
```

---

## COMMIT 2 — Inscription → Stripe immédiat

**Flux nouvel utilisateur :**
1. Register via Supabase → Profile créé avec `subscription_status="pending"`
2. Redirect frontend vers `/app/checkout` (page d'attente)
3. Page Checkout affiche bouton "Payer 14,99€/mois" → POST /subscription/checkout
4. Stripe Checkout → webhook → `subscription_status="active"`
5. Redirect vers /app/dashboard

**src/routers/subscription.py** :
- `POST /subscription/checkout` accessible aux profils `pending`
- Webhook `checkout.session.completed` → `subscription_status = "active"` + `plan_started_at = now()`
- Webhook `customer.subscription.deleted` → `subscription_status = "cancelled"`

**frontend/src/pages/Checkout.tsx** (nouvelle page) :
- Affichage : "Bienvenue sur OfferTrail — activez votre abonnement pour commencer"
- Récap : Pro 14,99€/mois, résiliable à tout moment
- Bouton "Payer 14,99€" → redirect Stripe
- Si retour ?payment=success → polling GET /auth/me toutes les 2s jusqu'à subscription_status=active → redirect /app
- Si retour ?payment=cancelled → message "Paiement annulé, réessayer"

**frontend/src/App.tsx** :
- Nouvelle route `/app/checkout` dans SubscriptionGate bypass
- Après signup (RegisterPage) → navigate('/app/checkout')
- SubscriptionGate : si subscription_status !== 'active' → redirect /app/checkout

```
✨ feat(onboarding): paid signup flow with stripe checkout
```

---

## COMMIT 3 — Dashboard admin avec vrais graphiques

Installer Recharts si pas présent :
```bash
cd frontend && npm install recharts
```

### Backend — nouveaux endpoints analytics

**src/routers/admin.py** — ajouter :

```python
from sqlalchemy import func, and_
from datetime import datetime, timedelta

@router.get("/analytics/mrr-history")
def mrr_history(db=Depends(get_db), _=Depends(get_admin_profile)):
    """MRR des 12 derniers mois."""
    result = []
    today = datetime.utcnow()
    for i in range(11, -1, -1):
        month_start = (today.replace(day=1) - timedelta(days=i*30)).replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1)
        active_count = db.query(Profile).filter(
            Profile.subscription_status == "active",
            Profile.plan_started_at < month_end,
        ).count()
        result.append({
            "month": month_start.strftime("%Y-%m"),
            "mrr": round(active_count * 14.99, 2),
            "active_users": active_count,
        })
    return result


@router.get("/analytics/signups")
def signups_history(db=Depends(get_db), _=Depends(get_admin_profile)):
    """Inscriptions par jour sur 30 jours."""
    today = datetime.utcnow()
    start = today - timedelta(days=30)
    result = []
    for i in range(30, -1, -1):
        day = today - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = db.query(Profile).filter(
            and_(Profile.created_at >= day_start, Profile.created_at < day_end)
        ).count()
        paid = db.query(Profile).filter(
            and_(
                Profile.plan_started_at >= day_start,
                Profile.plan_started_at < day_end,
            )
        ).count()
        result.append({
            "date": day.strftime("%d/%m"),
            "signups": count,
            "paid": paid,
        })
    return result


@router.get("/analytics/funnel")
def funnel(db=Depends(get_db), _=Depends(get_admin_profile)):
    """Entonnoir d'acquisition."""
    total = db.query(Profile).count()
    pending = db.query(Profile).filter(Profile.subscription_status == "pending").count()
    active = db.query(Profile).filter(Profile.subscription_status == "active").count()
    cancelled = db.query(Profile).filter(Profile.subscription_status == "cancelled").count()
    churn_rate = round((cancelled / (cancelled + active) * 100), 1) if (cancelled + active) > 0 else 0
    return {
        "total": total,
        "pending": pending,
        "active": active,
        "cancelled": cancelled,
        "churn_rate": churn_rate,
        "activation_rate": round((active / total * 100), 1) if total > 0 else 0,
    }


@router.get("/analytics/candidatures-evolution")
def candidatures_evolution(db=Depends(get_db), _=Depends(get_admin_profile)):
    """Candidatures créées par jour sur 30 jours."""
    today = datetime.utcnow()
    result = []
    for i in range(30, -1, -1):
        day = today - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = db.query(Candidature).filter(
            and_(
                Candidature.created_at >= day_start,
                Candidature.created_at < day_end,
            )
        ).count()
        result.append({"date": day.strftime("%d/%m"), "count": count})
    return result
```

### Frontend — refonte Admin.tsx avec graphiques

**Layout 3 zones :**

**Zone 1 — Cards KPI** (SimpleGrid cols={4}) :
- MRR actuel (grand nombre + variation vs mois dernier)
- Abonnés actifs
- Taux d'activation (% pending → active)
- Churn rate mensuel

**Zone 2 — Graphiques** (SimpleGrid cols={2}) :
- LineChart MRR 12 mois (Recharts, couleur accent)
- LineChart Inscriptions vs Paiements 30j (2 lignes superposées)
- BarChart Candidatures créées 30j
- Funnel visuel : Total → Pending → Active → Cancelled (PieChart ou BarChart horizontal)

**Zone 3 — Gestion users**
Table Mantine avec :
- Email + nom
- Badge statut (pending=orange, active=vert, cancelled=rouge)
- Candidatures
- Inscrit le / Payé le
- Actions : Activer manuellement (si pending), Révoquer (si active)

Actions globales :
- Export CSV
- Recalculer probité

Recharts config :
```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts'
```

Utiliser les CSS variables du thème Mantine :
```tsx
const accentColor = 'var(--mantine-color-blue-6)'
const successColor = 'var(--mantine-color-green-6)'
```

```
✨ feat(admin): real dashboard with recharts - mrr, funnel, growth
```

---

## VÉRIFICATION

```bash
# Backend
pytest tests/ -v

# Frontend
cd frontend && npm run build

# Manuel
# 1. Créer un nouveau compte → redirect /app/checkout
# 2. Payer (Stripe test card 4242 4242 4242 4242) → redirect /app
# 3. Se connecter en admin → /app/admin
# 4. Vérifier :
#    - MRR affiché avec vraie valeur
#    - Graphique MRR 12 mois visible
#    - Graphique inscriptions 30j visible
#    - Funnel visuel présent
#    - Export CSV fonctionnel
```

PR → dev

---

## ⚠️ ATTENTION — Migration des comptes existants

Les comptes actuels avec `plan="starter"` doivent être migrés.
Option recommandée : les passer à `subscription_status="pending"` et leur envoyer un email
via Resend pour leur demander de s'abonner.

Migration SQL :
```sql
UPDATE profiles SET subscription_status = 'pending' WHERE plan = 'starter';
UPDATE profiles SET subscription_status = 'active' WHERE plan = 'pro';
```

Cette migration est dans le fichier Alembic généré automatiquement.

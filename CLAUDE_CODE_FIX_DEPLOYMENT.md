Tu dois régler trois problèmes sur OfferTrail :
1. Railway sert les anciennes vues HTML/Jinja2 au lieu de déléguer au frontend React
2. Le backoffice admin est absent
3. La configuration Stripe et Vercel manque dans le code

Lis src/main.py, src/routers/, frontend/src/App.tsx et frontend/src/pages/
intégralement avant de toucher quoi que ce soit.

---

## COMMIT 1 — Supprimer les vues HTML legacy de FastAPI

### Diagnostic
Railway sert des templates Jinja2 (vieilles vues HTML en anglais).
FastAPI ne doit plus servir de HTML — seulement des réponses JSON.
Le frontend React sur Vercel gère tout le HTML.

### Ce que tu dois faire

Lis src/main.py. Chercher :
- `Jinja2Templates` ou `templates.TemplateResponse`
- `StaticFiles` monté sur "/"
- `HTMLResponse`
- N'importe quel endpoint qui retourne du HTML

Pour chaque occurrence :
- Si c'est un endpoint qui retourne une page HTML → le supprimer
- Si c'est le montage des StaticFiles → le supprimer
- Si c'est Jinja2Templates → supprimer l'import et la variable

Lis src/routers/. Chercher tous les fichiers qui importent ou utilisent :
- `HTMLResponse`
- `Jinja2Templates`
- `TemplateResponse`
- `templates.`

Supprimer ces endpoints ou les remplacer par une réponse JSON équivalente.

Le seul endpoint HTML autorisé : `GET /health` qui retourne `{"status": "ok"}` en JSON.

Supprimer de requirements.txt si Jinja2 n'est plus utilisé nulle part :
- `jinja2`

Supprimer le dossier `src/templates/` s'il existe.
Supprimer le dossier `src/static/` s'il existe (le front React sera sur Vercel).

**Vérification** : après cette étape, `grep -r "HTMLResponse\|Jinja2\|TemplateResponse" src/`
doit retourner 0 résultats.

```bash
git add .
git commit -m "fix: remove legacy jinja2 html views - fastapi serves json only"
```

---

## COMMIT 2 — Backoffice admin complet

Lis src/models.py. Vérifier que le modèle Profile (ou User) a un champ `role`.
S'il est absent, l'ajouter :
```python
role = Column(String, default="user")  # user | admin
```

Lis src/auth.py. Vérifier que `get_admin_user` ou `get_admin_profile` existe.
S'il est absent, l'ajouter :
```python
def get_admin_profile(profile = Depends(get_current_profile)) -> Profile:
    if profile.role != "admin":
        raise HTTPException(status_code=403, detail="Accès admin requis")
    return profile
```

Vérifier si src/routers/admin.py existe.
S'il est absent, le créer avec :

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.auth import get_admin_profile
from src.models import Profile, Candidature

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
def global_stats(
    db: Session = Depends(get_db),
    _=Depends(get_admin_profile),
):
    total_users    = db.query(Profile).count()
    pro_users      = db.query(Profile).filter(Profile.plan == "pro").count()
    essential_users = db.query(Profile).filter(Profile.plan == "essential").count()
    starter_users  = total_users - pro_users - essential_users
    total_cands    = db.query(Candidature).count()
    mrr            = round(pro_users * 14.99 + essential_users * 9.99, 2)

    return {
        "total_users":     total_users,
        "pro_users":       pro_users,
        "essential_users": essential_users,
        "starter_users":   starter_users,
        "total_candidatures": total_cands,
        "mrr_estimate":    mrr,
    }


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    _=Depends(get_admin_profile),
):
    profiles = db.query(Profile).order_by(Profile.created_at.desc()).all()
    result = []
    for p in profiles:
        nb_cands = db.query(Candidature).filter(
            Candidature.user_id == p.id
        ).count()
        result.append({
            "id":             p.id,
            "email":          getattr(p, "email", None),
            "prenom":         p.prenom,
            "nom":            p.nom,
            "plan":           p.plan,
            "role":           p.role,
            "is_active":      p.is_active,
            "nb_candidatures": nb_cands,
            "created_at":     p.created_at.isoformat() if p.created_at else None,
            "plan_started_at": p.plan_started_at.isoformat() if p.plan_started_at else None,
        })
    return result


@router.patch("/users/{user_id}/plan")
def update_plan(
    user_id: str,
    body: dict,
    db: Session = Depends(get_db),
    admin=Depends(get_admin_profile),
):
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    new_plan = body.get("plan")
    if new_plan not in ("starter", "essential", "pro"):
        raise HTTPException(status_code=400, detail="Plan invalide")

    from src.services.subscription import activate_plan
    activate_plan(db, profile, new_plan)
    return {"id": profile.id, "plan": profile.plan}


@router.patch("/users/{user_id}/toggle-active")
def toggle_active(
    user_id: str,
    db: Session = Depends(get_db),
    admin=Depends(get_admin_profile),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Impossible de se désactiver soi-même")
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    profile.is_active = not profile.is_active
    db.commit()
    return {"id": profile.id, "is_active": profile.is_active}


@router.post("/recompute-probite")
def recompute(
    db: Session = Depends(get_db),
    _=Depends(get_admin_profile),
):
    from src.services.probite import recompute_probite_scores
    updated = recompute_probite_scores(db)
    return {"updated": updated}
```

Brancher dans src/main.py si absent :
```python
from src.routers.admin import router as admin_router
app.include_router(admin_router)
```

### Page Admin frontend

Vérifier si frontend/src/pages/Admin.tsx existe.
S'il est absent, le créer :

```tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../api'
import { useAuth } from '../context/AuthContext'

export const Admin: React.FC = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Administration — OfferTrail'
    Promise.all([
      axiosInstance.get('/admin/stats'),
      axiosInstance.get('/admin/users'),
    ])
      .then(([statsRes, usersRes]) => {
        setStats(statsRes.data)
        setUsers(usersRes.data)
      })
      .catch(err => {
        if (err.response?.status === 403) {
          navigate('/app')
        } else {
          setError('Erreur de chargement')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const updatePlan = async (userId: string, plan: string) => {
    await axiosInstance.patch(`/admin/users/${userId}/plan`, { plan })
    const res = await axiosInstance.get('/admin/users')
    setUsers(res.data)
  }

  const toggleActive = async (userId: string) => {
    await axiosInstance.patch(`/admin/users/${userId}/toggle-active`)
    const res = await axiosInstance.get('/admin/users')
    setUsers(res.data)
  }

  if (loading) return <div style={{ padding: '2rem', color: 'var(--color-text-secondary)' }}>Chargement...</div>
  if (error) return <div style={{ padding: '2rem', color: 'var(--color-text-danger)' }}>{error}</div>

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--color-text-tertiary)', margin: '0 0 4px' }}>Administration</p>
      <h1 style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 2rem' }}>Tableau de bord admin</h1>

      {/* KPIs */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '2rem' }}>
          {[
            { label: 'Users total', value: stats.total_users },
            { label: 'Pro (14,99€)', value: stats.pro_users },
            { label: 'Essential (9,99€)', value: stats.essential_users },
            { label: 'Starter', value: stats.starter_users },
            { label: 'MRR estimé', value: `${stats.mrr_estimate}€` },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '.75rem 1rem' }}>
              <p style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 2px' }}>{kpi.value}</p>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>{kpi.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tableau users */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              {['Email', 'Plan', 'Candidatures', 'Inscrit le', 'Actif', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 500, fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>{u.email || u.id.slice(0, 8)}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    display: 'inline-block', fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '99px',
                    background: u.plan === 'pro' ? 'var(--color-background-success)' : u.plan === 'essential' ? 'var(--color-background-info)' : 'var(--color-background-secondary)',
                    color: u.plan === 'pro' ? 'var(--color-text-success)' : u.plan === 'essential' ? 'var(--color-text-info)' : 'var(--color-text-secondary)',
                  }}>{u.plan}</span>
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>{u.nb_candidatures}</td>
                <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ color: u.is_active ? 'var(--color-text-success)' : 'var(--color-text-danger)' }}>
                    {u.is_active ? 'Oui' : 'Non'}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {u.plan !== 'pro' && (
                      <button onClick={() => updatePlan(u.id, 'pro')} style={{ fontSize: '11px', padding: '3px 8px', cursor: 'pointer' }}>→ Pro</button>
                    )}
                    {u.plan !== 'essential' && (
                      <button onClick={() => updatePlan(u.id, 'essential')} style={{ fontSize: '11px', padding: '3px 8px', cursor: 'pointer' }}>→ Essential</button>
                    )}
                    {u.plan !== 'starter' && (
                      <button onClick={() => updatePlan(u.id, 'starter')} style={{ fontSize: '11px', padding: '3px 8px', cursor: 'pointer' }}>→ Starter</button>
                    )}
                    <button onClick={() => toggleActive(u.id)} style={{ fontSize: '11px', padding: '3px 8px', cursor: 'pointer', color: u.is_active ? 'var(--color-text-danger)' : 'var(--color-text-success)' }}>
                      {u.is_active ? 'Désactiver' : 'Réactiver'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

Ajouter la route dans App.tsx si absente :
```tsx
<Route path="admin" element={<Admin />} />
```

Ajouter dans le dropdown navbar si absent :
```tsx
{profile?.role === 'admin' && (
  <Link to="/app/admin" className="app-dropdownItem" onClick={() => setDropdownOpen(false)}>
    Administration
  </Link>
)}
```

```bash
git add src/ frontend/src/
git commit -m "feat: admin backoffice - stats, user list, plan management"
```

---

## COMMIT 3 — Configuration Stripe dans le code

Vérifier src/services/stripe_service.py. S'il est absent → le créer.
S'il existe → vérifier qu'il utilise os.getenv pour toutes les clés.

Vérifier src/routers/subscription.py.
L'endpoint POST /subscription/checkout doit :
- Si STRIPE_SECRET_KEY absent → upgrade simulé direct
- Si présent → create_checkout_session() → retourner checkout_url

L'endpoint POST /subscription/webhook doit :
- Lire Stripe-Signature header
- Vérifier avec verify_webhook_signature()
- checkout.session.completed → activate_pro()
- customer.subscription.deleted → downgrade

Vérifier frontend/src/api.ts.
Ajouter si absent :
```typescript
export const subscriptionService = {
  getMe: async () => {
    const res = await axiosInstance.get('/subscription/me')
    return res.data
  },
  checkout: async () => {
    const res = await axiosInstance.post('/subscription/checkout')
    return res.data
  },
}
```

Vérifier frontend/src/pages/Pricing.tsx.
Le bouton upgrade doit appeler subscriptionService.checkout() :
```typescript
const handleCheckout = async () => {
  setLoading(true)
  try {
    const data = await subscriptionService.checkout()
    if (data.checkout_url) {
      window.location.href = data.checkout_url  // redirect Stripe
    } else {
      // mode simulé local
      const sub = await subscriptionService.getMe()
      setSub(sub)
    }
  } catch (e) {
    setError('Erreur paiement')
  } finally {
    setLoading(false)
  }
}
```

Sur frontend/src/pages/MonCompte.tsx — détecter retour Stripe :
```typescript
const [params] = useSearchParams()
useEffect(() => {
  if (params.get('payment') === 'success') {
    subscriptionService.getMe().then(setSub)
  }
}, [])
```

```bash
git add src/ frontend/src/
git commit -m "feat: stripe checkout and webhook wired up"
```

---

## COMMIT 4 — Vercel config et variables d'env

Vérifier frontend/vercel.json. Le créer si absent :
```json
{
  "rewrites": [
    { "source": "/app/(.*)", "destination": "/index.html" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Vérifier frontend/.env.example. Le créer si absent :
```
VITE_API_URL=https://web-production-06b5d8.up.railway.app
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PK=pk_test_...
```

Vérifier frontend/src/api.ts :
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
```

Lancer le build pour vérifier :
```bash
cd frontend && npm run build
```

Corriger toutes les erreurs TypeScript bloquantes (pas les warnings).

```bash
git add frontend/
git commit -m "feat: vercel config and env variables for production"
```

---

## COMMIT 5 — Purge pages legacy frontend

Chercher dans frontend/src/pages/ les fichiers qui :
- Utilisent encore des appels vers /api/applications, /api/organizations
- Contiennent des composants HTML legacy non utilisés
- Sont des doublons de pages déjà migrées

```bash
grep -r "api/applications\|api/organizations\|api/contacts\|api/dashboard" frontend/src/
```

Pour chaque fichier trouvé :
- Si la page a un équivalent migré → supprimer l'ancienne
- Si la page est encore utilisée → corriger les URLs vers les nouveaux endpoints

Vérifier App.tsx — toutes les routes importent des pages qui existent réellement.
Supprimer les imports de pages supprimées.

```bash
git add frontend/src/
git commit -m "chore: remove legacy pages and fix remaining api/... routes"
```

---

## VÉRIFICATION FINALE

```bash
# Aucune vue HTML dans FastAPI
grep -r "HTMLResponse\|Jinja2\|TemplateResponse\|templates\." src/ | grep -v ".pyc"

# Aucune route legacy dans le frontend  
grep -r '"/api/' frontend/src/
grep -r "'/api/" frontend/src/

# Build propre
cd frontend && npm run build && cd ..

# Tests backend
pytest tests/ -v

# Push
git push origin feat/fix-deployment-backoffice-stripe
```

**PR title :** `fix: remove legacy html views + admin backoffice + stripe + vercel`
**Target :** `dev`
**Branche :** `feat/fix-deployment-backoffice-stripe`

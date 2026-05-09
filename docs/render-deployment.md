# Déploiement Backend — Render

## Prérequis

- Compte [Render](https://render.com)
- Repo GitHub connecté à Render
- Base de données Supabase active (PostgreSQL)
- Compte Stripe avec produit et prix configurés

---

## 1. Créer le Web Service

1. Dashboard Render → **New → Web Service**
2. Connecter le repo `darkiron/offertrail`
3. Render détecte automatiquement `render.yaml` — **laisser Render l'utiliser**

Si config manuelle :

| Champ | Valeur |
|---|---|
| Runtime | Python 3 |
| Region | Frankfurt (EU) |
| Branch | `main` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `alembic upgrade head && uvicorn src.main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/health` |

---

## 2. Variables d'environnement

À configurer dans **Environment → Environment Variables** :

### Base de données

| Variable | Valeur | Source |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` | Supabase → Settings → Database → **Connection string** (mode `Session`, port **5432**) |

> **Important** : utiliser la connexion directe port **5432** (pas le pooler port 6543).
> Alembic a besoin d'une connexion persistante pour les migrations.

### Supabase Auth

| Variable | Source |
|---|---|
| `SUPABASE_JWT_SECRET` | Dashboard → Settings → API → JWT Settings → **JWT Secret** |
| `SUPABASE_URL` | Dashboard → Settings → API → **Project URL** |
| `SUPABASE_SERVICE_KEY` | Dashboard → Settings → API → **service_role** (secret) |

### Stripe

| Variable | Source |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → **Secret key** (`sk_live_...`) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys → **Publishable key** (`pk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Voir section Webhooks ci-dessous |
| `STRIPE_PRICE_ID` | Stripe Dashboard → Products → Plan Pro → **ID du prix** (`price_...`) |
| `ENABLE_STRIPE_CHECKOUT` | `1` |

### Email

| Variable | Source |
|---|---|
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |

### CORS & redirects

| Variable | Valeur |
|---|---|
| `ALLOWED_ORIGINS` | `https://offertrail.fr,https://www.offertrail.fr` |
| `ALLOWED_ORIGIN_REGEX` | `^https://(([a-z0-9-]+\.)?offertrail\.fr\|offertrail\.craftcodes\.fr)$` |
| `APP_BASE_URL` | `https://offertrail.fr` |

---

## 3. Webhook Stripe

1. Stripe Dashboard → Developers → **Webhooks → Add endpoint**
2. URL : `https://<nom-du-service>.onrender.com/subscription/webhook`
3. Événements à écouter :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copier le **Signing secret** (`whsec_...`) → variable `STRIPE_WEBHOOK_SECRET`

---

## 4. Domaine custom (optionnel)

1. Render → Service → **Settings → Custom Domains → Add Custom Domain**
2. Ajouter `api.offertrail.fr`
3. Render fournit un enregistrement CNAME → ajouter chez le registrar
4. Mettre à jour `ALLOWED_ORIGINS` et `APP_BASE_URL` si besoin

---

## 5. Vérification post-déploiement

```bash
# Health check
curl https://<service>.onrender.com/health
# → {"status": "ok", "version": "0.1.0"}

# CORS
curl -I -H "Origin: https://offertrail.fr" https://<service>.onrender.com/health
# → Access-Control-Allow-Origin: https://offertrail.fr
```

---

## Différences Railway → Render

| | Railway | Render |
|---|---|---|
| Config IaC | `railway.toml` | `render.yaml` |
| URL PostgreSQL | `DATABASE_URL` (pooler) + `DATABASE_DIRECT_URL` (direct) | `DATABASE_URL` uniquement (connexion directe) |
| Migrations | `DATABASE_URL=$DATABASE_DIRECT_URL alembic upgrade head` | `alembic upgrade head` |
| Builder | nixpacks | buildpack Python natif |
| Région EU | Europe West | Frankfurt |

> `alembic/env.py` gère déjà le fallback `DATABASE_DIRECT_URL → DATABASE_URL`.
> Sur Render, `DATABASE_URL` est toujours direct — aucune adaptation code nécessaire.

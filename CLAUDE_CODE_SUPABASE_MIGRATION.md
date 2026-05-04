Tu dois créer et implémenter la branche feat/supabase-migration depuis dev.

## AVANT DE COMMENCER

```bash
# Vérifier qu'on est sur dev à jour
git checkout dev
git pull origin dev

# Créer la branche
git checkout -b feat/supabase-migration
```

## ÉTAPE 0 — LIS D'ABORD

Lis dans cet ordre AVANT d'écrire une seule ligne :
1. requirements.txt → dépendances actuelles
2. src/database.py → configuration engine SQLAlchemy
3. src/models.py → tous les modèles et relations
4. src/main.py → startup, middleware, routers branchés
5. src/auth.py → SECRET_KEY et dépendances
6. src/routers/subscription.py → logique paiement actuelle
7. Procfile → si existe
8. .env.example → si existe

Produis mentalement un diagnostic avant d'écrire quoi que ce soit.

---

## COMMIT 1 — requirements.txt complet

Remplace le contenu de requirements.txt par :

```
fastapi==0.115.0
uvicorn==0.30.6
sqlalchemy==2.0.35
psycopg2-binary==2.9.9
alembic==1.13.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
apscheduler==3.10.4
resend==0.7.2
slowapi==0.1.9
stripe==8.0.0
pytest==8.0.0
pytest-asyncio==0.23.6
httpx==0.26.0
pytest-cov==4.1.0
```

Ne pas supprimer de dépendances qui seraient dans le fichier actuel et absentes de cette liste.
Fusionner les deux — garder tout.

```bash
git add requirements.txt
git commit -m "chore: update requirements - add psycopg2, alembic, stripe, slowapi"
```

---

## COMMIT 2 — src/database.py : compatible SQLite ET PostgreSQL

Lis src/database.py.
Le paramètre `connect_args={"check_same_thread": False}` plante sur PostgreSQL.
Corriger pour détecter automatiquement le driver :

```python
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.models import Base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./offertrail.db")

# check_same_thread est SQLite uniquement
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Utilisé uniquement pour les tests (BDD en mémoire). Ne pas appeler en production."""
    Base.metadata.create_all(bind=engine)
```

```bash
git add src/database.py
git commit -m "fix: database engine compatible with sqlite and postgresql"
```

---

## COMMIT 3 — Alembic setup

Vérifier si un dossier `alembic/` existe déjà à la racine.
S'il n'existe pas :

```bash
alembic init alembic
```

Ensuite, mettre à jour `alembic/env.py` :
Trouver la ligne `target_metadata = None` et la remplacer par :

```python
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.models import Base
from dotenv import load_dotenv
load_dotenv()

target_metadata = Base.metadata

# Lire DATABASE_URL depuis l'env
config.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL", "sqlite:///./offertrail.db"))
```

Dans `alembic.ini`, trouver la ligne `sqlalchemy.url` et la commenter :
```ini
# sqlalchemy.url = driver://user:pass@localhost/dbname
```
(elle sera lue depuis l'env dans env.py)

Créer la première migration depuis les modèles existants :
```bash
alembic revision --autogenerate -m "initial saas schema"
```

Vérifier que le fichier de migration généré dans `alembic/versions/` contient bien
les tables : users, candidatures, etablissements, succursales, contacts,
candidature_events, relances, contact_interactions, probite_scores, password_reset_tokens.

Si une table manque → vérifier l'import dans env.py.

```bash
git add alembic/ alembic.ini
git commit -m "feat: alembic migrations setup for postgresql"
```

---

## COMMIT 4 — Procfile et railway.toml

Vérifier si Procfile existe à la racine.
Le créer ou le mettre à jour :

```
web: alembic upgrade head && uvicorn src.main:app --host 0.0.0.0 --port $PORT
```

Vérifier si railway.toml existe à la racine.
Le créer ou le mettre à jour :

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "alembic upgrade head && uvicorn src.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
```

```bash
git add Procfile railway.toml
git commit -m "feat: procfile with alembic migration on startup"
```

---

## COMMIT 5 — Variables d'env sécurisées

Lis src/auth.py.
Trouver SECRET_KEY. Si elle a un fallback "changeme-..." :

```python
# AVANT (dangereux)
SECRET_KEY = os.getenv("SECRET_KEY", "changeme-avant-prod-utiliser-secrets-python")

# APRÈS (sécurisé)
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY manquante dans les variables d'environnement")
```

Faire pareil pour toutes les variables critiques dans src/ :
chercher `os.getenv` avec fallback "changeme" ou valeur hardcodée sensible.

Mettre à jour ou créer `.env.example` à la racine :

```
# Base de données
DATABASE_URL=sqlite:///./offertrail.db

# Auth - OBLIGATOIRE - générer avec: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=

# Supabase (optionnel en local, obligatoire en prod)
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# Stripe (optionnel en local)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=

# Email Resend (optionnel en local)
RESEND_API_KEY=

# CORS - séparer par virgule
ALLOWED_ORIGINS=http://localhost:5173

# URL de l'app (pour les redirects Stripe)
APP_BASE_URL=http://localhost:5173
```

Vérifier que `.env` est bien dans `.gitignore` (il l'est déjà d'après ce qu'on voit).

```bash
git add src/auth.py .env.example
git commit -m "fix: remove hardcoded secret fallbacks, add env example"
```

---

## COMMIT 6 — Service Stripe (remplace Mollie)

Créer `src/services/stripe_service.py` :

```python
import os
import stripe

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

STRIPE_PRICE_ID       = os.getenv("STRIPE_PRICE_ID", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
APP_BASE_URL          = os.getenv("APP_BASE_URL", "http://localhost:5173")


def create_checkout_session(user_id: str, user_email: str) -> str:
    """
    Crée une session Stripe Checkout et retourne l'URL de paiement.
    Mode abonnement mensuel à 9,99€.
    """
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{"price": STRIPE_PRICE_ID, "quantity": 1}],
        mode="subscription",
        customer_email=user_email,
        success_url=f"{APP_BASE_URL}/app/mon-compte?payment=success",
        cancel_url=f"{APP_BASE_URL}/app/mon-compte?payment=cancelled",
        metadata={"user_id": user_id},
    )
    return session.url


def verify_webhook_signature(payload: bytes, sig_header: str) -> stripe.Event:
    """
    Vérifie la signature Stripe du webhook.
    Lève stripe.error.SignatureVerificationError si invalide.
    """
    return stripe.Webhook.construct_event(
        payload, sig_header, STRIPE_WEBHOOK_SECRET
    )


def is_configured() -> bool:
    """Vérifie si Stripe est configuré (clé API présente)."""
    return bool(os.getenv("STRIPE_SECRET_KEY"))
```

Si un fichier `src/services/mollie.py` existe → le supprimer.

Lis `src/routers/subscription.py`.
Remplacer la logique Mollie par Stripe :

```python
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from src.auth import get_current_user, get_db
from src.models import User
from src.services.subscription import get_usage, activate_pro, _downgrade_to_starter
from src.services.stripe_service import (
    create_checkout_session, verify_webhook_signature, is_configured
)

router = APIRouter(prefix="/subscription", tags=["subscription"])


@router.get("/me")
def get_my_subscription(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return get_usage(db, user)


@router.post("/checkout")
def create_checkout(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    En local sans Stripe → simule l'upgrade directement.
    En prod avec Stripe configuré → retourne l'URL de checkout.
    """
    if not is_configured():
        activate_pro(db, user)
        return {
            "mode": "simulated",
            "checkout_url": None,
            "message": "Upgrade simulé — Stripe non configuré"
        }

    checkout_url = create_checkout_session(user.id, user.email)
    return {
        "mode": "stripe",
        "checkout_url": checkout_url,
    }


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Reçoit les événements Stripe.
    NE PAS authentifier cet endpoint — Stripe n'envoie pas de token.
    Vérifier la signature avec le webhook secret.
    """
    payload    = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = verify_webhook_signature(payload, sig_header)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Signature webhook invalide")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("metadata", {}).get("user_id")
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                activate_pro(db, user)

    elif event["type"] == "customer.subscription.deleted":
        # Abonnement annulé ou paiement échoué → downgrade
        subscription = event["data"]["object"]
        customer_email = subscription.get("customer_email")
        if customer_email:
            user = db.query(User).filter(User.email == customer_email).first()
            if user:
                _downgrade_to_starter(db, user)

    return {"status": "ok"}
```

```bash
git add src/services/stripe_service.py src/routers/subscription.py
git commit -m "feat: stripe payment - checkout session and webhook handler"
```

---

## COMMIT 7 — Script migration SQLite → Supabase

Créer `scripts/migrate_sqlite_to_supabase.py` :

```python
"""
Migration des données locales SQLite vers Supabase PostgreSQL.
Lancer une seule fois après avoir configuré DATABASE_URL PostgreSQL dans .env.

Usage:
  DATABASE_URL=postgresql://... python scripts/migrate_sqlite_to_supabase.py
"""
import os
import sqlite3
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

SQLITE_PATH  = "offertrail.db"
POSTGRES_URL = os.getenv("DATABASE_URL")

if not POSTGRES_URL or POSTGRES_URL.startswith("sqlite"):
    raise SystemExit("Définir DATABASE_URL avec une URL PostgreSQL Supabase dans .env")

print(f"Source : {SQLITE_PATH}")
print(f"Destination : {POSTGRES_URL[:40]}...")

# Connexion SQLite source
sqlite_conn = sqlite3.connect(SQLITE_PATH)
sqlite_conn.row_factory = sqlite3.Row

# Connexion PostgreSQL destination
pg_engine  = create_engine(POSTGRES_URL)
PgSession  = sessionmaker(bind=pg_engine)
pg_session = PgSession()

# Tables dans l'ordre (respect des foreign keys)
TABLES = [
    "users",
    "etablissements",
    "succursales",
    "contacts",
    "password_reset_tokens",
    "candidatures",
    "candidature_events",
    "relances",
    "contact_interactions",
    "probite_scores",
]

total_migrated = 0

for table in TABLES:
    try:
        rows = sqlite_conn.execute(f"SELECT * FROM {table}").fetchall()
    except Exception as e:
        print(f"  {table}: ignorée ({e})")
        continue

    if not rows:
        print(f"  {table}: 0 lignes (ignorée)")
        continue

    columns = rows[0].keys()
    col_names = ", ".join(columns)
    placeholders = ", ".join([f":{c}" for c in columns])

    inserted = 0
    skipped  = 0

    for row in rows:
        try:
            pg_session.execute(
                text(f"""
                    INSERT INTO {table} ({col_names})
                    VALUES ({placeholders})
                    ON CONFLICT DO NOTHING
                """),
                dict(row)
            )
            inserted += 1
        except Exception:
            skipped += 1

    pg_session.commit()
    print(f"  {table}: {inserted} insérées, {skipped} ignorées")
    total_migrated += inserted

sqlite_conn.close()
pg_session.close()

print(f"\n✅ Migration terminée — {total_migrated} lignes migrées")
```

```bash
git add scripts/migrate_sqlite_to_supabase.py
git commit -m "feat: sqlite to supabase migration script"
```

---

## COMMIT 8 — Mise à jour Makefile

Lis le Makefile actuel. Ajouter ces cibles si absentes :

```makefile
migrate-prod:
	$(PYTHON) scripts/migrate_sqlite_to_supabase.py

alembic-migrate:
	alembic upgrade head

alembic-revision:
	alembic revision --autogenerate -m "$(msg)"

db-shell:
	$(PYTHON) -c "from src.database import engine; print(engine.url)"
```

```bash
git add Makefile
git commit -m "chore: makefile - add alembic and migration targets"
```

---

## VÉRIFICATION FINALE

```bash
# Tests avec SQLite local (pas besoin de Supabase)
DATABASE_URL=sqlite:///./offertrail.db pytest tests/ -v

# Build frontend
cd frontend && npm run build && cd ..

# Vérifier qu'Alembic peut lire les modèles
alembic check

# Vérifier que l'app démarre
make run
```

Si les tests passent et que l'app démarre :

```bash
# Pusher la branche
git push origin feat/supabase-migration

# Créer la PR
# Title : feat: supabase postgresql + alembic + stripe payment
# Target : dev
```

---

## PR DESCRIPTION À COPIER

```
## feat: Supabase PostgreSQL + Alembic + Stripe

### Ce qui change
- requirements.txt complet avec toutes les dépendances prod
- database.py compatible SQLite (dev) et PostgreSQL (prod)
- Alembic setup pour les migrations en production
- Procfile : alembic upgrade head avant uvicorn
- SECRET_KEY sans fallback hardcodé
- Stripe remplace Mollie (gratuit, sans abonnement mensuel)
- Webhook Stripe vérifié par signature
- Script de migration SQLite → Supabase

### Comment tester
1. make run → app fonctionne avec SQLite
2. pytest tests/ → tous verts
3. npm run build → build sans erreur

### Variables d'env requises en prod
Voir .env.example
```

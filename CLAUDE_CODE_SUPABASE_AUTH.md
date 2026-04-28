Tu dois migrer l'authentification de FastAPI maison vers Supabase Auth.
Lis intégralement src/ et frontend/src/ avant de toucher quoi que ce soit.

## CE QUI CHANGE

AVANT : FastAPI gère register/login/JWT/passwords avec passlib + python-jose
APRÈS : Supabase Auth gère tout ça. FastAPI vérifie juste le JWT Supabase.

Les abonnements (plan Pro/Starter) vivent dans une table `profiles`
liée à auth.users via user_id.

---

## ÉTAPE 0 — SQL À EXÉCUTER SUR SUPABASE D'ABORD

Avant de toucher au code, exécuter ce SQL dans Supabase SQL Editor :

```sql
-- Table profiles : données utilisateur liées à auth.users
-- Remplace la table users SQLAlchemy
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  prenom          TEXT,
  nom             TEXT,
  plan            TEXT NOT NULL DEFAULT 'starter',  -- starter | pro
  role            TEXT NOT NULL DEFAULT 'user',      -- user | admin
  plan_started_at TIMESTAMPTZ,
  plan_expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Créer automatiquement un profil à chaque inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, prenom, nom)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'prenom',
    NEW.raw_user_meta_data->>'nom'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS sur profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Un user voit et modifie uniquement son propre profil
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

Ce SQL crée :
- La table `profiles` liée à `auth.users`
- Un trigger qui crée automatiquement le profil à l'inscription
- Les RLS policies

---

## COMMIT 1 — Modèle Profile dans SQLAlchemy

Dans `src/models.py` :

1. Supprimer entièrement le modèle `User` existant
2. Supprimer le modèle `PasswordResetToken` (géré par Supabase Auth)
3. Ajouter le modèle `Profile` :

```python
class Profile(Base):
    __tablename__ = "profiles"

    id                     = Column(String, primary_key=True)  # = auth.users.id (UUID Supabase)
    prenom                 = Column(String)
    nom                    = Column(String)
    plan                   = Column(String, default="starter")  # starter | pro
    role                   = Column(String, default="user")      # user | admin
    plan_started_at        = Column(DateTime, nullable=True)
    plan_expires_at        = Column(DateTime, nullable=True)
    stripe_customer_id     = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    is_active              = Column(Boolean, default=True)
    created_at             = Column(DateTime, default=now)
    updated_at             = Column(DateTime, default=now, onupdate=now)
```

4. Remplacer toutes les références à `User` par `Profile` dans les autres modèles :
   - `Candidature.user_id` → garde le Column mais la FK pointe vers profiles.id
   - `CandidatureEvent.user_id` → idem
   - `Relance.user_id` → idem
   - `Contact.created_by` → idem
   - `Etablissement.created_by` → idem
   - `ContactInteraction.user_id` → idem

5. Supprimer les relations `user = relationship("User", ...)` dans tous les modèles
   (Supabase Auth gère les users, pas SQLAlchemy)

```bash
git add src/models.py
git commit -m "feat: replace User model with Profile linked to supabase auth"
```

---

## COMMIT 2 — src/auth.py : vérification JWT Supabase

Remplacer entièrement `src/auth.py`.

La logique change complètement :
- AVANT : on décode notre propre JWT signé avec SECRET_KEY
- APRÈS : on vérifie le JWT Supabase signé avec leur clé publique JWT

```python
"""
OfferTrail — Auth via Supabase JWT
FastAPI vérifie le token émis par Supabase Auth.
Plus de gestion de passwords ni de register côté backend.
"""
import os
from functools import lru_cache

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from src.database import get_db, SessionLocal
from src.models import Profile
from apscheduler.schedulers.background import BackgroundScheduler

SUPABASE_URL     = os.getenv("SUPABASE_URL", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
# SUPABASE_JWT_SECRET se trouve dans :
# Supabase Dashboard → Settings → API → JWT Settings → JWT Secret

bearer_scheme = HTTPBearer()


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    """
    Vérifie le JWT Supabase et retourne le user_id (sub).
    C'est le seul point d'entrée auth pour tous les endpoints privés.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},  # Supabase n'impose pas l'audience
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide")
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_profile(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Profile:
    """
    Retourne le profil complet du user connecté.
    Crée le profil automatiquement s'il n'existe pas
    (cas où le trigger Supabase n'aurait pas encore tourné).
    """
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        # Créer le profil à la volée si absent
        profile = Profile(id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    if not profile.is_active:
        raise HTTPException(status_code=403, detail="Compte désactivé")
    return profile


def get_admin_profile(
    profile: Profile = Depends(get_current_profile),
) -> Profile:
    """Réservé aux admins."""
    if profile.role != "admin":
        raise HTTPException(status_code=403, detail="Accès admin requis")
    return profile


# ── Scheduler APScheduler (probité) ────────────────────────────────
scheduler = BackgroundScheduler()


def start_scheduler() -> None:
    if scheduler.running:
        return
    scheduler.add_job(
        func=_run_probite_recompute,
        trigger="interval",
        hours=1,
        id="recompute_probite",
        replace_existing=True,
    )
    scheduler.start()


def _run_probite_recompute() -> None:
    db = SessionLocal()
    try:
        from src.services.probite import recompute_probite_scores
        recompute_probite_scores(db)
    finally:
        db.close()
```

```bash
git add src/auth.py
git commit -m "feat: replace fastapi jwt auth with supabase jwt verification"
```

---

## COMMIT 3 — Supprimer les routers auth FastAPI

Lis `src/routers/auth.py`.

Supprimer ou vider ces endpoints (Supabase Auth les gère maintenant) :
- POST /auth/register
- POST /auth/login
- POST /auth/forgot-password
- POST /auth/reset-password

Garder uniquement :
- GET /auth/me → retourne le profil du user connecté
- PATCH /auth/me → met à jour prenom/nom dans profiles

```python
# src/routers/auth.py — version Supabase
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.auth import get_current_profile, get_db
from src.models import Profile
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/auth", tags=["auth"])


class ProfileUpdate(BaseModel):
    prenom: Optional[str] = None
    nom: Optional[str] = None


class ProfileSchema(BaseModel):
    id: str
    prenom: Optional[str]
    nom: Optional[str]
    plan: str
    role: str
    plan_started_at: Optional[str]
    created_at: Optional[str]

    model_config = {"from_attributes": True}


@router.get("/me", response_model=ProfileSchema)
def get_me(profile: Profile = Depends(get_current_profile)):
    return profile


@router.patch("/me", response_model=ProfileSchema)
def update_me(
    body: ProfileUpdate,
    db: Session = Depends(get_db),
    profile: Profile = Depends(get_current_profile),
):
    if body.prenom is not None:
        profile.prenom = body.prenom
    if body.nom is not None:
        profile.nom = body.nom
    db.commit()
    db.refresh(profile)
    return profile
```

```bash
git add src/routers/auth.py
git commit -m "feat: simplify auth router - only /me endpoints, supabase handles register/login"
```

---

## COMMIT 4 — Abonnements liés à Profile

Lis `src/services/subscription.py`.
Remplacer toutes les références à `User` par `Profile` :

```python
from src.models import Profile, Candidature

CANDIDATURES_MAX_STARTER = 25


def get_usage(db: Session, profile: Profile) -> dict:
    count = db.query(Candidature).filter(
        Candidature.user_id == profile.id
    ).count()
    is_pro = profile.plan == "pro"
    return {
        "plan":               profile.plan,
        "is_pro":             is_pro,
        "candidatures_count": count,
        "candidatures_max":   0 if is_pro else CANDIDATURES_MAX_STARTER,
        "limite_atteinte":    not is_pro and count >= CANDIDATURES_MAX_STARTER,
        "alerte_80":          not is_pro and count >= CANDIDATURES_MAX_STARTER * 0.8,
        "plan_started_at":    profile.plan_started_at.isoformat() if profile.plan_started_at else None,
    }


def check_can_create(db: Session, profile: Profile) -> None:
    if profile.plan == "pro":
        return
    count = db.query(Candidature).filter(
        Candidature.user_id == profile.id
    ).count()
    if count >= CANDIDATURES_MAX_STARTER:
        raise HTTPException(
            status_code=402,
            detail={
                "code":    "LIMIT_REACHED",
                "message": "Limite de 25 candidatures atteinte. Passez en Pro.",
                "current": count,
                "max":     CANDIDATURES_MAX_STARTER,
            }
        )


def activate_pro(db: Session, profile: Profile) -> None:
    from datetime import datetime
    profile.plan            = "pro"
    profile.plan_started_at = datetime.utcnow()
    profile.plan_expires_at = None
    db.commit()


def _downgrade_to_starter(db: Session, profile: Profile) -> None:
    profile.plan            = "starter"
    profile.plan_expires_at = None
    db.commit()
```

Mettre à jour `src/routers/subscription.py` :
Remplacer `get_current_user` par `get_current_profile` et `User` par `Profile`.

Mettre à jour `src/routers/candidatures.py` :
- Remplacer `get_current_user` par `get_current_profile`
- Remplacer `user: User` par `profile: Profile`
- Remplacer `user.id` par `profile.id`

Mettre à jour `src/routers/admin.py` :
- Remplacer `User` par `Profile` dans toutes les queries
- Remplacer `get_admin_user` par `get_admin_profile`

Faire pareil dans tous les autres routers qui utilisent `User` ou `get_current_user`.

```bash
git add src/
git commit -m "feat: link subscriptions to supabase profiles"
```

---

## COMMIT 5 — Nouvelle migration Alembic

Puisque les modèles ont changé (User → Profile, suppression PasswordResetToken) :

```bash
alembic revision --autogenerate -m "replace user with profile for supabase auth"
```

Vérifier le fichier de migration généré :
- Il doit supprimer la table `users` si elle existe
- Il doit supprimer la table `password_reset_tokens`
- Il doit créer la table `profiles`
- Il ne doit PAS toucher à auth.users (c'est Supabase qui gère)

Si la migration tente de créer `auth.users` → la supprimer manuellement du fichier.

```bash
git add alembic/
git commit -m "feat: alembic migration - profiles table replaces users"
```

---

## COMMIT 6 — Frontend : Supabase Auth SDK

Dans `frontend/` :

```bash
cd frontend && npm install @supabase/supabase-js
```

Créer `frontend/src/lib/supabase.ts` :

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont requis')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Mettre à jour `frontend/src/context/AuthContext.tsx` :

```typescript
import { supabase } from '../lib/supabase'
import { User, Session } from '@supabase/supabase-js'

// Remplacer la logique JWT maison par Supabase Auth
// supabase.auth.signUp({ email, password, options: { data: { prenom, nom } } })
// supabase.auth.signInWithPassword({ email, password })
// supabase.auth.signOut()
// supabase.auth.getSession() → récupère le token JWT pour les appels API
// supabase.auth.onAuthStateChange() → écoute les changements d'auth

// Le token JWT Supabase s'injecte dans axiosInstance :
// session.access_token → Authorization: Bearer <token>
```

Remplacer entièrement AuthContext.tsx :

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import axiosInstance from '../api'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: any | null
  isAuthenticated: boolean
  isLoading: boolean
  signUp: (email: string, password: string, meta?: { prenom?: string; nom?: string }) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Récupère la session au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.access_token) {
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${session.access_token}`
        fetchProfile()
      }
      setIsLoading(false)
    })

    // Écoute les changements d'auth (login, logout, refresh token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.access_token) {
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${session.access_token}`
        fetchProfile()
      } else {
        delete axiosInstance.defaults.headers.common.Authorization
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get('/auth/me')
      setProfile(res.data)
    } catch {
      // profil pas encore créé, ignorer
    }
  }

  const signUp = async (email: string, password: string, meta?: { prenom?: string; nom?: string }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta ?? {} },
    })
    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile,
      isAuthenticated: !!user,
      isLoading,
      signUp, signIn, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

Mettre à jour `frontend/src/pages/Login.tsx` :
- Remplacer `authService.login()` par `signIn()` du context
- Gestion d'erreur : `error.message` de Supabase

Mettre à jour `frontend/src/pages/Register.tsx` :
- Remplacer `authService.register()` par `signUp()` du context
- Après register → Supabase envoie un email de confirmation automatiquement
- Afficher "Vérifie ta boîte email pour confirmer ton inscription"

Mettre à jour `frontend/src/pages/ForgotPassword.tsx` :
- Remplacer l'appel API par `supabase.auth.resetPasswordForEmail(email)`

Mettre à jour `frontend/src/pages/ResetPassword.tsx` :
- Remplacer l'appel API par `supabase.auth.updateUser({ password: newPassword })`

Ajouter dans `frontend/.env.example` :
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=https://api.offertrail.fr
```

```bash
git add frontend/
git commit -m "feat: supabase auth sdk on frontend - signUp/signIn/signOut"
```

---

## COMMIT 7 — Supprimer les dépendances auth obsolètes

Dans `requirements.txt`, supprimer si elles ne sont plus utilisées ailleurs :
- `passlib[bcrypt]` → plus de hash password local
- Garder `python-jose` → toujours utilisé pour décoder le JWT Supabase

Vérifier que `passlib` n'est importé nulle part dans `src/`.
Si des imports subsistent → les supprimer.

```bash
git add requirements.txt src/
git commit -m "chore: remove passlib - password hashing handled by supabase"
```

---

## COMMIT 8 — Variables d'env Supabase

Dans `.env.example`, ajouter :
```
# Supabase Auth
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_JWT_SECRET=       # Settings → API → JWT Settings → JWT Secret
SUPABASE_SERVICE_KEY=      # Settings → API → service_role key
```

Le `SUPABASE_JWT_SECRET` (pas l'anon key) se trouve dans :
Supabase Dashboard → Settings → API → JWT Settings → **JWT Secret**

C'est ce secret qui permet à FastAPI de vérifier les tokens Supabase.

```bash
git add .env.example
git commit -m "docs: add supabase jwt secret to env example"
```

---

## APRÈS TOUS LES COMMITS

```bash
# Tests
pytest tests/ -v

# Build frontend
cd frontend && npm run build && cd ..

# Vérifier que l'app démarre en local (avec SQLite)
DATABASE_URL=sqlite:///./offertrail.db make run

# Push et PR
git push origin feat/supabase-auth
# PR : feat/supabase-auth → dev
```

## PR DESCRIPTION

```
## feat: Supabase Auth + Profiles + Subscriptions

### Ce qui change
- Suppression de l'auth FastAPI maison (register/login/passwords/JWT custom)
- Vérification JWT Supabase dans FastAPI via SUPABASE_JWT_SECRET
- Table `profiles` liée à auth.users avec plan Starter/Pro
- Trigger Supabase crée automatiquement le profil à l'inscription
- Frontend utilise @supabase/supabase-js pour signUp/signIn/signOut
- Reset password géré par Supabase (email automatique)
- Abonnements liés à Profile au lieu de User

### Variables d'env requises
SUPABASE_URL, SUPABASE_JWT_SECRET, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

### À faire avant de merger
1. Exécuter le SQL profiles + trigger sur Supabase
2. Récupérer SUPABASE_JWT_SECRET dans Settings → API → JWT Settings
3. make test → tous verts
```

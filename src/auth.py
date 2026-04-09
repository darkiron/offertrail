"""
OfferTrail - Auth JWT local + dependances FastAPI
Remplace le RLS Supabase en local.
Migration vers Supabase : remplacer verify_token() par la verification du JWT Supabase.
"""
import os
from datetime import datetime, timedelta
from typing import List, Optional

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from src.models import Candidature, Contact, Etablissement, User
from src.services.probite import recompute_probite_scores
from src.database import SessionLocal, get_db

# ============================================================
# CONFIG (a mettre en .env)
# ============================================================
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY manquante dans les variables d'environnement")
ALGORITHM = "HS256"
TOKEN_EXPIRE = 60 * 24 * 7  # 7 jours en minutes

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ============================================================
# UTILITAIRES AUTH
# ============================================================
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str, email: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expire",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


# ============================================================
# DEPENDANCE : utilisateur courant
# Equivalent de auth.uid() dans Supabase RLS
# ============================================================
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token invalide")

    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return user


def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    """
    Decode le JWT et retourne le user_id.
    JAMAIS de fallback, JAMAIS de valeur par defaut.
    Si le token est absent ou invalide -> 401 immediat.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise credentials_exception
        return user_id
    except JWTError as exc:
        raise credentials_exception from exc


def get_admin_user(user: User = Depends(get_current_user)) -> User:
    """Reserve aux admins. 403 pour tous les autres."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Acces reserve aux administrateurs")
    return user


# ============================================================
# DEPENDANCES RLS - Equivalent des policies Supabase
# ============================================================
def own_candidature(
    candidature_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Candidature:
    """
    Equivalent RLS : user_id = auth.uid() sur candidatures.
    Injecte la candidature si elle appartient au user courant, 404 sinon.
    """
    cand = db.query(Candidature).filter(
        Candidature.id == candidature_id,
        Candidature.user_id == user_id,
    ).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidature introuvable")
    return cand


def contact_visible_by_user(
    contact_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Contact:
    """
    Equivalent de la policy contacts_visible_par_contexte.
    Un contact est visible si le user a une candidature dans :
    - la meme succursale
    - le meme ETS
    - un ETS du meme groupe (filiale du meme siege)
    """
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact introuvable")

    if not _user_can_see_contact(db, user_id, contact):
        raise HTTPException(status_code=403, detail="Acces refuse")

    return contact


def _user_can_see_contact(db: Session, user_id: str, contact: Contact) -> bool:
    """
    Logique de visibilite des contacts - miroir exact de la policy RLS Supabase.
    Centralise ici pour etre reutilisable dans les listings et les details.
    """
    user_candidatures = db.query(Candidature).filter(Candidature.user_id == user_id).all()

    user_ets_ids = {c.etablissement_id for c in user_candidatures}
    user_succ_ids = {c.succursale_id for c in user_candidatures if c.succursale_id}

    if contact.succursale_id and contact.succursale_id in user_succ_ids:
        return True

    if contact.etablissement_id and contact.etablissement_id in user_ets_ids:
        return True

    if contact.etablissement_id:
        ets_contact = db.query(Etablissement).filter(
            Etablissement.id == contact.etablissement_id
        ).first()
        if ets_contact and ets_contact.created_by == user_id:
            return True
        if ets_contact and ets_contact.siege_id:
            groupe_ids = {
                e.id
                for e in db.query(Etablissement).filter(
                    Etablissement.siege_id == ets_contact.siege_id
                ).all()
            }
            groupe_ids.add(ets_contact.siege_id)
            if user_ets_ids & groupe_ids:
                return True

    if contact.created_by == user_id:
        return True

    return False


def get_visible_contacts(
    db: Session,
    user_id: str,
    etablissement_id: Optional[str] = None,
    succursale_id: Optional[str] = None,
) -> List[Contact]:
    """
    Retourne tous les contacts visibles pour un user.
    Utilise dans les listings - equivalent du SELECT avec RLS actif.
    """
    user_cands = db.query(Candidature).filter(Candidature.user_id == user_id).all()
    user_ets_ids = {c.etablissement_id for c in user_cands}
    user_succ_ids = {c.succursale_id for c in user_cands if c.succursale_id}
    owned_ets_ids = {
        etablissement_id
        for (etablissement_id,) in db.query(Etablissement.id).filter(Etablissement.created_by == user_id).all()
    }

    groupe_ets_ids: set[str] = set()
    if user_ets_ids:
        user_ets = db.query(Etablissement).filter(Etablissement.id.in_(user_ets_ids)).all()
        siege_ids = {e.siege_id for e in user_ets if e.siege_id}
        if siege_ids:
            filiales = db.query(Etablissement).filter(Etablissement.siege_id.in_(siege_ids)).all()
            groupe_ets_ids = {e.id for e in filiales} | siege_ids

    visible_ets = user_ets_ids | groupe_ets_ids | owned_ets_ids

    from sqlalchemy import or_

    query = db.query(Contact).filter(
        or_(
            Contact.succursale_id.in_(user_succ_ids) if user_succ_ids else False,
            Contact.etablissement_id.in_(visible_ets) if visible_ets else False,
            Contact.created_by == user_id,
        )
    )

    if etablissement_id:
        query = query.filter(Contact.etablissement_id == etablissement_id)
    if succursale_id:
        query = query.filter(Contact.succursale_id == succursale_id)

    return query.all()


# ============================================================
# SCHEDULER - Remplace pg_cron en local
# ============================================================
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
    """Wrapper pour le scheduler - cree sa propre session."""
    db = SessionLocal()
    try:
        recompute_probite_scores(db)
    finally:
        db.close()

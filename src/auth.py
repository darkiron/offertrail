"""
OfferTrail — Auth via Supabase JWT
FastAPI vérifie le token émis par Supabase Auth.
Plus de gestion de passwords ni de register côté backend.

Supabase émet des JWTs signés en ES256 (clé EC asymétrique).
La clé publique est récupérée depuis le endpoint JWKS de Supabase au démarrage.
"""
import logging
import os
from typing import List, Optional

import httpx
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from src.database import get_db, SessionLocal
from src.models import Candidature, Contact, Etablissement, Profile

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")


def _load_supabase_jwks() -> list[dict]:
    """
    Récupère les clés publiques depuis le endpoint JWKS de Supabase (public, sans auth).
    Retourne la liste de JWK, ou [] si indisponible.
    """
    if not SUPABASE_URL:
        return []
    try:
        r = httpx.get(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json", timeout=10)
        r.raise_for_status()
        keys = r.json().get("keys", [])
        if keys:
            algos = [k.get("alg") for k in keys]
            logger.info("Clés publiques Supabase (JWKS) chargées — algos=%s", algos)
        return keys
    except Exception as exc:
        logger.warning("Impossible de charger le JWKS Supabase : %s", exc)
        return []


# Clés publiques Supabase chargées une fois au démarrage.
# Fallback : vérification HS256 si SUPABASE_JWT_SECRET est défini (projets legacy).
_SUPABASE_JWKS: list[dict] = _load_supabase_jwks()
_SUPABASE_HS256_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")

bearer_scheme = HTTPBearer(auto_error=False)


def _extract_profile_names(payload: dict) -> tuple[Optional[str], Optional[str]]:
    user_metadata = payload.get("user_metadata") or {}

    prenom = (
        payload.get("given_name")
        or payload.get("first_name")
        or user_metadata.get("prenom")
        or user_metadata.get("first_name")
    )
    nom = (
        payload.get("family_name")
        or payload.get("last_name")
        or user_metadata.get("nom")
        or user_metadata.get("last_name")
    )
    return prenom, nom


def get_jwt_payload(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    """
    Décode et retourne le payload complet du JWT Supabase.
    Supporte ES256 (JWKS, projets Supabase récents) et HS256 (legacy).
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Non authentifié",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    decode_opts = {"verify_aud": False}

    # Priorité 1 : JWKS (ES256 / RS256 — projets Supabase récents, clé asymétrique)
    for jwk in _SUPABASE_JWKS:
        alg = jwk.get("alg", "ES256")
        try:
            return jwt.decode(token, jwk, algorithms=[alg], options=decode_opts)
        except JWTError:
            continue

    # Priorité 2 : HS256 via le secret partagé (projets Supabase legacy)
    if _SUPABASE_HS256_SECRET:
        try:
            return jwt.decode(token, _SUPABASE_HS256_SECRET, algorithms=["HS256"], options=decode_opts)
        except JWTError:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user_id(
    payload: dict = Depends(get_jwt_payload),
) -> str:
    """
    Vérifie le JWT Supabase et retourne le user_id (sub).
    C'est le seul point d'entrée auth pour tous les endpoints privés.
    """
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token invalide")
    return user_id


def get_current_profile(
    payload: dict = Depends(get_jwt_payload),
    db: Session = Depends(get_db),
) -> Profile:
    """
    Retourne le profil complet du user connecté.
    Crée le profil automatiquement s'il n'existe pas
    (cas où le trigger Supabase n'aurait pas encore tourné).
    """
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token invalide")

    profile = db.query(Profile).filter(Profile.id == user_id).first()
    prenom, nom = _extract_profile_names(payload)

    if not profile:
        profile = Profile(
            id=user_id,
            prenom=prenom,
            nom=nom,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    else:
        updated = False
        if not profile.prenom and prenom:
            profile.prenom = prenom
            updated = True
        if not profile.nom and nom:
            profile.nom = nom
            updated = True
        if updated:
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


# ── Dépendances RLS — équivalent des policies Supabase ──────────────────────

def own_candidature(
    candidature_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> Candidature:
    """
    Équivalent RLS : user_id = auth.uid() sur candidatures.
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
    Équivalent de la policy contacts_visible_par_contexte.
    Un contact est visible si le user a une candidature dans :
    - la même succursale
    - le même ETS
    - un ETS du même groupe (filiale du même siège)
    """
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact introuvable")

    if not _user_can_see_contact(db, user_id, contact):
        raise HTTPException(status_code=403, detail="Accès refusé")

    return contact


def _user_can_see_contact(db: Session, user_id: str, contact: Contact) -> bool:
    """
    Logique de visibilité des contacts — miroir exact de la policy RLS Supabase.
    Centralisée ici pour être réutilisable dans les listings et les détails.
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
    Utilisé dans les listings — équivalent du SELECT avec RLS actif.
    """
    user_cands = db.query(Candidature).filter(Candidature.user_id == user_id).all()
    user_ets_ids = {c.etablissement_id for c in user_cands}
    user_succ_ids = {c.succursale_id for c in user_cands if c.succursale_id}
    owned_ets_ids = {
        eid
        for (eid,) in db.query(Etablissement.id).filter(Etablissement.created_by == user_id).all()
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


# ── Scheduler APScheduler (probité) ─────────────────────────────────────────

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

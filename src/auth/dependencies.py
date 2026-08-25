"""
OfferTrail — Dépendances FastAPI d'authentification et d'autorisation.

Ce module consomme le payload JWT vérifié par ``src.auth.jwks`` et l'expose
sous forme de dépendances FastAPI (``get_current_profile``, etc.), ainsi que
les équivalents RLS Supabase (visibilité des contacts, ownership des
candidatures) utilisés côté routers.
"""
from typing import List, Optional

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from src.auth.jwks import get_jwt_payload
from src.database import get_db
from src.models import Candidature, Contact, Etablissement, Profile


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
            plan="free",
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


def get_active_profile(
    profile: Profile = Depends(get_current_profile),
) -> Profile:
    """Retourne un profil actif. Les limites de plan sont verifiees par action."""
    return profile


def get_active_user_id(profile: Profile = Depends(get_active_profile)) -> str:
    """Version securisee de get_current_user_id."""
    return profile.id


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

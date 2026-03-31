"""
OfferTrail — Service de calcul du score de probité
Équivalent de la fonction SQL recompute_probite_scores() en Python.
Tourne toutes les heures via APScheduler.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from models import Candidature, ProbiteScore


# Statuts exclus du calcul (brouillons et abandons ne comptent pas)
STATUTS_EXCLUS = {"brouillon", "abandonnee"}

# Seuil minimum pour afficher un score (confidentialité)
SEUIL_FIABILITE = 3

# Pondérations du score global
POIDS_TAUX_REPONSE   = 0.40
POIDS_DELAI          = 0.30
POIDS_ANTI_GHOSTING  = 0.30

# Délai de référence pour la normalisation (jours)
# Au-delà de 30 jours sans réponse = score délai = 0
DELAI_MAX_JOURS = 30


def recompute_probite_scores(db: Session) -> int:
    """
    Recalcule les scores de probité pour tous les ETS ayant des candidatures.
    Retourne le nombre d'ETS mis à jour.
    """
    # Récupère toutes les candidatures actives (hors brouillons/abandons)
    candidatures = db.query(Candidature).filter(
        ~Candidature.statut.in_(STATUTS_EXCLUS),
        Candidature.date_candidature.isnot(None)
    ).all()

    if not candidatures:
        return 0

    # Grouper par ETS
    ets_groups: dict[str, list[Candidature]] = {}
    for c in candidatures:
        ets_groups.setdefault(c.etablissement_id, []).append(c)

    updated = 0
    for ets_id, cands in ets_groups.items():
        score = _compute_score(cands)

        # Upsert
        existing = db.query(ProbiteScore).filter(
            ProbiteScore.etablissement_id == ets_id
        ).first()

        if existing:
            existing.score_global        = score["score_global"]
            existing.taux_reponse        = score["taux_reponse"]
            existing.delai_moyen_reponse = score["delai_moyen_reponse"]
            existing.ghosting_rate       = score["ghosting_rate"]
            existing.nb_candidatures     = score["nb_candidatures"]
            existing.nb_users_uniques    = score["nb_users_uniques"]
            existing.last_computed_at    = datetime.utcnow()
        else:
            db.add(ProbiteScore(
                etablissement_id    = ets_id,
                last_computed_at    = datetime.utcnow(),
                **score
            ))

        updated += 1

    db.commit()
    return updated


def _compute_score(candidatures: list) -> dict:
    """
    Calcule les métriques pour un ensemble de candidatures d'un même ETS.

    Score global = taux_réponse (40%) + délai_normalisé (30%) + anti_ghosting (30%)
    """
    total = len(candidatures)
    users = {c.user_id for c in candidatures}

    # --- Taux de réponse ---
    avec_reponse = [c for c in candidatures if c.date_reponse is not None]
    taux_reponse = len(avec_reponse) / total * 100

    # --- Délai moyen de réponse ---
    delais = []
    for c in avec_reponse:
        if c.date_candidature:
            delta = (c.date_reponse - c.date_candidature).days
            if delta >= 0:
                delais.append(delta)
    delai_moyen = sum(delais) / len(delais) if delais else None

    # Normalisation délai : 0 jour = 100 pts, DELAI_MAX_JOURS = 0 pts
    if delai_moyen is not None:
        score_delai = max(0.0, (1 - delai_moyen / DELAI_MAX_JOURS) * 100)
    else:
        score_delai = 50.0  # valeur neutre si pas de données

    # --- Ghosting rate ---
    ghostings    = [c for c in candidatures if c.statut == "ghosting"]
    ghosting_rate = len(ghostings) / total * 100
    score_anti_ghosting = (1 - ghosting_rate / 100) * 100

    # --- Score global pondéré ---
    score_global = (
        taux_reponse      * POIDS_TAUX_REPONSE  +
        score_delai       * POIDS_DELAI          +
        score_anti_ghosting * POIDS_ANTI_GHOSTING
    )

    return {
        "score_global":        round(score_global, 2),
        "taux_reponse":        round(taux_reponse, 2),
        "delai_moyen_reponse": round(delai_moyen, 1) if delai_moyen is not None else None,
        "ghosting_rate":       round(ghosting_rate, 2),
        "nb_candidatures":     total,
        "nb_users_uniques":    len(users),
    }


def get_probite_for_ets(db: Session, etablissement_id: str) -> Optional[dict]:
    """
    Retourne le score de probité d'un ETS, ou None si données insuffisantes.
    Utilisé par les endpoints API.
    """
    score = db.query(ProbiteScore).filter(
        ProbiteScore.etablissement_id == etablissement_id
    ).first()

    if not score:
        return None

    if not score.fiable:
        # Retourner un résultat partiel sans exposer les données insuffisantes
        return {
            "fiable": False,
            "message": "Données insuffisantes (moins de 3 candidatures)",
            "nb_candidatures": score.nb_candidatures
        }

    return {
        "fiable":               True,
        "score_global":         score.score_global,
        "taux_reponse":         score.taux_reponse,
        "delai_moyen_reponse":  score.delai_moyen_reponse,
        "ghosting_rate":        score.ghosting_rate,
        "nb_candidatures":      score.nb_candidatures,
        "nb_users_uniques":     score.nb_users_uniques,
        "last_computed_at":     score.last_computed_at.isoformat(),
    }

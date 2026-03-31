"""
OfferTrail — Modèles SQLAlchemy
Base SQLite locale (migration Supabase plus tard sans changement de modèles)
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey,
    Integer, String, Text, UniqueConstraint, CheckConstraint, event
)
from sqlalchemy.orm import DeclarativeBase, relationship


def gen_uuid() -> str:
    return str(uuid.uuid4())


def now() -> datetime:
    return datetime.utcnow()


class Base(DeclarativeBase):
    pass


# ============================================================
# COUCHE GLOBALE
# ============================================================

class Etablissement(Base):
    __tablename__ = "etablissements"

    id          = Column(String, primary_key=True, default=gen_uuid)
    nom         = Column(String, nullable=False)
    secteur     = Column(String)
    siret       = Column(String, unique=True)
    site_web    = Column(String)
    logo_url    = Column(String)
    description = Column(Text)

    # Auto-référentiel : siege_id → parent (siège social)
    # null  = cet établissement EST le siège (ou indépendant)
    # non-null = c'est une filiale rattachée au siège
    siege_id    = Column(String, ForeignKey("etablissements.id"), nullable=True)
    type        = Column(String, default="independant")  # siege | filiale | independant

    verified    = Column(Boolean, default=False)
    created_by  = Column(String, ForeignKey("users.id"), nullable=True)
    created_at  = Column(DateTime, default=now)
    updated_at  = Column(DateTime, default=now, onupdate=now)

    # Relations
    siege       = relationship("Etablissement", remote_side="Etablissement.id",
                               backref="filiales", foreign_keys=[siege_id])
    succursales = relationship("Succursale", back_populates="etablissement",
                               cascade="all, delete-orphan")
    contacts    = relationship("Contact", back_populates="etablissement")
    probite     = relationship("ProbiteScore", back_populates="etablissement",
                               uselist=False)
    createur    = relationship("User", foreign_keys=[created_by])


class Succursale(Base):
    __tablename__ = "succursales"

    id               = Column(String, primary_key=True, default=gen_uuid)
    etablissement_id = Column(String, ForeignKey("etablissements.id"), nullable=False)
    nom              = Column(String)
    adresse          = Column(String)
    ville            = Column(String, nullable=False)
    code_postal      = Column(String)
    pays             = Column(String, default="FR")
    latitude         = Column(Float)
    longitude        = Column(Float)
    created_by       = Column(String, ForeignKey("users.id"), nullable=True)
    created_at       = Column(DateTime, default=now)

    # Relations
    etablissement = relationship("Etablissement", back_populates="succursales")
    contacts      = relationship("Contact", back_populates="succursale")
    createur      = relationship("User", foreign_keys=[created_by])


class Contact(Base):
    __tablename__ = "contacts"
    __table_args__ = (
        CheckConstraint(
            "etablissement_id IS NOT NULL OR succursale_id IS NOT NULL",
            name="contact_rattache"
        ),
    )

    id               = Column(String, primary_key=True, default=gen_uuid)
    etablissement_id = Column(String, ForeignKey("etablissements.id"), nullable=True)
    succursale_id    = Column(String, ForeignKey("succursales.id"), nullable=True)
    prenom           = Column(String, nullable=False)
    nom              = Column(String, nullable=False)
    poste            = Column(String)
    linkedin_url     = Column(String)
    email_pro        = Column(String)   # email générique/pro seulement — partagé
    created_by       = Column(String, ForeignKey("users.id"), nullable=True)
    created_at       = Column(DateTime, default=now)
    updated_at       = Column(DateTime, default=now, onupdate=now)

    # Relations
    etablissement = relationship("Etablissement", back_populates="contacts")
    succursale    = relationship("Succursale", back_populates="contacts")
    interactions  = relationship("ContactInteraction", back_populates="contact",
                                 cascade="all, delete-orphan")
    createur      = relationship("User", foreign_keys=[created_by])


# ============================================================
# COUCHE PRIVÉE
# ============================================================

STATUTS_CANDIDATURE = [
    "brouillon", "envoyee", "en_attente", "relancee",
    "entretien", "test_technique", "offre_recue",
    "acceptee", "refusee", "ghosting", "abandonnee"
]

TYPES_EVENT = [
    "creation", "statut_change", "contact_ajout",
    "relance_envoyee", "note_ajout", "entretien_planifie",
    "offre_recue", "document_joint"
]


class Candidature(Base):
    __tablename__ = "candidatures"

    id               = Column(String, primary_key=True, default=gen_uuid)
    user_id          = Column(String, ForeignKey("users.id"), nullable=False)
    etablissement_id = Column(String, ForeignKey("etablissements.id"), nullable=False)
    succursale_id    = Column(String, ForeignKey("succursales.id"), nullable=True)
    poste            = Column(String, nullable=False)
    url_offre        = Column(String)
    description      = Column(Text)
    statut           = Column(String, default="brouillon")
    date_candidature = Column(DateTime)
    date_reponse     = Column(DateTime)
    salaire_vise     = Column(Integer)
    source           = Column(String)
    notes            = Column(Text)
    created_at       = Column(DateTime, default=now)
    updated_at       = Column(DateTime, default=now, onupdate=now)

    # Relations
    user          = relationship("User", foreign_keys=[user_id])
    etablissement = relationship("Etablissement")
    succursale    = relationship("Succursale")
    events        = relationship("CandidatureEvent", back_populates="candidature",
                                 cascade="all, delete-orphan",
                                 order_by="CandidatureEvent.created_at")
    relances      = relationship("Relance", back_populates="candidature",
                                 cascade="all, delete-orphan")


class CandidatureEvent(Base):
    """Historique immuable Git-like — jamais modifié, jamais supprimé."""
    __tablename__ = "candidature_events"

    id             = Column(String, primary_key=True, default=gen_uuid)
    candidature_id = Column(String, ForeignKey("candidatures.id"), nullable=False)
    user_id        = Column(String, ForeignKey("users.id"), nullable=False)
    type           = Column(String, nullable=False)
    ancien_statut  = Column(String)
    nouveau_statut = Column(String)
    contenu        = Column(Text)
    created_at     = Column(DateTime, default=now)

    # Relations
    candidature = relationship("Candidature", back_populates="events")
    user        = relationship("User")


class Relance(Base):
    __tablename__ = "relances"

    id             = Column(String, primary_key=True, default=gen_uuid)
    candidature_id = Column(String, ForeignKey("candidatures.id"), nullable=False)
    user_id        = Column(String, ForeignKey("users.id"), nullable=False)
    contact_id     = Column(String, ForeignKey("contacts.id"), nullable=True)
    date_prevue    = Column(DateTime, nullable=False)
    date_effectuee = Column(DateTime)
    canal          = Column(String)   # email | linkedin | telephone | autre
    contenu        = Column(Text)     # brouillon du message
    statut         = Column(String, default="a_faire")  # a_faire | faite | ignoree
    created_at     = Column(DateTime, default=now)

    # Relations
    candidature = relationship("Candidature", back_populates="relances")
    user        = relationship("User")
    contact     = relationship("Contact")


class ContactInteraction(Base):
    """Notes et données privées d'un user sur un contact partagé."""
    __tablename__ = "contact_interactions"
    __table_args__ = (
        UniqueConstraint("contact_id", "user_id", name="uq_interaction_contact_user"),
    )

    id           = Column(String, primary_key=True, default=gen_uuid)
    contact_id   = Column(String, ForeignKey("contacts.id"), nullable=False)
    user_id      = Column(String, ForeignKey("users.id"), nullable=False)
    appreciation = Column(String)   # positif | neutre | negatif
    notes        = Column(Text)     # strictement privé
    email_perso  = Column(String)   # strictement privé
    telephone    = Column(String)   # strictement privé
    derniere_interaction = Column(DateTime)
    created_at   = Column(DateTime, default=now)
    updated_at   = Column(DateTime, default=now, onupdate=now)

    # Relations
    contact = relationship("Contact", back_populates="interactions")
    user    = relationship("User")


# ============================================================
# COUCHE DÉRIVÉE
# ============================================================

class ProbiteScore(Base):
    __tablename__ = "probite_scores"

    etablissement_id     = Column(String, ForeignKey("etablissements.id"),
                                  primary_key=True)
    score_global         = Column(Float)
    taux_reponse         = Column(Float)
    delai_moyen_reponse  = Column(Float)   # en jours
    ghosting_rate        = Column(Float)
    nb_candidatures      = Column(Integer, default=0)
    nb_users_uniques     = Column(Integer, default=0)
    last_computed_at     = Column(DateTime, default=now)

    # Relations
    etablissement = relationship("Etablissement", back_populates="probite")

    @property
    def fiable(self) -> bool:
        """Score affiché seulement si au moins 3 candidatures."""
        return (self.nb_candidatures or 0) >= 3


# ============================================================
# AUTH
# ============================================================

class User(Base):
    __tablename__ = "users"

    id           = Column(String, primary_key=True, default=gen_uuid)
    email        = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    nom          = Column(String)
    prenom       = Column(String)
    plan         = Column(String, default="starter")   # starter | pro
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=now)
    updated_at   = Column(DateTime, default=now, onupdate=now)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id         = Column(String, primary_key=True, default=gen_uuid)
    user_id    = Column(String, ForeignKey("users.id"), nullable=False)
    token      = Column(String, unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used       = Column(Boolean, default=False)
    created_at = Column(DateTime, default=now)

    user = relationship("User")


# ============================================================
# TRIGGER PYTHON — log automatique des changements de statut
# SQLite ne supporte pas les triggers SQL complexes,
# on utilise les SQLAlchemy events à la place.
# ============================================================

@event.listens_for(Candidature, "before_update")
def log_statut_change(mapper, connection, target):
    """Enregistre automatiquement un event à chaque changement de statut."""
    history = target.__dict__
    # Récupération de l'ancienne valeur via l'inspect SQLAlchemy
    from sqlalchemy import inspect as sa_inspect
    insp = sa_inspect(target)
    attr = insp.attrs.statut
    if attr.history.has_changes() and attr.history.deleted:
        ancien = attr.history.deleted[0]
        nouveau = target.statut
        if ancien != nouveau:
            connection.execute(
                CandidatureEvent.__table__.insert().values(
                    id=gen_uuid(),
                    candidature_id=target.id,
                    user_id=target.user_id,
                    type="statut_change",
                    ancien_statut=ancien,
                    nouveau_statut=nouveau,
                    created_at=now()
                )
            )

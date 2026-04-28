from enum import Enum


class CandidatureStatut(str, Enum):
    EN_ATTENTE  = "en_attente"
    ENVOYEE     = "envoyee"
    ENTRETIEN   = "entretien"
    OFFRE_RECUE = "offre_recue"
    REFUSEE     = "refusee"


STATUTS_REPONSE_POSITIVE = frozenset({
    CandidatureStatut.ENTRETIEN,
    CandidatureStatut.OFFRE_RECUE,
})

STATUTS_CLOS = frozenset({CandidatureStatut.REFUSEE})

STATUTS_ACTIFS = frozenset({
    CandidatureStatut.EN_ATTENTE,
    CandidatureStatut.ENVOYEE,
    CandidatureStatut.ENTRETIEN,
    CandidatureStatut.OFFRE_RECUE,
})

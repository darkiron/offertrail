"""Import TSV/CSV de candidatures (copier-coller depuis un tableur).

Logique métier extraite de ``src/main.py`` (``api_process_import``) per
ADR-0002 : ni concerns HTTP, ni requêtes SQLAlchemy directes — délègue
l'accès aux données à ``repositories/``.
"""
from datetime import datetime

from sqlalchemy.orm import Session

from src.repositories import candidatures as candidatures_repo
from src.repositories import etablissements as etablissements_repo

_COLUMN_MAPPING = {
    "Entreprise": "company",
    "Poste": "title",
    "Lien de l’offre": "job_url",
    "Source": "source",
    "Date candidature": "applied_at",
    "Statut": "status",
    "Notes": "notes",
    "Contact RH": "contact_rh",
    "Email RH": "email_rh",
    "Téléphone": "phone",
}

_STATUS_MAPPING = {
    "INTERESTED": "brouillon", "A CONTACTER": "brouillon",
    "APPLIED": "envoyee", "POSTULÉ": "envoyee", "CANDIDATURE ENVOYÉE": "envoyee",
    "INTERVIEW": "entretien", "ENTRETIEN": "entretien",
    "OFFER": "offre_recue", "OFFRE": "offre_recue",
    "REJECTED": "refusee", "REFUSÉ": "refusee",
}


def _parse_date(date_str: str | None) -> str | None:
    if not date_str or not date_str.strip():
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(date_str.strip(), fmt).date().isoformat()
        except ValueError:
            continue
    return None


def process_tsv_import(db: Session, tsv_data: str, user_id: str) -> dict:
    lines = tsv_data.strip().split("\n")
    if not lines:
        return {"error": "Empty data"}

    header = lines[0].split("\t")
    rows = lines[1:]

    col_map = {}
    for i, h in enumerate(header):
        h_clean = h.strip()
        if h_clean in _COLUMN_MAPPING:
            col_map[_COLUMN_MAPPING[h_clean]] = i

    results = {"total": len(rows), "created": 0, "skipped": 0, "errors": []}

    for idx, row_str in enumerate(rows):
        cols = row_str.split("\t")
        row_num = idx + 2

        try:
            def get_val(key, _cols=cols):
                if key in col_map and col_map[key] < len(_cols):
                    return _cols[col_map[key]].strip() or None
                return None

            company = get_val("company")
            title = get_val("title")

            if not company or not title:
                results["skipped"] += 1
                results["errors"].append({"row": row_num, "reason": "Missing Company or Job Title"})
                continue

            etablissement = etablissements_repo.get_by_nom(db, company)
            if not etablissement:
                etablissement = etablissements_repo.create_minimal(db, nom=company, created_by=user_id)

            raw_status = (get_val("status") or "APPLIED").upper()
            statut = _STATUS_MAPPING.get(raw_status, "envoyee")

            raw_date = get_val("applied_at")
            date_candidature = _parse_date(raw_date)

            note_parts = []
            if get_val("notes"):      note_parts.append(get_val("notes"))
            if get_val("contact_rh"): note_parts.append("Contact RH: " + get_val("contact_rh"))
            if get_val("email_rh"):   note_parts.append("Email RH: " + get_val("email_rh"))
            if get_val("phone"):      note_parts.append("Telephone: " + get_val("phone"))

            candidatures_repo.create_from_import(
                db,
                {
                    "etablissement_id": etablissement.id,
                    "poste": title,
                    "url_offre": get_val("job_url"),
                    "source": get_val("source"),
                    "statut": statut,
                    "date_candidature": datetime.fromisoformat(date_candidature) if date_candidature else None,
                    "notes": "\n".join(note_parts) if note_parts else None,
                },
                user_id,
            )
            results["created"] += 1

        except Exception as e:
            results["skipped"] += 1
            results["errors"].append({"row": row_num, "reason": str(e)})

    db.commit()
    return results

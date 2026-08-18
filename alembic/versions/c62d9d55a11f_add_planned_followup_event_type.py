"""Allow planned follow-ups in candidature history.

Revision ID: c62d9d55a11f
Revises: b41f2c9d8a6e
Create Date: 2026-08-06
"""

from alembic import op

revision = "c62d9d55a11f"
down_revision = "b41f2c9d8a6e"
branch_labels = None
depends_on = None

EVENT_TYPES = (
    "creation", "statut_change", "contact_ajout", "relance_envoyee",
    "relance_planifiee", "note_ajout", "entretien_planifie",
    "offre_recue", "document_joint",
)


def _replace_constraint(values: tuple[str, ...]) -> None:
    allowed = ", ".join(f"'{value}'" for value in values)
    op.execute("ALTER TABLE candidature_events DROP CONSTRAINT IF EXISTS candidature_events_type_check")
    op.execute(
        "ALTER TABLE candidature_events "
        f"ADD CONSTRAINT candidature_events_type_check CHECK (type IN ({allowed}))"
    )


def upgrade() -> None:
    _replace_constraint(EVENT_TYPES)


def downgrade() -> None:
    _replace_constraint(tuple(value for value in EVENT_TYPES if value != "relance_planifiee"))

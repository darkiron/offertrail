"""add contract type to applications

Revision ID: 437705d48570
Revises: c62d9d55a11f
Create Date: 2026-08-06 22:16:36.337754

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '437705d48570'
down_revision: Union[str, Sequence[str], None] = 'c62d9d55a11f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("candidatures", sa.Column("type_contrat", sa.String(), nullable=True))
    op.add_column("candidatures", sa.Column("tjm_vise", sa.Integer(), nullable=True))
    op.create_check_constraint(
        "candidature_type_contrat_check",
        "candidatures",
        "type_contrat IS NULL OR type_contrat IN ('cdi','cdd','freelance','stage','alternance','autre')",
    )
    op.execute(
        "UPDATE candidatures SET type_contrat = LOWER(TRIM(description)), description = NULL "
        "WHERE UPPER(TRIM(description)) IN ('CDI','CDD','FREELANCE','STAGE','ALTERNANCE')"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(
        "UPDATE candidatures SET description = UPPER(type_contrat) "
        "WHERE description IS NULL AND type_contrat IS NOT NULL AND type_contrat <> 'autre'"
    )
    op.drop_constraint("candidature_type_contrat_check", "candidatures", type_="check")
    op.drop_column("candidatures", "tjm_vise")
    op.drop_column("candidatures", "type_contrat")

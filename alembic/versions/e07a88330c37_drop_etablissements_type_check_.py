"""drop etablissements type check constraint

Revision ID: e07a88330c37
Revises: 49c63bad3f4a
Create Date: 2026-04-15 17:53:58.786272

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'e07a88330c37'
down_revision: Union[str, Sequence[str], None] = '49c63bad3f4a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE etablissements DROP CONSTRAINT IF EXISTS etablissements_type_check")


def downgrade() -> None:
    op.execute("""
        ALTER TABLE etablissements
        ADD CONSTRAINT etablissements_type_check
        CHECK (type = ANY (ARRAY['siege'::text, 'filiale'::text, 'independant'::text]))
    """)

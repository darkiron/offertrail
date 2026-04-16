"""add client_final_id to candidatures

Revision ID: 49c63bad3f4a
Revises: 8a65c6570d66
Create Date: 2026-04-15 15:47:13.760080

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '49c63bad3f4a'
down_revision: Union[str, Sequence[str], None] = '8a65c6570d66'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE candidatures
        ADD COLUMN IF NOT EXISTS client_final_id UUID
        REFERENCES etablissements(id)
    """)


def downgrade() -> None:
    op.drop_column('candidatures', 'client_final_id')

"""rename plan starter to free

Revision ID: 158e00ccb854
Revises: e07a88330c37
Create Date: 2026-04-18 13:51:20.071475

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '158e00ccb854'
down_revision: Union[str, Sequence[str], None] = 'e07a88330c37'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE profiles SET plan = 'free' WHERE plan = 'starter'")


def downgrade() -> None:
    op.execute("UPDATE profiles SET plan = 'starter' WHERE plan = 'free'")

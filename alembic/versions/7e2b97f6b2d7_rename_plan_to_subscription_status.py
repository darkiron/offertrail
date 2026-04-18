"""rename plan to subscription_status

Revision ID: 7e2b97f6b2d7
Revises: e07a88330c37
Create Date: 2026-04-18 14:31:39.637808

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7e2b97f6b2d7'
down_revision: Union[str, Sequence[str], None] = 'e07a88330c37'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("profiles", "plan", new_column_name="subscription_status")
    op.execute("UPDATE profiles SET subscription_status = 'active' WHERE subscription_status = 'pro'")
    op.execute("UPDATE profiles SET subscription_status = 'pending' WHERE subscription_status IN ('starter', 'free')")


def downgrade() -> None:
    op.execute("UPDATE profiles SET subscription_status = 'pro' WHERE subscription_status = 'active'")
    op.execute("UPDATE profiles SET subscription_status = 'starter' WHERE subscription_status IN ('pending', 'cancelled')")
    op.alter_column("profiles", "subscription_status", new_column_name="plan")

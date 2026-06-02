"""add billing_period, update plan values

Revision ID: b41f2c9d8a6e
Revises: 7e2b97f6b2d7
Create Date: 2026-05-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b41f2c9d8a6e"
down_revision: Union[str, Sequence[str], None] = "7e2b97f6b2d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("profiles", sa.Column("plan", sa.String(), nullable=True, server_default="free"))
    op.add_column("profiles", sa.Column("billing_period", sa.String(), nullable=True))

    op.execute("UPDATE profiles SET plan = 'free' WHERE plan IS NULL")
    op.execute("UPDATE profiles SET plan = 'free' WHERE plan IN ('starter', 'essential')")
    op.execute("UPDATE profiles SET plan = 'pro' WHERE plan = 'pro'")
    op.execute("UPDATE profiles SET plan = 'ultimate' WHERE plan = 'ultimate'")
    op.execute(
        "UPDATE profiles SET plan = 'pro', billing_period = 'monthly' "
        "WHERE subscription_status = 'active' AND plan = 'free'"
    )


def downgrade() -> None:
    op.drop_column("profiles", "billing_period")
    op.drop_column("profiles", "plan")

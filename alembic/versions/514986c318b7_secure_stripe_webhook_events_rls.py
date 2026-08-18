"""secure stripe webhook events rls

Revision ID: 514986c318b7
Revises: 437705d48570
Create Date: 2026-08-18 14:43:39.592225

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = '514986c318b7'
down_revision: Union[str, Sequence[str], None] = '437705d48570'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Keep the internal Stripe event ledger out of the Supabase Data API."""
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    table_exists = bind.execute(
        sa.text("SELECT to_regclass('public.stripe_webhook_events') IS NOT NULL")
    ).scalar_one()
    if not table_exists:
        return

    op.execute("ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY")
    op.execute("REVOKE ALL PRIVILEGES ON TABLE public.stripe_webhook_events FROM PUBLIC")
    op.execute("REVOKE ALL PRIVILEGES ON TABLE public.stripe_webhook_events FROM anon")
    op.execute("REVOKE ALL PRIVILEGES ON TABLE public.stripe_webhook_events FROM authenticated")


def downgrade() -> None:
    """Do not reopen a security vulnerability during rollback."""

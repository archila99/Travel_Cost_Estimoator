"""add user id to vehicles

Revision ID: 20260108_1130
Revises: 997045f3061a
Create Date: 2026-01-08 11:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260108_1130'
down_revision = '997045f3061a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('vehicles', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_vehicles_users', 'vehicles', 'users', ['user_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_vehicles_users', 'vehicles', type_='foreignkey')
    op.drop_column('vehicles', 'user_id')

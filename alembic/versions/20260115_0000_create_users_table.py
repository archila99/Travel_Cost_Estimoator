"""create users table

Revision ID: 20260115_0000
Revises: 997045f3061a
Create Date: 2026-01-15 00:00:00.000000

Creates the users table (was missing from initial migration).
Run this if you use Alembic instead of create_all() at startup.
"""
from alembic import op
import sqlalchemy as sa


revision = '20260115_0000'
down_revision = '997045f3061a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')

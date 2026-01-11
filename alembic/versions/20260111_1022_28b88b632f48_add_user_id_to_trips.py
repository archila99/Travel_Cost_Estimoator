"""add_user_id_to_trips

Revision ID: 28b88b632f48
Revises: 17fe20398746
Create Date: 2026-01-11 10:22:20.336341

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '28b88b632f48'
down_revision = '17fe20398746'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('trips')]
    
    if 'user_id' not in columns:
        op.add_column('trips', sa.Column('user_id', sa.Integer(), nullable=True))
        op.create_foreign_key('fk_trips_users', 'trips', 'users', ['user_id'], ['id'])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('trips')]
    
    if 'user_id' in columns:
        op.drop_constraint('fk_trips_users', 'trips', type_='foreignkey')
        op.drop_column('trips', 'user_id')

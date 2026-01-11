"""repair_missing_user_id_column

Revision ID: 17fe20398746
Revises: 20260108_1130
Create Date: 2026-01-11 09:44:10.240807

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '17fe20398746'
down_revision = '20260108_1130'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('vehicles')]
    
    if 'user_id' not in columns:
        op.add_column('vehicles', sa.Column('user_id', sa.Integer(), nullable=True))
        op.create_foreign_key('fk_vehicles_users', 'vehicles', 'users', ['user_id'], ['id'])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('vehicles')]
    
    if 'user_id' in columns:
        op.drop_constraint('fk_vehicles_users', 'vehicles', type_='foreignkey')
        op.drop_column('vehicles', 'user_id')

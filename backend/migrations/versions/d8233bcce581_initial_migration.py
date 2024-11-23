"""Initial migration

Revision ID: d8233bcce581
Revises: 
Create Date: 2024-11-23 18:39:50.597243

"""
from alembic import op
import sqlalchemy as sa
import geoalchemy2


# revision identifiers, used by Alembic.
revision = 'd8233bcce581'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('user',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('email', sa.String(length=120), nullable=False),
    sa.Column('password_hash', sa.String(length=128), nullable=True),
    sa.Column('location', geoalchemy2.types.Geometry(geometry_type='POINT', from_text='ST_GeomFromEWKT', name='geometry'), nullable=True),
    sa.Column('notification_radius', sa.Float(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email')
    )
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.create_index('idx_user_location', ['location'], unique=False, postgresql_using='gist')

    op.create_table('game',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=100), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('location', geoalchemy2.types.Geometry(geometry_type='POINT', from_text='ST_GeomFromEWKT', name='geometry', nullable=False), nullable=False),
    sa.Column('location_name', sa.String(length=200), nullable=False),
    sa.Column('date_time', sa.DateTime(), nullable=False),
    sa.Column('whatsapp_link', sa.String(length=200), nullable=True),
    sa.Column('creator_id', sa.Integer(), nullable=False),
    sa.Column('max_players', sa.Integer(), nullable=True),
    sa.Column('skill_level', sa.String(length=20), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['creator_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('game', schema=None) as batch_op:
        batch_op.create_index('idx_game_location', ['location'], unique=False, postgresql_using='gist')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('game', schema=None) as batch_op:
        batch_op.drop_index('idx_game_location', postgresql_using='gist')

    op.drop_table('game')
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_index('idx_user_location', postgresql_using='gist')

    op.drop_table('user')
    # ### end Alembic commands ###

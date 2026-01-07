#!/bin/bash
set -e

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Exec the container's main process (CMD)
exec "$@"

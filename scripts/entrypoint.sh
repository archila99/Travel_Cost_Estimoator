#!/bin/bash
set -e

# Set default PORT if not provided (Cloud Run will override this)
export PORT=${PORT:-8080}

# No Alembic migrations in container: app uses Base.metadata.create_all() on startup for a fresh schema.
# Tables are created when the app starts (see app/main.py lifespan).

if [ "$#" -eq 0 ]; then
    echo "No command provided"
    exit 1
fi

echo "Starting application on port ${PORT}..."
exec "$@"

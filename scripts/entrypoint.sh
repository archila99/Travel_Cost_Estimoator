#!/bin/bash
set -e

# Set default PORT if not provided (Cloud Run will override this)
export PORT=${PORT:-8080}

# Run database migrations
echo "Running database migrations..."
alembic upgrade head || echo "Warning: Migration failed, continuing anyway..."

# Exec the container's main process (CMD)
# If CMD is a shell command, execute it in a shell to ensure variable expansion
if [ "$#" -eq 0 ]; then
    echo "No command provided"
    exit 1
fi

# Execute the command, ensuring PORT variable is available
echo "Starting application on port ${PORT}..."
exec "$@"

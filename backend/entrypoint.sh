#!/bin/bash
set -e

echo "Starting Job Agent Backend..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
while ! pg_isready -h ${DB_HOST:-postgres} -p ${DB_PORT:-5432} -U "${DB_USER:-job_agent}" -d "${DB_NAME:-job_agent_db}"; do
  sleep 2
done
echo "PostgreSQL is ready!"

# Run database migrations/initialization
echo "Initializing database..."
python -c "from app.db.database import engine, Base; Base.metadata.create_all(bind=engine)"
echo "Database initialized!"

# Start the application
echo "Starting uvicorn server..."
exec "$@"
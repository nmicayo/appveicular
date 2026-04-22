#!/bin/sh
set -e

echo "Running database migrations..."
./scripts/apply-migration.sh apply

echo "Starting application..."
exec "$@"

#!/bin/sh
set -e

echo "Running database migrations..."
bun db/migrate.ts

echo "Starting API server..."
exec bun run apps/api/src/index.ts

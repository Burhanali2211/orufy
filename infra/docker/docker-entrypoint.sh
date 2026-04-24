#!/bin/sh
set -e

# Wait for API service to be available (simple check)
echo "Waiting for API service..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if nc -z api 3000 2>/dev/null; then
    echo "API service is ready!"
    break
  fi
  attempt=$((attempt + 1))
  echo "Attempt $attempt/$max_attempts - waiting for API..."
  sleep 1
done

# Start Nginx
exec "$@"

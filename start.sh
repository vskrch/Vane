#!/bin/bash
set -e

echo "=== Starting SearXNG ==="
export SEARXNG_SETTINGS_PATH="/app/searxng-settings.yml"

python3 -m searx.webapp --host 0.0.0.0 --port 8080 &
SEARXNG_PID=$!
echo "SearXNG PID: $SEARXNG_PID"

for i in $(seq 1 20); do
  if curl -s http://localhost:8080/healthz > /dev/null 2>&1; then
    echo "SearXNG ready"
    break
  fi
  kill -0 $SEARXNG_PID 2>/dev/null || { echo "SearXNG died"; exit 1; }
  sleep 1
done

echo "=== Starting Vane on port ${PORT:-3000} ==="
exec npx next start -p ${PORT:-3000}

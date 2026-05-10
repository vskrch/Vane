#!/bin/bash
set -e

echo "=== Starting SearXNG on port 8080 ==="
export SEARXNG_SETTINGS_PATH="/app/searxng-settings.yml"

python3 -m searx.webapp &
SEARXNG_PID=$!

echo "Waiting for SearXNG (PID $SEARXNG_PID)..."
for i in $(seq 1 30); do
  if curl -s http://localhost:8080/healthz > /dev/null 2>&1; then
    echo "SearXNG ready on port 8080"
    break
  fi
  if ! kill -0 $SEARXNG_PID 2>/dev/null; then
    echo "SearXNG crashed, check logs above"
    exit 1
  fi
  sleep 1
done

echo "=== Starting Vane on port ${PORT:-3000} ==="
exec npx next start -p ${PORT:-3000}

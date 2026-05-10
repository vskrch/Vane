#!/bin/bash
set -e

echo "=== Starting search server on port 8080 ==="
python3 search-server.py &
SEARCH_PID=$!

for i in $(seq 1 10); do
  if curl -s http://localhost:8080/healthz > /dev/null 2>&1; then
    echo "Search server ready"
    break
  fi
  kill -0 $SEARCH_PID 2>/dev/null || { echo "Search server died"; exit 1; }
  sleep 1
done

echo "=== Starting Vane on port ${PORT:-3000} ==="
exec npx next start -p ${PORT:-3000}

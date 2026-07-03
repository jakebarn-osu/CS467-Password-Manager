#!/usr/bin/env bash
# Wipes the Postgres volume and re-runs init scripts on next start.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

docker compose down
docker volume rm "$(basename "$(pwd)")_db-data" 2>/dev/null || true
echo "Database volume removed. Run ./scripts/start.sh to recreate it."

#!/usr/bin/env bash
# Stops all running containers for this app.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

docker compose down

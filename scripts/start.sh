#!/usr/bin/env bash
# Starts the full stack (db, api, frontend) in the foreground.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

docker compose up --build

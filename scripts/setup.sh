#!/usr/bin/env bash
# One-time (or occasional) setup: creates .env and builds images.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

docker compose build
echo "Setup complete. Run ./scripts/start.sh to start the app."

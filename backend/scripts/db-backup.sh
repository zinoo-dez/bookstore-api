#!/usr/bin/env bash
set -euo pipefail

if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set. Load backend/.env first or run through npm script."
  exit 1
fi

mkdir -p backups
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT_FILE="backups/bookstore_${STAMP}.dump"

echo "Creating backup: ${OUT_FILE}"
pg_dump "${DATABASE_URL}" -Fc -f "${OUT_FILE}"
echo "Backup completed: ${OUT_FILE}"

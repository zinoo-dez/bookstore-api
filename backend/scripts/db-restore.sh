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

BACKUP_FILE="${BACKUP_FILE:-}"
if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: BACKUP_FILE=backups/bookstore_YYYYMMDD_HHMMSS.dump npm run db:restore"
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "Restoring from: ${BACKUP_FILE}"
pg_restore --clean --if-exists --no-owner --no-privileges -d "${DATABASE_URL}" "${BACKUP_FILE}"
echo "Restore completed."

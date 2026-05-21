#!/usr/bin/env bash
# Copy all data from Render Postgres into local Docker Postgres.
# Prereqs: Render DB must be "Available", docker compose up -d, pg_dump/pg_restore installed.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# shellcheck source=scripts/lib/render-env.sh
source "$ROOT/scripts/lib/render-env.sh"
render_env_init "$ROOT"

DUMP="$ROOT/prisma/.render-dump.dump"

echo "→ Checking Render database…"
if ! pg_isready -d "$RENDER_PG" -t 15 >/dev/null 2>&1; then
  echo "✗ Cannot reach Render Postgres."
  echo "  Open https://dashboard.render.com → your database → Resume / check status."
  echo "  Free tier may need 30–60s after resume before connections work."
  exit 1
fi

echo "→ Checking local database (localhost:5434)…"
if ! pg_isready -d "$LOCAL_PG" -t 5 >/dev/null 2>&1; then
  echo "✗ Local Postgres not running. Run: docker compose up -d"
  exit 1
fi

echo "→ Dumping schema \"$SCHEMA\" from Render…"
pg_dump "$RENDER_PG" \
  --schema="$SCHEMA" \
  --no-owner \
  --no-acl \
  --format=custom \
  --file="$DUMP"

echo "→ Restoring into local database (replaces existing $SCHEMA data)…"
psql "$LOCAL_PG" -v ON_ERROR_STOP=1 -c "CREATE SCHEMA IF NOT EXISTS \"$SCHEMA\";"
pg_restore \
  --dbname="$LOCAL_PG" \
  --schema="$SCHEMA" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  "$DUMP"

render_verify_counts "$LOCAL_PG" "Local"

echo ""
echo "✓ Sync complete. Keep DATABASE_URL in .env pointed at localhost:5434"
echo "  Restart: npm run dev"

#!/usr/bin/env bash
# Copy all data from Render Postgres into local Docker Postgres.
# Prereqs: Render DB must be "Available", docker compose up -d, pg_dump/pg_restore installed.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.render ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.render
  set +a
fi

RENDER_URL="${RENDER_DATABASE_URL:-}"
LOCAL_URL="${LOCAL_DATABASE_URL:-postgresql://postgres:password@localhost:5434/school_management}"

if [[ -z "$RENDER_URL" ]]; then
  echo "Set RENDER_DATABASE_URL in .env.render (from Render dashboard)."
  exit 1
fi

SCHEMA="${PRISMA_SCHEMA:-school_sms}"
DUMP="$ROOT/prisma/.render-dump.dump"

echo "→ Checking Render database…"
if ! pg_isready -d "$RENDER_URL" -t 15 >/dev/null 2>&1; then
  echo "✗ Cannot reach Render Postgres."
  echo "  Open https://dashboard.render.com → your database → Resume / check status."
  echo "  Free tier may need 30–60s after resume before connections work."
  exit 1
fi

echo "→ Checking local database (localhost:5434)…"
if ! pg_isready -d "$LOCAL_URL" -t 5 >/dev/null 2>&1; then
  echo "✗ Local Postgres not running. Run: docker compose up -d"
  exit 1
fi

echo "→ Dumping schema \"$SCHEMA\" from Render…"
pg_dump "$RENDER_URL" \
  --schema="$SCHEMA" \
  --no-owner \
  --no-acl \
  --format=custom \
  --file="$DUMP"

echo "→ Restoring into local database (replaces existing $SCHEMA data)…"
psql "$LOCAL_URL" -v ON_ERROR_STOP=1 -c "CREATE SCHEMA IF NOT EXISTS \"$SCHEMA\";"
pg_restore \
  --dbname="$LOCAL_URL" \
  --schema="$SCHEMA" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  "$DUMP"

echo "→ Verifying row counts…"
psql "$LOCAL_URL" -v ON_ERROR_STOP=1 <<SQL
SELECT 'User' AS entity, COUNT(*)::text AS rows FROM "$SCHEMA"."User"
UNION ALL SELECT 'Student', COUNT(*)::text FROM "$SCHEMA"."Student"
UNION ALL SELECT 'Payment', COUNT(*)::text FROM "$SCHEMA"."Payment"
UNION ALL SELECT 'Branch', COUNT(*)::text FROM "$SCHEMA"."Branch";
SQL

echo ""
echo "✓ Sync complete. Keep DATABASE_URL in .env pointed at localhost:5434"
echo "  Restart: npm run dev"

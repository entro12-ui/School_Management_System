#!/usr/bin/env bash
# Copy local Docker Postgres → Render (OVERWRITES Render school_sms data).
# Use when you want Render to match your local DB exactly (including HR module).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/db-url.sh
source "$ROOT/scripts/db-url.sh"

if [[ -f .env.render ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.render
  set +a
fi

RENDER_URL="${RENDER_DATABASE_URL:-}"
LOCAL_URL="${LOCAL_DATABASE_URL:-postgresql://postgres:password@localhost:5434/school_management}"

if [[ -z "$RENDER_URL" ]]; then
  echo "Set RENDER_DATABASE_URL in .env.render"
  exit 1
fi

if [[ "$RENDER_URL" != *"schema="* ]]; then
  if [[ "$RENDER_URL" == *"?"* ]]; then
    RENDER_URL="${RENDER_URL}&schema=school_sms"
  else
    RENDER_URL="${RENDER_URL}?schema=school_sms"
  fi
fi

SCHEMA="${PRISMA_SCHEMA:-school_sms}"
DUMP="$ROOT/prisma/.local-to-render.dump"

echo "⚠  This replaces ALL data in Render schema \"$SCHEMA\" with your local copy."
read -r -p "Type YES to continue: " confirm
if [[ "$confirm" != "YES" ]]; then
  echo "Aborted."
  exit 0
fi

LOCAL_PG="$(db_url_for_pg "$LOCAL_URL")"
RENDER_PG="$(db_url_for_pg "$RENDER_URL")"

echo "→ Checking databases…"
pg_isready -d "$LOCAL_PG" -t 5 >/dev/null 2>&1 || { echo "Start local: docker compose up -d"; exit 1; }
pg_isready -d "$RENDER_PG" -t 20 >/dev/null 2>&1 || { echo "Resume Render Postgres first"; exit 1; }

echo "→ Dumping local schema…"
pg_dump "$LOCAL_URL" \
  --schema="$SCHEMA" \
  --no-owner \
  --no-acl \
  --format=custom \
  --file="$DUMP"

echo "→ Restoring to Render…"
psql "$RENDER_URL" -v ON_ERROR_STOP=1 -c "CREATE SCHEMA IF NOT EXISTS \"$SCHEMA\";" 2>/dev/null || true
pg_restore \
  --dbname="$RENDER_URL" \
  --schema="$SCHEMA" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  "$DUMP"

echo "→ Verifying Render…"
psql "$RENDER_URL" -v ON_ERROR_STOP=1 <<SQL
SELECT 'User' AS entity, COUNT(*)::text FROM "$SCHEMA"."User"
UNION ALL SELECT 'HrEmployee', COUNT(*)::text FROM "$SCHEMA"."HrEmployee"
UNION ALL SELECT 'Student', COUNT(*)::text FROM "$SCHEMA"."Student";
SQL

echo ""
echo "✓ Local data copied to Render."
echo "  Point production app DATABASE_URL at Render External URL with ?schema=school_sms"

#!/usr/bin/env bash
# Copy local Docker Postgres → Render (OVERWRITES Render school_sms data).
# Use when you want Render to match your local DB exactly (including HR module).
#
#   npm run db:sync-to-render
#   npm run db:sync-to-render -- --yes
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AUTO_YES=false
SKIP_SCHEMA=false
for arg in "$@"; do
  if [[ "$arg" == "--yes" || "$arg" == "-y" ]]; then AUTO_YES=true; fi
  if [[ "$arg" == "--skip-schema" ]]; then SKIP_SCHEMA=true; fi
done

# shellcheck source=scripts/lib/render-env.sh
source "$ROOT/scripts/lib/render-env.sh"
render_env_init "$ROOT"

DUMP="$ROOT/prisma/.local-to-render.dump"

if [[ "$AUTO_YES" != true ]]; then
  echo "⚠  This replaces ALL data in Render schema \"$SCHEMA\" with your local copy."
  read -r -p "Type YES to continue: " confirm
  if [[ "$confirm" != "YES" ]]; then
    echo "Aborted."
    exit 0
  fi
fi

echo "→ Checking databases…"
pg_isready -d "$LOCAL_PG" -t 5 >/dev/null 2>&1 || { echo "Start local: docker compose up -d"; exit 1; }
pg_isready -d "$RENDER_PG" -t 20 >/dev/null 2>&1 || { echo "Resume Render Postgres first"; exit 1; }

echo "→ Dumping local schema…"
# pg_dump/pg_restore/psql do not accept ?schema= in the URI (Prisma-only parameter).
pg_dump "$LOCAL_PG" \
  --schema="$SCHEMA" \
  --no-owner \
  --no-acl \
  --format=custom \
  --file="$DUMP"

echo "→ Restoring to Render…"
psql "$RENDER_PG" -v ON_ERROR_STOP=1 -c "CREATE SCHEMA IF NOT EXISTS \"$SCHEMA\";" 2>/dev/null || true
pg_restore \
  --dbname="$RENDER_PG" \
  --schema="$SCHEMA" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  "$DUMP"

render_verify_counts "$RENDER_PG" "Render"

echo ""
echo "✓ Local data copied to Render."
echo "  Point production app DATABASE_URL at Render External URL with ?schema=school_sms"

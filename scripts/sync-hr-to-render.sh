#!/usr/bin/env bash
# Copy HR module data from local Docker → Render (keeps existing students/payments).
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

RENDER_URL="$(db_url_with_schema "$RENDER_URL" school_sms)"
LOCAL_URL="$(db_url_with_schema "$LOCAL_URL" school_sms)"

RENDER_PG="$(db_url_for_pg "$RENDER_URL")"
LOCAL_PG="$(db_url_for_pg "$LOCAL_URL")"

echo "→ Checking databases…"
pg_isready -d "$LOCAL_PG" -t 5 >/dev/null 2>&1 || {
  echo "✗ Local Postgres not running. Start: docker compose up -d"
  exit 1
}

if ! pg_isready -d "$RENDER_PG" -t 25 >/dev/null 2>&1; then
  echo "✗ Cannot reach Render Postgres."
  echo "  Resume the database at https://dashboard.render.com then retry."
  exit 1
fi

echo "→ Applying HR schema on Render (if needed)…"
DATABASE_URL="$RENDER_URL" npx prisma db push --accept-data-loss

echo "→ Syncing HR rows from local to Render…"
export LOCAL_DATABASE_URL="$LOCAL_URL"
export RENDER_DATABASE_URL="$RENDER_URL"
npx tsx prisma/sync-hr-to-render.ts

echo ""
echo "Done. Production app should use Render DATABASE_URL with ?schema=school_sms"

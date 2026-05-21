#!/usr/bin/env bash
# One command: align Render schema + copy ALL local Postgres data to Render.
# Use after you build/test on localhost and want production DB to match.
#
# Usage:
#   npm run db:deploy-render          # asks for YES confirmation before data copy
#   npm run db:deploy-render -- --yes # no prompt (CI / scripts)
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AUTO_YES=false
for arg in "$@"; do
  if [[ "$arg" == "--yes" || "$arg" == "-y" ]]; then
    AUTO_YES=true
  fi
done

# shellcheck source=scripts/lib/render-env.sh
source "$ROOT/scripts/lib/render-env.sh"
render_env_init "$ROOT"

echo "══════════════════════════════════════════════════════════════"
echo "  Deploy local database → Render (schema + full data copy)"
echo "══════════════════════════════════════════════════════════════"
echo "  Local:  $LOCAL_PG"
echo "  Render: (schema $SCHEMA)"
echo ""

echo "→ Step 1/4: Check local Postgres…"
pg_isready -d "$LOCAL_PG" -t 5 >/dev/null 2>&1 || {
  echo "✗ Local DB not running. Start: docker compose up -d"
  exit 1
}

echo "→ Step 2/4: Check Render Postgres…"
pg_isready -d "$RENDER_PG" -t 25 >/dev/null 2>&1 || {
  echo "✗ Cannot reach Render. Resume DB at https://dashboard.render.com"
  exit 1
}

echo "→ Step 3/4: Push Prisma schema to local + Render…"
DATABASE_URL="$LOCAL_URL" npx prisma db push
DATABASE_URL="$RENDER_URL" npx prisma db push --accept-data-loss

echo "→ Step 4/4: Copy all local data to Render (overwrites Render $SCHEMA)…"
if [[ "$AUTO_YES" != true ]]; then
  echo "⚠  This replaces ALL data in Render with your local copy."
  read -r -p "Type YES to continue: " confirm
  if [[ "$confirm" != "YES" ]]; then
    echo "Aborted. Schema was still updated on Render."
    exit 0
  fi
fi

bash "$ROOT/scripts/sync-to-render.sh" --yes --skip-schema

echo ""
render_verify_counts "$RENDER_PG" "Render (after deploy)"

echo ""
echo "✓ Deploy complete."
echo "  Production app on Render must use DATABASE_URL with ?schema=school_sms"
echo "  Uploaded files (avatars, HR documents) live under public/uploads/ —"
echo "  copy that folder to Render disk or object storage if you need files in prod."

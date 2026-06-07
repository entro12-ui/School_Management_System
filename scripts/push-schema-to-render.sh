#!/usr/bin/env bash
# Apply current Prisma schema to Render Postgres (adds HR tables, new enums, etc.).
# Does NOT delete existing school data — only schema changes.
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

if [[ -z "$RENDER_URL" ]]; then
  echo "Set RENDER_DATABASE_URL in .env.render"
  exit 1
fi

# Ensure Prisma uses school_sms schema (same as production app)
if [[ "$RENDER_URL" != *"schema="* ]]; then
  if [[ "$RENDER_URL" == *"?"* ]]; then
    RENDER_URL="${RENDER_URL}&schema=school_sms"
  else
    RENDER_URL="${RENDER_URL}?schema=school_sms"
  fi
fi

RENDER_PG="$(db_url_for_pg "$RENDER_URL")"

echo "→ Checking Render database…"
if ! pg_isready -d "$RENDER_PG" -t 20 >/dev/null 2>&1; then
  echo "✗ Cannot reach Render Postgres."
  echo "  Resume the instance at https://dashboard.render.com then retry."
  exit 1
fi

echo "→ Pushing Prisma schema to Render (school_sms)…"
DATABASE_URL="$RENDER_URL" npx prisma db push --accept-data-loss

echo ""
echo "✓ Schema on Render is up to date (platform SaaS, Chapa, HR, etc.)."
echo "  Next: npm run db:ensure-demo-render  — platform admin + demo logins"
echo "  Optional: npm run db:deploy-render   — copy ALL local data to Render"

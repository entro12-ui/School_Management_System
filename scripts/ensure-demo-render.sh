#!/usr/bin/env bash
# Upsert demo accounts (incl. platform@entroethiopia.com) on Render Postgres.
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

echo "→ Ensuring demo logins on Render (platform admin, super admin, branch users)…"
DATABASE_URL="$RENDER_URL" npx tsx prisma/ensure-demo-login.ts
echo "✓ Done."

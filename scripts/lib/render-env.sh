#!/usr/bin/env bash
# Shared Render + local DB URLs for sync scripts.

render_env_init() {
  local root="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
  cd "$root"

  # shellcheck source=scripts/db-url.sh
  source "$root/scripts/db-url.sh"

  if [[ -f .env.render ]]; then
    set -a
    # shellcheck disable=SC1091
    source .env.render
    set +a
  fi

  RENDER_URL="${RENDER_DATABASE_URL:-}"
  LOCAL_URL="${LOCAL_DATABASE_URL:-postgresql://postgres:password@localhost:5434/school_management}"
  SCHEMA="${PRISMA_SCHEMA:-school_sms}"

  if [[ -z "$RENDER_URL" ]]; then
    echo "Set RENDER_DATABASE_URL in .env.render (copy from Render dashboard → Postgres → External URL)."
    exit 1
  fi

  RENDER_URL="$(db_url_with_schema "$RENDER_URL" "$SCHEMA")"
  LOCAL_URL="$(db_url_with_schema "$LOCAL_URL" "$SCHEMA")"

  LOCAL_PG="$(db_url_for_pg "$LOCAL_URL")"
  RENDER_PG="$(db_url_for_pg "$RENDER_URL")"
}

# $1 = connection URL without ?schema= (use LOCAL_PG or RENDER_PG)
render_verify_counts() {
  local pg_url="$1"
  local label="${2:-Database}"
  echo "→ $label row counts:"
  psql "$pg_url" -v ON_ERROR_STOP=1 <<SQL
SELECT 'Branch' AS entity, COUNT(*)::text AS rows FROM "$SCHEMA"."Branch"
UNION ALL SELECT 'User', COUNT(*)::text FROM "$SCHEMA"."User"
UNION ALL SELECT 'Student', COUNT(*)::text FROM "$SCHEMA"."Student"
UNION ALL SELECT 'HrEmployee', COUNT(*)::text FROM "$SCHEMA"."HrEmployee"
UNION ALL SELECT 'HrEmployeeDocument', COUNT(*)::text FROM "$SCHEMA"."HrEmployeeDocument"
UNION ALL SELECT 'RegistrationRequest', COUNT(*)::text FROM "$SCHEMA"."RegistrationRequest"
UNION ALL SELECT 'Payment', COUNT(*)::text FROM "$SCHEMA"."Payment";
SQL
}

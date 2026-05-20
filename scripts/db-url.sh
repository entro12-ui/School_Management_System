#!/usr/bin/env bash
# Helpers for Postgres CLI tools (pg_isready, pg_dump) — they reject ?schema= in the URI.

db_url_for_pg() {
  echo "$1" | sed -E 's/[?&]schema=[^&]*//g; s/\?&/?/g; s/\?$//; s/&$//'
}

db_url_with_schema() {
  local url="$1"
  local schema="${2:-school_sms}"
  if [[ "$url" == *"schema="* ]]; then
    echo "$url"
    return
  fi
  if [[ "$url" == *"?"* ]]; then
    echo "${url}&schema=${schema}"
  else
    echo "${url}?schema=${schema}"
  fi
}

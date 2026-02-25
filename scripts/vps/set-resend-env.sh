#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/adflow}"
APP_BASE_URL="${APP_BASE_URL:-https://getorbita.com.br}"
EMAIL_FROM="${EMAIL_FROM:-Orbita <noreply@getorbita.com.br>}"
EMAIL_PROVIDER="${EMAIL_PROVIDER:-resend}"

if [[ ! -d "$APP_DIR" ]]; then
  echo "[resend-env] APP_DIR nao encontrado: $APP_DIR"
  exit 1
fi

cd "$APP_DIR"

if [[ ! -f ".env" ]]; then
  echo "[resend-env] Arquivo .env nao encontrado em $APP_DIR"
  exit 1
fi

if [[ -z "${RESEND_API_KEY:-}" ]]; then
  read -r -s -p "Digite a nova RESEND_API_KEY: " RESEND_API_KEY
  echo
fi

if [[ -z "${RESEND_API_KEY:-}" ]]; then
  echo "[resend-env] RESEND_API_KEY vazia. Abortando."
  exit 1
fi

upsert_env() {
  local key="$1"
  local value="$2"

  if grep -q "^${key}=" .env; then
    sed -i.bak "s|^${key}=.*|${key}=${value}|" .env
  else
    echo "${key}=${value}" >> .env
  fi
}

upsert_env "APP_BASE_URL" "$APP_BASE_URL"
upsert_env "EMAIL_PROVIDER" "$EMAIL_PROVIDER"
upsert_env "EMAIL_FROM" "$EMAIL_FROM"
upsert_env "RESEND_API_KEY" "$RESEND_API_KEY"

echo "[resend-env] Variaveis de email atualizadas com sucesso."
echo "[resend-env] APP_BASE_URL=${APP_BASE_URL}"
echo "[resend-env] EMAIL_PROVIDER=${EMAIL_PROVIDER}"
echo "[resend-env] EMAIL_FROM=${EMAIL_FROM}"
echo "[resend-env] RESEND_API_KEY=***$(printf '%s' "$RESEND_API_KEY" | tail -c 7)"


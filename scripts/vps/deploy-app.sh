#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/adflow}"
APP_NAME="${APP_NAME:-adflow}"
BRANCH="${BRANCH:-main}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-1}"

cd "$APP_DIR"

echo "[deploy] Atualizando codigo (${BRANCH})..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "[deploy] Instalando dependencias..."
corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile

echo "[deploy] Build de producao..."
pnpm build

if [[ "$RUN_MIGRATIONS" == "1" ]]; then
  echo "[deploy] Aplicando migracoes (db:push)..."
  pnpm db:push
else
  echo "[deploy] RUN_MIGRATIONS=0, pulando migracoes."
fi

echo "[deploy] Reiniciando processo PM2..."
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 restart "$APP_NAME" --update-env
else
  pm2 start "pnpm start" --name "$APP_NAME" --time
fi
pm2 save

echo "[deploy] OK. Processo: $APP_NAME"
pm2 status "$APP_NAME"

#!/usr/bin/env bash
set -euo pipefail

REMOTE="${1:-}"
APP_DIR="${APP_DIR:-/var/www/adflow}"
BRANCH="${BRANCH:-main}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-1}"

if [[ -z "$REMOTE" ]]; then
  echo "Uso: bash scripts/vps/quick-deploy.sh usuario@ip"
  echo "Exemplo: bash scripts/vps/quick-deploy.sh root@203.0.113.10"
  exit 1
fi

echo "[quick] Atualizando producao em ${REMOTE}..."
ssh "$REMOTE" \
  "cd '${APP_DIR}' && BRANCH='${BRANCH}' RUN_MIGRATIONS='${RUN_MIGRATIONS}' bash scripts/vps/deploy-app.sh"

echo "[quick] Deploy remoto finalizado."

#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Execute como root: sudo bash scripts/vps/setup-ubuntu.sh"
  exit 1
fi

APP_DIR="${APP_DIR:-/var/www/adflow}"
APP_USER="${APP_USER:-${SUDO_USER:-root}}"
REPO_URL="${REPO_URL:-https://github.com/ogusttavs/ADflow.git}"
BRANCH="${BRANCH:-main}"
NODE_MAJOR="${NODE_MAJOR:-20}"
DB_NAME="${DB_NAME:-adflow}"
DB_USER="${DB_USER:-adflow}"
DB_PASS="${DB_PASS:-}"

if [[ -z "$APP_USER" ]]; then
  echo "Nao foi possivel detectar APP_USER. Defina APP_USER manualmente."
  exit 1
fi

if [[ -z "$DB_PASS" ]]; then
  echo "Defina DB_PASS antes de rodar. Exemplo:"
  echo "  sudo DB_PASS='senha-forte' bash scripts/vps/setup-ubuntu.sh"
  exit 1
fi

echo "[setup] Instalando pacotes base..."
apt update
apt install -y git curl ca-certificates gnupg nginx mysql-server ufw

echo "[setup] Instalando Node.js ${NODE_MAJOR}..."
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt install -y nodejs
fi

echo "[setup] Ativando pnpm e PM2..."
corepack enable
corepack prepare pnpm@latest --activate
npm i -g pm2

echo "[setup] Criando banco e usuario MySQL..."
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost'; FLUSH PRIVILEGES;"

echo "[setup] Preparando app em ${APP_DIR}..."
mkdir -p "$APP_DIR"
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

run_as_app() {
  if [[ "$(id -un)" == "$APP_USER" ]]; then
    "$@"
    return
  fi

  if command -v sudo >/dev/null 2>&1; then
    sudo -u "$APP_USER" "$@"
    return
  fi

  local escaped=()
  local arg
  for arg in "$@"; do
    escaped+=("$(printf '%q' "$arg")")
  done
  su - "$APP_USER" -s /bin/bash -c "${escaped[*]}"
}

if [[ ! -d "$APP_DIR/.git" ]]; then
  run_as_app git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
run_as_app git fetch origin "$BRANCH"
run_as_app git checkout "$BRANCH"
run_as_app git pull --ff-only origin "$BRANCH"

if [[ ! -f "$APP_DIR/.env" ]]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  chown "$APP_USER":"$APP_USER" "$APP_DIR/.env"
  echo "[setup] Arquivo .env criado. Edite antes de publicar."
fi

echo "[setup] Configurando firewall (UFW)..."
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
ufw --force enable || true

echo "[setup] Setup base concluido. Proximo passo:"
echo "1) Edite ${APP_DIR}/.env"
echo "2) Rode como ${APP_USER}: bash scripts/vps/deploy-app.sh"

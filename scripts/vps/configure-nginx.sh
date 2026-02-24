#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Execute como root: sudo bash scripts/vps/configure-nginx.sh"
  exit 1
fi

DOMAIN="${DOMAIN:-}"
APP_PORT="${APP_PORT:-3000}"

if [[ -z "$DOMAIN" ]]; then
  echo "Defina DOMAIN. Exemplo:"
  echo "  sudo DOMAIN=app.seudominio.com bash scripts/vps/configure-nginx.sh"
  exit 1
fi

cat >/etc/nginx/sites-available/adflow <<NGINX
server {
  listen 80;
  server_name ${DOMAIN};

  client_max_body_size 50M;

  location / {
    proxy_pass http://127.0.0.1:${APP_PORT};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
NGINX

ln -sf /etc/nginx/sites-available/adflow /etc/nginx/sites-enabled/adflow
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "Nginx configurado para ${DOMAIN} -> 127.0.0.1:${APP_PORT}"

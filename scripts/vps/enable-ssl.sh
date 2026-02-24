#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Execute como root: sudo bash scripts/vps/enable-ssl.sh"
  exit 1
fi

DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"
INCLUDE_WWW="${INCLUDE_WWW:-0}"

if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
  echo "Defina DOMAIN e EMAIL. Exemplo:"
  echo "  sudo DOMAIN=app.seudominio.com EMAIL=voce@dominio.com bash scripts/vps/enable-ssl.sh"
  exit 1
fi

apt update
apt install -y certbot python3-certbot-nginx

if [[ "$INCLUDE_WWW" == "1" ]]; then
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --agree-tos --no-eff-email -m "$EMAIL" --redirect
else
  certbot --nginx -d "$DOMAIN" --agree-tos --no-eff-email -m "$EMAIL" --redirect
fi

echo "SSL habilitado para ${DOMAIN}."

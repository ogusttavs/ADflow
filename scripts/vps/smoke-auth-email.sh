#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/adflow}"
APP_NAME="${APP_NAME:-adflow}"
DOMAIN="${DOMAIN:-getorbita.com.br}"

if [[ ! -d "$APP_DIR" ]]; then
  echo "[smoke] APP_DIR nao encontrado: $APP_DIR"
  exit 1
fi

cd "$APP_DIR"

if [[ ! -f ".env" ]]; then
  echo "[smoke] .env nao encontrado em $APP_DIR"
  exit 1
fi

echo "[smoke] Validando variaveis obrigatorias..."
required_keys=("APP_BASE_URL" "EMAIL_PROVIDER" "EMAIL_FROM" "RESEND_API_KEY")
for key in "${required_keys[@]}"; do
  value="$(grep -E "^${key}=" .env | tail -n 1 | cut -d '=' -f 2- || true)"
  if [[ -z "${value}" ]]; then
    echo "[smoke] ERRO: ${key} nao configurada."
    exit 1
  fi
done

email_provider="$(grep -E '^EMAIL_PROVIDER=' .env | tail -n 1 | cut -d '=' -f 2- || true)"
if [[ "$email_provider" != "resend" ]]; then
  echo "[smoke] ERRO: EMAIL_PROVIDER deve ser 'resend' em producao. Atual: ${email_provider}"
  exit 1
fi

echo "[smoke] Reiniciando PM2 com env atualizado..."
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 restart "$APP_NAME" --update-env >/dev/null
else
  echo "[smoke] ERRO: processo PM2 '${APP_NAME}' nao encontrado."
  exit 1
fi
pm2 save >/dev/null

echo "[smoke] Verificando status da app e dominio..."
pm2 status "$APP_NAME"
curl -I "https://${DOMAIN}" | head -n 1

echo "[smoke] Procurando erros comuns de email no log..."
if pm2 logs "$APP_NAME" --lines 200 --nostream | rg -i "RESEND_API_KEY|EMAIL_FROM|EMAIL_PROVIDER|Failed to send|error" >/dev/null 2>&1; then
  echo "[smoke] ALERTA: encontrado padrao de erro recente no log. Revise manualmente:"
  pm2 logs "$APP_NAME" --lines 200 --nostream | tail -n 60
else
  echo "[smoke] Sem erros obvios de configuracao de email nos ultimos logs."
fi

cat <<'EOF'

[smoke] Checklist manual obrigatorio (browser):
1) Cadastro novo -> deve exibir popup de verificacao e disparar email.
2) Abrir /verify-email?token=... -> deve confirmar email.
3) Login -> "Esqueci minha senha" -> deve enviar email.
4) /reset-password?token=... -> deve trocar senha.
5) No popup, "Reenviar email de verificacao" -> deve enviar email.
6) Forcar repeticao de requests -> validar retorno 429 nos endpoints protegidos.

EOF

echo "[smoke] Validacao operacional concluida."


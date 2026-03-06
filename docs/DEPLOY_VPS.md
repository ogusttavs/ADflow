# Deploy VPS - Operacao Oficial

Atualizado em: 2026-03-06 07:40:00 -0300

Objetivo: publicar e manter o app em VPS com PM2 + Nginx + SSL.

## Producao atual
- Dominio em uso: `https://getorbita.com.br`
- Processo: `pm2` app `adflow`

## 1) Setup inicial (uma vez)

No servidor:

```bash
cd /var/www
mkdir -p adflow
cd adflow
git clone https://github.com/ogusttavs/ADflow.git .
DB_PASS='SENHA_FORTE_AQUI' bash scripts/vps/setup-ubuntu.sh
```

## 2) Variaveis obrigatorias (`/var/www/adflow/.env`)

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://adflow:SENHA_FORTE_AQUI@localhost:3306/adflow
JWT_SECRET=UM_SEGREDO_FORTE_E_UNICO
VITE_APP_ID=orbita
CREDENTIAL_ENCRYPTION_KEY=CHAVE_32_BYTES_HEX_OU_BASE64
APP_BASE_URL=https://getorbita.com.br
EMAIL_PROVIDER=resend
EMAIL_FROM=Orbita <noreply@getorbita.com.br>
RESEND_API_KEY=NOVA_CHAVE_RESEND
PAYMENT_PROVIDER=kiwify
KIWIFY_WEBHOOK_TOKEN=SEGREDO_FORTE_WEBHOOK_KIWIFY
KIWIFY_WEBHOOK_ALLOWED_IPS=
KIWIFY_CHECKOUT_URL_PERSONAL_STANDARD=https://pay.kiwify.com.br/SEU_LINK_1
KIWIFY_CHECKOUT_URL_PERSONAL_PRO=https://pay.kiwify.com.br/SEU_LINK_2
KIWIFY_CHECKOUT_URL_BUSINESS_STANDARD=https://pay.kiwify.com.br/SEU_LINK_3
KIWIFY_CHECKOUT_URL_BUSINESS_PRO=https://pay.kiwify.com.br/SEU_LINK_4
```

Se usar Google OAuth:

```env
GOOGLE_OAUTH_REDIRECT_URI=https://SEU_DOMINIO/api/oauth/google/callback
GOOGLE_LOGIN_OAUTH_REDIRECT_URI=https://SEU_DOMINIO/api/oauth/google/login/callback
```

## 2.1) Email transacional (Resend) - operacional

Antes de configurar na VPS:
- Revogar qualquer API key exposta.
- Criar nova key no Resend (ex.: `orbita-prod`).
- Validar dominio `getorbita.com.br` no Resend (SPF/DKIM e registros extras do painel).

Atualizacao segura do `.env` na VPS:

```bash
cd /var/www/adflow
bash scripts/vps/set-resend-env.sh
```

Observacao:
- O script pede a `RESEND_API_KEY` sem eco no terminal.
- Nao comitar `.env` com segredo real.

## 2.2) Pagamentos Kiwify - operacional

- Endpoint webhook do backend: `POST /api/webhooks/kiwify`
- Header aceito para token: `x-kiwify-token` (recomendado) e variantes compativeis.
- Seguranca minima obrigatoria:
  - `KIWIFY_WEBHOOK_TOKEN` definido em producao;
  - token igual no painel Kiwify;
  - HTTPS ativo no dominio.
- Restricao por IP e opcional:
  - usar `KIWIFY_WEBHOOK_ALLOWED_IPS` (CSV) somente apos observar IPs reais em producao;
  - se vazio, o webhook segue protegido por token.

## 3) Deploy recorrente (oficial)

Dentro da VPS:

```bash
cd /var/www/adflow
bash scripts/vps/deploy-app.sh
```

Do computador local:

```bash
bash scripts/vps/quick-deploy.sh root@SEU_IP
```

## 4) Nginx e SSL

```bash
sudo DOMAIN=SEU_DOMINIO bash scripts/vps/configure-nginx.sh
sudo DOMAIN=SEU_DOMINIO EMAIL=seu-email@dominio.com bash scripts/vps/enable-ssl.sh
```

## 5) Validacao rapida

```bash
pm2 status adflow
pm2 logs adflow --lines 200
curl -I https://SEU_DOMINIO
curl -I http://SEU_DOMINIO
```

Esperado:
- HTTPS `200 OK`
- HTTP `301` para HTTPS

Smoke operacional de Auth + Email:

```bash
cd /var/www/adflow
DOMAIN=getorbita.com.br bash scripts/vps/smoke-auth-email.sh
```

Esse script valida:
- ENV obrigatorias de email;
- `EMAIL_PROVIDER=resend`;
- restart de PM2 com `--update-env`;
- health HTTPS;
- varredura inicial de erros de email em log.

Provisionar contas QA por plano (quando necessario):

```bash
cd /var/www/adflow
QA_USERS_BASE_EMAIL=nome@dominio.com QA_USERS_PASSWORD='SENHA_FORTE' pnpm provision:qa-users
```

Uso:
- cria/atualiza 4 contas QA, uma por plano;
- marcar apenas para validacao interna controlada;
- nao substituir usuarios reais.

## 6) Regras operacionais

- Nao editar codigo direto na VPS.
- Fluxo correto: local -> commit/push -> deploy.
- Se segredo vazar, rotacionar imediatamente.

# Deploy VPS - Operacao Oficial

Atualizado em: 2026-02-25 11:10:52 -0300

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
VITE_APP_ID=adflow
```

Se usar Google OAuth:

```env
GOOGLE_OAUTH_REDIRECT_URI=https://SEU_DOMINIO/api/oauth/google/callback
GOOGLE_LOGIN_OAUTH_REDIRECT_URI=https://SEU_DOMINIO/api/oauth/google/login/callback
```

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

## 6) Regras operacionais

- Nao editar codigo direto na VPS.
- Fluxo correto: local -> commit/push -> deploy.
- Se segredo vazar, rotacionar imediatamente.

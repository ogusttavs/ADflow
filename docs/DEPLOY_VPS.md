# Deploy VPS (Publico) - AdFlow

Objetivo: publicar o app em dominio proprio usando Ubuntu + PM2 + Nginx + SSL.

## 1) Requisitos
- VPS Ubuntu 22.04+ com acesso SSH.
- Dominio apontando para o IP da VPS (registro A).
- Portas 80 e 443 liberadas.

## 2) Setup inicial na VPS (uma vez)
No seu computador local:

```bash
ssh root@SEU_IP
```

No servidor:

```bash
cd /var/www
mkdir -p adflow
cd adflow
git clone https://github.com/ogusttavs/ADflow.git .

# setup base (pacotes, node, pnpm, pm2, mysql, firewall)
DB_PASS='SENHA_FORTE_AQUI' bash scripts/vps/setup-ubuntu.sh
```

## 3) Configurar `.env` de producao
Edite `/var/www/adflow/.env` com valores reais.
Campos minimos:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://adflow:SENHA_FORTE_AQUI@localhost:3306/adflow
JWT_SECRET=UM_SEGREDO_FORTE_E_UNICO
VITE_APP_ID=adflow
```

Se usar Google OAuth, ajuste redirects para o dominio publico:

```env
GOOGLE_OAUTH_REDIRECT_URI=https://SEU_DOMINIO/api/oauth/google/callback
GOOGLE_LOGIN_OAUTH_REDIRECT_URI=https://SEU_DOMINIO/api/oauth/google/login/callback
```

## 4) Build + start do app
No servidor:

```bash
cd /var/www/adflow
bash scripts/vps/deploy-app.sh
```

## 5) Publicar no dominio (Nginx)
No servidor:

```bash
sudo DOMAIN=SEU_DOMINIO bash scripts/vps/configure-nginx.sh
```

## 6) SSL (HTTPS)
No servidor:

```bash
sudo DOMAIN=SEU_DOMINIO EMAIL=seu-email@dominio.com bash scripts/vps/enable-ssl.sh
```

## 7) Validacao
- URL: `https://SEU_DOMINIO`
- Status processo:

```bash
pm2 status adflow
pm2 logs adflow --lines 200
```

## 8) Atualizacao de producao (deploy recorrente)
Opcao A: dentro da VPS

```bash
cd /var/www/adflow
bash scripts/vps/deploy-app.sh
```

Opcao B: do computador local (1 comando)

```bash
bash scripts/vps/quick-deploy.sh root@SEU_IP
```

Opcional:
- sem migracao no deploy: `RUN_MIGRATIONS=0 bash scripts/vps/quick-deploy.sh root@SEU_IP`
- branch especifica: `BRANCH=main bash scripts/vps/quick-deploy.sh root@SEU_IP`

## 9) Observacoes importantes
- Nao editar codigo direto na VPS. Fluxo correto: local -> commit/push -> deploy.
- Se segredos vazaram em conversas, rotacione imediatamente (Google, JWT, DB).
- O app usa `PORT` do `.env`; Nginx faz proxy para `127.0.0.1:3000`.

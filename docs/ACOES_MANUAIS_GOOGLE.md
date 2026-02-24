# Acoes Manuais - Google (Fazer Depois)

Ultima atualizacao: 2026-02-24 14:44:05 -0300

Objetivo:
- Ativar de forma real o Google Agenda e o Login com Google no AdFlow.

## 0) Acoes do Dono (controle rapido)

- [ ] Confirmar que o login por email redireciona direto para `/dashboard` sem ajuste manual da URL.
- [ ] Testar acesso manual em `/dashboard/` e validar que o app normaliza para `/dashboard`.
- [ ] Testar botao `Sair` e confirmar redirecionamento para `/login` sem erro.
- [ ] Confirmar que no logout nao aparece mensagem de erro antes da tela de login.
- [ ] Confirmar que apos login por email a tela nao some e entra direto no dashboard (sem precisar clicar ou mexer na tela).
- [ ] Confirmar que nao aparece mais o erro `Rendered more hooks than during the previous render`.
- [ ] Se ainda aparecer tela de erro, copiar o texto do stack exibido e me enviar.
- [ ] Me avisar resultado desse reteste para eu validar se precisamos de mais ajuste.

## 1) Google Cloud - Configuracao Inicial

- [ ] Criar ou selecionar um projeto no Google Cloud Console.
- [ ] Ativar API: `Google Calendar API`.
- [ ] Configurar `OAuth consent screen` (nome do app, email de suporte, dominios).
- [ ] Em ambiente de testes, adicionar seu email como `Test user`.

## 2) OAuth Client (Web)

- [ ] Criar credencial `OAuth Client ID` do tipo `Web application`.
- [ ] Em `Authorized redirect URIs`, cadastrar:
- [ ] `http://localhost:3000/api/oauth/google/callback`
- [ ] `http://localhost:3000/api/oauth/google/login/callback`

## 3) Variaveis de Ambiente no Projeto

No arquivo `.env`, preencher:

- [ ] `GOOGLE_CLIENT_ID=...`
- [ ] `GOOGLE_CLIENT_SECRET=...`
- [ ] Opcional: `GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback`
- [ ] Opcional: `GOOGLE_LOGIN_OAUTH_REDIRECT_URI=http://localhost:3000/api/oauth/google/login/callback`

## 4) Subir o Projeto Local

- [ ] Garantir banco rodando.
- [ ] Rodar `pnpm db:push` (ja executado hoje, repetir se precisar).
- [ ] Rodar `pnpm dev`.

## 5) Validacao Funcional

Google Agenda:
- [ ] Ir em `Agenda`.
- [ ] Clicar `Conectar Google`.
- [ ] Autorizar no Google.
- [ ] Voltar ao app e validar status `Conectado`.
- [ ] Testar `Sincronizar dia`.

Login Google:
- [ ] Ir em `/login`.
- [ ] Clicar `Entrar com Google`.
- [ ] Confirmar redirecionamento para `/dashboard` com sessao ativa.
- [ ] Testar logout e novo login com Google.

## 6) Se Der Erro de Redirect URI

- [ ] Verificar porta real do app (3000, 3001, etc).
- [ ] Atualizar URIs no Google Cloud para bater com a porta atual.
- [ ] Atualizar `.env` se estiver usando overrides de redirect.

## 7) Producao (quando for subir)

- [ ] Adicionar URIs HTTPS do dominio real:
- [ ] `https://SEU_DOMINIO/api/oauth/google/callback`
- [ ] `https://SEU_DOMINIO/api/oauth/google/login/callback`
- [ ] Publicar tela de consentimento (se necessario).

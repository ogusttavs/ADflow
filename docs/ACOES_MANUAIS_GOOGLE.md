# Acoes Manuais - Google (Execucao)

Ultima atualizacao: 2026-02-24 15:50:08 -0300

Objetivo:
- Ativar de forma real o Google Agenda e o Login com Google no AdFlow.

## 0) Acoes do Dono (controle rapido)

- [x] Confirmar que o login por email redireciona direto para `/dashboard` sem ajuste manual da URL.
- [x] Testar acesso manual em `/dashboard/` e validar que o app normaliza para `/dashboard`.
- [x] Testar botao `Sair` e confirmar redirecionamento para `/login` sem erro.
- [x] Confirmar que no logout nao aparece mensagem de erro antes da tela de login.
- [x] Confirmar que apos login por email a tela nao some e entra direto no dashboard (sem precisar clicar ou mexer na tela).
- [x] Confirmar que nao aparece mais o erro `Rendered more hooks than during the previous render`.
- [ ] Se ainda aparecer tela de erro, copiar o texto do stack exibido e me enviar.
- [x] Me avisar resultado desse reteste para eu validar se precisamos de mais ajuste.

## 1) Google Cloud - Configuracao Inicial

- [x] Criar ou selecionar um projeto no Google Cloud Console.
- [x] Ativar API: `Google Calendar API`.
- [x] Configurar `OAuth consent screen` (nome do app, email de suporte, dominios).
- [x] Em ambiente de testes, adicionar seu email como `Test user`.

## 2) OAuth Client (Web)

- [x] Criar credencial `OAuth Client ID` do tipo `Web application`.
- [x] Em `Authorized redirect URIs`, cadastrar:
- [x] `http://localhost:3000/api/oauth/google/callback`
- [x] `http://localhost:3000/api/oauth/google/login/callback`
- [x] `http://localhost:3001/api/oauth/google/callback`
- [x] `http://localhost:3001/api/oauth/google/login/callback`

## 3) Variaveis de Ambiente no Projeto

No arquivo `.env`, preencher:

- [x] `GOOGLE_CLIENT_ID=...`
- [x] `GOOGLE_CLIENT_SECRET=...`
- [x] Opcional: `GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3001/api/oauth/google/callback`
- [x] Opcional: `GOOGLE_LOGIN_OAUTH_REDIRECT_URI=http://localhost:3001/api/oauth/google/login/callback`
- [ ] Recomendado: gerar nova `GOOGLE_CLIENT_SECRET` no Google Cloud e atualizar no `.env`.

## 4) Subir o Projeto Local

- [x] Garantir banco rodando.
- [x] Rodar `pnpm db:push` (ja executado hoje, repetir se precisar).
- [x] Rodar `pnpm dev`.

## 5) Validacao Funcional

Google Agenda:
- [x] Ir em `Agenda`.
- [x] Clicar `Conectar Google`.
- [x] Autorizar no Google.
- [x] Voltar ao app e validar status `Conectado`.
- [x] Testar `Sincronizar dia` (retorno da API: `created: 0`, `skipped: 0` para data sem tarefas).

Login Google:
- [x] Ir em `/login`.
- [x] Clicar `Entrar com Google`.
- [x] Confirmar redirecionamento para `/dashboard` com sessao ativa.
- [x] Testar logout e novo login com Google.

## 6) Se Der Erro de Redirect URI

- [x] Verificar porta real do app (3000, 3001, etc).
- [x] Atualizar URIs no Google Cloud para bater com a porta atual.
- [x] Atualizar `.env` se estiver usando overrides de redirect.

## 7) Producao (quando for subir)

- [ ] Adicionar URIs HTTPS do dominio real:
- [ ] `https://SEU_DOMINIO/api/oauth/google/callback`
- [ ] `https://SEU_DOMINIO/api/oauth/google/login/callback`
- [ ] Publicar tela de consentimento (se necessario).

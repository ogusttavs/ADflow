# Checklist - Google OAuth em Producao

Atualizado em: 2026-03-06 10:19:29 -0300

Objetivo: fechar `A1` e `A2` da Sprint 2 sem depender de memoria de conversa.

## Estado atual validado

- Producao responde `302` em `https://getorbita.com.br/api/oauth/google/login`.
- O redirect atual vai para `accounts.google.com` com:
  - `client_id` configurado;
  - `redirect_uri=https://getorbita.com.br/api/oauth/google/login/callback`.
- Isso confirma que codigo + ambiente estao corretos.
- Pendencia restante: painel do Google Cloud.

## Valores que precisam existir no Google Cloud

### Authorized JavaScript origins

- `https://getorbita.com.br`

### Authorized redirect URIs

- `https://getorbita.com.br/api/oauth/google/login/callback`
- `https://getorbita.com.br/api/oauth/google/callback`

## A1 - Redirect URIs de producao

No Google Cloud Console, no OAuth Client usado pelo Orbita:

1. Abrir o client OAuth Web.
2. Confirmar `Authorized JavaScript origins` com:
   - `https://getorbita.com.br`
3. Confirmar `Authorized redirect URIs` com:
   - `https://getorbita.com.br/api/oauth/google/login/callback`
   - `https://getorbita.com.br/api/oauth/google/callback`
4. Salvar.

## A2 - Publicar app OAuth

Na tela de consentimento OAuth:

1. Confirmar dominio autorizado com `getorbita.com.br`.
2. Confirmar email de suporte e dados basicos do app.
3. Confirmar links exigidos pelo Google, se o painel pedir.
4. Mudar status de `Testing` para publico/publicado.
5. Salvar e publicar.

## Validacao apos painel

1. Abrir `https://getorbita.com.br/login`.
2. Clicar em login com Google.
3. Confirmar ida ao Google sem erro de `redirect_uri_mismatch`.
4. Confirmar retorno ao Orbita em `/dashboard?google_login=success`.
5. Testar tambem a conexao de Google Calendar se necessario.

## Evidencia tecnica atual

- `curl -I https://getorbita.com.br/api/oauth/google/login`
- Resultado esperado atual:
  - `302 Found`
  - `Location: https://accounts.google.com/...`
  - `redirect_uri=https://getorbita.com.br/api/oauth/google/login/callback`

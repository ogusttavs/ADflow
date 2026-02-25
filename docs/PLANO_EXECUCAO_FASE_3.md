# PLANO EXECUCAO FASE 3 - Auth e Email

Atualizado em: 2026-02-25 16:01:05 -0300

## Objetivo da fase

Fechar o ciclo de seguranca da conta do usuario com tres entregas:
- confirmacao de email no cadastro;
- recuperacao de senha (esqueci minha senha);
- troca de senha para usuario autenticado.

## Decisoes aprovadas (travadas)

- Provedor de email transacional: `Resend`.
- Fluxo de verificacao: `soft lock` (usuario entra no app, mas recebe popup de verificacao).
- Usuarios legados: tambem entram no fluxo de popup para verificar email.
- Arquitetura de tokens: tabela dedicada `auth_tokens` (nao usar colunas soltas em `users`).

## Ordem de implementacao

1. Item 11 - Troca de senha no app (baixo risco, sem dependencia de email).
2. Item 10 - Esqueci minha senha (token de reset + envio de email).
3. Item 09 - Confirmacao de email no cadastro + popup persistente de verificacao.

## Modelo de dados (Drizzle)

### Alteracoes em `users`

- `emailVerified`: boolean (default `false`).
- `emailVerifiedAt`: timestamp nullable.

Observacao de rollout:
- Usuarios existentes entram com `emailVerified=false` e recebem popup de verificacao ate concluir.

### Nova tabela `auth_tokens`

Campos minimos:
- `id` (int, PK, autoincrement).
- `userId` (int, not null).
- `type` (enum: `email_verification`, `password_reset`).
- `tokenHash` (varchar grande, not null).
- `expiresAt` (timestamp, not null).
- `usedAt` (timestamp nullable).
- `createdAt` (timestamp default now).

## Fluxo funcional por item

### Item 11 - Troca de senha dentro do app

Backend:
- Nova procedure `auth.changePassword` (`protectedProcedure`).
- Input: `currentPassword`, `newPassword`.
- Validar senha atual com `bcrypt.compare`.
- Persistir nova senha com `bcrypt.hash`.

Frontend:
- Formulario de seguranca em `Settings` para alterar senha.
- Exibir apenas para contas com login por email (`loginMethod` com email).

### Item 10 - Esqueci minha senha

Backend:
- `auth.requestPasswordReset` (public):
  - recebe email;
  - resposta sempre neutra (sem confirmar existencia de conta);
  - gera token raw, salva apenas `tokenHash` em `auth_tokens` com exp. curta (30-60 min);
  - envia link de reset por email.
- `auth.resetPassword` (public):
  - recebe `token` + `newPassword`;
  - valida hash, expiracao e uso;
  - atualiza `passwordHash`;
  - marca token como usado.

Frontend:
- Pagina `/forgot-password`.
- Pagina `/reset-password?token=...`.

### Item 09 - Confirmacao de email no cadastro

Backend:
- Ajustar `auth.register` para gerar token de verificacao e enviar email.
- Nova procedure `auth.verifyEmail` para consumir token.
- Nova procedure `auth.resendVerification` (com rate limit).
- Ao confirmar, atualizar `users.emailVerified=true` e `emailVerifiedAt`.

Frontend:
- Pagina `/verify-email?token=...`.
- Popup persistente no app para email nao verificado:
  - texto claro;
  - botao de reenviar link;
  - opcao para atualizar email se necessario.

## Seguranca obrigatoria

- Nunca salvar token raw no banco (somente hash).
- Token com expiracao curta e uso unico.
- Invalidez explicita para token expirado/usado.
- Resposta neutra no forgot password (evitar enumeracao de contas).
- Rate limit dedicado em:
  - `auth.requestPasswordReset`;
  - `auth.resetPassword`;
  - `auth.resendVerification`.
- Nao logar senha, token raw ou credenciais sensiveis.

## Infra de email

Implementar adaptador unico de envio (ex.: `server/_core/email.ts`):
- `production` com Resend.
- `development` com modo mock (log seguro do link sem quebrar fluxo).

Variaveis esperadas:
- `APP_BASE_URL`
- `EMAIL_PROVIDER` (`resend` | `mock`)
- `EMAIL_FROM`
- `RESEND_API_KEY`

## Checklist de execucao (marcar [x] durante desenvolvimento)

- [ ] Migration do banco (`users` + `auth_tokens`).
- [x] Adaptador de email (Resend + mock local).
- [x] Item 11 completo (backend + frontend).
- [x] Item 10 completo (backend + frontend + rate limit).
- [x] Item 09 completo (backend + frontend + popup + reenvio).
- [x] Validacoes finais: `pnpm check`, `pnpm test`, `pnpm build`.
- [ ] Atualizar docs operacionais (`TODO`, `CENTRO`, `LOG`) e registrar deploy.

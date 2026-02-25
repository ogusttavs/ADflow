# PLANO EXECUCAO FASE 3 - Auth e Email

Atualizado em: 2026-02-25 19:12:28 -0300

## Objetivo da fase

Fechar o ciclo de seguranca da conta do usuario com tres entregas:
- confirmacao de email no cadastro;
- recuperacao de senha (esqueci minha senha);
- troca de senha para usuario autenticado.

## Status consolidado da fase

- Implementacao de Sprint 3 concluida em codigo (itens 09, 10 e 11).
- Hardening adicional de conta/cadastro concluido em codigo para seguranca de dados pessoais.
- Validacao local consolidada verde:
  - `pnpm check`
  - `pnpm test` (66 testes)
  - `pnpm build`
- Operacao de email em producao preparada com Resend + scripts de automacao (`set-resend-env.sh` e `smoke-auth-email.sh`).
- Validacao manual de producao concluida (verificacao, reset, reenvio e teste de rate limit), fechando a Sprint 3 operacionalmente.

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

## Entregas por item base

### Item 11 - Troca de senha dentro do app

Backend:
- Nova procedure `auth.changePassword` (`protectedProcedure`).
- Input: `currentPassword`, `newPassword`.
- Validar senha atual com `bcrypt.compare`.
- Persistir nova senha com `bcrypt.hash`.

Frontend:
- Formulario de seguranca em `Settings` para alterar senha.
- Exibir apenas para contas com login por email (`loginMethod` com email).
- Se email nao verificado, troca de senha e bloqueada e o usuario recebe orientacao de verificacao.

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
  - botao de reenviar link.

## Hardening adicional entregue nesta fase

1. Cadastro ampliado com dados de perfil:
- nome, sobrenome, whatsapp, cidade, endereco, origem, idioma preferido, CPF/CNPJ e opt-in de comunicacao.

2. Protecao de PII:
- CPF/CNPJ protegido no backend com criptografia AES-256-GCM;
- suporte a chave dedicada `USER_PII_ENCRYPTION_KEY` (fallback seguro para `CREDENTIAL_ENCRYPTION_KEY`).

3. Conta em modo leitura por padrao:
- dados carregam persistidos e so entram em modo edicao ao clicar `Editar`.

4. Validacao real de CPF/CNPJ:
- validacao por digitos verificadores (nao apenas tamanho), no cadastro, conta e fluxo de recuperacao de email.

5. Politica de senha forte obrigatoria:
- minimo 8 caracteres;
- sem espacos;
- exige maiuscula, minuscula, numero e caractere especial;
- aplicada em cadastro, reset e troca.

6. Regras de login para email nao verificado:
- bloqueio de novo login sem verificacao de email;
- expurgo de conta nao verificada apos 7 dias.

7. Fluxo "Esqueci meu email":
- nova rota `/forgot-email`;
- recuperacao por CPF/CNPJ validado com rate limit dedicado.

8. Performance no cadastro:
- envio de verificacao movido para fluxo assincrono para reduzir tempo de resposta pos-cadastro.

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
- `USER_PII_ENCRYPTION_KEY` (recomendado para isolamento de segredo PII)

## Operacao de producao (runbook aplicado)

- Script de ENV de email na VPS: `scripts/vps/set-resend-env.sh`
- Script de smoke operacional: `scripts/vps/smoke-auth-email.sh`
- Deploy rapido remoto: `scripts/vps/quick-deploy.sh`
- Runbook detalhado: `docs/DEPLOY_VPS.md`

## Checklist de fechamento da Sprint 3

- [x] Migration do banco (`users` + `auth_tokens` + extensoes de perfil).
- [x] Adaptador de email (Resend + mock local).
- [x] Item 11 completo (backend + frontend).
- [x] Item 10 completo (backend + frontend + rate limit).
- [x] Item 09 completo (backend + frontend + popup + reenvio).
- [x] Hardening adicional de conta/cadastro/PII (CPF-CNPJ, senha forte, login gate, forgot email).
- [x] Validacoes finais locais: `pnpm check`, `pnpm test`, `pnpm build`.
- [x] Documentacao operacional sincronizada (`TODO`, `CENTRO`, `LOG`).
- [x] Validacao manual final em producao (checklist de browser + rate limit com 429).

# TODO - Lancamento Orbita (Backlog Oficial)

Atualizado em: 2026-02-25 19:12:28 -0300

Este e o backlog oficial do projeto.

## Regra obrigatoria de manutencao
- Ao concluir tarefa: marcar imediatamente aqui.
- Ao criar tarefa nova: adicionar imediatamente aqui.
- Nao usar outro arquivo paralelo como backlog principal.

## Status geral
- Fase A: em andamento (Sprints 1 e 2 concluidas em producao; Sprint 3 concluida, deployada em producao no release `5efe746` e validada manualmente em fluxo real de email).

---

## FASE A - Estruturacao e base de lancamento

### Sprint 1 - Limpeza

- [x] 01. Ocultar Familia & Equipe temporariamente na interface (manter backend para reativacao futura)
Status atual: concluido. Modulo oculto na interface; backend/rotas preservados para uso futuro.

- [x] 02. Ocultar Campanhas e IA de campanhas em todos os planos
Status atual: concluido. Rotas/CTAs/onboarding e acessos principais ocultados no frontend; backend preservado para reativacao futura.

- [x] 03. Remover assistente de voz basico (VoiceCommandButton)
Status atual: concluido. Assistente desativado no layout por flag de feature, sem remocao destrutiva de codigo.

- [x] 04. Corrigir onboarding navigation (`window.location.hash` -> `navigate()`)
Status atual: concluido. Onboarding agora usa `navigate()` em vez de alterar `window.location.hash`.

### Sprint 2 - Seguranca

- [x] 05. Rate limiting no auth (`express-rate-limit`)
Status atual: concluido. Limites aplicados em `auth.login` (10/15min) e `auth.register` (5/1h), com `trust proxy` ativo para ambiente com Nginx e suporte a path/batch do tRPC.

- [x] 06. Security headers (`helmet`) em `server/_core/index.ts`
Status atual: concluido. `helmet` aplicado antes das rotas com `contentSecurityPolicy: false` e `crossOriginEmbedderPolicy: false` para evitar regressao imediata.

- [x] 07. JWT expiry: 1 ano -> 7 dias (`server/_core/sdk.ts`)
Status atual: concluido. Sessao padrao migrada para `SESSION_DURATION_MS` (7 dias) em login, cadastro e callback Google OAuth (token + cookie `maxAge`).

- [x] 08. Encrypt credenciais de cliente (AES-256) em `server/routers/credentials.ts`
Status atual: concluido. Credenciais agora usam AES-256-GCM com chave `CREDENTIAL_ENCRYPTION_KEY`, fallback para legado plaintext na leitura e erro explicito quando chave estiver ausente/invalida.

- [x] 08b. Hardening pós-revisao da Sprint 2
Status atual: concluido. Adicionado rate limit global de API (`200 req/min` em `/api`) e `.env.example` alinhado com `VITE_APP_ID=orbita` sem bloco AWS legado.

### Sprint 3 - Auth e Email

- [x] 09a. Plano tecnico da Sprint 3 aprovado
Status atual: concluido. Documento `docs/PLANO_EXECUCAO_FASE_3.md` criado com decisoes travadas (Resend, soft lock, popup para verificacao e tabela `auth_tokens`).

- [x] 09. Confirmacao de email no cadastro
Status atual: concluido e em producao. Cadastro gera token de verificacao e dispara email; procedures `auth.verifyEmail` e `auth.resendVerification` ativas; rota `/verify-email` e popup de verificacao (`soft lock`) ativos.

- [x] 09b. Cadastro ampliado com dados de perfil e consentimento
Status atual: concluido em codigo. Cadastro agora coleta nome, sobrenome, email, WhatsApp, cidade, endereco, origem, idioma, CPF/CNPJ e opt-in de comunicacoes, persistindo no banco com dados sensiveis protegidos.

- [x] 10. "Esqueci minha senha" no login
Status atual: concluido e em producao. Procedures `auth.requestPasswordReset` e `auth.resetPassword` ativas, paginas `/forgot-password` e `/reset-password` publicadas, hash de token em `auth_tokens` e rate limit especifico.

- [x] 11. Troca de senha dentro do app
Status atual: concluido e em producao. `auth.changePassword` ativo no backend (senha atual + hash bcrypt da nova senha) e aba "Segurança" publicada em `Settings` para contas com login por email.

- [x] 11b. Troca de senha exige email verificado
Status atual: concluido em codigo. Backend bloqueia `auth.changePassword` para contas sem verificacao de email e frontend exibe acao de reenvio de verificacao antes da troca.

- [x] 11c. Area Conta em modo leitura por padrao
Status atual: concluido em codigo. Tela de Conta agora abre persistida em modo somente leitura; campos so liberam edicao ao clicar em `Editar`, com `Cancelar`/`Salvar` e persistencia real no banco.

- [x] 11d. Validacao real de CPF/CNPJ no cadastro e na conta
Status atual: concluido em codigo. Backend e frontend agora validam CPF/CNPJ por algoritmo (digitos verificadores), nao apenas por tamanho.

- [x] 11e. Politica de senha forte obrigatoria
Status atual: concluido em codigo. Cadastro, reset e troca de senha exigem 8+ caracteres, sem espacos, com maiuscula, minuscula, numero e caractere especial.

- [x] 11f. Bloqueio de login para email nao verificado + expiração de conta
Status atual: concluido em codigo. Usuario nao verificado nao consegue novo login; contas sem verificacao por 7 dias sao expurgadas (cleanup em login/sessao e rotina periodica no servidor).

- [x] 11g. Fluxo "Esqueci meu email" no login
Status atual: concluido em codigo. Nova rota `/forgot-email` e procedure `auth.recoverEmailByTaxId` para recuperar email por CPF/CNPJ validado, com rate limit dedicado.

- [x] 11h. Cadastro mais rapido apos criar conta
Status atual: concluido em codigo. Envio de email de verificacao no cadastro foi movido para fluxo assincrono (nao bloqueia resposta de criacao de conta).

### Sprint 4 - Pagamentos e Planos

- [ ] 12. Integrar Asaas + webhooks
- [ ] 13. Migration: `plan`, `planExpiry`, `planStatus` em `users`
- [ ] 14. Guards frontend por plano
- [ ] 15. Guards backend por plano (middleware tRPC)

### Sprint 5 - Features novas

- [ ] 16. Registro de ideias (texto + audio)
- [ ] 17. Categorias em tarefas
- [ ] 18. Categorias em agenda
- [ ] 19. Integracao API de tempo
- [ ] 20. Integracao Spotify no Pomodoro
- [ ] 21. Personalizacao de notificacoes/popups

### Sprint 6 - Onboarding e Ajuda

- [ ] 22. Mensagem de primeiro acesso + tutorial guiado
- [ ] 23. Central de ajuda por funcionalidade

### Sprint 7 - Admin e Email marketing

- [ ] 24. Dashboard admin (usuarios, planos, vencimentos)
- [ ] 25. Fluxo de email marketing (D1/D3/D7, expiracao, retencao)
- [ ] 26. Configurar ferramenta de email (Brevo ou Resend)

### Sprint 8 - Branding e Design

- [x] 27. Logo + favicon Orbita
Status atual: concluido. `client/public/favicon.svg` e `client/public/logo-icon.svg` criados (orbital ring, azul #1741C6). Favicon linkado no index.html. Icone Zap substituido pelo logo SVG na sidebar e mobile header.

- [x] 28. Rename completo AdFlow -> Orbita
Status atual: concluido. 13 substituicoes em codigo ativo (localStorage keys, UI, AI prompt, Google Calendar events, OAuth cookies, env default, package.json name, analytics). grep -r AdFlow|adflow client/src server/ = zero resultados.

- [x] 28b. Remocao de codigo morto e deps sem uso
Status atual: concluido. Deletados: ComponentShowcase.tsx (155 linhas), ManusDialog.tsx (89 linhas), Map.tsx (155 linhas). Deps axios e @aws-sdk ja ausentes do package.json.

- [ ] 29. Design overhaul (sem cara de template generico)
- [ ] 30. Cards compartilhaveis para redes sociais

### Sprint 9 - LP

- [ ] 31. Landing page Orbita com pricing dos 4 planos

### Operacional - Documentacao e governanca

- [x] 32. Oficializar `docs/DECISOES_PRODUTO.md` como referencia para decisoes de produto
Status atual: concluido. Documento integrado na hierarquia oficial (`AGENTS`, `LEIA_PRIMEIRO` e `CENTRO`).

- [x] 33. Ocultar no menu lateral todos os itens marcados como "Em breve"
Status atual: concluido. Itens desabilitados nao sao mais renderizados na UI (desktop/mobile), mantendo estrutura para reativacao futura.

- [x] 34. Alinhar nomenclaturas da sidebar e da tela de Configuracoes com o Orbita atual
Status atual: concluido. Subdivisoes do menu renomeadas e configuracoes revisadas para rotina/negocio (sem fluxos de campanhas obsoletos).

- [x] 35. Fechar baseline funcional do que esta visivel no app para demo publica
Status atual: concluido. Configuracoes com persistencia real (incluindo metas), onboarding alinhado aos modulos ativos, datas em timezone local, LP/login com branding Orbita e textos ajustados para escopo atual.

- [x] 36. Definir tema inicial escuro e alinhar LP ao que o app entrega hoje
Status atual: concluido. `ThemeProvider` agora inicia em dark por padrao e a Home comunica apenas modulos ativos no Orbita.

---

## Acoes do dono (fora do codigo)

- [ ] A1. Google Cloud: adicionar redirect URIs de producao
- [ ] A2. Google Cloud: publicar app OAuth (sair de Testing)
- [ ] A3. Rotacionar credenciais e atualizar `.env` no servidor
- [x] A4. Configurar `CREDENTIAL_ENCRYPTION_KEY` em producao
- [x] A5. Definir dominio final da marca Orbita
- [ ] A6. Criar conta Asaas e configurar webhook
- [x] A7. Liberar acesso SSH de deploy (chave/usuario) para executar `quick-deploy` remoto
- [x] A8. Configurar Resend em producao (dominio/DNS + `RESEND_API_KEY` + `EMAIL_FROM` + `EMAIL_PROVIDER=resend`)
Status atual: concluido. ENV operacional aplicado na VPS (`APP_BASE_URL`, `EMAIL_PROVIDER=resend`, `EMAIL_FROM`, `RESEND_API_KEY`), smoke executado e checklist manual de browser concluido (verificacao, reset, reenvio e rate limit).
- [x] A9. Definir `USER_PII_ENCRYPTION_KEY` dedicado na VPS (recomendado)
Status atual: concluido. Chave dedicada configurada na VPS com tamanho valido (32 bytes/64 hex), app online e sem erro de runtime relacionado.

### Proximas tarefas do dono (ordem sugerida)

1. A1 + A2 (Google OAuth em producao)
- Adicionar redirect URIs de producao e publicar o app fora de `Testing`.

2. A6 (Asaas)
- Criar conta, gerar chave/API e configurar webhook de producao.

3. A3 (rotacao de segredos)
- Rotacionar credenciais sensiveis do servidor (`JWT_SECRET`, OAuth client secret e demais chaves operacionais).

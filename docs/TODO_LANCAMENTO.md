# TODO - Lancamento Orbita (Backlog Oficial)

Atualizado em: 2026-02-25 14:23:54 -0300

Este e o backlog oficial do projeto.

## Regra obrigatoria de manutencao
- Ao concluir tarefa: marcar imediatamente aqui.
- Ao criar tarefa nova: adicionar imediatamente aqui.
- Nao usar outro arquivo paralelo como backlog principal.

## Status geral
- Fase A: em andamento (Sprints 1 e 2 concluidas; branding concluido; Sprint 3 pendente).

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

- [ ] 09. Confirmacao de email no cadastro
- [ ] 10. "Esqueci minha senha" no login
- [ ] 11. Troca de senha dentro do app

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
- [ ] A4. Configurar `CREDENTIAL_ENCRYPTION_KEY` em producao
- [x] A5. Definir dominio final da marca Orbita
- [ ] A6. Criar conta Asaas e configurar webhook
- [ ] A7. Liberar acesso SSH de deploy (chave/usuario) para executar `quick-deploy` remoto

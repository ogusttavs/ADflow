# TODO - Lancamento Orbita (Backlog Oficial)

Atualizado em: 2026-02-25 09:56:07 -0300

Este e o backlog oficial do projeto.

## Regra obrigatoria de manutencao
- Ao concluir tarefa: marcar imediatamente aqui.
- Ao criar tarefa nova: adicionar imediatamente aqui.
- Nao usar outro arquivo paralelo como backlog principal.

## Status geral
- Fase A: em andamento (Sprint 1 concluida; Sprint 2 pendente).

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

- [ ] 05. Rate limiting no auth (`express-rate-limit`)
- [ ] 06. Security headers (`helmet`) em `server/_core/index.ts`
- [ ] 07. JWT expiry: 1 ano -> 7 dias (`server/_core/sdk.ts`)
- [ ] 08. Encrypt credenciais de cliente (AES-256) em `server/routers/credentials.ts`

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

- [ ] 27. Logo + favicon Orbita
- [ ] 28. Rename completo AdFlow -> Orbita
- [ ] 29. Design overhaul (sem cara de template generico)
- [ ] 30. Cards compartilhaveis para redes sociais

### Sprint 9 - LP

- [ ] 31. Landing page Orbita com pricing dos 4 planos

### Operacional - Documentacao e governanca

- [x] 32. Oficializar `docs/DECISOES_PRODUTO.md` como referencia para decisoes de produto
Status atual: concluido. Documento integrado na hierarquia oficial (`AGENTS`, `LEIA_PRIMEIRO` e `CENTRO`).

---

## Acoes do dono (fora do codigo)

- [ ] A1. Google Cloud: adicionar redirect URIs de producao
- [ ] A2. Google Cloud: publicar app OAuth (sair de Testing)
- [ ] A3. Rotacionar credenciais e atualizar `.env` no servidor
- [ ] A4. Configurar `CREDENTIAL_ENCRYPTION_KEY` em producao
- [ ] A5. Definir dominio final da marca Orbita
- [ ] A6. Criar conta Asaas e configurar webhook

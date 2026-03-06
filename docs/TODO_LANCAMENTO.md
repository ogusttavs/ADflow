# TODO - Lancamento Orbita (Backlog Oficial)

Atualizado em: 2026-03-06 09:14:54 -0300

Este e o backlog oficial do projeto.

## Regra obrigatoria de manutencao
- Ao concluir tarefa: marcar imediatamente aqui.
- Ao criar tarefa nova: adicionar imediatamente aqui.
- Nao usar outro arquivo paralelo como backlog principal.

## Status geral
- Fase A: em andamento (Sprints 1 e 2 concluidas em producao; Sprint 3 concluida e sucedida pelo release `5cded29` em producao com o novo funil Kiwify; pagamentos da Sprint 4 agora com foco oficial em Kiwify e validacao real de webhook).
- Sprint final de fechamento criado no backlog: revisao completa de seguranca, performance e SEO antes do encerramento do ciclo.

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

- [x] 11i. UX de cadastro reforcada (telefone/CEP/origem/CPF/senha)
Status atual: concluido em codigo. Cadastro agora tem pais + DDI automatico no WhatsApp, CEP com busca de endereco (Brasil) para completar complemento, opcoes de origem da lead (`Onde conheceu a Orbita?`), formatacao de CPF/CNPJ no blur e confirmacao obrigatoria de senha.

- [x] 11j. Primeiro acesso sem popup de resumo de ontem
Status atual: concluido em codigo. Popup diario foi condicionado ao onboarding concluido; no primeiro acesso o foco fica no onboarding passo a passo de boas-vindas.

### Sprint 4 - Pagamentos e Planos

- [x] 12a. Plano tecnico da Sprint 4 aprovado e documentado
Status atual: concluido. Documento `docs/PLANO_EXECUCAO_FASE_4.md` criado com ordem de implementacao, hard gates de seguranca e validacao em sandbox antes de producao.

- [ ] 12. Integrar Kiwify + webhooks
Status atual: parcialmente concluido em codigo + producao (2026-03-06). Links reais de checkout por plano e token de webhook foram definidos no ambiente local; backend com token + idempotencia ja ativo; fluxo publico `auth.registerForCheckout` passou a criar conta com plano pendente e devolver checkout Kiwify para a landing; checkout agora sai com prefill automatico de `name/email/phone/cpf` usando os dados ja coletados no Orbita; funil tambem ganhou `checkoutCompletionToken` + pagina publica `/obrigado` para coletar dados complementares depois do pagamento; a tela `/obrigado` agora possui preview via `/obrigado?preview=1` para QA sem compra; validacao local fechada com `pnpm test` (89 testes), `pnpm exec tsc --noEmit`, `pnpm exec vite build` e smoke HTTP em `localhost:3000`; release `5cded29` ja esta em producao com PM2 online; pendente validar evento real no painel Kiwify e confirmar mudanca de status via webhook em um pagamento aprovado.
- [x] 12c. Definir estrategia de checkout da Orbita (hosted Kiwify vs checkout proprio)
Status atual: decisao tomada. Manter checkout hospedado da Kiwify no lancamento; checkout visual proprio fica para pos-lancamento, apenas se continuar valendo a pena.
- [x] 13. Migration: `plan`, `planExpiry`, `planStatus` em `users`
Status atual: concluido em codigo. Campos de plano adicionados no `drizzle/schema.ts`, migration `drizzle/0010_secret_stature.sql` gerada e `auth.me` passando `plan/planStatus/planExpiry`.
- [x] 13b. Aplicar migration da Sprint 4 no banco de producao (`pnpm db:push`) e validar colunas em `users`
Status atual: concluido em 2026-03-06 no deploy do release `5cded29`. `db:push` executado na VPS e colunas `plan`, `planStatus` e `planExpiry` confirmadas em `users`.
- [x] 14. Guards frontend por plano
Status atual: concluido em codigo. Criados `usePlanAccess`, `PlanGate` e `UpgradePlanModal`, com bloqueio visual em rotas modulares (`Clients`, `ClientDetail`, `CRM`, `Prospecting`) e abertura de CTA de upgrade tambem em erro `UPGRADE_REQUIRED` da API.
- [x] 14b. Upsell interno ao clicar em "Ver planos"
Status atual: concluido em codigo. Botao do `UpgradePlanModal` agora abre `Settings` na aba `Planos` (`/settings?tab=plans`), com cards de oferta por plano e CTA de contratacao dentro do app.
- [x] 14c. Refinar UX de planos para conta pessoal (sem sinalizacao Business no menu) + corrigir abas de Configuracoes
Status atual: concluido em codigo. Itens business agora ficam ocultos para plano pessoal na sidebar/customizacao, mensagens de bloqueio removem rótulo "Business" e as abas de `Settings` foram corrigidas para trocar conteudo corretamente (sincronizacao por `window.location.search`).
- [x] 14d. Remover destaque visual de "plano recomendado" na tela de Planos
Status atual: concluido em codigo. Cards de planos em `Settings` nao exibem mais badge/ring de destaque e todos os CTAs estao neutros (sem plano em evidência).
- [x] 15. Guards backend por plano (middleware tRPC)
Status atual: concluido em codigo. Middleware `planProcedure` criado no tRPC com regra compartilhada (`shared/planAccess.ts`) e aplicado em `clientsRouter` e `crmRouter`, retornando `FORBIDDEN` com `UPGRADE_REQUIRED` para plano sem acesso.

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

- [x] 31. Landing page Orbita com pricing dos 4 planos
Status atual: concluido em codigo. A home agora mostra os 4 planos com CTA por plano; o usuario escolhe na LP, segue para cadastro com plano preselecionado e vai direto ao checkout Kiwify antes de acessar a plataforma.

### Sprint 10 - Revisao final (Seguranca, Velocidade e SEO)

- [ ] 37. Revisao final de seguranca de dados sensiveis (PII)
Status esperado: criptografia em repouso para PII critica (incluindo endereco), minimizacao de dados retornados por endpoint e checklist de risco residual.

- [ ] 38. Revisao de sessao/cookies/CSRF/CSP para producao
Status esperado: politica final de cookie e CSP revisada para reduzir superficie de ataque sem quebrar fluxo do app.

- [ ] 39. Auditoria de logs e segredos
Status esperado: ausencia de segredos/tokens/PII em logs, `env` saneado e plano de rotacao recorrente de chaves validado.

- [ ] 40. Baseline de performance frontend (Core Web Vitals)
Status esperado: metas de LCP/INP/CLS definidas e atingidas para a home e telas criticas.

- [ ] 41. Otimizacao de bundle e carregamento inicial
Status esperado: reducao do JS inicial (code splitting/manual chunks) e queda no tempo de carregamento percebido.

- [ ] 42. Auditoria de consultas e latencia de API
Status esperado: endpoints criticos com latencia monitorada e sem gargalos evidentes de banco.

- [ ] 43. SEO tecnico base (sitemap, robots, canonicals)
Status esperado: indexacao controlada e estrutura tecnica SEO pronta para crescimento organico.

- [ ] 44. Metatags sociais (Open Graph/Twitter) e snippets
Status esperado: compartilhamento com preview correto e consistente nas paginas publicas.

- [ ] 45. Dados estruturados (Schema.org) para paginas publicas
Status esperado: markup estruturado valido para melhorar entendimento em buscadores.

- [ ] 46. Auditoria final de release (seguranca + performance + SEO)
Status esperado: checklist final assinado antes de declarar encerramento geral da fase.

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

- [x] 47. Sistema de documentacao V2 com log por acao (autor humano/IA), template e guardrails
Status atual: concluido em docs + scripts. Novo arquivo `docs/SISTEMA_DOCUMENTACAO.md`, template `docs/TEMPLATE_LOG_ACAO.md`, script `scripts/docs/log-action.sh` e validacao automatica do formato de log em hook/CI.

- [x] 48. Restaurar cadastro local e hardening de startup para banco indisponivel
Status atual: concluido em codigo + ambiente local. Cadastro local voltou a funcionar apos configurar `DATABASE_URL` e aplicar `pnpm db:push`; backend agora executa health check de banco no startup e falha rapido em producao se DB estiver indisponivel. Em 2026-03-06, a conta local do dono `gustavosilva585@gmail.com` tambem foi confirmada manualmente no banco para seguir o QA sem envio real de email. O modo full stack local estavel passou a usar `pnpm dev:web` (`localhost:3000`) + `pnpm dev:api` (`localhost:3001`) com proxy `/api`.

- [ ] 49. Sanear ambiente local fora de pasta sincronizada e reinstalar dependencias da arvore principal
Status esperado: remover a dependencia do espelho temporario `/private/tmp/ADflow-local-run`, garantir `node_modules` integro na copia principal e manter `pnpm dev`/`pnpm dev:web`/`pnpm dev:api` operacionais sem corrupcao de arquivos.

---

## Acoes do dono (fora do codigo)

- [ ] A1. Google Cloud: adicionar redirect URIs de producao
- [ ] A2. Google Cloud: publicar app OAuth (sair de Testing)
- [x] A3. Rotacionar credenciais e atualizar `.env` no servidor
Status atual: concluido (confirmado pelo dono).
- [x] A4. Configurar `CREDENTIAL_ENCRYPTION_KEY` em producao
- [x] A5. Definir dominio final da marca Orbita
- [ ] A6. Configurar Kiwify e webhook oficial
Status atual: em andamento. Links dos 4 planos e token webhook ja definidos para operacao local e release `5cded29` ja publicado em producao; falta validar evento real da Kiwify no endpoint oficial e fechar controle de IP observado para opcional `KIWIFY_WEBHOOK_ALLOWED_IPS`. Nao foi localizada documentacao oficial de sandbox publico para checkout, entao a validacao final deve usar compra real controlada.
- [x] A7. Liberar acesso SSH de deploy (chave/usuario) para executar `quick-deploy` remoto
- [x] A8. Configurar Resend em producao (dominio/DNS + `RESEND_API_KEY` + `EMAIL_FROM` + `EMAIL_PROVIDER=resend`)
Status atual: concluido. ENV operacional aplicado na VPS (`APP_BASE_URL`, `EMAIL_PROVIDER=resend`, `EMAIL_FROM`, `RESEND_API_KEY`), smoke executado e checklist manual de browser concluido (verificacao, reset, reenvio e rate limit).
- [x] A9. Definir `USER_PII_ENCRYPTION_KEY` dedicado na VPS (recomendado)
Status atual: concluido. Chave dedicada configurada na VPS com tamanho valido (32 bytes/64 hex), app online e sem erro de runtime relacionado.

### Proximas tarefas do dono (ordem sugerida)

1. A6 (Kiwify)
- Configurar checkout hospedado + webhook no painel Kiwify, validar entrega de eventos e confirmar atualizacao de status de pagamento/assinatura no backend.
- Coletar IPs reais recebidos no webhook para decidir ativacao do bloqueio `KIWIFY_WEBHOOK_ALLOWED_IPS`.

2. A1 + A2 (Google OAuth em producao)
- Adicionar redirect URIs de producao e publicar o app fora de `Testing`.

3. Rotacao recorrente de segredos (operacional)
- Definir periodicidade para rotacao de credenciais sensiveis do servidor (`JWT_SECRET`, OAuth client secret e demais chaves operacionais).

### Checklist de retomada (proximo dia)

1. Validar no browser local o checkout abrindo link Kiwify para pelo menos 2 planos diferentes.
   Confirmar se `name/email/phone/cpf` chegam preenchidos no checkout.
   Confirmar se o retorno para `/obrigado` funciona no mesmo navegador e se a sessao so libera apos o webhook marcar o plano como ativo.
   Revisar tambem o preview visual em `/obrigado?preview=1`.
2. Configurar/confirmar webhook da Kiwify e disparar evento real para validar mudanca de `planStatus`.
   Configurar no painel a pagina externa de obrigado para `https://getorbita.com.br/obrigado`.
3. Registrar IP de origem recebido no primeiro webhook real e decidir se ativa `KIWIFY_WEBHOOK_ALLOWED_IPS`.
4. Validar no browser a tela de planos sem destaque de "recomendado" em nenhum card.
5. Confirmar decisao do item `12c` em todos os docs operacionais (hosted Kiwify no lancamento).
6. Se tudo OK na validacao controlada, preparar roteiro de migracao controlada para producao (sem virar chave ainda).
7. Sanear a copia principal local do repo fora de `Documents`/File Provider ou reinstalar dependencias de forma definitiva, para aposentar o espelho temporario `/private/tmp/ADflow-local-run`.

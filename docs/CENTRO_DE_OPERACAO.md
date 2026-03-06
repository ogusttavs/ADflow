# Centro de Operacao - Orbita

Atualizado em: 2026-03-06 09:54:39 -0300

Este arquivo e a fonte oficial de operacao do projeto.

## 1) Governanca atual

Papeis:
- Dono do produto (voce): decisao final de prioridade, escopo e release.
- Codex: dev principal (execucao, triagem, implementacao, deploy, atualizacao de docs).
- Claude: consultor tecnico (arquitetura, revisao critica, aconselhamento).
- Gemini: fora do projeto.

Estado de disponibilidade:
| Papel | Estado |
|---|---|
| Codex (dev principal) | Ativo |
| Claude (consultor) | Disponivel (`Claude +`) |

Comandos operacionais:
- `Claude +`: consultor disponivel novamente.
- `Claude -`: consultor indisponivel; Codex segue a execucao sem bloqueio.

## 2) Regras obrigatorias

- Toda acao relevante (humano ou IA) exige nova entrada em `docs/LOG_AGENTES.md` no formato V2.
- Toda alteracao relevante (codigo, infra, testes, deploy, commit/push) exige update de:
  - `docs/CENTRO_DE_OPERACAO.md`
  - `docs/LOG_AGENTES.md`
- `docs/TODO_LANCAMENTO.md` e o backlog oficial: ao concluir tarefa ou criar nova tarefa, atualizar imediatamente.
- Guardrail automatico local/CI exige:
  - `LOG` em todo commit;
  - `CENTRO` + `TODO` quando houver mudanca fora de `docs/`;
  - formato V2 valido nas entradas novas do log.
- Nao manter decisoes duplicadas em arquivos diferentes com versoes conflitantes.
- Nao registrar segredo real em `docs/`.

## 3) Fluxo oficial de execucao

1. Ler `docs/SISTEMA_DOCUMENTACAO.md` e `docs/TODO_LANCAMENTO.md`.
2. Executar tarefa prioritaria.
3. Validar (`pnpm check`, `pnpm test`, `pnpm build`) quando aplicavel.
4. Registrar no `LOG_AGENTES` (formato V2).
5. Atualizar `TODO` (status da tarefa).
6. Atualizar este `CENTRO` se houver mudanca de estado/processo.

## 4) Fonte de verdade por documento

- `docs/TODO_LANCAMENTO.md`: o que fazer agora e o status de cada tarefa.
- `docs/LOG_AGENTES.md`: log cronologico por acao (humano e IA).
- `docs/SISTEMA_DOCUMENTACAO.md`: padrao oficial de documentacao e formato de log.
- `docs/DEPLOY_VPS.md`: operacao de producao/VPS.
- `docs/DECISOES_PRODUTO.md`: decisoes de produto vigentes (priorizacao e escopo).
- `docs/ESTRATEGIA_MERCADO_UX_SEGURANCA.md`: base de pesquisa e criterios estrategicos.
- `docs/PLANO_EXECUCAO_FASE_3.md`: plano de implementacao da Sprint 3 (Auth e Email).
- `docs/PLANO_EXECUCAO_FASE_4.md`: plano de implementacao da Sprint 4 (Pagamentos e Planos).
- `docs/IDEIAS_PRODUTO.md`: banco de ideias de produto (nao substitui o backlog oficial).
- `docs/LEIA_PRIMEIRO.md`: mapa rapido da documentacao.
- `docs/ARQUIVO/*`: historico antigo (nao usar como regra operacional diaria).

## 5) Snapshot tecnico atual

Stack:
- Frontend: React + Vite + Tailwind + Radix + React Query + wouter
- Backend: Node + Express + tRPC + Zod
- Banco: MySQL + Drizzle ORM

Comandos principais:
- `pnpm dev`
- `pnpm check`
- `pnpm test`
- `pnpm build`
- `pnpm db:push`

Producao:
- Dominio ativo: `https://getorbita.com.br`
- Dominio anterior: `https://metrizy.com.br`
- App em PM2 + Nginx + SSL

## 6) Situacao real (agora)

Estado atual de desenvolvimento:
- Fase atual oficial: ciclo reiniciado apos o funil Kiwify.
- Ordem oficial de trabalho reindexada a partir do estado atual:
  - 1) Sprint 1: onboarding, primeiro acesso e ajuda minima;
  - 2) Sprint 2: pendencias operacionais de lancamento (`A1`, `A2`, item `49` e QA interno controlado);
  - 3) Sprint 3: admin, retencao e email marketing;
  - 4) Sprint 4: marca, LP e auditoria final;
  - 5) Sprint 5: validacao real em producao (Kiwify + webhook + pagamentos reais);
  - 6) Sprint 6: ideias novas e expansao.
- Regra oficial de backlog: nova ideia nao entra na fila principal; primeiro vai para `docs/IDEIAS_PRODUTO.md` e so pode subir para execucao quando promovida explicitamente para a Sprint 6 do ciclo atual.
- A transicao para o plano `Orbita - Fase A` segue ativa com Sprint 1 e Sprint 2 concluidas.
- Modulo Familia & Equipe esta oculto na interface por decisao de produto, com backend preservado para reativacao futura.
- Modulo Campanhas/IA de campanhas esta oculto no frontend (rotas, CTAs, onboarding e atalhos), mantendo backend para reativacao futura.
- Itens de menu marcados como "Em breve" foram ocultados da barra lateral (desktop/mobile), mantendo declaracao no codigo para liberar depois.
- Sidebar e Configuracoes foram alinhadas com a realidade atual do Orbita (nomenclatura e textos sem dependencias de campanhas desativadas).
- Configuracoes agora persistem preferencias locais reais (conta, alertas, rotina, metas e pagina inicial).
- Onboarding do dashboard foi alinhado 100% aos modulos ativos/visiveis (clientes, rotina, CRM, financeiro, configuracoes).
- Fluxos diarios em frontend usam chave de data local; backend ainda possui pontos com `toISOString` para tratar na trilha de hardening.
- Landing page/login alinhados ao branding Orbita e ao escopo funcional atual para demo publica.
- Landing page comercial atualizada para exibir os 4 planos e iniciar o funil `plano -> cadastro -> checkout` antes do acesso ao app.
- Tema inicial do app definido como escuro por padrao para novos acessos.
- Landing page atualizada para comunicar apenas modulos realmente ativos no produto hoje.

Pendencias tecnicas objetivas:
- Validacao de baseline verde confirmada: `pnpm check`, `pnpm test` e `pnpm build` executados com sucesso.
- Sprint 2 (Seguranca) concluida: `helmet`, rate limiting em auth, sessao JWT de 7 dias e criptografia AES-256-GCM em credenciais.
- Deploy da Sprint 2 aplicado em producao na VPS com HEAD `6aa1b1d`, `.env` ajustado (`VITE_APP_ID=orbita` e `CREDENTIAL_ENCRYPTION_KEY`), `pm2` online e HTTPS `200 OK` em `getorbita.com.br` e `www.getorbita.com.br`.
- Acesso SSH remoto local liberado e `quick-deploy` validado com sucesso em producao (A7 concluido).
- Pendencias atuais do dono no backlog: A1, A2 e A6 (A3 concluido).
- A9 concluido operacionalmente: `USER_PII_ENCRYPTION_KEY` dedicada configurada na VPS com tamanho valido e sem erro de runtime.
- Producao atualizada em 2026-03-06 para o release `e48d1c4`, com Sprint 1 atual publicada (`/help`, onboarding por plano e persistencia de primeiro acesso), funil Kiwify, pagina publica `/obrigado`, preview `?preview=1` e migracao de plano aplicada na VPS.
- Sprint 4 planejada oficialmente com documento tecnico aprovado e fluxo `security-first` travado (sandbox antes de producao).
- Sprint 4 em execucao: itens 14 e 15 concluidos em codigo; frente de pagamentos (item 12) pivotada oficialmente para Kiwify em 2026-03-05.
- Integracao Asaas existente continua registrada como legado tecnico, mas nao e mais o caminho oficial de lancamento.
- Upsell interno de planos publicado na tela de `Settings` (aba `Planos`) e fluxo do modal conectado para abrir diretamente essa aba (`/settings?tab=plans`).
- Migracao tecnica de pagamentos iniciada em codigo (Kiwify):
  - `auth.createSubscription` agora abre checkout hospedado Kiwify por plano via ENV;
  - `auth.registerForCheckout` cria conta publica com plano pendente e devolve checkout para o funil da landing;
  - novo endpoint `POST /api/webhooks/kiwify` com validacao de token;
  - processamento de webhook com deduplicacao/idempotencia e atualizacao de `planStatus`/`planExpiry`/`plan`.
- Checkout hospedado Kiwify agora recebe prefill automatico de comprador (`name`, `email`, `phone`, `cpf`, `region=br`) nos fluxos de novo lead e usuario autenticado, reduzindo redigitacao no pagamento.
- Funil comercial foi repartido em 2 etapas:
  - antes do pagamento: cadastro minimo para abrir checkout com prefill;
  - depois do pagamento: pagina publica `/obrigado` para coletar dados complementares e liberar a sessao apenas apos confirmacao do plano.
- Pagina publica `/obrigado` agora tambem possui modo de pre-visualizacao via `?preview=1`, permitindo revisar UI e copy sem depender de pagamento aprovado.
- Tela `Login` agora suporta funil comercial por query string (`plan` + `checkout=1`), com cadastro sem sessao para novos leads e login com redirecionamento direto ao checkout para contas existentes.
- Configuracao operacional local da Kiwify atualizada com links reais dos 4 planos e token webhook; controle opcional de allowlist por IP habilitado via `KIWIFY_WEBHOOK_ALLOWED_IPS`.
- Registro privado de credenciais e checkpoint de IPs criado em `docs/CREDENCIAIS_PRIVADAS.md` (arquivo local ignorado no Git).
- Ajuste UX da Sprint 4 aplicado: removido destaque de "plano recomendado" nos cards de planos em `Settings`.
- Decisao de produto vigente: manter checkout hospedado Kiwify para o lancamento; checkout proprio Orbita fica para pos-lancamento (somente se necessario).
- Refinamento de UX por plano aplicado: contas pessoais nao visualizam modulos business na sidebar/customizacao e mensagens de bloqueio nao exibem mais rotulo "Business".
- Correcao da navegacao interna de abas em `Settings`: troca de tab funcionando com sincronizacao via query string.
- Base local de QA foi limpa em 2026-03-05.
- Em 2026-03-06 foram provisionadas 4 contas QA internas em producao, uma por plano, todas com `planStatus=active`, para validacao manual controlada antes do pagamento real final.
- Cadastro local restaurado em 2026-03-05 apos ajuste de `DATABASE_URL` + `pnpm db:push`; fluxo `auth.register` validado com sucesso via API local.
- Conta local do dono `gustavosilva585@gmail.com` foi confirmada manualmente no banco em 2026-03-06 para continuar o QA sem dependencia de envio de email no ambiente local.
- Modo local estavel para QA completo definido em 2026-03-06: frontend Vite standalone em `localhost:3000` com proxy `/api` para backend local em `localhost:3001`; o middleware Vite integrado ao `pnpm dev` segue instavel neste ambiente.
- Hardening adicional do runtime local aplicado em 2026-03-06: backend agora suporta modo `DISABLE_INTERNAL_VITE=1` e `pnpm dev` foi redirecionado para orquestrar `dev:api` + `dev:web`, sem usar o Vite embutido no processo `tsx`.
- Dependencias da arvore original em `Documents/.../ADflow/node_modules` foram diagnosticadas como corrompidas/incompletas (`react`/`lucide-react` com arquivos faltando); QA imediato ficou destravado por um espelho limpo em `/private/tmp/ADflow-local-run`.
- Hardening de disponibilidade aplicado no backend: startup agora testa conexao com banco e, em producao, encerra processo imediatamente se DB estiver indisponivel.
- UX de cadastro reforcada no login:
  - pais + DDI automatico para WhatsApp (usuario digita sem `+55`);
  - CEP (Brasil) com busca automatica de endereco para completar apenas complemento;
  - selecao guiada de origem (`Onde conheceu a Orbita?`) com opcao `Outro`;
  - formatacao de CPF/CNPJ no blur;
  - confirmacao obrigatoria de senha no cadastro.
- Primeiro acesso ajustado: popup de briefing diario (resumo de ontem) nao abre enquanto onboarding nao estiver concluido ou explicitamente dispensado.
- Sprint 1 atual concluida em codigo + producao: onboarding agora ficou sensivel ao plano do usuario, com estado persistido por conta no navegador e central de ajuda dedicada por funcionalidade em `/help`.
- Sprint 10 criado no backlog para encerramento de fase com auditoria final de seguranca, velocidade e SEO.
- Refinamentos de seguranca/conta adicionados na Sprint 3:
  - cadastro ampliado com dados completos de perfil e consentimento;
  - area Conta em modo somente leitura por padrao (edicao explicita por botao `Editar`);
  - troca de senha condicionada a email verificado (frontend + backend).
- Hardening adicional de auth/conta implementado em codigo:
  - validacao real de CPF/CNPJ (digitos verificadores) em cadastro/conta e recuperacao de email;
  - politica de senha forte obrigatoria (8+, sem espacos, maiuscula, minuscula, numero e especial) em cadastro, reset e troca;
  - bloqueio de novo login para nao verificados e expurgo de conta pendente apos 7 dias;
  - novo fluxo "Esqueci meu email" na tela de login (`/forgot-email`) com rate limit dedicado;
  - envio de verificacao no cadastro movido para async para reduzir latencia.
- Fluxo de verificacao ativo em soft lock com popup persistente no app, rota `/verify-email` e reenvio autenticado.
- Fluxo de reset de senha ativo com token hash em `auth_tokens`, expiracao e rate limit dedicado.
- Validacao local apos hardening adicional: `pnpm check`, `pnpm test` (66 testes) e `pnpm build` verdes.
- Sprint 3 encerrada operacionalmente: checklist manual de browser do A8 validado (verificacao, reset, reenvio e 429).
- Toolkit operacional de email preparado:
  - `scripts/vps/set-resend-env.sh` (atualizacao segura de ENV na VPS);
  - `scripts/vps/smoke-auth-email.sh` (validacao operacional + checklist manual).

## 7) Prioridade recomendada (curto prazo)

1. Fechar Sprint 2 (`A1`, `A2` e item `49`).
2. Usar as 4 contas QA internas para validar navegacao e diferencas por plano sem compra real.
3. Executar Sprint 3 (admin e email marketing).
4. Executar Sprint 4 (marca, LP e auditoria final).
5. Executar Sprint 5 por ultimo com compra real controlada na Kiwify; nao foi localizada documentacao oficial de sandbox publico para este checkout.
6. Registrar IP real do primeiro webhook recebido e decidir ativacao do bloqueio `KIWIFY_WEBHOOK_ALLOWED_IPS`.
7. Manter novas ideias congeladas ate a abertura da Sprint 6.

## 8) Marcos recentes

- 2026-03-05: sistema de documentacao V2 oficializado com log estruturado por acao (`autor`, `perfil` humano/IA, `acao`, `id`), novo guia `docs/SISTEMA_DOCUMENTACAO.md`, template de log e guardrails automaticos reforcados em hook/CI.
- 2026-03-05: decisao de produto revisada para pagamentos via Kiwify no lancamento (hosted checkout), substituindo o caminho oficial anterior baseado em Asaas.
- 2026-03-05: incidente local de cadastro resolvido (`Banco de dados indisponivel`) com configuracao de `DATABASE_URL`, migracao local aplicada e hardening fail-fast para producao quando DB nao estiver acessivel no startup.
- 2026-03-05: pacote UX de cadastro aplicado (pais/DDI, CEP auto, origem com opcoes, CPF formatado no blur, confirmacao de senha) e ajuste de primeiro acesso para priorizar onboarding antes do popup de resumo diario.
- 2026-03-05: Sprint 4 avancou com migracao em codigo para Kiwify (checkout por plano via ENV + webhook `/api/webhooks/kiwify` com token e idempotencia) e com remocao do destaque de plano recomendado em `Settings`; validacoes `pnpm check`, `pnpm test` (79 testes) e `pnpm build` verdes.
- 2026-03-06: links reais dos 4 planos da Kiwify e token de webhook foram aplicados no ambiente local; webhook ganhou allowlist opcional por IP (`KIWIFY_WEBHOOK_ALLOWED_IPS`) para hardening incremental apos observacao dos IPs reais.
- 2026-03-06: landing page recebeu pricing dos 4 planos e o novo funil comercial `LP -> cadastro -> checkout Kiwify`; backend ganhou `auth.registerForCheckout` para criar conta sem liberar acesso antes do pagamento.
- 2026-03-06: ambiente local full stack estabilizado com `pnpm dev:web` em `:3000` e `pnpm dev:api` em `:3001`, usando proxy `/api` no Vite; ajuste em `server/_core/vite.ts` removeu import direto de `vite.config.ts` no runtime do backend.
- 2026-03-06: novo incidente local foi isolado como corrupcao/incompletude de `node_modules` na copia sob `Documents`; `package.json`, `server/_core/index.ts` e `vite.config.ts` foram ajustados para um fluxo local mais robusto, e o app ficou operacional em espelho limpo sob `/private/tmp/ADflow-local-run`.
- 2026-03-06: checkout Kiwify passou a abrir com prefill automatico de `name/email/phone/cpf` a partir dos dados do Orbita, reduzindo digitacao duplicada no funil `cadastro/login -> pagamento`.
- 2026-03-06: funil de checkout foi reestruturado com cadastro minimo pre-pagamento, `checkoutCompletionToken` assinado no backend e nova pagina publica `/obrigado` para completar perfil e liberar acesso so apos `planStatus=active|trial`.
- 2026-03-06: pagina `/obrigado` foi refinada visualmente, ganhou modo `preview=1` para QA sem compra e passou por validacao completa local (`pnpm test` com 89 testes, `pnpm exec tsc --noEmit`, `pnpm exec vite build` e smoke em `localhost:3000`).
- 2026-03-06: ciclo de sprints foi reiniciado a partir do estado atual; o antigo Sprint 6 virou Sprint 1 do ciclo novo, com onboarding por plano, persistencia por usuario no navegador e nova central de ajuda em `/help`.
- 2026-03-06: deploy de producao executado com sucesso via `quick-deploy`; VPS atualizada para `e48d1c4`, PM2 online, `/` e `/help` respondendo `200 OK` no app interno (`127.0.0.1:3000`) e `auth.me` publico respondendo JSON.
- 2026-03-06: 4 contas QA internas foram provisionadas em producao com aliases do email do dono, uma por plano, todas com `planStatus=active` e `emailVerified=1`.
- 2026-02-24: deploy publico concluido em `https://metrizy.com.br`.
- 2026-02-24: guardrails de documentacao implantados (hooks + CI).
- 2026-02-25: documentacao consolidada para modelo definitivo (Codex principal, Claude consultor, Gemini fora).
- 2026-02-25: deploy em producao da versao `f83d346` validado pelo dono (`pm2 online` + `curl -I https://metrizy.com.br` retornando `200 OK`).
- 2026-02-25: Sprint 1 consolidada (ocultacao de Campanhas/IA no front, voice assistant desativado e onboarding com `navigate()`), com `check/test/build` verdes.
- 2026-02-25: `docs/DECISOES_PRODUTO.md` oficializado como documento de decisao de produto para todos os agentes.
- 2026-02-25: baseline funcional do app visivel fechado para demo (persistencia em settings, datas locais, onboarding e LP coerentes), com `check/test/build` verdes.
- 2026-02-25: tema padrao alterado para dark e LP refinada para refletir somente funcionalidades ativas do Orbita.
- 2026-02-25: cutover concluido para `https://getorbita.com.br` com SSL ativo, `pm2` online, HTTPS `200 OK` e HTTP `301` para HTTPS.
- 2026-02-25: branding Orbita completo — logo SVG + favicon criados, rename AdFlow→Orbita em todo o codigo, metadata HTML reescrita, codigo morto removido.
- 2026-02-25: SSL expandido para cobrir `www.getorbita.com.br` (certbot + Nginx). Ambos `https://getorbita.com.br` e `https://www.getorbita.com.br` retornando `200 OK`. HTTP `301` para HTTPS ativo. Cert valido ate 2026-05-26.
- 2026-02-25: Sprint 2 (Seguranca) concluida com `helmet`, rate limiting em auth com `trust proxy`, expiracao de sessao em 7 dias e criptografia de credenciais de cliente (AES-256-GCM), validada por `pnpm check`, `pnpm test` e `pnpm build`.
- 2026-02-25: hardening pós-revisao da Sprint 2 concluido com rate limit global (`200 req/min` em `/api`) e ajuste do `.env.example` para `VITE_APP_ID=orbita`, removendo bloco AWS legado.
- 2026-02-25: commit `1f82a20` da Sprint 2 enviado para `origin/main`; tentativa de deploy remoto bloqueada por autenticacao SSH (`Permission denied (publickey,password)`).
- 2026-02-25: deploy manual na VPS concluido para `origin/main` HEAD `6aa1b1d` com `bash scripts/vps/deploy-app.sh`; `db:push` sem migracoes pendentes, PM2 `adflow` online e `curl -I` em `https://getorbita.com.br` e `https://www.getorbita.com.br` retornando `200 OK` com headers de seguranca ativos.
- 2026-02-25: apos reboot da VPS, incidente `502 Bad Gateway` resolvido com recuperacao do PM2 (`start/save/startup systemd`), validacao interna em `127.0.0.1:3000` e health externo `200 OK`; `quick-deploy` remoto executado com sucesso via `root@167.88.32.1` (fallback IPv4).
- 2026-02-25: plano da Sprint 3 aprovado e documentado com decisoes travadas de seguranca: Resend para email transacional, soft lock com popup de verificacao, usuarios legados no fluxo de verificacao e tabela dedicada `auth_tokens`.
- 2026-02-25: Sprint 3 item 11 concluido: `auth.changePassword` no backend + aba "Segurança" no `Settings` para contas com login por email, com validacoes executadas (`pnpm check`, `pnpm test`, `pnpm build`).
- 2026-02-25: Sprint 3 itens 09 e 10 concluidos em codigo: confirmacao de email no cadastro (`verifyEmail` + `resendVerification` + popup soft lock + rota `/verify-email`) e recuperacao de senha (`requestPasswordReset` + `resetPassword` + telas dedicadas), com validacao `pnpm check`, `pnpm test` e `pnpm build` verdes.
- 2026-02-25: plano operacional Resend+Hostinger implementado em repo com scripts de VPS (`set-resend-env.sh` e `smoke-auth-email.sh`) e runbook atualizado em `docs/DEPLOY_VPS.md`.
- 2026-02-25: Sprint 3 refinada para producao com cadastro ampliado de perfil, criptografia de CPF/CNPJ no backend, `auth.updateProfile`, Conta em modo leitura por padrao e bloqueio de troca de senha sem email verificado; validado com `pnpm check`, `pnpm test` (58 testes) e `pnpm build`.
- 2026-02-25: hardening adicional de auth com validacao algoritimica de CPF/CNPJ, senha forte obrigatoria, bloqueio de login para nao verificados, expiracao de conta em 7 dias, fluxo "esqueci meu email" e cadastro com envio de verificacao assincrono; validado com `pnpm check`, `pnpm test` (66 testes) e `pnpm build`.
- 2026-02-25: release `5efe746` (Sprint 3 final) deployado via `quick-deploy` em `root@167.88.32.1` com build+db:push+restart PM2, HEAD remoto confirmado em `5efe746`, `pm2 status adflow` online e `https://getorbita.com.br` retornando `200 OK`.
- 2026-02-25: dono confirmou validacao manual fim-a-fim dos fluxos de email em producao; A8 marcado como concluido e Sprint 3 encerrada operacionalmente.
- 2026-02-25: dono confirmou A3 concluido (rotacao de credenciais no servidor) e A6 em andamento com conta Asaas criada, faltando configuracao de webhook.
- 2026-02-25: Sprint 4 planejada em `docs/PLANO_EXECUCAO_FASE_4.md` com hard gates de seguranca, ordem de implementacao e validacao obrigatoria em Asaas sandbox.
- 2026-02-25: Sprint 4 Item 13 implementado em codigo (`drizzle/schema.ts`, migration `0010_secret_stature.sql`, retorno de `plan/planStatus/planExpiry` em `auth.me`) com `pnpm check`, `pnpm test` e `pnpm build` verdes.
- 2026-02-25: Sprint 4 avancou com implementacao em codigo dos itens 12, 14 e 15: cliente Asaas + webhook seguro com idempotencia, `createSubscription/getSubscriptionStatus`, middleware `planProcedure` (erro `UPGRADE_REQUIRED`) aplicado em Clients/CRM e paywall frontend (`usePlanAccess`, `PlanGate`, `UpgradePlanModal`), validado em `pnpm check`, `pnpm test` e `pnpm build`.
- 2026-02-25: fluxo de upsell refinado no app: `UpgradePlanModal` agora direciona para `Settings` na aba `Planos`, com cards comerciais e CTA de contratacao por plano; usuarios locais de QA por plano criados para testes manuais (local only).
- 2026-02-25: ajustes de UX da Sprint 4 aplicados apos feedback do dono: itens business ocultados para contas pessoais na navegacao, textos de bloqueio tornados neutros e correção da troca de abas em `Settings`.
- 2026-02-25: dono solicitou incluir Sprint final de fechamento para revisao completa de seguranca, velocidade e SEO; backlog atualizado com Sprint 10.
- 2026-02-25: hotfix de checkout sandbox aplicado na Sprint 4: `auth.createSubscription` agora busca URL em fallback por `GET /subscriptions/{id}/payments` quando a resposta inicial vier sem `checkoutUrl`; `Settings` passou a tratar `fetch failed` com mensagem amigavel de conexao com gateway. Validado em `pnpm check`, `pnpm test server/auth.subscription.test.ts` e `pnpm build`.

# Centro de Operacao - Orbita

Atualizado em: 2026-02-25 17:15:44 -0300

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

- Toda alteracao relevante (codigo, infra, testes, deploy, commit/push) exige update de:
  - `docs/CENTRO_DE_OPERACAO.md`
  - `docs/LOG_AGENTES.md`
- `docs/TODO_LANCAMENTO.md` e o backlog oficial: ao concluir tarefa ou criar nova tarefa, atualizar imediatamente.
- Guardrail automatico local/CI exige os 3 arquivos (`CENTRO`, `LOG`, `TODO`) quando houver mudanca fora de `docs/`.
- Nao manter decisoes duplicadas em arquivos diferentes com versoes conflitantes.
- Nao registrar segredo real em `docs/`.

## 3) Fluxo oficial de execucao

1. Ler `docs/TODO_LANCAMENTO.md`.
2. Executar tarefa prioritaria.
3. Validar (`pnpm check`, `pnpm test`, `pnpm build`) quando aplicavel.
4. Atualizar `TODO` (status da tarefa).
5. Registrar no `LOG_AGENTES`.
6. Atualizar este `CENTRO` se houver mudanca de estado/processo.

## 4) Fonte de verdade por documento

- `docs/TODO_LANCAMENTO.md`: o que fazer agora e o status de cada tarefa.
- `docs/LOG_AGENTES.md`: historico cronologico de execucao.
- `docs/DEPLOY_VPS.md`: operacao de producao/VPS.
- `docs/DECISOES_PRODUTO.md`: decisoes de produto vigentes (priorizacao e escopo).
- `docs/ESTRATEGIA_MERCADO_UX_SEGURANCA.md`: base de pesquisa e criterios estrategicos.
- `docs/PLANO_EXECUCAO_FASE_3.md`: plano de implementacao da Sprint 3 (Auth e Email).
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
- A transicao para o plano `Orbita - Fase A` segue ativa com Sprint 1 e Sprint 2 concluidas.
- Modulo Familia & Equipe esta oculto na interface por decisao de produto, com backend preservado para reativacao futura.
- Modulo Campanhas/IA de campanhas esta oculto no frontend (rotas, CTAs, onboarding e atalhos), mantendo backend para reativacao futura.
- Itens de menu marcados como "Em breve" foram ocultados da barra lateral (desktop/mobile), mantendo declaracao no codigo para liberar depois.
- Sidebar e Configuracoes foram alinhadas com a realidade atual do Orbita (nomenclatura e textos sem dependencias de campanhas desativadas).
- Configuracoes agora persistem preferencias locais reais (conta, alertas, rotina, metas e pagina inicial).
- Onboarding do dashboard foi alinhado 100% aos modulos ativos/visiveis (clientes, rotina, CRM, financeiro, configuracoes).
- Fluxos diarios usam chave de data local (sem dependencia de `toISOString` para "hoje"), reduzindo risco de virada de dia por UTC.
- Landing page/login alinhados ao branding Orbita e ao escopo funcional atual para demo publica.
- Tema inicial do app definido como escuro por padrao para novos acessos.
- Landing page atualizada para comunicar apenas modulos realmente ativos no produto hoje.

Pendencias tecnicas objetivas:
- Validacao de baseline verde confirmada: `pnpm check`, `pnpm test` e `pnpm build` executados com sucesso.
- Sprint 2 (Seguranca) concluida: `helmet`, rate limiting em auth, sessao JWT de 7 dias e criptografia AES-256-GCM em credenciais.
- Deploy da Sprint 2 aplicado em producao na VPS com HEAD `6aa1b1d`, `.env` ajustado (`VITE_APP_ID=orbita` e `CREDENTIAL_ENCRYPTION_KEY`), `pm2` online e HTTPS `200 OK` em `getorbita.com.br` e `www.getorbita.com.br`.
- Acesso SSH remoto local liberado e `quick-deploy` validado com sucesso em producao (A7 concluido).
- Pendencias atuais do dono no backlog: A1, A2, A3, A6 e A8.
- Sprint 3 (Auth e Email) concluida em codigo: itens 09, 10 e 11 implementados e validados localmente.
- Refinamentos de seguranca/conta adicionados na Sprint 3:
  - cadastro ampliado com dados completos de perfil e consentimento;
  - area Conta em modo somente leitura por padrao (edicao explicita por botao `Editar`);
  - troca de senha condicionada a email verificado (frontend + backend).
- Fluxo de verificacao ativo em soft lock com popup persistente no app, rota `/verify-email` e reenvio autenticado.
- Fluxo de reset de senha ativo com token hash em `auth_tokens`, expiracao e rate limit dedicado.
- Pendencia operacional imediata da Sprint 3: aplicar migration `0009_giant_blacklash.sql` em ambiente alvo e fazer deploy desta revisao.
- Toolkit operacional de email preparado:
  - `scripts/vps/set-resend-env.sh` (atualizacao segura de ENV na VPS);
  - `scripts/vps/smoke-auth-email.sh` (validacao operacional + checklist manual).

## 7) Prioridade recomendada (curto prazo)

1. Aplicar migration da Sprint 3 no ambiente alvo (`users.emailVerified*` + `auth_tokens`).
2. Configurar Resend em producao (`EMAIL_PROVIDER=resend`, `EMAIL_FROM`, `RESEND_API_KEY`, DNS do dominio).
3. Executar deploy e smoke test dos fluxos de verificacao e reset em producao.

## 8) Marcos recentes

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

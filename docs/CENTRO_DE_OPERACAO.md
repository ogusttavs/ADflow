# Centro de Operacao - Orbita

Atualizado em: 2026-02-25 11:10:52 -0300

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
- A transicao para o plano `Orbita - Fase A` segue ativa com Sprint 1 concluida.
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
- Sprint 2 (Seguranca) ainda nao iniciada: rate-limit, `helmet`, expiracao JWT e encrypt de credenciais.
- SSL em `getorbita.com.br`: possivel mismatch com `www.` — reemitir cert na VPS via `sudo certbot --nginx -d getorbita.com.br -d www.getorbita.com.br`.

## 7) Prioridade recomendada (curto prazo)

1. Iniciar Sprint 2 da Fase A (Seguranca) pela ordem do backlog oficial (`TODO_LANCAMENTO`):
- rate limiting no auth;
- `helmet` com headers de seguranca;
- reduzir expiry de JWT;
- encrypt de credenciais de cliente.
2. Manter disciplina de docs/guardrails a cada alteracao.
3. Preparar revisao arquitetural pontual com o Claude para Sprint 2 (`Claude +`).

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

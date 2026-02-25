# Centro de Operacao - AdFlow/Orbita

Atualizado em: 2026-02-25 00:39:52 -0300

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
| Claude (consultor) | Indisponivel (`Claude -`) |

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
- `docs/ESTRATEGIA_MERCADO_UX_SEGURANCA.md`: referencia estrategica e criterios de decisao.
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
- Dominio ativo: `https://metrizy.com.br`
- App em PM2 + Nginx + SSL

## 6) Situacao real (agora)

Estado atual de desenvolvimento:
- A transicao para o plano `Orbita - Fase A` foi iniciada, mas esta parcial.
- Modulo Familia & Equipe esta oculto na interface por decisao de produto, com backend preservado para reativacao futura.
- Ocultacao de Campanhas foi iniciada apenas no menu principal; ainda existe em varias telas/rotas.

Pendencias tecnicas objetivas:
- `pnpm check` falha no estado atual com erros TS2783 (`name` duplicado) em formulários de clientes/campanhas.
- Tarefa 02 da `Fase A` esta parcial e precisa fechamento end-to-end.
- Onboarding ainda usa `window.location.hash` em vez de `navigate()`.
- Voice assistant ainda ativo no layout.

## 7) Prioridade recomendada (curto prazo)

1. Fechar Sprint 1 da Fase A com criterio de pronto tecnico:
- ocultar Campanhas/IA de campanhas de forma consistente (menu + rotas + CTAs + onboarding).
- remover assistente de voz basico.
- corrigir navegacao do onboarding para `navigate()`.
2. Corrigir `pnpm check` para voltar baseline de build limpo.
3. Seguir Sprint 2 (seguranca) sem pular ordem.

## 8) Marcos recentes

- 2026-02-24: deploy publico concluido em `https://metrizy.com.br`.
- 2026-02-24: guardrails de documentacao implantados (hooks + CI).
- 2026-02-25: documentacao consolidada para modelo definitivo (Codex principal, Claude consultor, Gemini fora).
- 2026-02-25: deploy em producao da versao `f83d346` validado pelo dono (`pm2 online` + `curl -I https://metrizy.com.br` retornando `200 OK`).

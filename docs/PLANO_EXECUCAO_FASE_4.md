# PLANO DE EXECUCAO - FASE 4 (PAGAMENTOS E PLANOS)

Atualizado em: 2026-02-25 20:35:01 -0300
Status da fase: `EM ANDAMENTO`

## Objetivo

Implementar cobranca recorrente com Asaas e controle de acesso por plano no Orbita, com prioridade absoluta para seguranca de dados e confiabilidade operacional.

## Decisoes travadas desta fase

- Gateway: `Asaas`.
- Ambiente inicial obrigatorio: `Sandbox` (sem cobranca real) ate validacao completa.
- Entrada em producao: somente apos checklist de seguranca aprovado.
- Persistencia: campos de assinatura na tabela `users` (fase A) + tabela de idempotencia para webhook.
- Planos oficiais (conforme `DECISOES_PRODUTO`):
  - `personal_standard`
  - `personal_pro`
  - `business_standard`
  - `business_pro`
- Grace period de inadimplencia: 3 dias antes de bloqueio duro.
- Bloqueio por plano: backend primeiro (frontend sozinho nao e confiavel).

## Escopo por item do backlog

### Item 13 - Migration de plano em `users`

Adicionar campos em `users`:
- `plan` (`personal_standard | personal_pro | business_standard | business_pro | null`)
- `planStatus` (`trial | active | past_due | expired | canceled | null`)
- `planExpiry` (`datetime | null`)
- `asaasCustomerId` (`varchar | null`)
- `asaasSubscriptionId` (`varchar | null`)

Criar tabela de idempotencia:
- `processed_webhook_events`
  - `provider` (`asaas`)
  - `eventId` (unique)
  - `eventType`
  - `processedAt`

Regras de rollout:
- Usuarios existentes nao podem ser bloqueados no deploy.
- Backfill inicial sugerido:
  - `planStatus = trial`
  - `planExpiry = now + 30 dias`

Status de execucao atual:
- [x] Campos adicionados em `drizzle/schema.ts`.
- [x] Migration gerada: `drizzle/0010_secret_stature.sql`.
- [x] `auth.me` atualizado para expor `plan`, `planStatus`, `planExpiry`.
- [ ] Aplicar migration em ambiente alvo (`pnpm db:push`) e validar no banco.

### Item 12 - Integracao Asaas + webhook

Backend:
- Criar cliente `server/_core/asaas.ts`.
- Implementar endpoint de webhook em Express: `POST /api/webhooks/asaas` (fora do tRPC).
- Validar header de seguranca do Asaas (`asaas-access-token`) contra `ASAAS_WEBHOOK_TOKEN`.
- Usar idempotencia para ignorar replay.

Eventos minimos:
- `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED` -> `planStatus=active` e atualizar `planExpiry`.
- `PAYMENT_OVERDUE` -> `planStatus=past_due`.
- `SUBSCRIPTION_DELETED` / `PAYMENT_REFUNDED` -> `planStatus=canceled`.

Observacao:
- Sempre preferir data de expiracao vinda do payload da Asaas (`dueDate`/`nextDueDate`) em vez de `now + 30`.

Status de execucao atual:
- [x] Cliente Asaas implementado em `server/_core/asaas.ts`.
- [x] Webhook `POST /api/webhooks/asaas` implementado e validando `asaas-access-token`.
- [x] Idempotencia implementada via `processed_webhook_events`.
- [x] Procedures `auth.createSubscription` e `auth.getSubscriptionStatus` implementadas.
- [ ] Validar ciclo completo no Asaas Sandbox (evento real recebido e aplicado).

### Item 15 - Guards backend por plano

- Criar mapa de acesso por feature em `shared/planAccess.ts`.
- Criar middleware tRPC reutilizavel (`requireFeature` / `requirePlan`).
- Aplicar primeiro em recursos business:
  - clientes
  - CRM
  - prospeccao
- Resposta padrao para bloqueio:
  - `TRPCError(FORBIDDEN, "UPGRADE_REQUIRED")`

Status de execucao atual:
- [x] `planProcedure(feature)` criado em `server/_core/trpc.ts`.
- [x] `shared/planAccess.ts` criado para regra unica de acesso.
- [x] Guards aplicados em `clientsRouter` e `crmRouter`.
- [x] Testes de guard adicionados (`server/plan.guard.test.ts`).

### Item 14 - Guards frontend por plano

- Criar hook `usePlanAccess`.
- Criar componente `PlanGate`.
- Criar `UpgradePlanModal`.
- Tratar erro `UPGRADE_REQUIRED` globalmente para abrir CTA de upgrade.
- Mostrar estado de grace period sem quebrar leitura de dados existentes.

Status de execucao atual:
- [x] `usePlanAccess` criado.
- [x] `PlanGate` criado e aplicado nas telas de `Clients`, `ClientDetail`, `CRM` e `Prospecting`.
- [x] `UpgradePlanModal` global criado.
- [x] Tratamento global de erro `UPGRADE_REQUIRED` adicionado em `main.tsx`.
- [x] Navegacao lateral com bloqueio visual e CTA para upgrade em modulos business.

## Ordem de implementacao recomendada

1. `Item 13` - Migration + backfill seguro.
2. `Item 12` - Webhook Asaas seguro + idempotencia.
3. `Item 15` - Guard backend.
4. `Item 14` - Guard frontend.
5. `Item 12` (checkout) - endpoint de criacao/consulta de assinatura.

## Hard gates de seguranca (release blocker)

Sem todos os itens abaixo, nao vai para producao:

- [ ] Segredos em ENV apenas (`ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`), sem hardcode.
- [ ] Webhook validando token de origem.
- [ ] Idempotencia de webhook ativa e testada.
- [ ] Logs sem PII sensivel e sem secrets.
- [ ] Rate limit em rotas de billing/upgrade.
- [ ] Guard de plano no backend ativo para features restritas.
- [ ] Testes de abuso/replay executados e registrados.
- [ ] Smoke completo em sandbox aprovado.

## ENVs obrigatorias

- `ASAAS_ENV` (`sandbox` ou `production`)
- `ASAAS_API_BASE_URL`
- `ASAAS_API_KEY`
- `ASAAS_WEBHOOK_TOKEN`
- `APP_BASE_URL`

## Checklist de validacao da sprint

- [x] `pnpm check`
- [x] `pnpm test`
- [x] `pnpm build`
- [ ] Webhook sandbox recebido e processado sem duplicidade.
- [ ] Mudanca de status de plano refletida no `auth.me`.
- [x] Guard backend bloqueando recurso business para plano inferior.
- [x] Guard frontend exibindo CTA de upgrade sem quebrar fluxo.

## Regra operacional desta fase

A cada entrega:
- atualizar `docs/TODO_LANCAMENTO.md`;
- registrar em `docs/LOG_AGENTES.md`;
- manter `docs/CENTRO_DE_OPERACAO.md` consistente.

## Checkpoint de encerramento do dia (2026-02-25)

Estado atual:
- Checkout de assinatura funcionando no local sandbox com fallback de URL por pagamentos da assinatura.
- Erro de rede no checkout (`fetch failed`) tratado com mensagem amigavel no frontend.
- Sprint 4 continua pendente de validacao manual completa do webhook sandbox (A6) e aplicacao de migration em producao (`13b`).

Passo a passo de retomada (proximo dia):
1. Validar no browser local duas contratacoes (planos diferentes) abrindo checkout Asaas.
2. Confirmar webhook sandbox recebendo e processando evento real (idempotencia + atualizacao de `planStatus`/`planExpiry`).
3. Implementar ajuste de UX: remover destaque visual de plano recomendado (sem plano em evidência).
4. Fechar decisao de produto sobre checkout (hosted Asaas agora vs checkout proprio em fase futura) e registrar em `docs/DECISOES_PRODUTO.md`.
5. Com sandbox validado, preparar roteiro seguro para producao sem trocar chave/ambiente antes do checklist final.

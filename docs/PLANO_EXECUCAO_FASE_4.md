# PLANO DE EXECUCAO - FASE 4 (PAGAMENTOS E PLANOS)

Atualizado em: 2026-03-05 21:11:00 -0300
Status da fase: `EM ANDAMENTO`

## Objetivo

Implementar cobranca recorrente com Kiwify e controle de acesso por plano no Orbita, com prioridade absoluta para seguranca de dados e confiabilidade operacional.

## Decisoes travadas desta fase

- Gateway: `Kiwify`.
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
- `billingCustomerId` (`varchar | null`)
- `billingSubscriptionId` (`varchar | null`)

Criar tabela de idempotencia:
- `processed_webhook_events`
  - `provider` (`kiwify`)
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

### Item 12 - Integracao Kiwify + webhook

Backend:
- Criar cliente `server/_core/kiwify.ts` (se a integracao exigir chamada de API).
- Implementar endpoint de webhook em Express: `POST /api/webhooks/kiwify` (fora do tRPC).
- Validar assinatura/token de seguranca da Kiwify contra segredo local.
- Usar idempotencia para ignorar replay.

Eventos minimos:
- Pagamento aprovado -> `planStatus=active` e atualizar `planExpiry`.
- Pagamento em atraso -> `planStatus=past_due`.
- Assinatura cancelada/reembolso -> `planStatus=canceled`.

Observacao:
- Sempre preferir data de expiracao vinda do payload oficial do provedor em vez de `now + 30`.

Status de execucao atual:
- [x] Implementar cliente/servico Kiwify necessario para checkout hosted por plano (`server/_core/kiwify.ts` + ENVs por plano).
- [x] Implementar webhook `POST /api/webhooks/kiwify` com validacao segura da origem (token).
- [x] Reaproveitar/ajustar idempotencia via `processed_webhook_events`.
- [x] Adaptar `auth.createSubscription` para fluxo Kiwify mantendo contrato de resposta do frontend.
- [ ] Validar ciclo completo em ambiente de testes da Kiwify (evento real recebido e aplicado).
- [x] Integracao Asaas anterior permanece apenas como legado tecnico (nao oficial para lancamento).

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
2. `Item 12` - Webhook Kiwify seguro + idempotencia.
3. `Item 15` - Guard backend.
4. `Item 14` - Guard frontend.
5. `Item 12` (checkout) - endpoint de criacao/consulta de assinatura.

## Hard gates de seguranca (release blocker)

Sem todos os itens abaixo, nao vai para producao:

- [ ] Segredos em ENV apenas (Kiwify), sem hardcode.
- [ ] Webhook validando token de origem.
- [ ] Idempotencia de webhook ativa e testada.
- [ ] Logs sem PII sensivel e sem secrets.
- [ ] Rate limit em rotas de billing/upgrade.
- [ ] Guard de plano no backend ativo para features restritas.
- [ ] Testes de abuso/replay executados e registrados.
- [ ] Smoke completo em sandbox aprovado.

## ENVs obrigatorias

- `PAYMENT_PROVIDER` (`kiwify`)
- `KIWIFY_API_BASE_URL` (se aplicavel)
- `KIWIFY_API_KEY` (se aplicavel)
- `KIWIFY_WEBHOOK_TOKEN` (ou segredo equivalente de assinatura)
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
- Pivot oficial para Kiwify aprovado; implementacao de pagamentos em curso na nova plataforma.
- Integracao Asaas anterior mantida apenas como referencia tecnica ate a troca completar.
- Sprint 4 continua pendente de validacao manual completa do webhook Kiwify (A6) e aplicacao da migration em producao (`13b`).

Passo a passo de retomada (proximo dia):
1. Validar no browser local duas contratacoes (planos diferentes) abrindo checkout Kiwify.
2. Confirmar webhook sandbox recebendo e processando evento real (idempotencia + atualizacao de `planStatus`/`planExpiry`).
3. Validar ajuste de UX aplicado: nenhum plano com destaque visual de "recomendado".
4. Garantir consistencia da decisao de checkout entre docs (`12c` = hosted Kiwify no lancamento).
5. Com sandbox validado, preparar roteiro seguro para producao sem trocar chave/ambiente antes do checklist final.

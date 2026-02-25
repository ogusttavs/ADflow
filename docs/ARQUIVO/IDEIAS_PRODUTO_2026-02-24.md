# Ideias do Produto - AdFlow

Ultima atualizacao: 2026-02-24 16:54:58 -0300

Como usar:
- Sempre adicione novas ideias no topo.
- Marque prioridade: `Alta`, `Media` ou `Baixa`.
- Use status: `Backlog`, `Em conversa`, `Em andamento`, `Concluida`, `Nao viavel`.
- Lider ativo deve revisar este arquivo em todo ciclo e conversar com o dono antes de executar.
- Depois da conversa:
- Se implementado, marcar como `Concluida`.
- Se nao for possivel, marcar como `Nao viavel` com motivo.
- Opcional: mover itens `Concluida`/`Nao viavel` para a secao `Historico`.

## Ideias

[2026-02-24 16:54:58 -0300]
- Ideia: Fluxo de Email no App (transacional + operacional + lifecycle) via n8n com backend como source of truth
- Prioridade: Alta
- Status: Em conversa
- Observacoes: Implementar eventos de dominio no backend, orquestracao no n8n, webhooks de entrega e preferencias por categoria no perfil do usuario.

[2026-02-24 16:52:38 -0300]
- Ideia: Camada de IA via n8n para orquestrar fluxos multi-etapa (prompt, validacao, fallback e resposta)
- Prioridade: Alta
- Status: Em conversa
- Observacoes: Manter backend como source of truth; usar n8n para automacao e integracoes externas com guardrails.

[2026-02-24 16:52:38 -0300]
- Ideia: Integracao WhatsApp via n8n (Cloud API) para briefing, status de campanha e aprovacoes
- Prioridade: Alta
- Status: Em conversa
- Observacoes: Fluxo com validacao de webhook, deduplicacao por message id, roteamento por intencao e fallback humano.

[2026-02-24 16:52:38 -0300]
- Ideia: Pacote de automacoes n8n para versao business (follow-up, alertas financeiros, resumo diario, reengajamento)
- Prioridade: Media
- Status: Em conversa
- Observacoes: Definir SLO por workflow, custo por execucao/mensagem e ordem de rollout por impacto operacional.

[2026-02-24 14:09:56 -0300]
- Ideia: Google como login da plataforma inteira
- Prioridade: Alta
- Status: Concluida
- Observacoes: Fluxo OAuth validado com sessao ativa e redirecionamento para `/dashboard`; pendente apenas rotacao operacional da `GOOGLE_CLIENT_SECRET` no Google Cloud.

[2026-02-24 14:06:37 -0300]
- Ideia: Conectar calendario com Google Agenda
- Prioridade: Alta
- Status: Concluida
- Observacoes: MVP concluido e validado (OAuth + listar eventos + sincronizar tarefas por dia). `syncTasksForDate` executado com sucesso (`created: 0`, `skipped: 0`) em data sem tarefas.

## Historico

Ideias Do Dono: 

Uma parte de registro de Ideias onde pode adicionar coisas por audio ou por texto
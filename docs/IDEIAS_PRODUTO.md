# Ideias do Produto - AdFlow

Ultima atualizacao: 2026-02-24 15:50:08 -0300

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

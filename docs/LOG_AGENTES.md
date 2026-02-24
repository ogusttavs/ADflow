# Log Continuo de Agentes - AdFlow

Objetivo:
- Historico cronologico permanente de ideias, execucoes, revisoes e proximos passos.

Regra obrigatoria de timestamp:
- Toda nova entrada deve usar data/hora atual do sistema.
- Formato obrigatorio: `[AAAA-MM-DD HH:mm:ss -03]`.
- Comando padrao: `date '+%Y-%m-%d %H:%M:%S %z'`.
- Nao editar entradas antigas; somente adicionar novas entradas no topo ou no fim (padrao: fim).

Governanca:
- Claude = chefe tecnico e responsavel por consolidar prioridades.
- Codex = dev auxiliar senior.
- Gemini = dev auxiliar.
- Claude consolida status e se reporta diretamente ao dono do produto.
- Claude define o que cada IA vai executar e pode implementar diretamente quando necessario.
- Tarefas simples devem ser priorizadas para o Gemini (custo mais baixo).
- Se Claude estiver indisponivel, Codex assume lideranca interina e decide execucao/prioridades.
- Durante essa contingencia, Gemini segue direcionamento do Codex.
- Se qualquer IA estiver indisponivel, o proximo da cadeia assume tarefas simples e urgentes.

Comandos de operacao:
- `Claude -` -> Claude indisponivel: ativa contingencia; Codex lidera, decide e documenta tudo para handoff.
- `Claude +` -> Claude disponivel: Codex consolida periodo da ausencia, atualiza docs e devolve lideranca ao Claude.
- `Codex -` -> Codex indisponivel: tarefas simples sobem para Gemini/Claude conforme disponibilidade.
- `Codex +` -> Codex disponivel: retoma execucao tecnica e fallback de lideranca.
- `Gemini -` -> Gemini indisponivel: tarefas simples sobem para Codex e depois Claude.
- `Gemini +` -> Gemini disponivel: tarefas simples voltam para ele (prioridade de custo).

Regra rapida de cadeia:
1. Lideranca tecnica: Claude -> Codex -> Gemini (apenas simples/urgente).
2. Tarefas simples: Gemini -> Codex -> Claude.

Template de entrada:

```text
[AAAA-MM-DD HH:mm:ss -03] [Agente]
Contexto:
- ...

Feito:
- ...

Proximo:
- ...

Bloqueios/Riscos:
- ...

Arquivos alterados:
- ...
```

## Historico

[2026-02-24 13:35:01 -03] [Codex]
Contexto:
- Criacao do log continuo solicitado para alinhamento entre os 3 agentes.

Feito:
- Documento `docs/LOG_AGENTES.md` criado.
- Regra de data/hora do sistema definida como obrigatoria para toda atualizacao.
- Governanca registrada com Claude como chefe tecnico e reporte ao dono.

Proximo:
- Passar a registrar cada execucao relevante neste arquivo.

Bloqueios/Riscos:
- Nenhum bloqueio tecnico para manter esse fluxo.

Arquivos alterados:
- docs/LOG_AGENTES.md
- docs/CENTRO_DE_OPERACAO.md

[2026-02-24 13:38:12 -0300] [Codex]
Contexto:
- Ajuste de governanca solicitado: consolidar Gemini como agente auxiliar e centralizar atribuicao no Claude.

Feito:
- Governanca atualizada para `Codex e Gemini = devs auxiliares`.
- Regra explicita adicionada: Claude define tarefas de cada IA e pode implementar diretamente.

Proximo:
- Seguir esse modelo em todas as proximas execucoes e registros.

Bloqueios/Riscos:
- Nenhum.

Arquivos alterados:
- docs/LOG_AGENTES.md
- docs/CENTRO_DE_OPERACAO.md

[2026-02-24 13:40:29 -0300] [Codex]
Contexto:
- Nova regra solicitada: remover referencias de agente ausente e definir contingencia quando o Claude nao estiver disponivel.

Feito:
- Modelo atualizado com Codex acima do Gemini na ausencia do Claude.
- Procedimento oficial adicionado para os comandos "Claude nao ta disponivel" e "Claude voltou".
- Processo de documentacao e handoff para retorno do Claude definido.

Proximo:
- Executar automaticamente esse fluxo quando voce ativar os comandos.

Bloqueios/Riscos:
- Nenhum.

Arquivos alterados:
- docs/LOG_AGENTES.md
- docs/CENTRO_DE_OPERACAO.md

[2026-02-24 13:44:35 -0300] [Codex]
Contexto:
- Nova regra operacional solicitada: priorizar tarefas simples no Gemini e trocar comandos para `Claude +` / `Claude -`.

Feito:
- Governanca atualizada para priorizar tarefas simples no Gemini por custo.
- Regra de fallback adicionada: IA indisponivel -> proximo da cadeia assume tarefas simples e urgentes.
- Comandos de operacao atualizados para `Claude +` (disponivel) e `Claude -` (indisponivel).

Proximo:
- Aplicar automaticamente esse roteamento de tarefas sempre que voce sinalizar indisponibilidade.

Bloqueios/Riscos:
- Nenhum.

Arquivos alterados:
- docs/LOG_AGENTES.md
- docs/CENTRO_DE_OPERACAO.md

[2026-02-24 13:46:39 -0300] [Codex]
Contexto:
- Solicitacao de novos comandos de disponibilidade para Codex e Gemini, seguindo a mesma logica de `+` e `-`.

Feito:
- Comandos adicionados: `Codex +`, `Codex -`, `Gemini +`, `Gemini -`.
- Regras de fallback documentadas para cada indisponibilidade.
- Cadeia rapida de lideranca e execucao simples registrada.

Proximo:
- Aplicar automaticamente o roteamento de tarefas ao receber esses comandos.

Bloqueios/Riscos:
- Nenhum.

Arquivos alterados:
- docs/LOG_AGENTES.md
- docs/CENTRO_DE_OPERACAO.md
- docs/GUIA_RAPIDO_HIERARQUIA_IA.md

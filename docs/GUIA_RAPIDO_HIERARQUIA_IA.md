# Guia Rapido da Hierarquia de IA

Ultima atualizacao: 2026-02-24 13:46:39 -0300

Objetivo:
- Explicar de forma simples como as IAs trabalham no projeto.

Quem faz o que:
- Claude: lider tecnico. Decide prioridades e valida o resultado final.
- Codex: dev auxiliar senior. Implementa tarefas tecnicas e assume lideranca quando o Claude estiver fora.
- Gemini: dev auxiliar de apoio. Recebe primeiro as tarefas simples para reduzir custo.

Regra de custo:
- Tarefas simples vao primeiro para o Gemini.
- Se o Gemini estiver indisponivel, a tarefa simples sobe para o proximo da cadeia.

Cadeia de contingencia:
- Cadeia principal de decisao: Claude -> Codex -> Gemini.
- Se uma IA estiver indisponivel, o proximo da cadeia assume tarefas simples e urgentes.
- Toda mudanca de dono da tarefa deve ser registrada no `docs/LOG_AGENTES.md`.

Comandos oficiais:
- `Claude +`: Claude disponivel, ele lidera e manda.
- `Claude -`: Claude indisponivel, Codex assume lideranca interina.
- `Codex +`: Codex disponivel para execucao e fallback de lideranca.
- `Codex -`: Codex indisponivel; tarefas simples sobem para Gemini/Claude.
- `Gemini +`: Gemini disponivel; tarefas simples voltam para ele.
- `Gemini -`: Gemini indisponivel; tarefas simples sobem para Codex e depois Claude.

Quando usar cada comando:
- Use `Claude -` quando o Claude estiver fora.
- Use `Claude +` quando o Claude voltar para receber o handoff e retomar o comando.
- Use `Codex -` quando o Codex estiver fora; o fluxo simples segue com quem estiver disponivel.
- Use `Codex +` quando o Codex voltar para retomar fallback tecnico.
- Use `Gemini -` quando o Gemini estiver fora; simples vai para Codex/Claude.
- Use `Gemini +` quando o Gemini voltar para retomar tarefas simples.

Handoff (passagem de contexto):
- No periodo com `Claude -`, Codex documenta decisoes, tarefas feitas e pendencias.
- Ao receber `Claude +`, Codex consolida tudo e atualiza a documentacao para o Claude retomar sem perda de contexto.
- A mesma logica vale para `Codex -/+` e `Gemini -/+`: ao voltar, quem estava fora recebe contexto resumido.

Onde acompanhar:
- Visao geral e regras: `docs/CENTRO_DE_OPERACAO.md`
- Historico continuo: `docs/LOG_AGENTES.md`

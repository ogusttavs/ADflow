# AGENTS - Regras Operacionais do Projeto

Estas regras valem para qualquer IA/agente neste repositorio.

## Modelo de trabalho atual
- Dono do produto: decisao final.
- Codex: dev principal (execucao).
- Claude: consultor tecnico.
- Gemini: fora do projeto.

## Regra obrigatoria de documentacao (hard rule)
Sempre que houver alteracao de codigo, config, infra, testes, banco, commit ou push, atualizar e stage no mesmo commit:
- `docs/CENTRO_DE_OPERACAO.md`
- `docs/LOG_AGENTES.md`

Sempre que tarefa for concluida ou criada:
- atualizar `docs/TODO_LANCAMENTO.md` imediatamente.

Sem isso, o trabalho e considerado incompleto.

## Fonte de verdade dos docs
1. `docs/TODO_LANCAMENTO.md` (backlog oficial)
2. `docs/CENTRO_DE_OPERACAO.md` (governanca e estado atual)
3. `docs/LOG_AGENTES.md` (historico)
4. `docs/DEPLOY_VPS.md` (operacao de producao)
5. `docs/DECISOES_PRODUTO.md` (decisoes de produto vigentes)
6. `docs/ESTRATEGIA_MERCADO_UX_SEGURANCA.md` (base de pesquisa e referencia estrategica)

## Guardrails automaticos
- Hook local de `pre-commit` e `pre-push` valida update de `CENTRO`, `LOG` e `TODO`.
- CI (`.github/workflows/docs-guardrail.yml`) valida a mesma regra no GitHub.

## Setup obrigatorio em maquina/clone novo
Execute uma vez:

```bash
./scripts/install-hooks.sh
```

## Excecoes
Nao ha excecao automatica. Em emergencia, registrar no `docs/LOG_AGENTES.md`:
- motivo,
- data/hora,
- responsavel,
- correcao posterior aplicada.

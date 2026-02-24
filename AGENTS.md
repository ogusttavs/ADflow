# AGENTS - Regras Operacionais do Projeto

Estas regras valem para qualquer IA/agente que atuar neste repositório.

## Regra obrigatória de documentação (hard rule)
Sempre que houver alteração de código, config, infra, testes, banco, commit ou push, atualize e stage no mesmo commit:
- `docs/LOG_AGENTES.md`
- `docs/CENTRO_DE_OPERACAO.md`

Sem isso, o trabalho é considerado incompleto.

## Guardrails automáticos
- Hook local de `pre-commit` e `pre-push` valida a regra acima.
- CI (`.github/workflows/docs-guardrail.yml`) valida a mesma regra no GitHub.

## Setup obrigatório em máquina/clone novo
Execute uma vez:

```bash
./scripts/install-hooks.sh
```

Isso ativa `core.hooksPath=.githooks` e os hooks do projeto.

## Exceções
Não há exceção automática. Se for necessário bypass manual em emergência, registrar no `docs/LOG_AGENTES.md`:
- motivo,
- data/hora,
- responsável,
- correção posterior aplicada.

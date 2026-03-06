# AGENTS - Regras Operacionais do Projeto

Estas regras valem para qualquer IA/agente neste repositorio.

## Modelo de trabalho atual
- Dono do produto: decisao final.
- Codex: dev principal (execucao).
- Claude: consultor tecnico.
- Gemini: fora do projeto.

## Regra obrigatoria de documentacao (hard rule)
- Toda acao relevante (humano ou IA) precisa gerar **nova entrada** em `docs/LOG_AGENTES.md`.
- O log e append-only e deve seguir o formato V2 descrito em `docs/SISTEMA_DOCUMENTACAO.md`.
- Sempre que houver alteracao de codigo, config, infra, testes, banco, commit ou push, atualizar e stage no mesmo commit:
  - `docs/CENTRO_DE_OPERACAO.md`
  - `docs/TODO_LANCAMENTO.md`
  - `docs/LOG_AGENTES.md`
- Sem isso, o trabalho e considerado incompleto.

## Fonte de verdade dos docs
1. `docs/TODO_LANCAMENTO.md` (backlog oficial)
2. `docs/CENTRO_DE_OPERACAO.md` (governanca e estado atual)
3. `docs/LOG_AGENTES.md` (log cronologico por acao)
4. `docs/SISTEMA_DOCUMENTACAO.md` (regras, formato e automacao de documentacao)
5. `docs/DEPLOY_VPS.md` (operacao de producao)
6. `docs/DECISOES_PRODUTO.md` (decisoes de produto vigentes)
7. `docs/ESTRATEGIA_MERCADO_UX_SEGURANCA.md` (base de pesquisa e referencia estrategica)

## Guardrails automaticos
- Hook local de `pre-commit` e `pre-push` valida:
  - presenca de `LOG_AGENTES` em todo commit;
  - presenca de `CENTRO` + `TODO` quando houver mudanca fora de docs;
  - formato V2 da nova entrada no log.
- CI (`.github/workflows/docs-guardrail.yml`) valida a mesma regra no GitHub.

## Setup obrigatorio em maquina/clone novo
Execute uma vez:

```bash
./scripts/install-hooks.sh
```

Atalho para registrar acao no log:

```bash
bash scripts/docs/log-action.sh --help
```

## Excecoes
Nao ha excecao automatica. Em emergencia, registrar no `docs/LOG_AGENTES.md`:
- motivo,
- data/hora,
- responsavel,
- correcao posterior aplicada.

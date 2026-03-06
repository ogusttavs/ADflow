# LEIA PRIMEIRO - Documentacao Oficial

Atualizado em: 2026-03-05 19:35:00 -0300

Este arquivo define a estrutura oficial dos documentos para evitar duplicacao e conflito.

## Ordem de consulta (obrigatoria)
1. `docs/SISTEMA_DOCUMENTACAO.md` -> regras oficiais de documentacao, formato de log e guardrails.
2. `docs/TODO_LANCAMENTO.md` -> backlog oficial e status de execucao.
3. `docs/CENTRO_DE_OPERACAO.md` -> regras operacionais e estado atual do projeto.
4. `docs/LOG_AGENTES.md` -> log cronologico por acao (humano e IA).
5. `docs/DEPLOY_VPS.md` -> operacao de deploy em VPS/producao.
6. `docs/DECISOES_PRODUTO.md` -> decisoes de produto vigentes (fonte para priorizacao).
7. `docs/ESTRATEGIA_MERCADO_UX_SEGURANCA.md` -> base de pesquisa e referencia estrategica (nao operacional diaria).

## Regras de manutencao
- Toda acao relevante deve gerar nova entrada em `docs/LOG_AGENTES.md` no formato V2.
- Ao concluir tarefa: atualizar imediatamente `docs/TODO_LANCAMENTO.md`.
- Ao criar tarefa nova: adicionar imediatamente no `docs/TODO_LANCAMENTO.md`.
- Em toda alteracao relevante de codigo/infra/teste/deploy: atualizar `docs/CENTRO_DE_OPERACAO.md`.
- Nao manter a mesma regra/decisao em mais de um arquivo com textos diferentes.
- Nunca registrar segredo real em arquivo dentro de `docs/`.

## Arquivos arquivados
Documentos antigos ou redundantes foram movidos para `docs/ARQUIVO/` para consulta historica sem poluir o fluxo principal.

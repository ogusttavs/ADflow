# LEIA PRIMEIRO - Documentacao Oficial

Atualizado em: 2026-02-25 00:18:33 -0300

Este arquivo define a estrutura oficial dos documentos para evitar duplicacao e conflito.

## Ordem de consulta (obrigatoria)
1. `docs/TODO_LANCAMENTO.md` -> backlog oficial e status de execucao.
2. `docs/CENTRO_DE_OPERACAO.md` -> regras operacionais e estado atual do projeto.
3. `docs/LOG_AGENTES.md` -> historico cronologico do que foi feito.
4. `docs/DEPLOY_VPS.md` -> operacao de deploy em VPS/producao.
5. `docs/ESTRATEGIA_MERCADO_UX_SEGURANCA.md` -> referencia estrategica (nao operacional diaria).

## Regras de manutencao
- Ao concluir tarefa: atualizar imediatamente `docs/TODO_LANCAMENTO.md`.
- Ao criar tarefa nova: adicionar imediatamente no `docs/TODO_LANCAMENTO.md`.
- Em toda alteracao relevante de codigo/infra/teste/deploy: atualizar `docs/CENTRO_DE_OPERACAO.md` e `docs/LOG_AGENTES.md`.
- Nao manter a mesma regra/decisao em mais de um arquivo com textos diferentes.
- Nunca registrar segredo real em arquivo dentro de `docs/`.

## Arquivos arquivados
Documentos antigos ou redundantes foram movidos para `docs/ARQUIVO/` para consulta historica sem poluir o fluxo principal.

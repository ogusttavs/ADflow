# Sistema de Documentacao - Orbita (V2)

Atualizado em: 2026-03-05 19:35:00 -0300

Objetivo:
- garantir continuidade total do projeto entre humanos e IAs;
- evitar perda de contexto entre sessoes, ferramentas e trocas de agente;
- manter historico rastreavel de toda acao relevante.

## 1) Principios obrigatorios

1. Um backlog oficial: somente `docs/TODO_LANCAMENTO.md`.
2. Um estado operacional atual: `docs/CENTRO_DE_OPERACAO.md`.
3. Um log append-only por acao: `docs/LOG_AGENTES.md`.
4. Toda acao relevante precisa de registro no mesmo ciclo de trabalho.
5. Sem segredo real em documentacao versionada.

## 2) Estrutura oficial dos documentos

- `docs/LEIA_PRIMEIRO.md`: mapa mestre e ordem de leitura.
- `docs/SISTEMA_DOCUMENTACAO.md`: regras, padroes e processo.
- `docs/TODO_LANCAMENTO.md`: backlog oficial (planejamento + status).
- `docs/CENTRO_DE_OPERACAO.md`: contexto vivo do projeto e prioridades.
- `docs/LOG_AGENTES.md`: trilha cronologica de acoes (humano e IA).
- `docs/DEPLOY_VPS.md`: runbook de producao.
- `docs/DECISOES_PRODUTO.md`: decisoes de produto vigentes.
- `docs/ESTRATEGIA_MERCADO_UX_SEGURANCA.md`: base estrategica e referencias.
- `docs/ARQUIVO/*`: historico congelado (nao operacional diario).

## 3) Matriz de atualizacao obrigatoria

Quando houver qualquer acao relevante, atualizar:
- Sempre: `docs/LOG_AGENTES.md` (1 entrada nova por acao).
- Se alterou escopo/status de tarefa: `docs/TODO_LANCAMENTO.md`.
- Se mudou estado operacional/processo/prioridade: `docs/CENTRO_DE_OPERACAO.md`.
- Se mudou regra de negocio/produto: `docs/DECISOES_PRODUTO.md`.
- Se mudou deploy/infra/procedimento: `docs/DEPLOY_VPS.md`.

## 4) Formato obrigatorio do log por acao (V2)

Cada entrada nova em `docs/LOG_AGENTES.md` deve usar este cabecalho:

```text
[AAAA-MM-DD HH:mm:ss -0300] [autor:<nome>] [perfil:humano|ia] [acao:<categoria.subcategoria>] [id:LOG-AAAAMMDD-HHMMSS-<slug>]
```

Campos obrigatorios da entrada:
- `Contexto:`
- `Mudancas:`
- `Arquivos afetados:`
- `Proximo:`
- `Evidencias:`

Categorias recomendadas de `acao`:
- `docs.governanca`
- `backend.feature`
- `frontend.feature`
- `infra.deploy`
- `infra.db`
- `seguranca.hardening`
- `qa.validacao`
- `produto.decisao`

## 5) Fluxo operacional padrao

1. Ler `LEIA_PRIMEIRO` e `TODO`.
2. Executar a acao.
3. Validar tecnicamente (quando aplicavel).
4. Registrar entrada no `LOG_AGENTES`.
5. Atualizar `TODO` e/ou `CENTRO` quando necessario.
6. Confirmar que hooks/CI passaram.

## 6) Automacao obrigatoria

Guardrails ativos:
- hook `pre-commit`;
- hook `pre-push`;
- workflow `.github/workflows/docs-guardrail.yml`.

Os guardrails validam:
- presenca de `docs/LOG_AGENTES.md` em todo commit;
- para mudancas fora de docs, presenca de `docs/CENTRO_DE_OPERACAO.md` e `docs/TODO_LANCAMENTO.md`;
- formato minimo da entrada V2 no log.

## 7) Comandos de uso rapido

Instalar hooks:

```bash
./scripts/install-hooks.sh
```

Gerar entrada de log (assistido):

```bash
bash scripts/docs/log-action.sh \
  --autor "gustavo" \
  --perfil "humano" \
  --acao "docs.governanca" \
  --contexto "Ajuste de regra de documentacao" \
  --mudanca "Definido sistema V2 de log por acao" \
  --arquivo "docs/SISTEMA_DOCUMENTACAO.md" \
  --proximo "Aplicar o padrao em todas as proximas entregas" \
  --evidencia "hooks e CI atualizados"
```

## 8) Regra de continuidade entre IAs

Se trocar de IA ou perder contexto:
1. Ler `LEIA_PRIMEIRO`.
2. Ler os ultimos itens de `TODO`.
3. Ler o bloco final de `CENTRO`.
4. Ler as ultimas entradas de `LOG_AGENTES`.
5. Continuar sem depender de memoria de conversa anterior.

## 9) Politica de qualidade da documentacao

- Linguagem operacional objetiva.
- Timestamps reais em timezone local.
- Sem duplicar regra em arquivos diferentes com texto conflitante.
- Quando houver conflito, corrigir no mesmo ciclo da entrega.

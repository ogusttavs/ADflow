#!/usr/bin/env bash
set -euo pipefail

required_docs=(
  "docs/LOG_AGENTES.md"
  "docs/CENTRO_DE_OPERACAO.md"
  "docs/TODO_LANCAMENTO.md"
)

mode="staged"
range=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      mode="${2:-}"
      shift 2
      ;;
    --range)
      mode="range"
      range="${2:-}"
      shift 2
      ;;
    *)
      echo "Uso: $0 [--mode staged|range] [--range <git-range>]" >&2
      exit 2
      ;;
  esac
done

changed_files=""
case "$mode" in
  staged)
    changed_files="$(git diff --cached --name-only --diff-filter=ACMRTUXB)"
    ;;
  range)
    if [[ -z "$range" ]]; then
      echo "ERRO: --range requer um range git valido (ex: origin/main...HEAD)." >&2
      exit 2
    fi
    changed_files="$(git diff --name-only --diff-filter=ACMRTUXB "$range")"
    ;;
  *)
    echo "ERRO: modo invalido '$mode'. Use staged ou range." >&2
    exit 2
    ;;
esac

if [[ -z "${changed_files}" ]]; then
  exit 0
fi

needs_docs=0
while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  case "$file" in
    docs/*)
      ;;
    *)
      needs_docs=1
      break
      ;;
  esac
done <<< "$changed_files"

if [[ "$needs_docs" -eq 0 ]]; then
  exit 0
fi

missing_docs=()
for doc in "${required_docs[@]}"; do
  if ! grep -Fxq "$doc" <<< "$changed_files"; then
    missing_docs+=("$doc")
  fi
done

if [[ ${#missing_docs[@]} -gt 0 ]]; then
  echo ""
  echo "ERRO: Mudancas fora de docs detectadas sem atualizacao dos docs obrigatorios."
  echo "Inclua no commit/branch:"
  for doc in "${missing_docs[@]}"; do
    echo "- ${doc}"
  done
  echo ""
  echo "Sugestao: registre o resumo final da tarefa e rode:"
  echo "  git add docs/LOG_AGENTES.md docs/CENTRO_DE_OPERACAO.md docs/TODO_LANCAMENTO.md"
  echo ""
  exit 1
fi

if [[ "$mode" == "staged" ]]; then
  unstaged_required_docs="$(git diff --name-only -- "${required_docs[@]}")"
  if [[ -n "$unstaged_required_docs" ]]; then
    echo ""
    echo "ERRO: Docs obrigatorios foram editados, mas nao estao staged."
    echo "$unstaged_required_docs"
    echo ""
    echo "Rode:"
    echo "  git add docs/LOG_AGENTES.md docs/CENTRO_DE_OPERACAO.md docs/TODO_LANCAMENTO.md"
    echo ""
    exit 1
  fi
fi

exit 0

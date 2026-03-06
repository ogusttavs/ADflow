#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

log_doc="docs/LOG_AGENTES.md"
required_docs_non_docs=(
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

# Regra V2: toda acao registrada em log no mesmo commit/range.
if ! grep -Fxq "$log_doc" <<< "$changed_files"; then
  echo ""
  echo "ERRO: toda mudanca precisa registrar acao em ${log_doc}."
  echo "Inclua uma nova entrada de log V2 e adicione o arquivo no commit."
  echo ""
  echo "Sugestao:"
  echo "  bash scripts/docs/log-action.sh --help"
  echo "  git add ${log_doc}"
  echo ""
  exit 1
fi

needs_non_docs=0
while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  case "$file" in
    docs/*)
      ;;
    *)
      needs_non_docs=1
      break
      ;;
  esac
done <<< "$changed_files"

missing_docs=()
if [[ "$needs_non_docs" -eq 1 ]]; then
  for doc in "${required_docs_non_docs[@]}"; do
    if ! grep -Fxq "$doc" <<< "$changed_files"; then
      missing_docs+=("$doc")
    fi
  done

  if [[ ${#missing_docs[@]} -gt 0 ]]; then
    echo ""
    echo "ERRO: mudancas fora de docs detectadas sem atualizacao dos docs obrigatorios."
    echo "Inclua no commit/branch:"
    for doc in "${missing_docs[@]}"; do
      echo "- ${doc}"
    done
    echo ""
    echo "Rode:"
    echo "  git add docs/CENTRO_DE_OPERACAO.md docs/TODO_LANCAMENTO.md ${log_doc}"
    echo ""
    exit 1
  fi
fi

if [[ "$mode" == "staged" ]]; then
  docs_to_stage=("$log_doc")
  if [[ "$needs_non_docs" -eq 1 ]]; then
    docs_to_stage+=("${required_docs_non_docs[@]}")
  fi

  unstaged_required_docs="$(git diff --name-only -- "${docs_to_stage[@]}")"
  if [[ -n "$unstaged_required_docs" ]]; then
    echo ""
    echo "ERRO: docs obrigatorios foram editados, mas nao estao staged."
    echo "$unstaged_required_docs"
    echo ""
    echo "Rode:"
    echo "  git add ${docs_to_stage[*]}"
    echo ""
    exit 1
  fi
fi

# Regra V2: valida formato minimo da nova entrada no log.
if [[ "$mode" == "staged" ]]; then
  "$repo_root/scripts/docs/validate-log-entry.sh" --mode staged
else
  "$repo_root/scripts/docs/validate-log-entry.sh" --range "$range"
fi

exit 0

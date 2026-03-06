#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

log_file="docs/LOG_AGENTES.md"
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

case "$mode" in
  staged)
    diff_output="$(git diff --cached --unified=0 -- "$log_file")"
    ;;
  range)
    if [[ -z "$range" ]]; then
      echo "ERRO: --range requer um range git valido." >&2
      exit 2
    fi
    diff_output="$(git diff --unified=0 "$range" -- "$log_file")"
    ;;
  *)
    echo "ERRO: modo invalido '$mode'. Use staged ou range." >&2
    exit 2
    ;;
esac

added_lines="$(printf '%s\n' "$diff_output" | grep '^+' | grep -v '^+++' || true)"

if [[ -z "$added_lines" ]]; then
  echo "ERRO: $log_file precisa conter uma nova entrada no diff atual." >&2
  exit 1
fi

header_regex='^\+\[[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2} [+-][0-9]{4}\] \[autor:[^][]+\] \[perfil:(humano|ia)\] \[acao:[a-z0-9._-]+\] \[id:LOG-[0-9]{8}-[0-9]{6}-[a-z0-9._-]+\]$'
if ! grep -Eq "$header_regex" <<< "$added_lines"; then
  echo "ERRO: cabecalho de log V2 ausente ou invalido em $log_file." >&2
  echo "Formato esperado:" >&2
  echo "[AAAA-MM-DD HH:mm:ss -0300] [autor:<nome>] [perfil:humano|ia] [acao:<categoria.subcategoria>] [id:LOG-AAAAMMDD-HHMMSS-<slug>]" >&2
  exit 1
fi

required_labels=(
  "Contexto:"
  "Mudancas:"
  "Arquivos afetados:"
  "Proximo:"
  "Evidencias:"
)

missing_labels=()
for label in "${required_labels[@]}"; do
  if ! grep -Fq "+${label}" <<< "$added_lines"; then
    missing_labels+=("$label")
  fi
done

if [[ ${#missing_labels[@]} -gt 0 ]]; then
  echo "ERRO: secao obrigatoria ausente no log V2:" >&2
  for label in "${missing_labels[@]}"; do
    echo "- $label" >&2
  done
  exit 1
fi

exit 0

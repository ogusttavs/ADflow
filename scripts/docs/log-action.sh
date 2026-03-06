#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

log_file="docs/LOG_AGENTES.md"
autor=""
perfil=""
acao=""
contexto=""
mudanca=""

arquivos=()
proximos=()
evidencias=()

usage() {
  cat <<'USAGE'
Uso:
  bash scripts/docs/log-action.sh \
    --autor "nome" \
    --perfil "humano|ia" \
    --acao "categoria.subcategoria" \
    --contexto "contexto da acao" \
    --mudanca "resumo principal" \
    [--arquivo "path/arquivo"]... \
    [--proximo "proximo passo"]... \
    [--evidencia "comando/resultado"]...
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --autor)
      autor="${2:-}"
      shift 2
      ;;
    --perfil)
      perfil="${2:-}"
      shift 2
      ;;
    --acao)
      acao="${2:-}"
      shift 2
      ;;
    --contexto)
      contexto="${2:-}"
      shift 2
      ;;
    --mudanca)
      mudanca="${2:-}"
      shift 2
      ;;
    --arquivo)
      arquivos+=("${2:-}")
      shift 2
      ;;
    --proximo)
      proximos+=("${2:-}")
      shift 2
      ;;
    --evidencia)
      evidencias+=("${2:-}")
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Parametro invalido: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if [[ -z "$autor" || -z "$perfil" || -z "$acao" || -z "$contexto" || -z "$mudanca" ]]; then
  echo "ERRO: parametros obrigatorios ausentes." >&2
  usage
  exit 2
fi

if [[ "$perfil" != "humano" && "$perfil" != "ia" ]]; then
  echo "ERRO: --perfil deve ser 'humano' ou 'ia'." >&2
  exit 2
fi

timestamp="$(date '+%Y-%m-%d %H:%M:%S %z')"
id_ts="$(date '+%Y%m%d-%H%M%S')"
slug="$(printf '%s' "$acao" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | sed 's/^-//;s/-$//')"
entry_id="LOG-${id_ts}-${slug}"

if [[ ${#arquivos[@]} -eq 0 ]]; then
  arquivos+=("n/a")
fi
if [[ ${#proximos[@]} -eq 0 ]]; then
  proximos+=("n/a")
fi
if [[ ${#evidencias[@]} -eq 0 ]]; then
  evidencias+=("n/a")
fi

{
  echo ""
  echo "[${timestamp}] [autor:${autor}] [perfil:${perfil}] [acao:${acao}] [id:${entry_id}]"
  echo "Contexto:"
  echo "- ${contexto}"
  echo ""
  echo "Mudancas:"
  echo "- ${mudanca}"
  echo ""
  echo "Arquivos afetados:"
  for item in "${arquivos[@]}"; do
    echo "- ${item}"
  done
  echo ""
  echo "Proximo:"
  for item in "${proximos[@]}"; do
    echo "- ${item}"
  done
  echo ""
  echo "Evidencias:"
  for item in "${evidencias[@]}"; do
    echo "- ${item}"
  done
} >> "$log_file"

echo "Entrada registrada em ${log_file}: ${entry_id}"

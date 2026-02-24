#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

chmod +x scripts/check-docs-sync.sh .githooks/pre-commit
chmod +x .githooks/pre-push

git config core.hooksPath .githooks

echo "Hooks instalados com sucesso (core.hooksPath=.githooks)."

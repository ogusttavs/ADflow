#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

chmod +x scripts/check-docs-sync.sh .githooks/pre-commit
chmod +x .githooks/pre-push
if compgen -G "scripts/docs/*.sh" > /dev/null; then
  chmod +x scripts/docs/*.sh
fi

git config core.hooksPath .githooks

echo "Hooks instalados com sucesso (core.hooksPath=.githooks)."

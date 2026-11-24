#!/usr/bin/env bash
set -euo pipefail

readonly ALLOWED_TARGET="http://localhost:3000"
readonly TARGET="${1:-$ALLOWED_TARGET}"

if [[ "$TARGET" != "$ALLOWED_TARGET" ]]; then
  echo "Refusing target: security scans are restricted to $ALLOWED_TARGET" >&2
  exit 64
fi

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly REPOSITORY_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
# Compatibility entry point; use the scoped Compose daemon and shared session.
# Entrada de compatibilidade; use o daemon Compose com escopo e sessão compartilhada.
exec node "$REPOSITORY_DIR/scripts/zap.cjs" baseline

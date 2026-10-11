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
readonly REPORTS_DIR="$REPOSITORY_DIR/reports"

mkdir -p "$REPORTS_DIR"

docker run --rm \
  --network host \
  --volume "$REPORTS_DIR:/zap/wrk/:rw" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py \
  -t "$TARGET" \
  -r zap-baseline.html

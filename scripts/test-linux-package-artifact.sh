#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
ARTIFACT=$(find dist -maxdepth 2 -type f \( -name '*.AppImage' -o -name '*.appimage' \) | head -n 1 || true)
if [[ -z "$ARTIFACT" ]]; then
  echo "No AppImage artifact found under dist/." >&2
  exit 1
fi
printf '%s\n' "$ARTIFACT"

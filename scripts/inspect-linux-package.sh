#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
APPIMAGE=$(find dist -maxdepth 2 -type f \( -name '*.AppImage' -o -name '*.appimage' \) | head -n 1 || true)
if [[ -z "$APPIMAGE" ]]; then
  echo "No AppImage artifact found under dist/." >&2
  exit 1
fi
printf 'artifact=%s\n' "$APPIMAGE"
file "$APPIMAGE"

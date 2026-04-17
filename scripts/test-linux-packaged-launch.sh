#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
APPIMAGE=$(find dist -maxdepth 2 -type f \( -name '*.AppImage' -o -name '*.appimage' \) | head -n 1 || true)
if [[ -z "$APPIMAGE" ]]; then
  echo "No AppImage artifact found under dist/." >&2
  exit 1
fi
chmod +x "$APPIMAGE"
VOICE_CLI_AUTO_EXIT=1 VOICE_CLI_AUTO_EXIT_DELAY_MS=1500 "$APPIMAGE" --no-sandbox

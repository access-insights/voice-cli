#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
APPIMAGE=$(find dist -maxdepth 2 -type f \( -name '*.AppImage' -o -name '*.appimage' \) | head -n 1 || true)
if [[ -z "$APPIMAGE" ]]; then
  echo "No AppImage artifact found under dist/." >&2
  exit 1
fi
chmod +x "$APPIMAGE"
set +e
OUTPUT=$(VOICE_CLI_AUTO_EXIT=1 VOICE_CLI_AUTO_EXIT_DELAY_MS=1500 "$APPIMAGE" --no-sandbox 2>&1)
STATUS=$?
set -e
printf '%s\n' "$OUTPUT"
if [[ $STATUS -ne 0 && "$OUTPUT" == *"libfuse.so.2"* ]]; then
  echo "PACKAGED_LAUNCH_BLOCKED_BY_HOST_FUSE" >&2
  exit 2
fi
exit $STATUS

#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
SANDBOX=node_modules/electron/dist/chrome-sandbox
if [ ! -e "$SANDBOX" ]; then
  echo '{"ready":false,"reason":"chrome-sandbox missing"}'
  exit 0
fi
OWNER=$(stat -c '%U' "$SANDBOX")
MODE=$(stat -c '%a' "$SANDBOX")
if [ "$OWNER" = "root" ] && [ "$MODE" = "4755" ]; then
  echo '{"ready":true,"reason":"chrome-sandbox configured"}'
else
  printf '{"ready":false,"reason":"chrome-sandbox not configured","owner":"%s","mode":"%s"}\n' "$OWNER" "$MODE"
fi

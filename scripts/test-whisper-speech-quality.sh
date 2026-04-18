#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
AUDIO_PATH="${1:-}"
if [[ -z "$AUDIO_PATH" ]]; then
  echo "Usage: $0 /path/to/short-spoken-sample.wav" >&2
  exit 1
fi
bash ./scripts/test-whisper-prompt-load.sh "$AUDIO_PATH"

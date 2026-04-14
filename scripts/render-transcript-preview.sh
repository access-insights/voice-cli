#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node src/main.ts >/tmp/voice-cli-preview.json
cat /tmp/voice-cli-preview.json

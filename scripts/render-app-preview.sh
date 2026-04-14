#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node src/main.ts >/tmp/voice-cli-app-preview.json
cat /tmp/voice-cli-app-preview.json

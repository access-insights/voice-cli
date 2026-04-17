#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
VOICE_CLI_AUTO_EXIT=1 VOICE_CLI_TEST_MODE=real-session VOICE_CLI_AUTO_EXIT_DELAY_MS=1800 ./node_modules/.bin/electron . --no-sandbox

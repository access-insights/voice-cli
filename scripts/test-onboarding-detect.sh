#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node -e "import('./src/electron/main-onboarding.js').then((m) => console.log(JSON.stringify(m.detectCodexCliInMain(), null, 2))).catch((error) => { console.error(error); process.exit(1); })"

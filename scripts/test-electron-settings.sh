#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
TMPDIR=$(mktemp -d /tmp/voice-cli-settings-XXXX)
node -e "import('./src/electron/main-settings.js').then((m) => { const saved = m.saveElectronSettings({ onboardingProjectPath: '/tmp/demo', onboardingProjectValid: true, onboardingCodexPath: '/usr/bin/codex', onboardingCodexDetected: true }, process.argv[1]); const loaded = m.loadElectronSettings(process.argv[1]); console.log(JSON.stringify({ saved, loaded }, null, 2)); }).catch((error) => { console.error(error); process.exit(1); })" "$TMPDIR"
rm -rf "$TMPDIR"

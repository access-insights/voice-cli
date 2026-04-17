#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node -e "import('./src/electron/main-transcription.js').then((m) => { const result = m.transcribeAudioInMain(process.argv[1] || '', { model: 'whisper-1', language: 'en' }); console.log(JSON.stringify(result, null, 2)); if (!result.ok) process.exit(1); }).catch((error) => { console.error(error); process.exit(1); })" "${1:-}"

#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node -e "import('./src/electron/main-audio-capture.js').then((m) => { const sample = Buffer.from('RIFFTEST').toString('base64'); const result = m.persistCapturedAudioInMain(sample, { extension: 'wav', mimeType: 'audio/wav' }); console.log(JSON.stringify(result, null, 2)); if (!result.ok) process.exit(1); }).catch((error) => { console.error(error); process.exit(1); })"

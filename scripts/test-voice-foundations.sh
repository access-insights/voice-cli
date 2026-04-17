#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node <<'NODE'
import { speakTextInMain } from './src/electron/main-voice.js';
import { persistCapturedAudioInMain } from './src/electron/main-audio-capture.js';
const speak = speakTextInMain('', { rate: 1.0 });
const captured = persistCapturedAudioInMain(Buffer.from('RIFFTEST').toString('base64'), { extension: 'wav', mimeType: 'audio/wav' });
if (speak.ok || !speak.fallbackRecommended || !captured.ok || captured.extension !== 'wav') {
  console.error(JSON.stringify({ ok: false, speak, captured }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, speak, captured }, null, 2));
NODE

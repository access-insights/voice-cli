#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
AUDIO_PATH="${1:-/tmp/voice-cli-sample-tone.wav}"
node - <<'NODE' "$AUDIO_PATH"
import { transcribeAudioInMain, loadTranscriptionTextInMain } from './src/electron/main-transcription.js';
const audioPath = process.argv[2];
const result = transcribeAudioInMain(audioPath, { model: 'whisper-1', language: 'en' });
if (!result.ok) {
  console.error(JSON.stringify({ ok: false, stage: 'transcribe', result }, null, 2));
  process.exit(1);
}
const loaded = loadTranscriptionTextInMain(result.outPath);
if (!loaded.ok || !String(loaded.text || '').trim()) {
  console.error(JSON.stringify({ ok: false, stage: 'load', result, loaded }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, result, loaded }, null, 2));
NODE

#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node <<'NODE'
import { readFileSync } from 'node:fs';
const source = readFileSync('./src/renderer/page-script.js', 'utf8');
const required = [
  'History summary',
  'Runs with errors:',
  'flags ${escapeHtml(badges)}',
  'retry with a simpler prompt or re-check setup first',
  'Check local TTS availability if this should have spoken aloud.',
  'Verify the audio path and file format before retrying.',
];
const missing = required.filter((item) => !source.includes(item));
if (missing.length) {
  console.error(JSON.stringify({ ok: false, missing }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, checked: required }, null, 2));
NODE

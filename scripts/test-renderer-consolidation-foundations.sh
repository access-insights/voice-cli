#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node <<'NODE'
import { readFileSync } from 'node:fs';
const source = readFileSync('./src/renderer/page-script.js', 'utf8');
const required = [
  'function getLiveTranscriptViewOptions() {',
  'function getSavedTranscriptViewOptions() {',
  "transcriptEmptyMessage: 'No live transcript entries are available in this view.'",
  "transcriptEmptyMessage: 'No saved transcript entries are available in this view.'",
  'const transcriptView = getLiveTranscriptViewOptions();',
  'const transcriptView = getSavedTranscriptViewOptions();',
  'renderTranscriptNavigation(transcriptEntries, transcriptView)',
];
const missing = required.filter((item) => !source.includes(item));
if (missing.length) {
  console.error(JSON.stringify({ ok: false, missing }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, checked: required }, null, 2));
NODE

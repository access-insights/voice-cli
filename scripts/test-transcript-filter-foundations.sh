#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node <<'NODE'
import { readFileSync } from 'node:fs';
const source = readFileSync('./src/renderer/page-script.js', 'utf8');
const required = [
  "liveTranscriptFilter: 'all'",
  "savedTranscriptFilter: 'all'",
  'function filterTranscriptEntries(entries, filter)',
  'class="transcript-filter-button"',
  'Live transcript filter',
  'Saved transcript filter',
  'No live transcript entries match the current filter.',
  'No saved transcript entries match the current filter.',
  'Transcript filter changed:',
];
const missing = required.filter((item) => !source.includes(item));
if (missing.length) {
  console.error(JSON.stringify({ ok: false, missing }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, checked: required }, null, 2));
NODE

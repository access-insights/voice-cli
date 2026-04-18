#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node <<'NODE'
import { readFileSync } from 'node:fs';
const source = readFileSync('./src/renderer/page-script.js', 'utf8');
const required = [
  "historyFilter: 'all'",
  'function filterHistoryItems(history)',
  'class="history-filter-button" data-filter="errors"',
  'class="history-filter-button" data-filter="changes"',
  'class="history-filter-button" data-filter="prompts"',
  'No saved sessions match the current filter.',
  "setLiveMessage(`History filter changed to ${filter}.`)",
];
const missing = required.filter((item) => !source.includes(item));
if (missing.length) {
  console.error(JSON.stringify({ ok: false, missing }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, checked: required }, null, 2));
NODE

#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node <<'NODE'
import { readFileSync } from 'node:fs';
const source = readFileSync('./src/renderer/page-script.js', 'utf8');
const required = [
  'function getTranscriptEntryLabel(entry)',
  'const compact = options.compact !== false;',
  'const compactSummary = compact',
  '${escapeHtml(label)}: ${escapeHtml(entry.summary)}',
  "return `<li id=\"${entryAnchorId}\"><p id=\"${summaryId}\">${compactSummary}</p>${rawSection}</li>`;",
];
const missing = required.filter((item) => !source.includes(item));
if (missing.length) {
  console.error(JSON.stringify({ ok: false, missing }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, checked: required }, null, 2));
NODE

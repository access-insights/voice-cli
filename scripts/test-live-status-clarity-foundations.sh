#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node <<'NODE'
import { readFileSync } from 'node:fs';
const source = readFileSync('./src/renderer/page-script.js', 'utf8');
const required = [
  'The live runtime view is preparing new output.',
  'Live updates below reflect the current runtime state.',
  'The live runtime reported a problem.',
  'Latest live results are shown below unless you open recovered history.',
  'No live session is running yet. Start a session to view current runtime output here.',
  'const liveStateLabel = viewState.selectedRecord',
  'Recovered history is open, but this summary still describes the live runtime.',
  'This summary reflects the current live runtime.',
  'This summary reflects the latest completed live runtime.',
  'This summary will reflect the live runtime once a session starts.',
  'Live summary context:',
];
const missing = required.filter((item) => !source.includes(item));
if (missing.length) {
  console.error(JSON.stringify({ ok: false, missing }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, checked: required }, null, 2));
NODE

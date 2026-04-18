#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node <<'NODE'
import { readFileSync } from 'node:fs';
const source = readFileSync('./src/renderer/page-script.js', 'utf8');
const required = [
  'Recovered history view.',
  'You are inspecting a saved run snapshot, not the current live runtime.',
  'Return path:',
  'Return to live runtime view',
  'Live runtime is still available below this recovered history context.',
  'You are now viewing recovered history, not the live runtime.',
  'Recovered history is no longer selected.',
];
const missing = required.filter((item) => !source.includes(item));
if (missing.length) {
  console.error(JSON.stringify({ ok: false, missing }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, checked: required }, null, 2));
NODE

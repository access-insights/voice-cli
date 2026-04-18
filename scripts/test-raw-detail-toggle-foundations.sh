#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node <<'NODE'
import { readFileSync } from 'node:fs';
const source = readFileSync('./src/renderer/page-script.js', 'utf8');
const required = [
  "liveRawDetailsExpanded: false",
  "savedRawDetailsExpanded: false",
  "const expandRawDetails = options.expandRawDetails === true;",
  "<details ${expandRawDetails ? 'open' : ''}><summary",
  'class="raw-details-toggle-button"',
  'Collapse raw details',
  'Expand raw details',
  'Live raw details',
  'Saved raw details',
  'Raw details toggled:',
];
const missing = required.filter((item) => !source.includes(item));
if (missing.length) {
  console.error(JSON.stringify({ ok: false, missing }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, checked: required }, null, 2));
NODE

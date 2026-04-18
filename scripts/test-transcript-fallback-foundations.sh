#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node <<'NODE'
import { readFileSync } from 'node:fs';
const source = readFileSync('./src/renderer/page-script.js', 'utf8');
const required = [
  "const emptyMessage = options.emptyMessage || 'No transcript captured yet.';",
  "const emptyHint = options.emptyHint || 'Start a session or adjust the current transcript filter.';",
  "const noRawDetailMessage = options.noRawDetailMessage || 'No extra raw detail is available for this transcript entry.';",
  'No saved raw detail is available for this transcript entry.',
  'No live raw detail is available for this transcript entry.',
  'This saved run has limited transcript detail right now.',
  'This live run has limited transcript detail so far.',
  'Wait for more runtime events, switch filters, or review saved runs after completion.',
  'Try another saved transcript filter or return to the live runtime view.',
];
const missing = required.filter((item) => !source.includes(item));
if (missing.length) {
  console.error(JSON.stringify({ ok: false, missing }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, checked: required }, null, 2));
NODE

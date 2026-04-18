#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node <<'NODE'
import { readFileSync } from 'node:fs';
const source = readFileSync('./src/renderer/page-script.js', 'utf8');
const required = [
  'Risk level:',
  'Reply explicitly with <strong>yes</strong> to approve or <strong>no</strong> to deny.',
  'After you respond, the runtime status and saved run details will update below.',
  'The requested action was approved.',
  'The requested action was denied.',
  'Confirmation required. Review the action, reason, and risk before responding yes or no.',
  "focusElementById('confirmation-heading')",
];
const missing = required.filter((item) => !source.includes(item));
if (missing.length) {
  console.error(JSON.stringify({ ok: false, missing }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, checked: required }, null, 2));
NODE

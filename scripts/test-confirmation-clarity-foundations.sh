#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node <<'NODE'
import { readFileSync } from 'node:fs';
const source = readFileSync('./src/renderer/page-script.js', 'utf8');
const required = [
  'function getConfirmationResponseTone(responseDraft) {',
  'Decision summary:',
  'What this means:',
  'Approve means continue the requested action. Deny means stop it.',
  'Approve action',
  'Deny action',
  'Custom response',
  'Sending confirmation response.',
];
const missing = required.filter((item) => !source.includes(item));
if (missing.length) {
  console.error(JSON.stringify({ ok: false, missing }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, checked: required }, null, 2));
NODE

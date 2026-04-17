#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node <<'NODE'
import { shapeTranscript } from './src/electron/transcript-shaping.js';
const events = [
  { type: 'session.started', summary: 'Started Codex CLI session.' },
  { type: 'stream.chunk', source: 'stdout', raw: 'Changed files:\n- src/main.ts', summary: 'The CLI reported file changes. Ask for changed files or diff details.' },
  { type: 'prompt.detected', source: 'stdout', raw: 'Approve file changes?', summary: 'The CLI is waiting for confirmation or input.' },
  { type: 'error.detected', source: 'stderr', raw: 'fatal: something broke', summary: 'The CLI reported an error. Ask for details to hear the raw output.' },
];
const transcript = shapeTranscript(events);
const kinds = transcript.map((entry) => entry.kind);
if (!kinds.includes('change-hint') || !kinds.includes('prompt') || !kinds.includes('error')) {
  console.error(JSON.stringify({ ok: false, kinds, transcript }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, kinds, transcript }, null, 2));
NODE

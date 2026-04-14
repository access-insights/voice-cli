#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { getRawOutput, getChangedFiles, getDiffSummary } from './src/session/detail-requests.ts';
import { renderDetailPanel } from './src/ui/detail-panel.ts';
import { detailRequestToSpokenResponse } from './src/voice/detail-voice-policy.ts';

const events = [
  { type: 'stream.chunk', timestamp: new Date().toISOString(), summary: 'The CLI reported file changes.', raw: 'changed files: src/main.ts, README.md' },
  { type: 'stream.chunk', timestamp: new Date().toISOString(), summary: 'Diff available.', raw: 'diff --git a/src/main.ts b/src/main.ts' }
];

const raw = getRawOutput(events);
const changed = getChangedFiles(events);
const diff = getDiffSummary(events);
console.log(JSON.stringify({
  raw,
  changed,
  diff,
  panel: renderDetailPanel(diff),
  spoken: detailRequestToSpokenResponse(diff)
}, null, 2));
EOF

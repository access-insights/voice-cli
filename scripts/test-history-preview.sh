#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { ensureSessionDir, loadSessionHistory } from './src/persistence/session-history.ts';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderHistoryPanel } from './src/ui/history-panel.ts';
import { summarizeHistoryForVoice } from './src/voice/history-voice-policy.ts';

const dir = ensureSessionDir(process.cwd());
const samplePath = join(dir, '9999999999999-session.json');
writeFileSync(samplePath, JSON.stringify({ adapter: 'codex', exitCode: 0, spokenSummary: 'Sample successful session.' }, null, 2));
const history = loadSessionHistory(process.cwd());
console.log(JSON.stringify({
  count: history.length,
  latest: history[0],
  panel: renderHistoryPanel(history),
  spoken: summarizeHistoryForVoice(history)
}, null, 2));
EOF

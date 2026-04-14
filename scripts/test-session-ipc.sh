#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSessionIpcApi } from './src/electron/session-ipc.ts';

const projectPath = mkdtempSync(join(tmpdir(), 'voice-cli-ipc-'));
const transcriptDir = join(projectPath, '.voice-cli', 'sessions');
const api = createSessionIpcApi(projectPath, transcriptDir);

const events = [];
api.onEvent((event) => events.push(event.type));

const sendInputResult = api.sendInput('yes');
const state = api.getState();

console.log(JSON.stringify({
  sendInputResult,
  historyCount: api.getHistory().length,
  runtimeStatus: state.runtimeSummary.status,
  hasConfirmation: Boolean(state.confirmation),
  observedEvents: events,
}, null, 2));
EOF

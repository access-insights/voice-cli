#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node <<'NODE'
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { persistSessionRecord, loadSessionSummaries, loadSessionRecord } from './src/electron/main-session-storage.js';
const baseDir = mkdtempSync(join(tmpdir(), 'voice-cli-session-meta-'));
const record = {
  adapter: 'codex',
  exitCode: 0,
  spokenSummary: 'Completed successfully.',
  runtimeSummary: { status: 'completed', headline: 'Completed successfully.' },
  projectPath: '/tmp/demo-project',
  startedAt: '2026-04-17T00:00:00.000Z',
  endedAt: '2026-04-17T00:00:05.000Z',
  transcript: [
    { kind: 'change-hint', source: 'stdout', summary: 'The CLI reported file changes or a diff.', raw: 'Changed files:\n- src/main.ts', detailLabel: 'Changed files or diff hint' },
  ],
  events: [],
};
const filePath = persistSessionRecord(baseDir, record);
const summaries = loadSessionSummaries(baseDir);
const loaded = loadSessionRecord(baseDir, summaries[0].fileName);
if (!summaries[0].changeHints || summaries[0].projectPath !== '/tmp/demo-project' || loaded.transcriptEntryCount !== 1) {
  console.error(JSON.stringify({ ok: false, filePath, summaries, loaded }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, filePath, summaries, loaded }, null, 2));
NODE

#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node <<'NODE'
import { runCodexVerticalSliceInMain, respondToCodexPromptInMain } from './src/electron/main-session-runner.js';
const events = [];
const result = await runCodexVerticalSliceInMain({
  projectPath: process.cwd(),
  prompt: 'Please approve file changes?',
  onEvent: (event) => events.push(event.type),
});
const response = respondToCodexPromptInMain({ approved: true, projectPath: process.cwd(), onEvent: () => {} });
if (!result.pendingPrompt?.promptText || !events.includes('prompt.detected') || response.exitCode !== 0) {
  console.error(JSON.stringify({ ok: false, result, events, response }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, result, events, response }, null, 2));
NODE

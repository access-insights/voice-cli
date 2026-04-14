#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { summarizeRuntimeHealth } from './src/runtime/runtime-summary.ts';
import { detectConfirmationRequest } from './src/session/confirmation-detector.ts';
import { createDefaultSessionControls } from './src/renderer/session-controls.ts';
import { buildPromptResponse } from './src/runtime/prompt-response.ts';
import { createStreamEvent } from './src/session/event-normalizer.ts';

const promptEvents = [
  createStreamEvent('stdout', 'Approve file changes?'),
];
const cleanEvents = [
  createStreamEvent('stdout', 'Finished successfully.'),
];

const confirmation = detectConfirmationRequest(promptEvents);
const response = confirmation ? buildPromptResponse(confirmation, true) : null;
const controls = {
  ...createDefaultSessionControls(),
  canStartSession: true,
  canSendInput: Boolean(confirmation),
  currentInputDraft: confirmation ? 'yes' : '',
};

console.log(JSON.stringify({
  promptSummary: summarizeRuntimeHealth(promptEvents),
  cleanSummary: summarizeRuntimeHealth(cleanEvents),
  confirmation,
  response,
  controls,
}, null, 2));
EOF

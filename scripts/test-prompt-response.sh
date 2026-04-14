#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { createConfirmationRequest } from './src/safety/confirmation-flow.ts';
import { buildPromptResponse } from './src/runtime/prompt-response.ts';
import { confirmationRequestToVoicePrompt } from './src/voice/prompt-voice-policy.ts';

const req = createConfirmationRequest('Approve file changes', 'The CLI wants to edit tracked files.', 'high');
console.log(JSON.stringify({
  request: req,
  approveResponse: buildPromptResponse(req, true),
  denyResponse: buildPromptResponse(req, false),
  spoken: confirmationRequestToVoicePrompt(req)
}, null, 2));
EOF

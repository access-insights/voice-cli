#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { createStreamEvent } from './src/session/event-normalizer.ts';
import { detectConfirmationRequest } from './src/session/confirmation-detector.ts';
import { summarizeRuntimeHealth } from './src/runtime/runtime-summary.ts';
import { decideRuntimeVoiceOutput } from './src/voice/runtime-voice-policy.ts';
import { renderRuntimeStatusBanner } from './src/ui/runtime-status-banner.ts';

const events = [createStreamEvent('stdout', 'Approve file changes?')];
const summary = summarizeRuntimeHealth(events);
console.log(JSON.stringify({
  confirmation: detectConfirmationRequest(events),
  voiceDecision: decideRuntimeVoiceOutput(events),
  banner: renderRuntimeStatusBanner(summary)
}, null, 2));
EOF

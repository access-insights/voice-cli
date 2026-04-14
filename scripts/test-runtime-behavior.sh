#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { createStreamEvent } from './src/session/event-normalizer.ts';
import { detectConfirmationRequest } from './src/session/confirmation-detector.ts';
import { summarizeRuntimeHealth } from './src/runtime/runtime-summary.ts';
import { collectRuntimeDiagnostics } from './src/runtime/runtime-diagnostics.ts';

const events = [
  createStreamEvent('stdout', 'The CLI is asking: Approve file changes?'),
  createStreamEvent('stderr', 'warning: check configuration'),
];

console.log(JSON.stringify({
  confirmation: detectConfirmationRequest(events),
  runtimeSummary: summarizeRuntimeHealth(events),
  diagnostics: collectRuntimeDiagnostics(events),
}, null, 2));
EOF

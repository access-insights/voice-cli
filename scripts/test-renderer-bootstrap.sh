#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { createRendererBootstrap } from './src/renderer/bootstrap.ts';
import { createStreamEvent } from './src/session/event-normalizer.ts';

const listeners = [];
const sessionApi = {
  getHistory() {
    return [];
  },
  getState() {
    return {
      runtimeSummary: {
        status: 'needs_confirmation',
        headline: 'The session is waiting for confirmation.',
      },
      confirmation: null,
      controls: {
        canStartSession: true,
        canSendInput: true,
        currentInputDraft: 'yes',
      },
    };
  },
  onEvent(listener) {
    listeners.push(listener);
  },
};

const bootstrap = createRendererBootstrap(sessionApi);
const initialHtml = bootstrap.render();
bootstrap.subscribe();
const updateHtml = bootstrap.handleEvent(createStreamEvent('stdout', 'Approve file changes?'));

console.log(JSON.stringify({
  initialHasRuntime: initialHtml.includes('Runtime status'),
  initialHasControls: initialHtml.includes('Session controls'),
  listenerCount: listeners.length,
  transcriptCount: bootstrap.getState().transcript.length,
  updateHasConfirmationText: updateHtml.includes('waiting for confirmation'),
}, null, 2));
EOF

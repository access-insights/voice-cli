#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { createAppLoop } from './src/renderer/app-loop.ts';

const target = { innerHTML: '' };
const listeners = [];
let started = false;
const sessionApi = {
  async start(prompt) {
    started = prompt.length > 0;
    for (const listener of listeners) {
      listener({
        type: 'stream.chunk',
        timestamp: new Date().toISOString(),
        summary: 'Started sample session output.',
        raw: 'Started sample session output.',
        source: 'stdout',
      });
    }
    return { exitCode: 0 };
  },
  getHistory() {
    return [];
  },
  getState() {
    return {
      runtimeSummary: {
        status: started ? 'ok' : 'needs_confirmation',
        headline: started ? 'Sample session completed.' : 'The session is waiting for confirmation.',
      },
      confirmation: null,
      controls: {
        canStartSession: true,
        canSendInput: false,
        currentInputDraft: '',
      },
    };
  },
  onEvent(listener) {
    listeners.push(listener);
  },
};

const loop = createAppLoop(sessionApi, target);
const initialHtml = loop.getHtml();
const updatedHtml = await loop.start('Start sample session');

console.log(JSON.stringify({
  initialMounted: initialHtml.includes('voice-cli app preview'),
  updatedMounted: updatedHtml.includes('Sample session completed.'),
  updatedTranscript: updatedHtml.includes('Started sample session output.'),
}, null, 2));
EOF

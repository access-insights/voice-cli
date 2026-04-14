#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { createDomRenderer } from './src/renderer/dom-entry.ts';

const appNode = { innerHTML: '' };
const documentLike = {
  getElementById(id) {
    return id === 'app' ? appNode : null;
  },
};

const listeners = [];
let started = false;
const sessionApi = {
  async start(prompt) {
    started = prompt === 'Start from DOM';
    for (const listener of listeners) {
      listener({
        type: 'stream.chunk',
        timestamp: new Date().toISOString(),
        summary: 'DOM session output.',
        raw: 'DOM session output.',
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
        status: started ? 'ok' : 'ok',
        headline: started ? 'DOM session completed.' : 'No session started yet.',
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

const domRenderer = createDomRenderer(sessionApi, documentLike);
const initialHtml = domRenderer.mount();
const updatedHtml = await domRenderer.start('Start from DOM');

console.log(JSON.stringify({
  initialRendered: initialHtml.includes('voice-cli app preview'),
  mountTargetFilled: appNode.innerHTML.includes('voice-cli app preview'),
  updatedRendered: updatedHtml.includes('DOM session completed.'),
  updatedTranscript: updatedHtml.includes('DOM session output.'),
}, null, 2));
EOF

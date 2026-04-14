#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { bootstrapBrowserRenderer } from './src/renderer/browser-bootstrap.ts';

let submitHandler = null;
const nodes = new Map();
const appNode = { innerHTML: '' };
nodes.set('app', appNode);
nodes.set('session-start-form', {
  innerHTML: '',
  addEventListener(event, handler) {
    if (event === 'submit') submitHandler = handler;
  },
});
nodes.set('session-start-prompt', {
  innerHTML: '',
  value: 'Browser bootstrap prompt',
});

const documentLike = {
  getElementById(id) {
    return nodes.get(id) ?? null;
  },
};

const listeners = [];
let startedPrompt = null;
const sessionApi = {
  async start(prompt) {
    startedPrompt = prompt;
    for (const listener of listeners) {
      listener({
        type: 'stream.chunk',
        timestamp: new Date().toISOString(),
        summary: 'Browser bootstrap session output.',
        raw: 'Browser bootstrap session output.',
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
        status: startedPrompt ? 'ok' : 'ok',
        headline: startedPrompt ? 'Browser bootstrap completed.' : 'Ready to start.',
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

const result = bootstrapBrowserRenderer({ documentLike, sessionApi });
await submitHandler?.({ preventDefault() {} });

console.log(JSON.stringify({
  mounted: result.mounted,
  bindingsApplied: result.bindingsApplied,
  initialHtmlPresent: result.initialHtml.includes('voice-cli app preview'),
  appMounted: appNode.innerHTML.includes('voice-cli app preview'),
  startedPrompt,
}, null, 2));
EOF

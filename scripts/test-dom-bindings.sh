#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { bindSessionStartForm } from './src/renderer/dom-bindings.ts';

let submittedHandler = null;
let startedPrompt = null;
const nodes = new Map();
nodes.set('session-start-form', {
  innerHTML: '',
  addEventListener(event, handler) {
    if (event === 'submit') {
      submittedHandler = handler;
    }
  },
});
nodes.set('session-start-prompt', {
  innerHTML: '',
  value: 'Start from bound form',
});

const documentLike = {
  getElementById(id) {
    return nodes.get(id) ?? null;
  },
};

const controller = {
  mount() {
    return '';
  },
  async start(prompt) {
    startedPrompt = prompt;
    return '<div>updated</div>';
  },
};

bindSessionStartForm(documentLike, controller);
await submittedHandler?.({ preventDefault() {} });

console.log(JSON.stringify({
  handlerBound: typeof submittedHandler === 'function',
  startedPrompt,
}, null, 2));
EOF

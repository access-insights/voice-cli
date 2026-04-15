#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { createElectronMainHandlers } from './src/electron/main-handlers.ts';
import { exposePreloadApi } from './src/electron/preload.ts';
import { bootRenderer } from './src/renderer/boot-script.ts';

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
  value: 'Launchable path prompt',
});

const documentLike = {
  getElementById(id) {
    return nodes.get(id) ?? null;
  },
};

const handlers = createElectronMainHandlers(process.cwd());
const windowLike = exposePreloadApi({});
const result = bootRenderer(windowLike, documentLike);
await submitHandler?.({ preventDefault() {} });

console.log(JSON.stringify({
  appName: handlers.electron.getShellSummary().appName,
  rendererEntryHtml: handlers.electron.getConfig().rendererEntryHtml,
  hasSessionStart: typeof windowLike.voiceCli?.session?.start === 'function',
  mounted: result.mounted,
  bindingsApplied: result.bindingsApplied,
  appMounted: appNode.innerHTML.includes('voice-cli app preview'),
}, null, 2));
EOF

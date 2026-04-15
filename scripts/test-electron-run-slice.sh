#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { createElectronMainBootstrap } from './src/electron/main-bootstrap.ts';
import { getBrowserSafePreloadApi } from './src/electron/preload.ts';
import { startRendererApp } from './src/renderer/startup-entry.ts';

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
  value: 'Electron run slice prompt',
});

const documentLike = {
  getElementById(id) {
    return nodes.get(id) ?? null;
  },
};

const bootstrap = createElectronMainBootstrap(process.cwd());
const browserSafeApi = getBrowserSafePreloadApi();
const windowLike = {
  voiceCli: browserSafeApi,
};

const result = startRendererApp(windowLike, documentLike);
await submitHandler?.({ preventDefault() {} });

console.log(JSON.stringify({
  appName: bootstrap.shell.appName,
  rendererEntryHtml: bootstrap.config.rendererEntryHtml,
  mounted: result.mounted,
  bindingsApplied: result.bindingsApplied,
  initialHtmlPresent: result.initialHtml.includes('voice-cli app preview'),
  appMounted: appNode.innerHTML.includes('voice-cli app preview'),
}, null, 2));
EOF

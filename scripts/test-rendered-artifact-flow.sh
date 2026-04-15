#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHandlerRegistry } from './src/electron/handler-registry.ts';
import { contextBridgeExpose } from './src/electron/preload.ts';
import { runPageScript } from './src/renderer/page-script.ts';

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
  value: 'Rendered artifact prompt',
});

const documentLike = {
  getElementById(id) {
    return nodes.get(id) ?? null;
  },
};

const registry = createHandlerRegistry(process.cwd());
const windowLike = contextBridgeExpose({});
const result = runPageScript(windowLike, documentLike);
await submitHandler?.({ preventDefault() {} });

const outDir = mkdtempSync(join(tmpdir(), 'voice-cli-rendered-'));
const outPath = join(outDir, 'app-shell-rendered.html');
writeFileSync(outPath, appNode.innerHTML);

console.log(JSON.stringify({
  sessionStartChannel: typeof registry['session:start'] === 'function',
  sessionGetHistoryChannel: typeof registry['session:get-history'] === 'function',
  mounted: result.mounted,
  appMounted: appNode.innerHTML.includes('voice-cli app preview'),
  artifactPath: outPath,
  artifactHasControls: appNode.innerHTML.includes('Session controls'),
}, null, 2));
EOF

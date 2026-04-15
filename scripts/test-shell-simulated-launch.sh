#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHandlerRegistry } from './src/electron/handler-registry.ts';
import { registerIpcHandlers } from './src/electron/ipc-register.ts';
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
  value: 'Simulated shell launch prompt',
});

const documentLike = {
  getElementById(id) {
    return nodes.get(id) ?? null;
  },
};

const handled = new Map();
const ipcMainLike = {
  handle(channel, handler) {
    handled.set(channel, handler);
  },
};

const registry = createHandlerRegistry(process.cwd());
const registeredChannels = registerIpcHandlers(ipcMainLike, registry);
const bridgeCalls = [];
const bridge = {
  exposeInMainWorld(name, api) {
    bridgeCalls.push({ name, hasSession: typeof api?.session?.start === 'function' });
  },
};
const exposedWindow = contextBridgeExpose({}, bridge);
const windowLike = {
  voiceCli: exposedWindow.__bridgedApi,
};
const result = runPageScript(windowLike, documentLike);
await submitHandler?.({ preventDefault() {} });

const shellHtml = readFileSync('./website/app-shell.html', 'utf8');
const outDir = mkdtempSync(join(tmpdir(), 'voice-cli-shell-'));
const outPath = join(outDir, 'simulated-shell-rendered.html');
writeFileSync(outPath, appNode.innerHTML);

console.log(JSON.stringify({
  registeredCount: registeredChannels.length,
  hasSessionStartHandler: handled.has('session:start'),
  bridgeCalls,
  shellHasScriptRef: shellHtml.includes('../src/renderer/page-script.ts'),
  mounted: result.mounted,
  artifactPath: outPath,
  artifactHasTranscript: appNode.innerHTML.includes('voice-cli transcript'),
}, null, 2));
EOF

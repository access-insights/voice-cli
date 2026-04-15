#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { bootstrapElectronRuntime } from './src/electron/electron-runtime-bootstrap.ts';

const handled = new Map();
const bridgeCalls = [];
const runtime = {
  ipcMain: {
    handle(channel, handler) {
      handled.set(channel, handler);
    },
  },
  contextBridge: {
    exposeInMainWorld(name, api) {
      bridgeCalls.push({ name, hasSession: typeof api?.session?.start === 'function' });
    },
  },
};

const target = {};
const result = bootstrapElectronRuntime(target, runtime);
console.log(JSON.stringify({
  mode: result.mode,
  registeredChannels: result.registeredChannels,
  bridgeCalls,
  targetHasVoiceCli: Boolean(target.voiceCli),
}, null, 2));
EOF

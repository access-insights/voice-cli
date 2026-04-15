#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { detectElectronRuntime } from './src/electron/electron-adapter.ts';
import { bootstrapElectronRuntime } from './src/electron/electron-runtime-bootstrap.ts';

const fallbackTarget = {};
const fallback = bootstrapElectronRuntime(fallbackTarget);

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
const electronTarget = {};
const electron = bootstrapElectronRuntime(electronTarget, runtime);

console.log(JSON.stringify({
  fallbackAvailability: detectElectronRuntime(),
  fallbackMode: fallback.mode,
  fallbackHasVoiceCli: Boolean(fallbackTarget.voiceCli),
  electronAvailability: detectElectronRuntime(runtime),
  electronMode: electron.mode,
  electronRegisteredCount: electron.registeredChannels.length,
  bridgeCalls,
  electronTargetHasVoiceCli: Boolean(electronTarget.voiceCli),
}, null, 2));
EOF

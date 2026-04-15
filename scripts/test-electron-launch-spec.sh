#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { createRealElectronLaunchSpec, launchElectronApp } from './src/electron/electron-main-entry.ts';

const spec = createRealElectronLaunchSpec(process.cwd());
const calls = [];
const fakeRuntime = {
  app: {
    async whenReady() {
      calls.push('whenReady');
    },
  },
  BrowserWindow: class {
    constructor(options) {
      calls.push({ type: 'window', options });
    }
    async loadURL(url) {
      calls.push({ type: 'loadURL', url });
    }
  },
};

const launched = await launchElectronApp(fakeRuntime);
const fallback = await launchElectronApp();

console.log(JSON.stringify({
  preloadPathLooksRight: spec.preloadPath.endsWith('src/electron/preload.ts'),
  rendererUrlLooksRight: spec.rendererUrl.includes('website/app-shell.html'),
  launched,
  fallback,
  calls,
}, null, 2));
EOF

#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if ! node -e "require.resolve('electron')" >/dev/null 2>&1; then
  echo '{"launched":false,"reason":"electron package not installed yet"}'
  exit 0
fi
node --input-type=module - <<'EOF'
import { launchElectronApp } from './src/electron/electron-main-entry.ts';

const calls = [];
const fakeElectron = {
  app: {
    async whenReady() {
      calls.push('whenReady');
    },
  },
  BrowserWindow: class {
    constructor(options) {
      calls.push({ type: 'window', title: options.title, preload: options.webPreferences?.preload ?? null });
    }
    async loadURL(url) {
      calls.push({ type: 'loadURL', url });
    }
  },
};

const result = await launchElectronApp(fakeElectron);
console.log(JSON.stringify({ result, calls }, null, 2));
EOF

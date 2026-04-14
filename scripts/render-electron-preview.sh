#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { createElectronBootstrapConfig } from './src/electron/bootstrap-config.ts';
import { bootstrapElectronShell } from './src/electron/main-process.ts';
import { createDefaultWindowState } from './src/electron/window-state.ts';
import { renderRendererApp } from './src/renderer/index.ts';
import { createSampleRendererState } from './src/renderer/sample-state.ts';

console.log(JSON.stringify({
  bootstrap: createElectronBootstrapConfig(),
  desktop: bootstrapElectronShell(),
  windowState: createDefaultWindowState(),
  previewLength: renderRendererApp(createSampleRendererState()).length
}, null, 2));
EOF

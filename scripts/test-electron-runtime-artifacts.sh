#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { readFileSync } from 'node:fs';

const shellHtml = readFileSync('./website/app-shell.html', 'utf8');
const preloadJs = readFileSync('./src/electron/preload.js', 'utf8');
const pageScriptJs = readFileSync('./src/renderer/page-script.js', 'utf8');

console.log(JSON.stringify({
  shellUsesJsPageScript: shellHtml.includes('../src/renderer/page-script.js'),
  preloadHasAutoExitFlag: preloadJs.includes('VOICE_CLI_AUTO_EXIT'),
  pageScriptMountsDom: pageScriptJs.includes("document.getElementById('app')"),
  pageScriptListensDOMContentLoaded: pageScriptJs.includes("window.addEventListener('DOMContentLoaded', mount)"),
}, null, 2));
EOF

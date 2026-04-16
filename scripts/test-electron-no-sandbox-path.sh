#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
console.log(JSON.stringify({
  hasNoSandboxScript: Boolean(packageJson.scripts['dev:electron-no-sandbox']),
  scriptValue: packageJson.scripts['dev:electron-no-sandbox'] ?? null,
  warning: 'Development only. Prefer fixing chrome-sandbox permissions for normal Electron launches.',
}, null, 2));
EOF

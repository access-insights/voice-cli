#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { runManagedSession } from './src/runtime/session-service.ts';
const result = await runManagedSession({
  projectPath: process.cwd(),
  prompt: 'Summarize the current repository structure in one short paragraph.',
  transport: 'node-pty'
});
console.log(JSON.stringify(result, null, 2));
EOF

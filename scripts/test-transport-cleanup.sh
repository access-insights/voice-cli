#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { SpawnTransport } from './src/runtime/spawn-transport.ts';

const transport = new SpawnTransport();
const seen = [];
transport.onEvent((event) => seen.push({ type: event.type, summary: event.summary, metadata: event.metadata ?? null }));
transport.onExit((code) => {
  console.log(JSON.stringify({ exitCode: code, seen }, null, 2));
});

transport.start({
  cwd: process.cwd(),
  command: 'bash',
  args: ['-lc', 'sleep 30'],
});

setTimeout(() => {
  transport.stop('Cleanup test stop.');
}, 200);
EOF

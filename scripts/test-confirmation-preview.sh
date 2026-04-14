#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { createConfirmationRequest } from './src/safety/confirmation-flow.ts';
import { renderConfirmationPanel } from './src/ui/confirmation-panel.ts';
const req = createConfirmationRequest('Apply file changes', 'The CLI wants to modify project files.', 'high');
console.log(renderConfirmationPanel(req));
EOF

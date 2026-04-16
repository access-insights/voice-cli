#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
MAIN=$(node --input-type=module - <<'EOF'
import pkg from './package.json' with { type: 'json' };
console.log(pkg.main);
EOF
)
if [[ "$MAIN" == *.ts ]]; then
  printf '{"ready":false,"reason":"electron main entry is TypeScript","main":"%s"}\n' "$MAIN"
else
  printf '{"ready":true,"reason":"electron main entry is launchable","main":"%s"}\n' "$MAIN"
fi

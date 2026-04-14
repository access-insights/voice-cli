#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p dist/release-notes
cat > dist/release-notes/BETA-NOTES.txt <<'EOF'
voice-cli beta artifact placeholder
- unsigned beta allowed
- first supported CLI: Codex CLI
- accessibility review still required before public beta
EOF
echo beta-artifacts-prepared

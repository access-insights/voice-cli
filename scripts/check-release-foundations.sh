#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
test -f electron-builder.json
test -f .github/workflows/release.yml
test -f .github/workflows/pages.yml
test -f docs/release-readiness.md
echo release-foundations-ok

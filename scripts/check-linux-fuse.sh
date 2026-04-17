#!/usr/bin/env bash
set -euo pipefail
if ldconfig -p 2>/dev/null | grep -q 'libfuse.so.2'; then
  echo "FUSE_OK"
  exit 0
fi
echo "FUSE_MISSING"
exit 1

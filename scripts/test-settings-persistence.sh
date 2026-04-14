#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { join } from 'node:path';
import { saveSettings, loadSettings } from './src/settings/settings-persistence.ts';
import { defaultSettings } from './src/settings/settings-store.ts';
const path = join(process.cwd(), '.voice-cli', 'settings.json');
const settings = { ...defaultSettings(), speechRate: 1.4, preferredVoice: 'default-neutral' };
saveSettings(path, settings);
console.log(JSON.stringify(loadSettings(path), null, 2));
EOF

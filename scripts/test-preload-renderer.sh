#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --input-type=module - <<'EOF'
import { preloadApi, preloadApiContract } from './src/electron/preload.ts';
import { createSampleRendererState } from './src/renderer/sample-state.ts';
import { renderLiveRendererApp, applySessionEventToTranscript } from './src/renderer/live-renderer.ts';
import { createStreamEvent } from './src/session/event-normalizer.ts';

const initialState = createSampleRendererState();
const updatedTranscript = applySessionEventToTranscript(
  initialState.transcript,
  createStreamEvent('stdout', 'Approve file changes?')
);
const html = renderLiveRendererApp({
  ...initialState,
  transcript: updatedTranscript,
}, preloadApi.session);

console.log(JSON.stringify({
  hasStart: typeof preloadApi.session.start === 'function',
  hasGetState: typeof preloadApi.session.getState === 'function',
  contractHasOnEvent: preloadApiContract.session.onEvent,
  transcriptCount: updatedTranscript.length,
  htmlIncludesRuntime: html.includes('Runtime status'),
  htmlIncludesControls: html.includes('Session controls'),
}, null, 2));
EOF

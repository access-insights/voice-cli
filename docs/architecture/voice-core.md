# Voice Interaction Core

## Goals

The voice core should:
- accept spoken requests
- produce concise spoken summaries
- allow drill-down into raw details
- preserve trust between summary and verbatim output

## Current scaffold

The current scaffold includes:
- `src/voice/voice-preferences.ts`
- `src/voice/speech-orchestrator.ts`

## Current policy

- summary-first by default
- raw output on demand
- explicit handling for prompts and errors
- language and voice preferences stored in a dedicated preferences model

## Future work

- real STT/TTS providers
- per-user voice configuration UI
- interruption handling
- queueing and playback policy
- transcript-linked playback controls

# First Vertical Slice

## Goal

Prove one end-to-end path:
- launch a managed Codex CLI session in the current project
- capture stdout and stderr
- normalize output into session events
- generate a spoken-summary candidate
- persist transcript/session history locally

## Current implementation

The current vertical slice is implemented in:
- `src/adapters/codex-adapter.ts`
- `src/session/event-types.ts`
- `src/session/event-normalizer.ts`
- `src/session/session-runner.ts`
- `src/persistence/transcript-store.ts`
- `src/main.ts`

## Current limitations

- uses `spawnSync` rather than a persistent PTY session
- no Electron shell yet
- no microphone or TTS integration yet
- no user confirmation UI yet
- no adapter registry beyond Codex

## Why this slice matters

It proves the critical trust model:
- raw output is captured
- events are structured
- spoken summaries are derived, not fabricated
- transcript persistence exists from day one

# Session History Foundation

## Goal

Users should be able to review prior sessions without relying only on live speech.

## Current scaffold

- `src/persistence/session-history.ts`
- `src/ui/history-panel.ts`
- `src/voice/history-voice-policy.ts`
- `src/renderer/history-state.ts`
- `scripts/test-history-preview.sh`

## Current behavior

The app can:
- locate stored session artifacts
- load high-level summaries of previous sessions
- render a basic session-history panel
- summarize the latest history item for voice access

## Why this matters

Persistent history is part of trust, reviewability, and non-visual usability.

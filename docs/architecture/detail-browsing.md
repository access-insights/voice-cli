# Detail Browsing Foundation

## Goal

Users should be able to move naturally from summaries to deeper detail, including raw output, changed files, and diffs.

## Current scaffold

- `src/session/detail-requests.ts`
- `src/ui/detail-panel.ts`
- `src/voice/detail-voice-policy.ts`
- `src/renderer/detail-state.ts`
- `scripts/test-detail-preview.sh`

## Current behavior

The scaffold supports extracting:
- latest raw output
- changed-files detail
- diff detail

It also supports:
- visual detail rendering
- spoken detail response generation

## Why this matters

Summary-first only works if detail access is real and easy.

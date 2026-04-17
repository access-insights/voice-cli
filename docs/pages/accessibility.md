# Accessibility Approach

voice-cli is designed around a high accessibility bar.

## Principles
- voice-first, not voice-only
- transcript-first trust model
- summary-first, details on demand
- keyboard access for core flows
- explicit confirmation for consequential actions

## Why this matters

Users must always know whether they are hearing:
- a summary
- a status update
- or verbatim terminal output

## Current implementation emphasis

The current Electron shell prioritizes:
- live status updates that can be surfaced non-visually
- keyboard-first movement through setup, session controls, confirmation, transcript, and history
- summary-first transcript review with raw output available on demand

## Current known gaps

- no full assistive-technology certification pass yet
- packaged-app accessibility validation is still pending
- broader automated renderer accessibility coverage is still limited

# Runtime Stabilization

## Goal

The managed session runtime should distinguish between:
- normal output
- confirmation-needed state
- recoverable errors

## Current scaffold

- `src/session/confirmation-detector.ts`
- `src/runtime/runtime-summary.ts`
- `src/runtime/runtime-diagnostics.ts`

## Current use

These helpers allow the app to:
- detect whether a session is waiting for user approval
- generate a safer runtime health summary
- count prompt, error, and stream-event frequency

## Why this matters

The voice and UI layers should not treat every non-zero or noisy output burst the same way. Prompt detection and safer runtime summaries are necessary for trust and confirmation behavior.

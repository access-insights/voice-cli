# Runtime Phase 1 Status

This note records what Phase 1 currently means in the voice-cli repository.

## Intent of Phase 1

Phase 1 is about making the current session runtime credible enough to support the next product layers.

That does **not** mean a full final PTY/session engine is already complete.
It means the Linux-first Electron vertical slice now has a believable runtime contract for:
- session start
- incremental event delivery
- running/waiting/completed state transitions
- confirmation round-trip handling
- durable session record persistence

## What Phase 1 currently includes

- real main/preload/renderer IPC for session start
- real main-side confirmation prompt/response round-trip
- persisted session summaries and full session records
- incremental event delivery from main to renderer during bounded live runs
- renderer states that distinguish:
  - starting
  - running
  - waiting for confirmation
  - completed
  - failed
- live transcript and saved transcript inspection in the Electron shell

## What Phase 1 does not claim yet

Phase 1 is still bounded by the current runtime architecture.
It does **not** yet provide:
- a fully long-lived PTY-backed runtime
- true continuous token/line streaming from a persistent subprocess
- a final production session supervisor
- final packaging/runtime behavior outside the current Linux-first dev smoke path

## Why this still counts as Phase 1 completion

The current implementation satisfies the practical Phase 1 exit criteria:
- a real session can stream updates into the live Electron UI
- approval/prompt flows work through the same main-side runtime path
- saved records remain durable and inspectable

## Next handoff after Phase 1

The recommended next phase is to improve transcript truthfulness and drill-down quality:
- persist structured shaped transcript data alongside raw events
- use the shaped transcript for live and saved views
- keep raw events for debugging and verbatim inspection

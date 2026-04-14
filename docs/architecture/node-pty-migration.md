# node-pty Migration Plan

## Current state

The runtime currently uses a spawn-based session foundation.

## Next upgrade

Adopt `node-pty` to support:
- long-lived interactive CLI sessions
- prompt handling
- incremental output streaming
- better fidelity for terminal-oriented tools

## Migration constraints

- preserve normalized event extraction
- preserve transcript persistence
- keep renderer and voice orchestration layers adapter-agnostic
- maintain clear risky-action confirmation semantics

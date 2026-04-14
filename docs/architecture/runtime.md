# Runtime and Session Management

## Goal

Provide a managed session runtime that can supervise CLI execution, capture terminal streams, and expose normalized events to the desktop shell and voice orchestration layer.

## Current foundation

Current runtime scaffolding includes:
- `src/runtime/pty-session.ts`
- `src/runtime/session-service.ts`
- `src/electron/main-process.ts`
- `src/electron/preload.ts`

## Current implementation notes

- the runtime currently uses `spawn` with stream capture as a PTY-oriented foundation
- this is not yet a full node-pty integration
- event emission and persistence are already wired
- the desktop bootstrap contract now exists for the future Electron main process

## Future work

- replace basic spawn-based runtime with node-pty
- add long-lived session control
- support interactive prompt handling
- connect preload API to renderer UI
- add native permission and confirmation surfaces

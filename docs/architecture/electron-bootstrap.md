# Electron Bootstrap Foundation

## Goal

Provide a real app bootstrap structure that can grow into a packaged desktop application.

## Current scaffold

- `src/electron/bootstrap-config.ts`
- `src/electron/main-process.ts`
- `src/electron/preload.ts`
- `src/electron/window-state.ts`
- `src/renderer/app-state.ts`
- `src/renderer/index.ts`
- `src/renderer/sample-state.ts`

## Current status

This is still a scaffold, but it now separates:
- Electron bootstrap configuration
- main-process bootstrap assumptions
- preload API contract
- renderer state
- renderer rendering entrypoint

## Future work

- replace HTML-string rendering with real renderer components
- wire preload bridge to renderer commands
- add packaging config for real Electron builds

# Electron Runtime and Renderer Wiring

## Goal

Move from isolated scaffolds to a coherent desktop runtime contract between main process, preload, and renderer.

## Current additions

- `src/electron/ipc-contract.ts`
- `src/electron/preload.ts`
- `src/renderer/session-controls.ts`
- `src/ui/session-controls-panel.ts`

## Current role

These files define the interaction surface for:
- starting sessions
- sending session input
- loading history
- loading and saving settings

## Future work

- replace documentation-style preload contract with real IPC bindings
- wire real renderer actions to main-process handlers
- add packaging-time Electron entry wiring

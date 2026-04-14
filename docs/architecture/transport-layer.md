# Transport Layer

## Goal

The transport layer should isolate terminal process mechanics from the rest of the app.

## Current transport abstraction

Current runtime transport files:
- `src/runtime/transport.ts`
- `src/runtime/spawn-transport.ts`
- `src/runtime/node-pty-transport.ts`

## Current state

- spawn transport is the active working path
- node-pty transport is a placeholder seam
- session-service now selects the transport implementation explicitly

## Why this matters

This allows the product to evolve from a bootstrap-safe subprocess path into a true PTY-driven interactive terminal without rewriting the event, voice, renderer, and persistence layers.

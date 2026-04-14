# Confirmation-Aware UI and Voice Behavior

## Goal

When a session needs approval, the UI and voice layers should surface that state explicitly rather than treating it like an ordinary error or summary.

## Current scaffold

- `src/voice/runtime-voice-policy.ts`
- `src/ui/runtime-status-banner.ts`
- `src/renderer/runtime-view-state.ts`
- `scripts/test-confirmation-aware-preview.sh`

## Current behavior

- runtime summary determines whether the session is okay, blocked on confirmation, or errored
- voice policy chooses a spoken status/summary response from that state
- renderer status banner exposes the same state visually

## Why this matters

This is a trust feature, not just a UI feature. The user should know when the CLI is waiting for approval and not confuse that with a crash.

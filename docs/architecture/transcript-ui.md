# Transcript UI Shell

## Goal

Transcript access is mandatory for a voice-first, not voice-only, product.

## Current scaffold

The current transcript shell lives in:
- `src/ui/transcript-shell.ts`

It renders a simple HTML transcript preview with:
- role labels
- mode labels such as summary, status, and verbatim
- transcript-first visibility by default

## Why this matters

The transcript view is the trust anchor for the product:
- spoken summaries must be inspectable
- verbatim content must be available on demand
- system status and confirmation prompts must remain visible even without audio

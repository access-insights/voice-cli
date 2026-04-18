# Architecture Overview

## Recommended stack

### Desktop shell
- Electron
- current renderer is a direct DOM-driven shell
- TypeScript/React remain optional future evolution, not current implementation truth

### Process and terminal control
- current implementation uses main-process child-process execution with structured event emission
- node-pty remains a future hardening path when richer terminal semantics are required

### Speech
- pluggable speech input/output abstraction
- provider adapters behind a stable interface
- transcript-first fallback when voice is unavailable

### Persistence
- local app state and transcript persistence
- session event log stored as append-only records where practical

### Packaging and release
- Electron Builder or Electron Forge
- GitHub Actions for builds and public beta release automation
- GitHub Pages for docs

## Layer boundaries

1. Desktop shell
   - app lifecycle
   - windowing
   - native permissions
   - packaging

2. Session runtime
   - CLI process spawn and supervision
   - PTY integration
   - stdout/stderr/prompt capture
   - exit-status tracking

3. CLI adapter layer
   - adapter registry
   - Codex v1 adapter
   - tool-specific prompt/confirmation handling

4. Event extraction and normalization
   - convert terminal streams into structured session events
   - distinguish raw text from inferred events

5. Conversation orchestration
   - determines what to speak
   - decides when to summarize versus quote verbatim
   - handles follow-up questions such as “read more” or “what changed?”

6. Speech I/O
   - STT/TTS abstraction
   - user voice preferences
   - fallback and transcript access

7. Trust and safety controls
   - risky action confirmation policy
   - explicit labeling of summary versus verbatim output
   - clear current-state reporting

## Current implementation note

The current Electron app now persists structured transcript entries alongside raw session events and spoken summaries. Live and saved views share the same persisted transcript model rather than relying only on renderer-local shaping.

## Key design answer

The app should maintain three distinct representations of terminal activity:

### 1. Raw output
- exact stdout/stderr/terminal text
- immutable session record
- always available on demand

### 2. Structured events
- normalized events extracted from raw output
- examples: process started, prompt requested, command finished, files changed, diff available, error detected, approval needed
- machine-friendly and UI-friendly

### 3. Spoken summaries
- user-facing narrative derived from structured events
- explicitly labeled as summaries
- concise by default
- can expand into verbatim output on request

This separation preserves trust because the user can always move from summary to event to raw text.

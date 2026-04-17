# Remaining Work Checklist

This checklist maps the documented voice-cli milestones to the current implemented state in the repository and highlights what is still left to develop.

## Current status snapshot

Substantial progress now exists beyond the original scaffold:
- Linux-first Electron desktop vertical slice is working
- main/preload/renderer IPC is in place
- real session start path exists
- confirmation round-trip exists through main IPC
- session history persists
- full saved session records persist
- live and saved transcript views exist in the Electron shell

That said, the project is still short of the documented MVP and public beta goals.

---

## Milestone 1. Project foundation

### Done or mostly done
- repository scaffold
- architecture and product docs baseline
- governance files
- GitHub Pages baseline
- CI baseline

### Remaining
- keep docs aligned with the now-real Electron vertical slice
- tighten any drift between implementation and architecture docs
- document current Linux-first development path and smoke scripts clearly

---

## Milestone 2. Terminal session core

### Done or mostly done
- bounded Codex CLI session start path
- stdout/stderr/prompt capture in current slice
- event normalization exists
- session history persists
- full saved session records now persist

### Remaining
- replace bounded synchronous run path with a robust long-lived session runtime
- support streaming updates while a session is running
- strengthen prompt and interactive input handling for real sessions
- improve event extraction beyond current heuristics
- make lifecycle deterministic without smoke-mode timing hacks
- add a proper PTY-backed runtime where needed

---

## Milestone 3. Voice interaction core

### Done or mostly done
- transcript-first fallback direction is present in product/docs
- summary-oriented UI direction is established

### Remaining
- real speech-to-text integration
- real text-to-speech integration
- speech provider abstraction in active use, not just documented
- user voice preferences and settings flow
- spoken summary behavior for important runtime events
- on-demand read-more / verbatim output voice flows

---

## Milestone 4. First CLI adapter

### Done or mostly done
- Codex adapter is the active first adapter target
- start-session path works
- confirmation loop exists in the Electron slice

### Remaining
- stronger adapter-specific parsing
- changed-files surfacing
- diff surfacing
- richer prompt/approval handling for real sessions
- follow-up question support using current session context
- more trustworthy classification of warnings, prompts, and errors

---

## Milestone 5. Installability and onboarding

### Done or mostly done
- basic desktop shell exists
- Linux-first direction is established

### Remaining
- first-run onboarding flow
- CLI detection and validation flow
- project selection flow
- voice test/setup flow
- sample-project or guided first-use experience
- clearer non-technical-user setup path

---

## Milestone 6. Public beta readiness

### Done or mostly done
- beta/release groundwork exists in repo scaffolding
- Linux-first desktop proof now exists

### Remaining
- real Linux packaging path
- Windows/macOS packaging later
- release artifact completeness review
- release automation hardening
- Pages/docs completion for actual user setup and usage
- accessibility review and broader test pass
- confidence that the app is usable by a non-technical blind user end to end

---

## Cross-cutting product gaps still open

### Runtime and interaction quality
- live streaming session updates instead of batch return
- more robust confirmation lifecycle
- explicit dangerous-action safety policy in active runtime behavior
- better transcript/state separation between live run and saved run

### Transcript and persistence quality
- persist cleaned/classified transcript alongside raw events
- keep raw events for debugging, shaped transcript for product UI
- better saved-run browsing and filtering
- cleaner distinction between summary, structured event, and raw text in the UI

### Accessibility and UX
- stronger keyboard-first flow
- screen-reader-aware interaction polish
- clearer status narration patterns
- more explicit summary-vs-verbatim labeling in the UI and voice layer

### Testing
- IPC contract tests
- session runtime tests
- renderer tests for live/saved transcript behavior
- Electron smoke/e2e coverage beyond current helper scripts
- regression tests for error normalization and prompt handling

---

## Highest-priority remaining work

If development continues in strict priority order, the most important remaining items are:

1. replace the bounded session slice with a robust managed runtime
2. add real STT/TTS voice capability
3. build onboarding and CLI validation flow
4. harden Linux packaging/public beta path
5. expand tests and accessibility verification

---

## Short honest status

The app now has a real and useful Linux-first Electron interaction loop.

It is not yet at the documented MVP or public-beta promise because the biggest unfinished areas are:
- real voice I/O
- robust long-lived session runtime behavior
- onboarding
- installability/packaging
- broader validation and accessibility hardening

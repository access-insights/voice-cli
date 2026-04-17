# Prioritized Execution Plan

This plan turns the remaining-work checklist into an execution order biased toward the fastest path to a genuinely usable, accessibility-first Linux beta.

## Goal

Reach a voice-cli milestone where a non-technical blind user can:
- launch the desktop app
- connect the supported CLI
- open a local project
- ask for a task
- hear or read useful summaries
- inspect more detail on demand
- confirm or deny important actions safely

## Planning principles

- preserve the working Linux-first Electron vertical slice
- prefer one bounded production-credible improvement at a time
- keep raw event/debug visibility while improving user-facing transcript quality
- do not broaden platform scope until Linux is solid
- do not prioritize release automation ahead of usability and runtime truthfulness

---

## Phase 1. Make the current session runtime credible

### Objective
Move from the current bounded run-return slice to a more trustworthy managed runtime.

### Why first
This is the core product loop. Without it, voice, onboarding, and packaging sit on shaky ground.

### Scope
- replace the most limiting synchronous execution assumptions
- support running-state updates during active sessions
- improve session lifecycle determinism
- harden prompt/confirmation handling for real sessions
- preserve history and transcript persistence

### Deliverables
- managed session runtime path in main process
- incremental event delivery to renderer
- clearer session state transitions: starting, running, waiting, completed, failed
- cleaner separation between live session state and saved session records

### Exit criteria
- a real session can stream updates into the live Electron UI
- approval/prompt flows still work in the same runtime path
- saved records remain correct and durable

---

## Phase 2. Improve transcript truthfulness and drill-down quality

### Objective
Make transcript review clearer, more trustworthy, and more useful.

### Why second
Once runtime behavior is more real-time, transcript quality becomes the main user experience surface.

### Scope
- persist shaped transcript data alongside raw events
- keep raw events available for debugging and verbatim drill-down
- improve changed-files and diff surfacing
- improve summary versus raw labeling
- improve saved-run browsing and transcript readability

### Deliverables
- structured transcript representation in persistence
- better event-to-transcript shaping outside renderer-only heuristics
- clearer display of prompts, warnings, failures, and meaningful outputs

### Exit criteria
- live and saved runs show the same trustworthy transcript model
- raw output remains accessible on demand
- changed files or diff hints surface when available

---

## Phase 3. Build the real voice loop

### Objective
Add real speech input/output on top of the runtime and transcript foundation.

### Why third
Voice depends on trustworthy runtime state and transcript shaping. Doing it earlier would amplify instability.

### Scope
- STT integration
- TTS integration
- speech provider abstraction in active use
- user voice preferences
- transcript-first fallback when speech is unavailable
- “say more”, “read raw output”, and “what changed?” style interactions

### Deliverables
- real speech pipeline working on Linux
- settings for voice preferences
- explicit summary-versus-verbatim voice behavior

### Exit criteria
- user can drive a basic session by voice
- user can hear summaries and request deeper detail
- app remains usable without voice enabled

---

## Phase 4. Onboarding and setup for non-technical users

### Objective
Make the app install-and-use path understandable for people who are not terminal-native.

### Why fourth
After runtime and voice are credible, onboarding becomes the blocker to real user success.

### Scope
- first-run experience
- CLI detection and validation
- project selection
- voice test/setup
- guided sample flow
- better error/help text for missing dependencies

### Deliverables
- onboarding flow in app
- Codex CLI validation flow
- voice setup test flow
- clearer setup docs to match the actual product

### Exit criteria
- a new user can reach first successful session without repo-level knowledge
- setup blockers are surfaced clearly and accessibly

---

## Phase 5. Linux beta packaging and release hardening

### Objective
Produce a Linux beta that is realistic to hand to testers.

### Why fifth
A beta without reliable runtime, transcript quality, voice, and onboarding would be noisy and misleading.

### Scope
- Linux packaging path
- release artifact review
- beta notes and install docs
- release automation hardening
- smoke validation for packaged app path

### Deliverables
- installable Linux beta artifact
- documented install/setup flow
- packaging smoke checks
- release workflow confidence on Linux

### Exit criteria
- a tester can install and launch the Linux app outside dev flow
- known setup steps are documented and bounded

---

## Phase 6. Accessibility and validation hardening

### Objective
Raise confidence that the app is ready for a public beta audience.

### Why sixth
Accessibility and validation must be continuous, but this phase is where they become explicit release gates.

### Scope
- accessibility review across transcript, controls, prompts, and onboarding
- keyboard-only flow validation
- screen-reader-oriented testing where practical
- IPC and runtime regression coverage
- Electron smoke/e2e coverage expansion

### Deliverables
- accessibility review findings and fixes
- stronger automated checks
- clearer beta readiness criteria

### Exit criteria
- major interaction loops have validation coverage
- accessibility issues are tracked and materially reduced

---

## Recommended immediate next slices

If we continue from the current repo state, the best near-term order is:

1. add incremental session event streaming into the live UI
2. replace renderer-side transcript shaping with persisted structured transcript data
3. add one Linux STT/TTS path end to end
4. add first-run Codex validation and setup flow
5. harden Linux beta packaging path

---

## What should wait

These should stay later unless a dependency forces them earlier:
- broad Windows/macOS packaging work
- multi-adapter support beyond Codex
- heavy release polish before runtime/onboarding are solid
- broad product-surface expansion unrelated to the session loop

---

## Honest risk summary

The biggest remaining delivery risks are:
- the runtime is still not a fully managed long-lived session engine
- voice is not yet a real user capability
- onboarding is still missing
- packaging may expose environment assumptions hidden by dev flow

If those are handled in order, the project has a believable path to a strong Linux-first beta.

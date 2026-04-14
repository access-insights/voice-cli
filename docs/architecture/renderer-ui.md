# Renderer UI Foundation

## Goal

The renderer must provide a transcript-first, keyboard-accessible interface that makes summaries, raw details, onboarding, settings, and session state easy to inspect.

## Current scaffold

The current renderer scaffold includes:
- `src/ui/app-shell-renderer.ts`
- `src/ui/transcript-shell.ts`
- `src/ui/settings-panel.ts`
- `src/ui/onboarding-panel.ts`
- `src/ui/session-status-panel.ts`

## Current design assumptions

- transcript is always visible
- settings are inspectable in plain language
- onboarding is checklist-based
- session state is summarized in a compact panel

## Future work

- real React components
- focus management and keyboard command model
- detail expansion for raw output and diffs
- accessible confirmation dialogs

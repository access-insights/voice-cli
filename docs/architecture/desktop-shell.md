# Desktop Shell Foundation

## Purpose

The desktop shell is responsible for:
- application lifecycle
- window creation
- keyboard-first access
- transcript visibility
- permissions and confirmation surfaces

## Current scaffold

The current scaffold includes:
- `src/app/desktop-shell.ts`
- `src/app/renderer-model.ts`

This is not yet a full Electron app, but it defines the first desktop-facing model and startup assumptions.

## Initial UX requirements

- transcript must always be available visually
- spoken content must be distinguishable as summary, status, or verbatim
- keyboard navigation must exist for all primary actions
- risky actions must be surfaced with clear confirmation affordances

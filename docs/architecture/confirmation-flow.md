# Confirmation Flow Foundation

## Goal

Dangerous or consequential actions require clear approval flows.

## Current scaffold

- `src/safety/confirmation-flow.ts`
- `src/ui/confirmation-panel.ts`
- `src/renderer/confirmation-state.ts`

## Current model

A confirmation request includes:
- action label
- reason
- risk level
- whether explicit approval is required

## Future work

- connect confirmation requests to normalized session events
- add keyboard and speech approval affordances
- persist approval decisions where appropriate

# Settings Persistence Foundation

## Goal

User preferences should survive restarts and support first-run onboarding.

## Current scaffold

- `src/settings/settings-store.ts`
- `src/settings/settings-persistence.ts`

## Current behavior

- load settings from disk if present
- fall back to defaults otherwise
- save settings to a local JSON file

## Future work

- choose the final platform-appropriate storage path
- add migrations/versioning for settings
- wire settings edits from real renderer UI controls

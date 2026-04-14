# Onboarding and Settings Foundation

## Goal

A non-technical user should be able to start voice-cli, choose a supported CLI, select a local project, test voice preferences, and understand confirmation behavior.

## Current scaffold

- `src/settings/settings-store.ts`
- `src/onboarding/first-run-flow.ts`
- `website/app-shell.html`
- `electron.main.config.json`

## First-run checklist

The current scaffold models these first-run steps:
- select supported CLI
- choose a local project
- test voice settings
- review confirmation and transcript preferences

## Future work

- persist settings to disk
- add actual onboarding UI screens
- add CLI detection and validation
- add voice preview and mic test
- add explicit accessibility and keyboard walkthrough

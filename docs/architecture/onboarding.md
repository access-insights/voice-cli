# Onboarding and Settings Foundation

## Goal

A non-technical user should be able to start voice-cli, choose a supported CLI, select a local project, test voice preferences, and understand confirmation behavior.

## Current implementation

- onboarding and setup state live in the Electron shell and main IPC path
- settings persist to `.voice-cli/settings.json`
- Codex detection and project-path validation run through main-process handlers
- the renderer restores saved onboarding state on startup

## First-run checklist

The current scaffold models these first-run steps:
- select supported CLI
- choose a local project
- test voice settings
- review confirmation and transcript preferences

## Future work

- add a more guided first-run walkthrough
- deepen voice preview and mic test behavior
- add explicit accessibility and keyboard walkthrough
- reduce setup friction for non-technical users further

# voice-cli

A cross-platform desktop application that provides a voice-first conversational wrapper around agentic CLI tools.

## Vision

voice-cli makes modern CLI-based AI workflows more accessible to blind users and more approachable to non-technical users. It is not a screen reader replacement. It is a conversational access layer for terminal and agent workflows.

## First release target

- First supported CLI: Codex CLI
- Platforms: macOS, Windows, Linux
- Release policy: public beta binaries
- Signing policy: unsigned beta allowed
- Accessibility bar: high
- License: MIT

## Core product principles

1. Voice-first, but not voice-only.
2. Summary-first, with raw details on demand.
3. Trust and transparency over polish theater.
4. Narrate meaningful state transitions, not every line.
5. Clear confirmation for dangerous actions.
6. Onboarding must work for non-technical users.

## MVP scope

The MVP aims to support:
- launching a managed Codex CLI session inside a selected local project
- capturing stdout, stderr, prompts, and exit status
- converting terminal output into a session event model
- speaking concise summaries of important events
- allowing the user to request more detail or verbatim output
- showing and summarizing changed files and diffs
- explicit confirmation before risky actions when possible
- persistent transcript and session history
- first-run setup flow for selecting a CLI, configuring voice, and testing interaction

## Architecture summary

voice-cli is structured around these layers:
- desktop shell and renderer UI
- PTY and process/session manager
- CLI adapter layer
- terminal event extraction and normalization
- conversation orchestration layer
- speech input/output layer
- transcript and state persistence
- permissions and safety controls
- packaging and release automation

See:
- `docs/architecture/overview.md`
- `docs/roadmap/milestones.md`
- `docs/accessibility-statement.md`
- `docs/support-matrix.md`

## Recommended stack

Current recommended implementation stack:
- Electron for the desktop shell
- React + TypeScript for UI
- Node PTY integration for managed terminal sessions
- Playwright for end-to-end app checks where practical
- GitHub Actions for CI/CD
- GitHub Pages for project documentation

## Repository structure

- `src/` application code
- `docs/` product, architecture, roadmap, accessibility, Pages content
- `.github/` issue templates, workflows, PR template
- `website/` static Pages scaffold
- `scripts/` project helper scripts

## Getting started

This repository is currently in project foundation stage.

Read first:
- `docs/architecture/overview.md`
- `docs/architecture/event-model.md`
- `docs/roadmap/milestones.md`
- `docs/pages/index.md`

## Delivery workflow

The intended engineering flow is:
1. propose architecture and stack
2. create repository scaffold
3. implement the first working vertical slice
4. establish CI/CD and release automation
5. publish documentation and progress artifacts

## Current vertical slice target

The first thin vertical slice should prove:
- a managed Codex CLI session can be launched in a local project
- terminal output can be normalized into events
- the app can generate a concise summary of a terminal event burst
- transcript and session history are persisted

## Status

This repository has been initialized as the public project foundation for voice-cli.
